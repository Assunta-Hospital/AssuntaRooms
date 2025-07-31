"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { toast } = useToast();

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Login failed", description: data.error });
        return;
      }

      // Optionally: store token, user info, update context, redirect, etc.
      toast({ title: "Login successful!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Something went wrong." });
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
        toast({ variant: "destructive", title: "Signup failed", description: data.error });
        return;
      }

      toast({ title: "Account created!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Something went wrong." });
    }
  };

  return { ...context, login, signup };
};
