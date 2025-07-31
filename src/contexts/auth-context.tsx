
"use client";

import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, username: string, dept_id: string, avatarUrl: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { },
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
    const storedUser = localStorage.getItem('assunta-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user data in localStorage");
        localStorage.removeItem('assunta-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password."
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(pass, data.password);
    if (!isPasswordCorrect) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password."
      });
      return;
    }

    setUser(data);
    localStorage.setItem('assunta-user', JSON.stringify(data));
    router.push(data.status !== 'approved' ? '/status' : '/dashboard');
  }, [router, toast]);

  const signup = useCallback(async (
    email: string,
    pass: string,
    username: string,
    dept_id: string,
    avatarUrl: string
  ) => {
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existing) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Error',
        description: 'An account with this email already exists.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        username,
        role: 'user',
        status: 'pending',
        dept_id,
        pfp_url: avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: 'Unable to create account. Please try again.',
      });
      return;
    }

    setUser(data);
    localStorage.setItem('assunta-user', JSON.stringify(data));
    toast({
      title: 'Account Created!',
      description: "Your account is now pending approval from an administrator.",
    });
    router.push('/status');
  }, [router, toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('assunta-user');
    router.push('/login');
  }, [router]);

  const updateUser = useCallback(async (updatedUser: User) => {
    const { error } = await supabase
      .from('users')
      .update(updatedUser)
      .eq('user_id', updatedUser.user_id);

    if (!error) {
      setUser(updatedUser);
      localStorage.setItem('assunta-user', JSON.stringify(updatedUser));
      toast({
        title: "Profile Updated",
        description: "Your profile has been changed successfully."
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile.'
      });
    }
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
