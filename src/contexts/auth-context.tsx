
"use client";

import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mockUsers } from '@/lib/mock-data';
import type { User, Department } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, department: string, avatarUrl: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUser: async () => {},
});

// Use a simple in-memory store for users that persists across HMR
let userStore = [...mockUsers];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for user in localStorage on initial load
    try {
        const storedUser = localStorage.getItem('assunta-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('assunta-user');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    // Find user in the mock data
    const foundUser = userStore.find(u => u.email === email && u.password === pass);

    if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('assunta-user', JSON.stringify(foundUser));
      
        if (foundUser.status !== 'approved') {
            router.push('/status');
        } else {
            router.push('/dashboard');
        }
    } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
        });
    }
  }, [router, toast]);

  const signup = useCallback(async (email: string, pass: string, name: string, department: string, avatarUrl: string) => {
    // Check if user already exists
    if (userStore.some(u => u.email === email)) {
        toast({
            variant: 'destructive',
            title: 'Sign-up Error',
            description: 'An account with this email already exists.',
        });
        return;
    }

    // Create a new user (in-memory)
    const newUser: User = {
        id: `user-${new Date().getTime()}`,
        name,
        email,
        password: pass,
        role: 'User',
        status: 'pending', // New signups are pending
        avatar: avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
        department: department as Department,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    
    userStore.push(newUser);
    setUser(newUser);
    localStorage.setItem('assunta-user', JSON.stringify(newUser));

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
      // Update in-memory store
      userStore = userStore.map(u => u.id === updatedUser.id ? updatedUser : u);
      
      // Update state and localStorage
      setUser(updatedUser);
      localStorage.setItem('assunta-user', JSON.stringify(updatedUser));

      toast({
          title: "Profile Updated",
          description: "Your profile has been changed successfully."
      });
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
