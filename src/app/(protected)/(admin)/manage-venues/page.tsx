"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash2, Users, Layers, Upload } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { Room } from '@/lib/types';

// Schema with file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const roomSchema = z.object({
  room_id: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  location: z.string().min(1, 'Location is required'),
  image_file: z
    .any()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      'Max image size is 5MB'
    )
    .refine(
      (file) => !file || (file instanceof File && file.type.startsWith('image/')),
      'Only image files are supported'
    )
    .optional(),
  tags: z.array(z.string()).min(1, 'Select at least one amenity'),
  is_active: z.boolean().default(true),
});


type RoomFormData = z.infer<typeof roomSchema>;

function ImageUpload({
  value,
  onChange,
  disabled,
  error,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (value) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onChange(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-md p-4 ${isDragging ? 'border-primary bg-primary/10' : 'border-muted'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${error ? 'border-destructive' : ''
          }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          {preview ? (
            <>
              <div className="relative w-full h-48">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              {!disabled && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onChange(null)}
                >
                  Remove Image
                </Button>
              )}
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {disabled ? 'Image upload disabled' : 'Drag & drop an image here, or click to select'}
              </p>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleFileChange}
                disabled={disabled}
              />
              {!disabled && (
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer text-sm font-medium text-primary"
                >
                  Select Image
                </Label>
              )}
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function RoomForm({ room, onSave, closeDialog }: { room?: Room; onSave: (data: RoomFormData, id?: string) => Promise<void>; closeDialog: () => void }) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setValue, watch } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room || {
      name: '',
      capacity: 1,
      location: '',
      image_file: null,
      tags: [],
      is_active: true
    },
  });

  const imageFile = watch('image_file');
  const isEdit = !!room;

  const onSubmit = async (data: RoomFormData) => {
    await onSave(data, room?.room_id);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name</Label>
          <Input id="name" {...register('name')} disabled={isSubmitting} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" {...register('capacity')} disabled={isSubmitting} />
          {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...register('location')} disabled={isSubmitting} />
        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Room Image {!isEdit && <span className="text-destructive">*</span>}</Label>
        <Controller
          name="image_file"
          control={control}
          render={({ field, fieldState }) => (
            <ImageUpload
              value={field.value}
              onChange={(file) => {
                field.onChange(file);
                setValue('image_file', file);
              }}
              disabled={isSubmitting}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
              {['Projector', 'Whiteboard', 'Video Conferencing', 'TV Screen', 'Coffee Machine', 'LAN Cable', 'HDMI Cable'].map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={field.value.includes(amenity)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...field.value, amenity]
                        : field.value.filter((a) => a !== amenity);
                      field.onChange(newValue);
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="font-normal">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          )}
        />
        {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="is_active" {...register('is_active')} disabled={isSubmitting} />
        <Label htmlFor="is_active" className="font-normal">
          Active (visible to users)
        </Label>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : room ? 'Save Changes' : 'Create Room'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ManageVenueDialog({ room, onSave, children }: { room?: Room, onSave: (data: RoomFormData, id?: string) => Promise<void>, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {room ? 'Edit Venue' : 'Create New Venue'}
          </DialogTitle>
        </DialogHeader>
        <RoomForm room={room} onSave={onSave} closeDialog={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default function ManageVenuesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRooms = data?.map(room => ({
        ...room,
        tags: Array.isArray(room.tags) ? room.tags : []
      })) || [];

      setRooms(formattedRooms);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading rooms",
        description: "Failed to fetch rooms data",
      });
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('rooms') // Using your 'rooms' bucket
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600' // 1 hour cache
      });

    if (uploadError) throw uploadError;

    // Construct the public URL directly for faster response
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rooms/${filePath}`;
  };

  const handleSaveRoom = async (data: RoomFormData, id?: string) => {
    const toastId = toast({
      title: "Saving venue...",
      description: "Please wait while we save your changes",
      duration: Infinity,
    });

    try {
      let imageUrl = id ? rooms.find(r => r.room_id === id)?.room_url : '';

      // Upload new image if provided
      if (data.image_file) {

        toast({
          title: "Saving venue...",
          description: "Uploading image...",
        });

        imageUrl = await uploadImage(data.image_file);
      } else if (!id) {
        throw new Error('Image is required for new rooms');
      }

      toast({
        title: "Saving venue...",
        description: "Saving room details...",
      });

      const roomData = {
        name: data.name,
        capacity: data.capacity,
        location: data.location,
        ...(imageUrl ? { room_url: imageUrl } : {}),
        tags: data.tags,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('room_id', id);

        if (error) throw error;

        setRooms(prev => prev.map(r => r.room_id === id ? {
          ...r,
          ...roomData,
          room_url: imageUrl || r.room_url,
        } : r));
      } else {
        // Create new room
        const { data: newRoom, error } = await supabase
          .from('rooms')
          .insert({
            ...roomData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setRooms(prev => [{
          ...newRoom,
          tags: Array.isArray(newRoom.tags) ? newRoom.tags : []
        }, ...prev]);
      }

      toast({
        title: "Success!",
        description: `Room "${data.name}" saved successfully`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save room",
        duration: 5000,
      });
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.room_id === roomId);
      if (!room) return;

      // Delete the image from storage if it's not the default
      if (room.room_url && !room.room_url.includes('default.png')) {
        const urlParts = room.room_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('rooms')).join('/');

        await supabase.storage
          .from('rooms')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('room_id', roomId);

      if (error) throw error;

      setRooms(prev => prev.filter(r => r.room_id !== roomId));

      toast({
        title: "Venue Deleted",
        description: "The venue has been successfully removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was an error deleting the venue.",
      });
      console.error('Error deleting room:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground -mt-4">
            Add, edit, or remove meeting rooms and their amenities.
          </p>
          <ManageVenueDialog onSave={handleSaveRoom}>
            <Button>
              <PlusCircle className="mr-2" />
              Add New Venue
            </Button>
          </ManageVenueDialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))
          ) : rooms.length > 0 ? (
            rooms.map(room => (
              <Card key={room.room_id} className="flex flex-col overflow-hidden">
                <CardHeader className="p-0 relative h-48">
                  <Image
                    src={room.room_url || 'https://placehold.co/600x400.png'}
                    alt={room.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </CardHeader>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <CardTitle className="font-headline text-xl mb-2">
                    {room.name}
                  </CardTitle>
                  <div className="text-muted-foreground text-sm space-y-3 flex-grow">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Up to {room.capacity} people</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>{room.location}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {room.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6">
                    <ManageVenueDialog room={room} onSave={handleSaveRoom}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </ManageVenueDialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the venue "{room.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteRoom(room.room_id)}
                            >
                              Delete Venue
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No meeting rooms have been added yet. You can add one using the button above.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
