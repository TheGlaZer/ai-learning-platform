import { supabase } from "./supabaseClient";
import { FileMetadata } from "@/app/models/file";
import { createClient } from '@supabase/supabase-js';

export const uploadFile = async (
  userId: string,
  workspaceId: string,
  file: File,
  token: string
): Promise<FileMetadata> => {
  // Create a new Supabase client with the user's token for this request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
  
  // Create an authenticated client with the user's token
  const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Generate a safe filename by replacing non-ASCII characters and encoding
  const timestamp = new Date().getTime();
  const fileExtension = file.name.split('.').pop() || '';
  const safeFileName = `${timestamp}_${encodeURIComponent(file.name.replace(/[^\x00-\x7F]/g, '_'))}`;
  
  const filePath = `private/${userId}/${workspaceId}/${safeFileName}`;
  
  // Upload file to Supabase Storage using authenticated client
  const { data: uploadData, error: uploadError } = await authenticatedSupabase.storage
  .from("files")
  .upload(filePath, file);
  
  // console.log("file uplioad => ", authenticatedSupabase);
  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = authenticatedSupabase.storage
    .from("files")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  // Insert file metadata into database
  const { data: fileData, error: fileError } = await authenticatedSupabase
    .from("files")
    .insert([
      {
        workspace_id: workspaceId,
        user_id: userId,
        name: file.name, // Keep the original filename in the database
        file_type: "document",
        url: publicUrl,
        metadata: {},
      },
    ])
    .select()
    .single();

  if (fileError){
    console.error("Error inserting file metadata:", fileError);
    throw fileError;
  } 
  return fileData;
};

/**
 * Gets all files for a specific workspace.
 * 
 * @param workspaceId - The ID of the workspace to fetch files for
 * @returns An array of file metadata objects
 */
export const getFilesByWorkspace = async (workspaceId: string): Promise<FileMetadata[]> => {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching files:", error);
    throw error;
  }

  return data || [];
};
