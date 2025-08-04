
import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name, department, avatarUrl } = body;

  const supabase = createServerClient();

  // Step 1: Get department UUID
  const { data: deptData, error: deptError } = await supabase
    .from("department")
    .select("dept_id")
    .eq("name", department)
    .single();

  if (deptError || !deptData) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Step 2: Insert user
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email,
        password: hashedPassword,
        username: name,
        dept_id: deptData.dept_id,
        pfp_url: avatarUrl || "https://mqwlfuoabldsdqkbbdam.supabase.co/storage/v1/object/public/avatars//default.png", // <--replace this with default pic bucket url if changed :)
        status: "pending",
        role: "user",
        created_at: new Date().toISOString()
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
  //shouldnt use client sided nav in api routes
  //this will return true to front end and redirect back to login
}
