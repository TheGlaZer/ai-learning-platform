import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/app/utils/fileProcessing/index";

/**
 * API route for extracting text from files
 * This keeps server-only code on the server and prevents client-side import of fs and other Node modules
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const addPageMarkers = formData.get("addPageMarkers") !== "false"; // Default to true
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Basic file validation
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF, Word document, PowerPoint, or text file." },
        { status: 400 }
      );
    }
    
    // Convert file to ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer();
    
    // Use the server-side file processing utility
    const extractedText = await extractTextFromFile(
      arrayBuffer,
      file.type,
      file.name,
      { 
        language: 'auto',
        addPageMarkers: addPageMarkers
      }
    );
    
    return NextResponse.json({ 
      success: true,
      text: extractedText,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hasPageMarkers: addPageMarkers
    });
    
  } catch (error: any) {
    console.error("Error extracting text from file:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to extract text", 
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 