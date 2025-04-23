// This file contains server-only functionality for flashcard operations
// IMPORTANT: Do not import this in client components, use API routes instead
import { supabase, getAuthenticatedClient } from "./supabaseClient";
import { Flashcard, CreateFlashcardParams, UpdateFlashcardParams } from "@/app/models/flashcard";

/**
 * Gets all flashcards for a specific workspace.
 */
export const getFlashcardsByWorkspace = async (
  workspaceId: string, 
  userId: string,
  token?: string
): Promise<Flashcard[]> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from("flashcards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching flashcards:", error);
    throw error;
  }

  return data || [];
};

/**
 * Creates a new flashcard
 */
export const createFlashcard = async (
  flashcardData: CreateFlashcardParams,
  token?: string
): Promise<Flashcard> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;

  const { data, error } = await client
    .from("flashcards")
    .insert({
      question: flashcardData.question,
      answer: flashcardData.answer,
      workspace_id: flashcardData.workspaceId,
      user_id: flashcardData.userId,
      status: flashcardData.status || "dont_know",
      pages: flashcardData.pages || null,
      file_name: flashcardData.fileName || null
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating flashcard:", error);
    throw error;
  }

  return data;
};

/**
 * Creates multiple flashcards at once
 */
export const createFlashcardsBatch = async (
  flashcardsData: CreateFlashcardParams[],
  token?: string
): Promise<{ count: number }> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;

  const { data, error } = await client
    .from("flashcards")
    .insert(
      flashcardsData.map((card) => ({
        question: card.question,
        answer: card.answer,
        workspace_id: card.workspaceId,
        user_id: card.userId,
        status: card.status || "dont_know",
        pages: card.pages || null,
        file_name: card.fileName || null
      }))
    );

  if (error) {
    console.log("token -> ", token); 
    console.error("Error creating flashcards batch:", error);
    throw error;
  }

  return { count: flashcardsData.length };
};

/**
 * Updates an existing flashcard
 */
export const updateFlashcard = async (
  id: string,
  userId: string,
  updateData: UpdateFlashcardParams,
  token?: string
): Promise<Flashcard> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;

  // First, verify the flashcard exists and belongs to the user
  const { data: flashcard, error: findError } = await client
    .from("flashcards")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (findError || !flashcard) {
    console.error("Error finding flashcard:", findError);
    throw new Error("Flashcard not found or unauthorized");
  }

  // Update the flashcard with new data
  const { data, error } = await client
    .from("flashcards")
    .update({
      question: updateData.question !== undefined ? updateData.question : flashcard.question,
      answer: updateData.answer !== undefined ? updateData.answer : flashcard.answer,
      status: updateData.status !== undefined ? updateData.status : flashcard.status,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating flashcard:", error);
    throw error;
  }

  return data;
};

/**
 * Deletes a flashcard
 */
export const deleteFlashcard = async (
  id: string,
  userId: string,
  token?: string
): Promise<boolean> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;

  // First, verify the flashcard exists and belongs to the user
  const { data: flashcard, error: findError } = await client
    .from("flashcards")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (findError || !flashcard) {
    console.error("Error finding flashcard:", findError);
    throw new Error("Flashcard not found or unauthorized");
  }

  // Delete the flashcard
  const { error } = await client
    .from("flashcards")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting flashcard:", error);
    throw error;
  }

  return true;
}; 