import { NextResponse } from "next/server";
import { uploadFile, getFilesByWorkspace } from "@/app/lib-server/filesService";
import type { FileMetadata } from "@/app/models/file";

export async function GET(req: Request) {
  try {
    // Get workspace ID from query parameter
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing required query parameter: workspaceId" },
        { status: 400 }
      );
    }

    // Fetch files for the specified workspace
    const files = await getFilesByWorkspace(workspaceId);
    
    return NextResponse.json(files);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve files" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("@@@@@ start 1 @@@@@@")
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }
    console.log("@@@@@ start 2 @@@@@@")
    
    // Use the built‑in formData parser to get fields and file
    const formData = await req.formData();
    
    // Extract fields (they come as FormDataEntryValue)
    const workspaceId = formData.get("workspaceId")?.toString();
    const userId = formData.get("userId")?.toString();
    const file = formData.get("file") as File; // This is a Blob (Web API File)
    
    if (!file || !workspaceId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: file, workspaceId, or userId" },
        { status: 400 }
      );
    }
    
    // Convert the Blob to a Buffer (if needed by your uploadFile function)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Create a new File object with the Buffer if your uploadFile expects it.
    // This new File uses the original file's name and type.
    const uploadedFile = new File([fileBuffer], file.name, {
      type: file.type,
    });
    
    // Call your uploadFile function with the userId, workspaceId, file, and token
    const fileMetadata: FileMetadata = await uploadFile(
      userId,
      workspaceId,
      uploadedFile,
      token
    );
    console.log("@@@@@ start 3 @@@@@@")
    
    
    return NextResponse.json(fileMetadata);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
