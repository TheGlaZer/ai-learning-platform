import { supabase } from "./supabaseClient";
import { Workspace } from "@/app/models/workspace";

export const createWorkspace = async (userId: string, name: string, description?: string): Promise<Workspace> => {
  const { data, error } = await supabase
    .from("workspaces")
    .insert([{ user_id: userId, name, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
};
