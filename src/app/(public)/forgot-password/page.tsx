
"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const accessToken = searchParams.get("access_token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      setMessage("Invalid or expired reset link.");
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { password },
      // @ts-ignore: Supabase v2 allows passing access_token here
      { accessToken }
    );

    if (error) setMessage(error.message);
    else {
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <form onSubmit={handleReset} className="max-w-sm mx-auto mt-20 grid gap-4">
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Reset Password</button>
      {message && <p>{message}</p>}
    </form>
  );
}
