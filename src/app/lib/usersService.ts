import { User } from "@/app/models/user";
import { supabase } from "./supabaseClient";

export const getUser = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, name: string): Promise<User> => {
  const { data, error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
