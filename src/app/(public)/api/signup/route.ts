import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const formData = await req.formData();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const department = formData.get('department') as string;
  const avatarFile = formData.get('avatar') as File | null;

  const supabase = await createServerSupabaseClient();

  try {
    // 1. Validate department exists
    const { data: deptData, error: deptError } = await supabase
      .from("department")
      .select("dept_id")
      .eq("name", department)
      .single();

    if (deptError || !deptData) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      );
    }

    // 2. Handle avatar upload if provided
    let avatarUrl = "https://mqwlfuoabldsdqkbbdam.supabase.co/storage/v1/object/public/avatars//default.png";

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file directly
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          contentType: avatarFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = urlData.publicUrl;
    }

    // 3. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // 4. Create user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{
        user_id: authData.user?.id,
        email,
        username: name,
        dept_id: deptData.dept_id,
        pfp_url: avatarUrl,
        status: "pending",
        role: "user",
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
