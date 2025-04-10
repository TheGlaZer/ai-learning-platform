import { supabase, getAuthenticatedClient } from "./supabaseClient";
import { Workspace } from "@/app/models/workspace";

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
