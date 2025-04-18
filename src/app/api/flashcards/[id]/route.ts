import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/lib-server/authService";
import { updateFlashcard, deleteFlashcard } from "@/app/lib-server/flashcardService";

// PUT /api/flashcards/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, token } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    try {
      const updatedFlashcard = await updateFlashcard(params.id, userId, data, token);
      return NextResponse.json({ flashcard: updatedFlashcard });
    } catch (serviceError) {
      if (serviceError.message === "Flashcard not found or unauthorized") {
        return NextResponse.json(
          { error: "Flashcard not found" },
          { status: 404 }
        );
      }
      throw serviceError;
    }
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard" },
      { status: 500 }
    );
  }
}

// DELETE /api/flashcards/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, token } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    try {
      await deleteFlashcard(params.id, userId, token);
      return NextResponse.json({ message: "Flashcard deleted successfully" });
    } catch (serviceError) {
      if (serviceError.message === "Flashcard not found or unauthorized") {
        return NextResponse.json(
          { error: "Flashcard not found" },
          { status: 404 }
        );
      }
      throw serviceError;
    }
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard" },
      { status: 500 }
    );
  }
} 