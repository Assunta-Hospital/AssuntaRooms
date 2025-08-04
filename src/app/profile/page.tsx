
"use client";

import { useState } from 'react';
import Image from 'next/image';
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
import { Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // State for editable fields
  const [name, setName] = useState(user?.name || '');
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  if (!user) {
    return <DashboardLayout><div>Loading profile...</div></DashboardLayout>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Name cannot be empty.',
      });
      return;
    }
    const updatedUser = { ...user, name: name, department: selectedDepartment };
    updateUser(updatedUser);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been changed successfully."
    });
  }

  const handleAvatarSave = () => {
    const updatedUser = { ...user, avatar: avatarUrl };
    updateUser(updatedUser);
    toast({
      title: "Avatar Updated",
      description: "Your profile picture has been changed."
    });
    setIsAvatarDialogOpen(false);
  }

  const handleCancel = () => {
    setName(user.name);
    setSelectedDepartment(user.department);
    setIsEditing(false);
  }

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
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={user.avatar} alt={name} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-3xl">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Profile Picture</DialogTitle>
                      <DialogDescription>Paste the URL of your new profile picture below.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex justify-center">
                        <Avatar className="h-32 w-32 border-4 border-primary">
                          <AvatarImage src={avatarUrl} alt={name} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-4xl">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar-url-profile">Image URL</Label>
                        <Input id="avatar-url-profile" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAvatarSave}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground px-1">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="text-3xl font-headline h-auto p-1 border-0 rounded-none focus-visible:ring-0" />
                  </div>
                ) : (
                  <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
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
                <span><Badge className={cn('text-white', getStatusClass(user.status))}>{user.status}</Badge></span>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Department</Label>
                {isEditing ? (
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitalDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="">{user.department}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Account Created</p>
                <p className="">{user.createdAt ? format(parseISO(user.createdAt), "PPP") : 'N/A'}</p>
              </div>
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="font-semibold text-muted-foreground">User ID</p>
                <p className="text-xs font-mono text-muted-foreground bg-secondary p-2 rounded-md">{user.id}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
