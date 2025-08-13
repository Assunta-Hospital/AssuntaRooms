"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Building, Eye, EyeOff, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("department")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to load departments",
          description: error.message,
        });
      } else {
        setDepartments(data.map((d) => d.name));
      }
    };

    fetchDepartments();
  }, [toast]);


  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      // If successful, you can redirect or show success toast
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Unknown error",
      });

      // Optional: Redirect to manage-users if account not approved
      if (err.message === "Account is not approved") {
        window.location.href = "/manage-users";
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleClear = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setDepartment("");
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSignupSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please re-enter your passwords.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('department', department);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - the browser will set it with the correct boundary
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Signup failed");
      }

      handleClear();
      toast({
        title: "Account Created!",
        description: "Your account is pending admin approval.",
      });
      router.push("/status");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-sm w-full shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building className="h-10 w-10 text-primary text-red-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline">Assunta Meeting Booking</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your credentials to access the booking system"
              : "Create an account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    variant="link"
                    type="button"
                    className="ml-auto inline-block h-auto p-0 text-sm"
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="grid gap-4">
              <div className="flex flex-col items-center gap-4 mb-4">
                <Label htmlFor="avatar-file" className="cursor-pointer">
                  <div className="w-28 h-28 rounded-full bg-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">

                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar Preview"
                        width={96}
                        height={96}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-xs text-center">Upload a Picture</span>
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/*, .gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          const preview = URL.createObjectURL(file);
                          setAvatarPreview(preview);
                        }
                      }}
                      className="hidden"
                      id="avatar-file"
                    />
                  </div>
                </Label>

              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department-signup">Department</Label>
                <Select
                  value={department}
                  onValueChange={setDepartment}
                  required
                >
                  <SelectTrigger id="department-signup">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password-signup">Password</Label>
                <div className="relative">
                  <Input
                    id="password-signup"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password-signup">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password-signup"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    setMode("signup");
                    setShowPassword(false);
                    handleClear();
                  }}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    setMode("login");
                    setShowPassword(false);
                    handleClear();
                  }}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
