import { NextResponse } from "next/server";
import { deleteQuiz, getQuizById } from "@/app/lib-server/quizService";

// GET a specific quiz by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;
    
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }
    
    const quiz = await getQuizById(quizId);
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve quiz" },
      { status: 500 }
    );
  }
}

// DELETE a quiz by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;
    
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }
    
    // Extract the authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }
    
    await deleteQuiz(quizId, token);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: error.message || "Failed to delete quiz" },
      { status: 500 }
    );
  }
} 