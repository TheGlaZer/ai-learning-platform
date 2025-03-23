import { NextResponse } from "next/server";
import { getUser, updateUserProfile } from "@/app/lib-server/usersService";
import { supabase } from "@/app/lib-server/supabaseClient";

export async function GET(req: Request) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const userDetails = await getUser(user.id);
        return NextResponse.json(userDetails);
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const { name } = await req.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const updatedUser = await updateUserProfile(user.id, name);
        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
    }
}
