"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  signup: (
    email: string,
    password: string,
    username: string,
    dept_id: string,
    avatarUrl: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => { },
  isLoading: true,
  login: async () => ({ success: false }),
  signup: async () => { },
  logout: () => { },
  updateUser: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        // Get user data from your users table
        const { data: dbUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (!error && dbUser) {
          setUser(dbUser);
        }
      }
      setIsLoading(false);
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        if (dbUser) setUser(dbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true); // Set loading state

      // 1. Attempt Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. Handle authentication errors
      if (authError) {
        // Check for legacy user (password in public.users)
        const { data: legacyUser, error: legacyError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (legacyError || !legacyUser) {
          throw new Error("Invalid credentials");
        }

        // Migrate legacy user to Supabase Auth
        const { error: migrateError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: legacyUser.username } }
        });

        if (migrateError) throw migrateError;

        // Retry authentication after migration
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) throw retryError;
      }

      // 3. Fetch user profile from public.users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authData?.user?.id || '')
        .single();

      if (dbError || !dbUser) {
        throw new Error("User profile not found");
      }

      // 4. Handle account status with appropriate UI feedback
      const statusHandlers = {
        approved: () => {
          setUser(dbUser);
          toast({
            title: "Login Successful",
            description: "Redirecting to dashboard...",
            className: "bg-green-600 hover:bg-green-700",
          });
          router.push('/dashboard'); // Redirect approved users
          return { success: true };
        },
        pending: () => {
          toast({
            title: "Account Pending",
            description: "Your account is awaiting admin approval",
            className: "bg-yellow-500 hover:bg-yellow-600",
          });
          return { success: false };
        },
        rejected: () => {
          toast({
            title: "Account Rejected",
            description: "Please contact your administrator",
            className: "bg-red-600 hover:bg-red-700",
          });
          return { success: false };
        },
        suspended: () => {
          toast({
            title: "Account Suspended",
            description: "Please contact support to reactivate",
            className: "bg-slate-600 hover:bg-slate-700",
          });
          return { success: false };
        }
      };

      // Execute the appropriate status handler
      return statusHandlers[dbUser.status as keyof typeof statusHandlers]();

    } catch (err: any) {
      console.error("Login error:", err);

      // Show error toast with appropriate styling
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Invalid email or password",
        className: "bg-red-600 hover:bg-red-700",
      });

      return { success: false, message: err.message };
    } finally {
      setIsLoading(false); // Clear loading state
    }
  };

  const signup = useCallback(
    async (
      email: string,
      password: string,
      username: string,
      dept_id: string,
      avatarUrl: string
    ) => {
      // Just forward to API route
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: username, department: dept_id, avatarUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Signup failed");
      }

      return result;
    },
    [router, toast]
  );
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback(
    async (updatedUser: User) => {
      const { error } = await supabase
        .from("users")
        .update(updatedUser)
        .eq("user_id", updatedUser.user_id);

      if (!error) {
        setUser(updatedUser);
        toast({
          title: "Profile Updated",
          description: "Your profile has been changed successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update your profile.",
        });
      }
    },
    [toast]
  );

  return (
    <AuthContext.Provider
      value={{ user, setUser, isLoading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
