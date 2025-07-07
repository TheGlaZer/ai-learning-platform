import { NextResponse } from "next/server";
import { authenticateRequest } from "@/app/lib-server/auth";
import { supabase, getAuthenticatedClient } from "@/app/lib-server/supabaseClient";
import { uploadFile } from "@/app/lib-server/filesService";

// Constants for validation
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE_MB = 50; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const MAX_PAGE_ESTIMATION_THRESHOLD = 15; // Estimated maximum page count

// Helper to estimate page count from file size
const estimatePageCount = (fileType: string, size: number): number => {
  // Rough estimates:
  // - PDF: ~100KB per page for text/simple graphics
  // - DOCX: ~150KB per page for text/simple formatting
  const bytesPerPage = fileType.includes('pdf') ? 100 * 1024 : 150 * 1024;
  return Math.ceil(size / bytesPerPage);
};

export async function POST(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Unable to authenticate user" },
        { status: 401 }
      );
    }
    
    // Use the built-in formData parser to get fields and file
    const formData = await req.formData();
    
    // Extract fields
    const workspaceId = formData.get("workspaceId")?.toString();
    const name = formData.get("name")?.toString();
    const year = formData.get("year")?.toString();
    const semester = formData.get("semester")?.toString();
    const course = formData.get("course")?.toString();
    const file = formData.get("file") as File; // This is a Blob (Web API File)
    
    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: file or workspaceId" },
        { status: 400 }
      );
    }

    // Validate file type
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!isValidType && !hasValidExtension) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB.` },
        { status: 400 }
      );
    }

    // Estimate page count based on file size
    const estimatedPages = estimatePageCount(file.type, file.size);
    if (estimatedPages > MAX_PAGE_ESTIMATION_THRESHOLD) {
      return NextResponse.json(
        { error: `File appears to exceed the maximum page limit of approximately ${MAX_PAGE_ESTIMATION_THRESHOLD} pages.` },
        { status: 400 }
      );
    }
    
    // Convert the Blob to a Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Create a new File object with the Buffer
    const uploadedFile = new File([fileBuffer], file.name, {
      type: file.type,
    });
    
    // Upload file using the existing file service
    const fileMetadata = await uploadFile(
      userId,
      workspaceId,
      uploadedFile,
      token
    );

    if (!fileMetadata) {
      throw new Error("Failed to upload file");
    }
    
    // Get authenticated Supabase client
    const client = await getAuthenticatedClient(token);
    
    // Insert past exam record in the database
    const { data: pastExamData, error: insertError } = await client
      .from('past_exams')
      .insert([{
        workspace_id: workspaceId,
        user_id: userId,
        name: name || file.name,
        year: year || null,
        semester: semester || null,
        course: course || null,
        url: fileMetadata.url,
        metadata: {
          ...fileMetadata.metadata,
          estimatedPages: estimatedPages,
          fileSize: file.size,
        },
      }])
      .select('*')
      .single();
    
    if (insertError) {
      console.error("Error inserting past exam record:", insertError);
      throw insertError;
    }
    
    return NextResponse.json(pastExamData);
  } catch (error: any) {
    console.error("Error uploading past exam:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Unable to authenticate user" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const updates = await req.json();
    const { id, ...updateData } = updates;
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }
    
    // Get authenticated client
    const client = await getAuthenticatedClient(token);
    
    // Update the past exam record
    const { data, error } = await client
      .from('past_exams')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) {
      console.error("Error updating past exam:", error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Unable to authenticate user" },
        { status: 401 }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }
    
    // Get authenticated client
    const client = await getAuthenticatedClient(token);
    
    // First, get the past exam record to get the file URL
    const { data: pastExam, error: fetchError } = await client
      .from('past_exams')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching past exam:", fetchError);
      throw fetchError;
    }
    
    if (!pastExam) {
      return NextResponse.json(
        { error: "Past exam not found" },
        { status: 404 }
      );
    }
    
    // Delete the file from storage if URL exists
    if (pastExam.url) {
      try {
        // Extract file path from URL
        const url = new URL(pastExam.url);
        const filePath = url.pathname.split('/').slice(2).join('/');
        
        // Delete the file from storage
        const { error: storageError } = await client.storage
          .from('files')
          .remove([filePath]);
        
        if (storageError) {
          console.warn("Error deleting file from storage:", storageError);
          // Continue with deleting the record even if file deletion fails
        }
      } catch (fileError) {
        console.warn("Error processing file deletion:", fileError);
        // Continue with deleting the record
      }
    }
    
    // Delete the past exam record
    const { error: deleteError } = await client
      .from('past_exams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error("Error deleting past exam:", deleteError);
      throw deleteError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
} 