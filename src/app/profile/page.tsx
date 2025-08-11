"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { format, parseISO } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Upload, Loader2, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  // State for editable fields
  const [name, setName] = useState(user?.username || '');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Clean up object URLs to avoid memory leaks
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user) {
    return <DashboardLayout><div>Loading profile...</div></DashboardLayout>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Name cannot be empty.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: name
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      setUser({ ...user, username: name });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please select an image file (JPEG, PNG, etc.)',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarSave = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select an image to upload',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedFile.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ pfp_url: publicUrl })
        .eq('user_id', user.user_id);

      if (updateError) throw updateError;

      // Update local state
      setUser({ ...user, pfp_url: publicUrl });
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been changed successfully."
      });
      setIsAvatarDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload avatar',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setName(user.username);
    setIsEditing(false);
  };

  const getStatusClass = (status: User['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'rejected':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'suspended':
        return 'bg-slate-600 hover:bg-slate-700 text-white';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6">
              <div className="relative group">
                {/* Updated Avatar container with proper aspect ratio */}
                <div className="h-24 w-24 rounded-full border-4 border-primary overflow-hidden">
                  <img
                    src={user.pfp_url}
                    alt={user.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='36' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'>${getInitials(user.username)}</text></svg>`;
                    }}
                  />
                </div>
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
                      variant="secondary"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Profile Picture</DialogTitle>
                      <DialogDescription>
                        Upload a new profile picture (JPG, PNG up to 2MB)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex flex-col items-center gap-4">
                        {/* Updated preview container */}
                        <div className="relative h-32 w-32 rounded-full border-4 border-primary overflow-hidden">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={user.pfp_url}
                              alt={user.username}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='48' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'>${getInitials(user.username)}</text></svg>`;
                              }}
                            />
                          )}
                          {previewUrl && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-0 right-0 rounded-full h-6 w-6"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*, .gif"
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? 'Change Image' : 'Select Image'}
                        </Button>
                        {selectedFile && (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAvatarDialogOpen(false);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAvatarSave}
                        disabled={!selectedFile || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground px-1">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-3xl font-headline h-auto p-1 border-0 rounded-none focus-visible:ring-0"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-3xl font-headline">{user.username}</CardTitle>
                )}
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm pt-6">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Role</p>
                <span><Badge>{user.role}</Badge></span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Status</p>
                <span>
                  <Badge className={cn('text-white', getStatusClass(user.status))}>
                    {user.status}
                  </Badge>
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Account Created</p>
                <p className="">{user.created_at ? format(parseISO(user.created_at), "PPP") : 'N/A'}</p>
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="font-semibold text-muted-foreground">User ID</p>
                <p className="text-xs font-mono text-muted-foreground bg-secondary p-2 rounded-md">
                  {user.user_id}
                </p>
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="font-semibold text-muted-foreground">Department ID</p>
                <p className="text-xs font-mono text-muted-foreground bg-secondary p-2 rounded-md">
                  {user.dept_id}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </CardFooter>

          <div className="p-8">
            <p className="font-semibold text-muted-foreground">For more info & assistance, please contact the Administrators :)</p>
          </div>

        </Card>
      </div>



    </DashboardLayout>
  );
}
