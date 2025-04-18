import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/lib-server/authService";
import { createFlashcardsBatch } from "@/app/lib-server/flashcardService";

/**
 * POST /api/flashcards/batch
 * Endpoint for creating multiple flashcards at once
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    if (!data.flashcards || !Array.isArray(data.flashcards)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected 'flashcards' array." },
        { status: 400 }
      );
    }
    
    if (data.flashcards.length === 0) {
      return NextResponse.json(
        { error: "Flashcards array is empty" },
        { status: 400 }
      );
    }
    
    // Validate required fields for each flashcard
    for (let i = 0; i < data.flashcards.length; i++) {
      const card = data.flashcards[i];
      if (!card.workspaceId) {
        return NextResponse.json(
          { error: `Workspace ID is required for flashcard at index ${i}` },
          { status: 400 }
        );
      }
      
      if (!card.question || !card.answer) {
        return NextResponse.json(
          { error: `Question and answer are required for flashcard at index ${i}` },
          { status: 400 }
        );
      }
    }
    
    // Add userId to each flashcard in the batch
    const flashcardsWithUser = data.flashcards.map((card: any) => ({
      ...card,
      userId
    }));
    
    // Create the flashcards
    const result = await createFlashcardsBatch(flashcardsWithUser, token);
    
    // Return success response with created flashcards count
    return NextResponse.json({ count: result.count }, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcards batch:", error);
    return NextResponse.json(
      { error: "Failed to create flashcards batch" },
      { status: 500 }
    );
  }
} 