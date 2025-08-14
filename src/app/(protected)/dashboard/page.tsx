"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Users, Clock, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, Room, BookingStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { timeSlots } from "@/lib/booking-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function TimeSlot({ time, onSelect, isSelected, isBooked }: {
  time: string,
  onSelect: (time: string) => void,
  isSelected: boolean,
  isBooked: boolean
}) {
  return (
    <Button
      variant={isBooked ? 'outline' : isSelected ? 'default' : 'outline'}
      onClick={() => !isBooked && onSelect(time)}
      disabled={isBooked}
      className="w-full justify-start text-base"
      size="lg"
    >
      <Clock className="mr-2 h-4 w-4" />
      {time}
      {isBooked && <X className="ml-2 h-4 w-4" />}
    </Button>
  )
}

function isSlotBooked(
  slot: string,
  roomId: string,
  date: Date,
  bookings: Booking[],
  duration: number
): boolean {
  const slotDate = format(date, 'yyyy-MM-dd');
  const startTime = new Date(`${slotDate}T${slot}`);
  const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

  return bookings.some(booking => {
    if (booking.room_id !== roomId) return false;

    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    return (
      (startTime >= bookingStart && startTime < bookingEnd) || // New booking starts during existing
      (endTime > bookingStart && endTime <= bookingEnd) ||    // New booking ends during existing
      (startTime <= bookingStart && endTime >= bookingEnd)    // New booking spans existing
    );
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      try {
        const [
          { data: roomsData, error: roomsErr },
          { data: bookingsData, error: bookingsErr }
        ] = await Promise.all([
          supabase.from("rooms").select("*").eq("is_active", true),
          supabase.from("bookings").select("*"),
        ]);

        if (roomsErr || bookingsErr) {
          throw roomsErr || bookingsErr;
        }

        setRooms(roomsData ?? []);
        setBookings(bookingsData ?? []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Error loading rooms and bookings data",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase, toast]);

  const handleNewBooking = async (roomId: string, title: string, startTime: string, duration: number) => {
    if (!date || !user) {
      throw new Error("Date or user information missing");
    }

    try {
      const startDateTime = new Date(`${format(date, "yyyy-MM-dd")}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

      // Enhanced conflict detection
      const { data: conflictingBookings, error: conflictError } = await supabase
        .from("bookings")
        .select("*")
        .eq("room_id", roomId)
        .gte("start_time", startDateTime.toISOString())
        .lte("start_time", endDateTime.toISOString())
        .or(`end_time.gte.${startDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()}`);

      if (conflictError) throw conflictError;
      if (conflictingBookings && conflictingBookings.length > 0) {
        throw new Error("This time slot conflicts with an existing booking");
      }

      const { data: newBooking, error } = await supabase
        .from("bookings")
        .insert({
          room_id: roomId,
          user_id: user.user_id,
          booked_at: new Date().toISOString(),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          title,
          status: "confirmed",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => [...prev, newBooking]);
      toast({
        title: "Booking Confirmed!",
        description: `${title} has been successfully booked.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Could not create booking",
      });
      throw error; // Re-throw the error so handleSubmit can catch it
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
          ) : rooms.length > 0 ? (
            rooms.map((room) => (
              <RoomCard
                key={room.room_id}
                room={room}
                date={date}
                setDate={setDate}
                bookings={bookings}
                onNewBooking={handleNewBooking}
              />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center text-muted-foreground">
              No active meeting rooms available. Please check back later.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function RoomCard({ room, date, setDate, bookings, onNewBooking }: {
  room: Room,
  date?: Date,
  setDate: (date?: Date) => void,
  bookings: Booking[],
  onNewBooking: (roomId: string, title: string, startTime: string, duration: number) => void
}) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingTitle, setBookingTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [duration, setDuration] = useState(1);
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset");
  const [customDuration, setCustomDuration] = useState(1);

  const handleSubmit = async () => {
    if (!selectedTime || !bookingTitle || !date) return;

    try {
      const finalDuration = durationMode === 'preset' ? duration : customDuration;
      await onNewBooking(room.room_id, bookingTitle, selectedTime, finalDuration);

      // Only reset if booking was successful
      setIsDialogOpen(false);
      setBookingTitle("");
      setSelectedTime(null);
      setDuration(1);
      setDurationMode("preset");
      setCustomDuration(1);
    } catch (error) {
      // Error handling is already done in onNewBooking
      // don't need to do anything here since the toast will show the error
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0 relative h-48">
        <Image
          src={room.room_url}
          alt={room.name}
          fill
          className="object-cover"
          unoptimized
        />
      </CardHeader>
      <CardContent className="p-6 flex flex-col flex-grow">
        <h3 className="font-headline text-xl mb-2">{room.name}</h3>
        <div className="text-muted-foreground text-sm space-y-3 flex-grow">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Capacity: {room.capacity}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {room.tags?.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-6" size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Book Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Book {room.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Date</h3>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Select Time Slot</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {timeSlots.map(slot => {
                      const isBooked = isSlotBooked(slot, room.room_id, date || new Date(), bookings, 1);
                      return (
                        <TimeSlot
                          key={slot}
                          time={slot}
                          onSelect={setSelectedTime}
                          isSelected={selectedTime === slot}
                          isBooked={isBooked}
                        />
                      );
                    })}
                  </div>
                </div>

                {selectedTime && date && (
                  <>
                    <div className="space-y-4 pt-4">
                      <Label className="font-semibold text-lg">Booking Duration</Label>
                      <RadioGroup
                        value={durationMode}
                        onValueChange={(v) => setDurationMode(v as "preset" | "custom")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="preset" id="preset" onClick={() => setDuration(1)} />
                          <Label htmlFor="preset">Preset</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label htmlFor="custom">Custom</Label>
                        </div>
                      </RadioGroup>

                      {durationMode === 'preset' && (
                        <RadioGroup
                          value={String(duration)}
                          onValueChange={(v) => setDuration(Number(v))}
                          className="flex space-x-2 pt-2"
                        >
                          <Button
                            type="button"
                            variant={duration === 1 ? 'default' : 'outline'}
                            onClick={() => setDuration(1)}
                            disabled={isSlotBooked(selectedTime, room.room_id, date, bookings, 1)}
                          >
                            1 Hour
                          </Button>
                          <Button
                            type="button"
                            variant={duration === 2 ? 'default' : 'outline'}
                            onClick={() => setDuration(2)}
                            disabled={isSlotBooked(selectedTime, room.room_id, date, bookings, 2)}
                          >
                            2 Hours
                          </Button>
                        </RadioGroup>
                      )}

                      {durationMode === 'custom' && (
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="customDuration">Custom Hours: {customDuration}</Label>
                          </div>what about this, when the dashboard is loads the available rooms, it will check the db for each room's reschedule like end_time start_time and created_at so if there is a slot today at this time until this time it will blank out the slot therefor users arent able to book it, same thing for the slider (custom)
                          <Slider
                            id="customDuration"
                            min={1}
                            max={4}
                            step={1}
                            value={[customDuration]}
                            onValueChange={(v) => setCustomDuration(v[0])}
                          />
                          {isSlotBooked(selectedTime, room.room_id, date, bookings, customDuration) ? (
                            <p className="text-sm text-destructive">
                              This duration conflicts with an existing booking.
                            </p>
                          ) : (
                            <p className="text-sm text-green-500">
                              Available for {customDuration} hour{customDuration > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 pt-4">
                      <Label htmlFor="bookingTitle" className="font-semibold text-lg">Booking Title</Label>
                      <Input
                        id="bookingTitle"
                        type="text"
                        placeholder="e.g. Project Sync-up"
                        value={bookingTitle}
                        onChange={(e) => setBookingTitle(e.target.value)}
                        className="text-base"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedTime ||
                  !bookingTitle ||
                  !date ||
                  isSlotBooked(
                    selectedTime,
                    room.room_id,
                    date,
                    bookings,
                    durationMode === 'preset' ? duration : customDuration
                  )
                }
              >
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
