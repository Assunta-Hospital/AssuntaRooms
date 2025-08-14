"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/ui/LoadingScreen"; // adjust path if needed

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking auth
  if (isLoading || !user) return <LoadingScreen isOpen={true} message="Checking access" />;

  return <>{children}</>;
}
