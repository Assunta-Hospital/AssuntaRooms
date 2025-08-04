
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { add, format, parseISO } from "date-fns";
import { Users, Clock, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { isSlotBooked, timeSlots } from "@/lib/booking-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { createServerClient } from "@/utils/supabase/server";


function TimeSlot({ time, onSelect, isSelected }: { time: string, onSelect: (time: string) => void, isSelected: boolean }) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      onClick={() => onSelect(time)}
      className="w-full justify-start text-base"
      size="lg"
    >
      <Clock className="mr-2 h-4 w-4" />
      {time}
    </Button>
  )
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const supabase = createServerClient();
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const [{ data: roomsData, error: roomsErr }, { data: bookingsData, error: bookingsErr }] = await Promise.all([
        supabase.from("rooms").select("*"),
        supabase.from("bookings").select("*"),
      ]);

      if (roomsErr || bookingsErr) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: roomsErr?.message || bookingsErr?.message,
        });
      } else {
        setRooms(roomsData ?? []);
        setBookings(bookingsData ?? []);
      }

      setIsLoading(false);
    }

    loadData();
  }, [toast]);


  const handleNewBooking = (roomId: string, title: string, startTime: string, duration: number) => {
    if (!date || !user) return;

    const newBooking: Booking = {
      id: `booking-${new Date().getTime()}`,
      roomId,
      userId: user.id,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime: format(add(parseISO(`${format(date, "yyyy-MM-dd")}T${startTime}`), { hours: duration }), "HH:mm"),
      title,
      status: 'confirmed',
    };

    setBookings(prevBookings => [...prevBookings, newBooking]);
    toast({ title: "Booking Confirmed!", description: `${title} has been booked.` });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
          ) : rooms.length > 0 ? (
            rooms.map((room) => (
              <RoomCard key={room.id} room={room} date={date} setDate={setDate} bookings={bookings} onNewBooking={handleNewBooking} />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center text-muted-foreground">
              No meeting rooms have been added yet. An administrator can add venues from the 'Manage Venues' page.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


function RoomCard({ room, date, setDate, bookings, onNewBooking }: { room: Room, date?: Date, setDate: (date?: Date) => void, bookings: Booking[], onNewBooking: (roomId: string, title: string, startTime: string, duration: number) => void }) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingTitle, setBookingTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [duration, setDuration] = useState(1);
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset");
  const [customDuration, setCustomDuration] = useState(1);

  const handleSubmit = () => {
    if (selectedTime && bookingTitle) {
      const finalDuration = durationMode === 'preset' ? duration : customDuration;
      onNewBooking(room.id, bookingTitle, selectedTime, finalDuration);
      setIsDialogOpen(false);
      setBookingTitle("");
      setSelectedTime(null);
      setDuration(1);
      setDurationMode("preset");
      setCustomDuration(1);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0 relative h-48">
        <Image src={room.image} data-ai-hint={room.dataAiHint} alt={room.name} layout="fill" objectFit="cover" />
      </CardHeader>
      <CardContent className="p-6 flex flex-col flex-grow">
        <h3 className="font-headline text-xl mb-2">{room.name}</h3>
        <div className="text-muted-foreground text-sm space-y-3 flex-grow">
          <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Up to {room.capacity} people</span></div>
          <div className="flex items-center gap-2 flex-wrap">{room.amenities.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
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
                    {timeSlots.map(slot => (
                      isSlotBooked(slot, room.id, date || new Date(), bookings, 1) ?
                        <Button key={slot} variant="outline" disabled className="w-full justify-start line-through text-base" size="lg">
                          <Clock className="mr-2 h-4 w-4" />
                          {slot}
                        </Button>
                        : <TimeSlot key={slot} time={slot} onSelect={setSelectedTime} isSelected={selectedTime === slot} />
                    ))}
                  </div>
                </div>

                {selectedTime && (
                  <>
                    <div className="space-y-4 pt-4">
                      <Label className="font-semibold text-lg">Booking Duration</Label>
                      <RadioGroup value={durationMode} onValueChange={(v) => setDurationMode(v as "preset" | "custom")} className="flex space-x-4">
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
                        <RadioGroup value={String(duration)} onValueChange={(v) => setDuration(Number(v))} className="flex space-x-2 pt-2">
                          <Button type="button" variant={duration === 1 ? 'default' : 'outline'} onClick={() => setDuration(1)} disabled={isSlotBooked(selectedTime, room.id, date!, bookings, 1)}>1 Hour</Button>
                          <Button type="button" variant={duration === 2 ? 'default' : 'outline'} onClick={() => setDuration(2)} disabled={isSlotBooked(selectedTime, room.id, date!, bookings, 2)}>2 Hours</Button>
                        </RadioGroup>
                      )}

                      {durationMode === 'custom' && (
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="customDuration">Custom Hours: {customDuration}</Label>
                          </div>
                          <Slider
                            id="customDuration"
                            min={1}
                            max={4}
                            step={1}
                            value={[customDuration]}
                            onValueChange={(v) => setCustomDuration(v[0])}
                          />
                          {isSlotBooked(selectedTime, room.id, date!, bookings, customDuration) && <p className="text-sm text-destructive">This duration conflicts with another booking.</p>}
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
              <Button onClick={handleSubmit} disabled={!selectedTime || !bookingTitle || (durationMode === 'custom' && isSlotBooked(selectedTime, room.id, date!, bookings, customDuration))}>Confirm Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
