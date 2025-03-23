import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { uploadFile } from "@/app/lib/filesService";
import multiparty from "multiparty";
import fs from "fs";
import { promisify } from "util";
import type { FileMetadata } from "@/app/models/file";

// Define types for form parsing results
interface ParsedForm {
  fields: Record<string, string[] | undefined> ;
  files: Record<string, multiparty.File[] | undefined>;
}

// Use promisify to convert callback-based parse into a Promise
const parseForm = (req: any): Promise<ParsedForm> =>
  new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });


// POST: Upload a file to a workspace
export async function POST(req: Request) {
  try {
    // Parse the form data using multiparty
    const { fields, files } = await parseForm(req);

    // Extract form data
    const workspaceId = fields.workspaceId?.[0];
    const userId = fields.userId?.[0];
    const file = files.file?.[0]; // The uploaded file object

    if (!file || !workspaceId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: file, workspaceId, or userId" },
        { status: 400 }
      );
    }

    // Read the file from the temporary path
    const fileBuffer = fs.readFileSync(file.path);

    // Construct a File object to pass to your `uploadFile` function
    const uploadedFile = new File([fileBuffer], file.originalFilename, {
      type: file.headers["content-type"],
    });

    // Call your existing uploadFile function
    const fileMetadata: FileMetadata = await uploadFile(userId, workspaceId, uploadedFile);

    return NextResponse.json(fileMetadata);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// Disable Next.js body parsing, since multiparty handles it
export const config = {
  api: {
    bodyParser: false,
  },
};
