import { NextResponse } from "next/server";
import { getFileDownloadUrl } from "@/app/lib-server/filesService";

export async function GET(req: Request) {
  console.log(`[API:files/download] Received download request: ${req.url}`);
  
  try {
    // Get file URL and file name from query parameters
    const url = new URL(req.url);
    const fileUrl = url.searchParams.get("fileUrl");
    const fileName = url.searchParams.get("fileName");
    
    console.log(`[API:files/download] Request params: fileUrl=${fileUrl?.substring(0, 50)}..., fileName=${fileName || 'not provided'}`);

    if (!fileUrl) {
      console.error(`[API:files/download] Missing required fileUrl parameter`);
      return NextResponse.json(
        { error: "Missing required query parameter: fileUrl" },
        { status: 400 }
      );
    }

    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    console.log(`[API:files/download] Auth token ${token ? 'provided' : 'not provided'}`);
    
    console.log(`[API:files/download] Calling getFileDownloadUrl service`);
    // Get the signed URL using the filesService
    const signedUrl = await getFileDownloadUrl(fileUrl, token || undefined, fileName || undefined);
    console.log(`[API:files/download] Received signed URL from service. Length: ${signedUrl.length}`);
    
    console.log(`[API:files/download] Returning successful response with signed URL`);
    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    console.error(`[API:files/download] Error processing download request:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to generate download URL" },
      { status: 500 }
    );
  }
}