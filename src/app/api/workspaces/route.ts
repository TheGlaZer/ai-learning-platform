import { NextResponse } from "next/server";
import { createWorkspace, getUserWorkspaces } from "@/app/lib/workspacesService";
import { supabase } from "@/app/lib/supabaseClient";

export async function GET(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const workspaces = await getUserWorkspaces(user.id);
    return NextResponse.json(workspaces);
  }catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { name, description, token } = await req.json();
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    console.log("@@@@@@@@@@@@@@@@@@")
    console.log(
      user.id, name, description
    )
    const workspace = await createWorkspace(user.id, name, description);
    return NextResponse.json(workspace);
  }  catch (error: any) {
    console.log("error => ", error
    )
    // if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
