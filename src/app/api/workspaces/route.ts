import { NextResponse } from "next/server";
import { createWorkspace, getUserWorkspaces } from "@/app/lib-server/workspacesService";
import { supabase } from "@/app/lib-server/supabaseClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  
  // Get the authorization header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!userId) {
    // If no userId provided, use authenticated user from the token
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    try {
      // Authenticate with the token
      const { data } = await supabase.auth.getUser(token);
      if (!data?.user) {
        return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
      }
      
      // Use the authenticated user's ID to get workspaces
      const workspaces = await getUserWorkspaces(data.user.id, token);
      return NextResponse.json(workspaces);
    } catch (error) {
      console.error("Error in GET /api/workspaces:", error);
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
    }
  } else {
    // Use provided userId from query parameter
    try {
      const workspaces = await getUserWorkspaces(userId, token || undefined);
      return NextResponse.json(workspaces);
    } catch (error) {
      console.error("Error in GET /api/workspaces with userId:", error);
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
    }
  }
}

export async function POST(req: Request) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Get request data
    const { name, description } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    // Authenticate the user with the token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return NextResponse.json({ 
        error: "Authentication failed: " + (error?.message || "User not found") 
      }, { status: 401 });
    }
    
    // Create the workspace using the authenticated user ID and token
    const workspace = await createWorkspace(data.user.id, name, description, token);
    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("Error in POST /api/workspaces:", error);
    return NextResponse.json({ 
      error: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
