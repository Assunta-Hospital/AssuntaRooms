
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not logged in → redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // Logged in but not admin → redirect to unauthorized
      if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  // Block render until auth check is complete
  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}
