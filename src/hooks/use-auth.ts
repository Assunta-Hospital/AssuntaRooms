"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { toast } = useToast();
  const router = useRouter();

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, isLoading, login, signup } = context;

  return { user, setUser, isLoading, login, signup };
};
