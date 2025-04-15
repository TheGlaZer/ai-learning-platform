import { supabase, getAuthenticatedClient } from "./supabaseClient";
import { Workspace } from "@/app/models/workspace";
import { deleteFileFromStorage } from "./filesService";

/**
 * Create a new workspace for a user
 */
export const createWorkspace = async (userId: string, name: string, description?: string, token?: string): Promise<Workspace> => {
  console.log("Creating workspace for user:", userId);
  
  // Use authenticated client if token is provided, otherwise use default client
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from("workspaces")
    .insert([{ user_id: userId, name, description }])
    .select()
    .single();

  if (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }
  
  return data;
};

/**
 * Get all workspaces for a user
 */
export const getUserWorkspaces = async (userId: string, token?: string): Promise<Workspace[]> => {
  // Use authenticated client if token is provided, otherwise use default client
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from("workspaces")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
  
  return data || [];
};

/**
 * Delete a workspace by ID and all its related data
 */
export const deleteWorkspace = async (workspaceId: string, token?: string): Promise<void> => {
  console.log("Deleting workspace:", workspaceId);
  
  // Use authenticated client if token is provided, otherwise use default client
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  // First, check if the workspace exists
  const { data: workspace, error: fetchError } = await client
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();
    
  if (fetchError) {
    console.error("Error fetching workspace to delete:", fetchError);
    throw fetchError;
  }
  
  if (!workspace) {
    throw new Error(`Workspace with ID ${workspaceId} not found`);
  }

  // Start a transaction to delete all related data
  try {
    console.log(`Starting deletion process for workspace ${workspaceId}`);
    
    // 1. Delete quiz submissions related to the workspace
    const { error: submissionsError } = await client
      .from("quiz_submissions")
      .delete()
      .eq("workspace_id", workspaceId);
      
    if (submissionsError) {
      console.error("Error deleting quiz submissions:", submissionsError);
      // Continue with other deletions even if this fails
      console.log("Continuing with other deletions...");
    } else {
      console.log("Successfully deleted related quiz submissions");
    }
    
    // 2. Delete subject performance metrics
    const { error: perfError } = await client
      .from("subject_performance")
      .delete()
      .eq("workspace_id", workspaceId);
      
    if (perfError) {
      console.error("Error deleting subject performance data:", perfError);
      // Continue with other deletions
      console.log("Continuing with other deletions...");
    } else {
      console.log("Successfully deleted related subject performance data");
    }
    
    // 3. Delete quizzes
    const { error: quizzesError } = await client
      .from("quizzes")
      .delete()
      .eq("workspace_id", workspaceId);
      
    if (quizzesError) {
      console.error("Error deleting quizzes:", quizzesError);
      // Continue with other deletions
      console.log("Continuing with other deletions...");
    } else {
      console.log("Successfully deleted related quizzes");
    }
    
    // 4. Get subjects first to handle cascading deletions properly
    const { data: subjects, error: subjectsQueryError } = await client
      .from("subjects")
      .select("id")
      .eq("workspace_id", workspaceId);
      
    if (subjectsQueryError) {
      console.error("Error fetching subjects for deletion:", subjectsQueryError);
    } else {
      console.log(`Found ${subjects?.length || 0} subjects to delete`);
      
      // Delete any subject-specific data if needed
      // (subject_materials table might be handled by CASCADE delete)
    }
    
    // 5. Delete subjects
    const { error: subjectsError } = await client
      .from("subjects")
      .delete()
      .eq("workspace_id", workspaceId);
      
    if (subjectsError) {
      console.error("Error deleting subjects:", subjectsError);
      // Continue with other deletions
      console.log("Continuing with other deletions...");
    } else {
      console.log("Successfully deleted related subjects");
    }
    
    // 6. Get files to delete from storage
    const { data: files, error: filesQueryError } = await client
      .from("files")
      .select("id, url")
      .eq("workspace_id", workspaceId);
      
    if (filesQueryError) {
      console.error("Error fetching workspace files for deletion:", filesQueryError);
    } else {
      console.log(`Found ${files?.length || 0} files to delete`);
      
      // Delete files from storage
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.url) {
            try {
              await deleteFileFromStorage(file.url, token);
              console.log(`Deleted file from storage: ${file.url}`);
            } catch (storageError) {
              console.error(`Error deleting file ${file.id} from storage:`, storageError);
              // Continue with other file deletions
            }
          }
        }
      }
    }
    
    // 7. Delete file records from database
    const { error: filesError } = await client
      .from("files")
      .delete()
      .eq("workspace_id", workspaceId);
      
    if (filesError) {
      console.error("Error deleting workspace files from database:", filesError);
      // Continue with other deletions
      console.log("Continuing with other deletions...");
    } else {
      console.log("Successfully deleted related files from database");
    }
    
    // 8. Finally, delete the workspace itself
    const { error: deleteError } = await client
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);
      
    if (deleteError) {
      console.error("Error deleting workspace:", deleteError);
      throw deleteError;
    }
    
    console.log(`Successfully deleted workspace ${workspaceId} and all related data`);
  } catch (error) {
    console.error("Transaction error when deleting workspace and related data:", error);
    throw error;
  }
};
