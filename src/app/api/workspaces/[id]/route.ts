import { NextResponse } from "next/server";
import { deleteWorkspace } from "@/app/lib-server/workspacesService";
import { supabase } from "@/app/lib-server/supabaseClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const workspaceId = params.id;
  
  // Get the authorization header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
  }
  
  try {
    // Authenticate with the token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return NextResponse.json({ 
        error: "Authentication failed: " + (error?.message || "User not found") 
      }, { status: 401 });
    }
    
    // Delete the workspace
    await deleteWorkspace(workspaceId, token);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/workspaces/[id]:", error);
    
    // Handle not found errors
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    // Handle other errors
    return NextResponse.json({ 
      error: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
} 