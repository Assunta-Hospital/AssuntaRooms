
"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createServerClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export const useAuth = () => {
  const { user, setUser, isLoading } = useContext(AuthContext); // ✅ include isLoading
  const { toast } = useToast();
  const router = useRouter();

  if (setUser === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const login = async (email: string, password: string) => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "User not found",
        });
        router.push("/login");
        return;
      }

      const isValid = await bcrypt.compare(password, data.password);
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Incorrect password",
        });
        router.push("/login");
        return;
      }

      if (data.status !== "approved") {
        toast({
          variant: "destructive",
          title: "Account Not Approved",
          description: "Please wait for admin approval.",
        });
        router.push("/login");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      router.push("/dashboard");
      // ^^ post login interface

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
      router.push("/login");
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    department: string,
    avatarUrl: string
  ) => {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, name, department, avatarUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: data.error || "Please check your details",
        });
        return;
      }

      toast({ title: "Account created!" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Check your internet or try again later",
      });
    }
  };

  return { user, setUser, isLoading, login, signup };
};
