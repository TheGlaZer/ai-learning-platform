import { NextRequest, NextResponse } from "next/server";
import { getQuizById } from "@/app/lib-server/quizService";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { Quiz } from "@/app/models/quiz";
import { extractToken, validateToken } from "@/app/lib-server/authService";

// Add this to prevent Next.js from handling the route as a static route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get quiz ID from query parameters
    const quizId = request.nextUrl.searchParams.get("id");
    
    if (!quizId) {
      return new NextResponse(
        JSON.stringify({ error: "Quiz ID is required" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract and validate token
    const token = await extractToken(request);
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = await validateToken(token);
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid token" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch quiz data
    const quiz = await getQuizById(quizId, token);
    if (!quiz) {
      return new NextResponse(
        JSON.stringify({ error: `Quiz not found with ID: ${quizId}` }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has permission to access this quiz
    if (quiz.userId !== userId) {
      return new NextResponse(
        JSON.stringify({ error: "You do not have permission to access this quiz" }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Quiz Title
          new Paragraph({
            text: quiz.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          // Instructions
          new Paragraph({
            text: "Instructions: Select the best answer for each question.",
            heading: HeadingLevel.HEADING_1,
          }),
          // Questions
          ...quiz.questions.map((question, index) => [
            new Paragraph({
              text: `Question ${index + 1}: ${question.question}`,
              heading: HeadingLevel.HEADING_2,
            }),
            ...question.options.map(option => 
              new Paragraph({
                text: `${option.id}. ${option.text}`,
              })
            ),
            new Paragraph({ text: "" }), // Add spacing
          ]).flat(),
        ],
      }],
    });

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the document
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Quiz-${quiz.title.replace(/[^a-zA-Z0-9]/g, "-")}.docx"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("[export] Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to export quiz",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
