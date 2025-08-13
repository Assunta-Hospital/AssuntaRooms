"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash2, Users, Layers } from 'lucide-react';
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

const roomSchema = z.object({
  room_id: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  location: z.string().min(1, 'Location is required'),
  room_url: z.string().url('Please provide a valid URL').startsWith('https://', { message: 'URL must start with https://' }),
  tags: z.array(z.string()).min(1, 'Select at least one amenity'),
  is_active: z.boolean().default(true),
});

type RoomFormData = z.infer<typeof roomSchema>;

function RoomForm({ room, onSave, closeDialog }: { room?: Room; onSave: (data: RoomFormData, id?: string) => void; closeDialog: () => void }) {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room || {
      name: '',
      capacity: 1,
      location: '',
      room_url: 'https://placehold.co/600x400.png',
      tags: [],
      is_active: true
    },
  });

  const imagePreview = watch('room_url');

  const onSubmit = (data: RoomFormData) => {
    onSave(data, room?.room_id);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" {...register('capacity')} />
          {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...register('location')} />
        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="room_url">Image URL</Label>
        <Input id="room_url" placeholder="https://placehold.co/600x400.png" {...register('room_url')} />
        {imagePreview && (
          <Image
            src={imagePreview}
            alt="Preview"
            width={200}
            height={100}
            className="rounded-md mt-2 object-cover"
          />
        )}
        {errors.room_url && <p className="text-sm text-destructive">{errors.room_url.message}</p>}
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
        <Checkbox id="is_active" {...register('is_active')} />
        <Label htmlFor="is_active" className="font-normal">
          Active (visible to users)
        </Label>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{room ? 'Save Changes' : 'Create Room'}</Button>
      </DialogFooter>
    </form>
  );
}

function ManageVenueDialog({ room, onSave, children }: { room?: Room, onSave: (data: RoomFormData, id?: string) => void, children: React.ReactNode }) {
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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Ensure tags is always an array
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
    };

    fetchRooms();
  }, [supabase, toast]);

  const handleSaveRoom = async (data: RoomFormData, id?: string) => {
    try {
      if (id) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          .update({
            name: data.name,
            capacity: data.capacity,
            location: data.location,
            room_url: data.room_url,
            tags: data.tags,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('room_id', id);

        if (error) throw error;

        // Update local state
        setRooms(prev => prev.map(r => r.room_id === id ? {
          ...r,
          ...data,
          updated_at: new Date().toISOString()
        } : r));

        toast({
          title: "Venue Updated",
          description: `"${data.name}" has been successfully updated.`,
        });
      } else {
        // Create new room
        const { data: newRoom, error } = await supabase
          .from('rooms')
          .insert({
            name: data.name,
            capacity: data.capacity,
            location: data.location,
            room_url: data.room_url,
            tags: data.tags,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setRooms(prev => [{
          ...newRoom,
          tags: Array.isArray(newRoom.tags) ? newRoom.tags : []
        }, ...prev]);

        toast({
          title: "Venue Created",
          description: `"${data.name}" has been successfully created.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: "There was an error saving the venue data.",
      });
      console.error('Error saving room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('room_id', roomId);

      if (error) throw error;

      // Update local state
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
                    unoptimized={room.room_url?.startsWith('https://placehold.co/')}
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
