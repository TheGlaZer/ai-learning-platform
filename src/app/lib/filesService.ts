import { supabase } from "./supabaseClient";
import { FileMetadata } from "@/app/models/file";

export const uploadFile = async (
  userId: string,
  workspaceId: string,
  file: File
): Promise<FileMetadata> => {
  const filePath = `workspaces/${workspaceId}/${file.name}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("files")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("files")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl; // Correct extraction

  // Insert file metadata into database
  const { data: fileData, error: fileError } = await supabase
    .from("files")
    .insert([
      {
        workspace_id: workspaceId,
        user_id: userId,
        name: file.name,
        file_type: "document",
        url: publicUrl,
        metadata: {},
      },
    ])
    .select()
    .single();

  if (fileError) throw fileError;
  return fileData;
};
