
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash2, Users, Layers, Upload } from 'lucide-react';
import { mockRooms as initialRooms } from '@/lib/mock-data';

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
import { allAmenities } from '@/lib/mock-data';
import type { Room } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  level: z.coerce.number().min(1, 'Level must be at most 7'),
  image: z.string().startsWith('https://', { message: 'Please provide a valid image URL.' }),
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
});

type RoomFormData = z.infer<typeof roomSchema>;


function RoomForm({ room, onSave, closeDialog }: { room?: Room; onSave: (data: RoomFormData, id?: string) => void; closeDialog: () => void }) {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room || { name: '', capacity: 1, level: 1, image: 'https://placehold.co/600x400.png', amenities: [] },
  });
  
  const imagePreview = watch('image');

  const onSubmit = (data: RoomFormData) => {
    onSave(data, room?.id);
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
            <Label htmlFor="level">Level (1-7)</Label>
            <Input id="level" type="number" {...register('level')} />
            {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...register('capacity')} />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" placeholder="https://placehold.co/600x400.png" {...register('image')} />
        {imagePreview && <Image src={imagePreview} alt="Preview" width={200} height={100} className="rounded-md mt-2 object-cover" />}
        {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Amenities</Label>
        <Controller
            name="amenities"
            control={control}
            render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                {allAmenities.map((amenity) => (
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
                    <Label htmlFor={`amenity-${amenity}`} className="font-normal">{amenity}</Label>
                    </div>
                ))}
                </div>
            )}
        />
        {errors.amenities && <p className="text-sm text-destructive">{errors.amenities.message}</p>}
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


function ManageVenueDialog({ room, onSave, children }: { room?: Room, onSave: (data: RoomFormData, id?:string) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{room ? 'Edit Venue' : 'Create New Venue'}</DialogTitle>
                </DialogHeader>
                <RoomForm room={room} onSave={onSave} closeDialog={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}


export default function ManageVenuesPage() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setRooms(initialRooms);
      setIsLoading(false);
    }, 300);
  }, []);

  const handleSaveRoom = (data: RoomFormData, id?: string) => {
    const roomData = { ...data, dataAiHint: "conference room" };

    if (id) {
        setRooms(prev => prev.map(r => r.id === id ? { ...r, ...roomData } : r));
        toast({
            title: "Venue Updated",
            description: `"${data.name}" has been successfully updated.`
        });
    } else {
        const newRoom = { ...roomData, id: `room-${new Date().getTime()}`};
        setRooms(prev => [...prev, newRoom]);
        toast({
            title: "Venue Created",
            description: `"${data.name}" has been successfully created.`
        });
    }
  };

  const handleDeleteRoom = (roomId: string) => {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast({
          variant: "destructive",
          title: "Venue Deleted",
          description: "The venue has been removed."
      });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <p className="text-muted-foreground -mt-4">Add, edit, or remove meeting rooms and their amenities.</p>
            <ManageVenueDialog onSave={handleSaveRoom}>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Venue
                </Button>
            </ManageVenueDialog>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
          ) : rooms.length > 0 ? (
            rooms.map(room => (
              <Card key={room.id} className="flex flex-col overflow-hidden">
                  <CardHeader className="p-0 relative h-48">
                      <Image src={room.image} data-ai-hint={room.dataAiHint} alt={room.name} layout="fill" objectFit="cover" />
                  </CardHeader>
                   <CardContent className="p-6 flex flex-col flex-grow">
                      <CardTitle className="font-headline text-xl mb-2">{room.name}</CardTitle>
                      <div className="text-muted-foreground text-sm space-y-3 flex-grow">
                          <div className="flex items-center gap-2"><Users className="h-4 w-4"/><span>Up to {room.capacity} people</span></div>
                          <div className="flex items-center gap-2"><Layers className="h-4 w-4"/><span>Level {room.level}</span></div>
                          <div className="flex items-center gap-2 flex-wrap">{room.amenities.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-6">
                          <ManageVenueDialog room={room} onSave={handleSaveRoom}>
                               <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                          </ManageVenueDialog>
                          
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
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
                                          <Button variant="destructive" onClick={() => handleDeleteRoom(room.id)}>Delete Venue</Button>
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
