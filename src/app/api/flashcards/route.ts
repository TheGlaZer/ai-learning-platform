import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/lib-server/authService";
import { CreateFlashcardParams } from "@/app/models/flashcard";
import {
  getFlashcardsByWorkspace,
  createFlashcard,
  createFlashcardsBatch
} from "@/app/lib-server/flashcardService";

// GET /api/flashcards?workspaceId=123
export async function GET(request: NextRequest) {
  try {
    const { userId, token } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const flashcards = await getFlashcardsByWorkspace(workspaceId, userId, token);

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Error retrieving flashcards:", error);
    return NextResponse.json(
      { error: "Failed to retrieve flashcards" },
      { status: 500 }
    );
  }
}

// POST /api/flashcards
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
    
    // Check if it's a batch request
    if (data.flashcards && Array.isArray(data.flashcards)) {
      if (data.flashcards.length === 0) {
        return NextResponse.json(
          { error: "Flashcards array is empty" },
          { status: 400 }
        );
      }
      
      // Add userId to each flashcard in the batch
      const flashcardsWithUser = data.flashcards.map((card: any) => ({
        ...card,
        userId
      }));
      
      const result = await createFlashcardsBatch(flashcardsWithUser, token);
      
      return NextResponse.json({ count: result.count }, { status: 201 });
    } 
    
    // Single flashcard creation
    const flashcardData = data as CreateFlashcardParams;
    
    if (!flashcardData.workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    if (!flashcardData.question || !flashcardData.answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }
    
    // Add userId to the flashcard data
    flashcardData.userId = userId;

    const flashcard = await createFlashcard(flashcardData, token);

    return NextResponse.json({ flashcard }, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    );
  }
} 