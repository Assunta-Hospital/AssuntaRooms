
'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, parseISO, addHours, startOfDay, isBefore } from "date-fns";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { isSlotBooked, timeSlots } from "@/lib/booking-utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


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

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allBookings, setAllBookings] = useState<Booking[]>(mockBookings);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [customDuration, setCustomDuration] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    if (user) {
      const userBookings = allBookings
        .filter(b => b.userId === user.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMyBookings(userBookings);
    }
    // Simulate loading
    setTimeout(() => setIsLoading(false), 300);
  }, [user, allBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!bookingId) return;

    setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));

    toast({ title: "Booking Cancelled", description: "Your booking has been successfully cancelled." });
    setSelectedBooking(null);
  };

  const handleOpenReschedule = (booking: Booking) => {
    const start = parseISO(`${booking.date}T${booking.startTime}`);
    const end = parseISO(`${booking.date}T${booking.endTime}`);
    const bookingDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    setSelectedBooking(booking);
    setRescheduleDate(parseISO(booking.date));
    setRescheduleTime(booking.startTime);

    if (bookingDuration === 1 || bookingDuration === 2) {
      setDurationMode('preset');
      setDuration(bookingDuration);
    } else {
      setDurationMode('custom');
      setCustomDuration(bookingDuration);
      setDuration(1);
    }

    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      toast({ title: "Error", description: "Please select a date and time for reschedule.", variant: "destructive" });
      return;
    }

    const finalDuration = durationMode === 'preset' ? duration : customDuration;
    const newEndTime = format(addHours(parseISO(`${format(rescheduleDate, "yyyy-MM-dd")}T${rescheduleTime}`), finalDuration), "HH:mm");

    setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? {
      ...b,
      date: format(rescheduleDate, "yyyy-MM-dd"),
      startTime: rescheduleTime,
      endTime: newEndTime,
      status: 'confirmed',
    } : b));

    toast({
      title: "Booking Rescheduled",
      description: `Your booking for "${selectedBooking.title}" has been successfully moved.`
    });

    setIsRescheduleOpen(false);
    setSelectedBooking(null);
    setRescheduleTime(null);
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardDescription>View, reschedule, or cancel your bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Skeleton className="h-8 w-24 inline-block" />
                        <Skeleton className="h-8 w-16 inline-block" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : myBookings.length > 0 ? myBookings.map(booking => {
                  const room = rooms.find(r => r.id === booking.roomId);
                  const isPast = isBefore(parseISO(`${booking.date}T${booking.endTime}`), new Date());
                  const canAct = !isPast && booking.status === 'confirmed';

                  return (
                    <TableRow
                      key={booking.id}
                      className={cn(
                        isPast && 'text-muted-foreground',
                        booking.status === 'cancelled' && 'line-through text-muted-foreground'
                      )}
                    >
                      <TableCell>{room?.name}</TableCell>
                      <TableCell className="font-medium">{booking.title}</TableCell>
                      <TableCell>{format(parseISO(booking.date), "PPP")}</TableCell>
                      <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canAct}
                          onClick={() => handleOpenReschedule(booking)}
                        >
                          Reschedule
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!canAct}
                            >
                              Cancel
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Booking?</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to cancel the booking for "{booking.title}"?</p>
                            <DialogFooter>
                              <DialogClose asChild><Button variant="outline">Back</Button></DialogClose>
                              <DialogClose asChild><Button variant="destructive" onClick={() => handleCancelBooking(booking.id)}>Yes, Cancel</Button></DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No bookings found for your user.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Reschedule: "{selectedBooking?.title}"</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select New Date</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={(date) => {
                    setRescheduleDate(date);
                    setRescheduleTime(null);
                  }}
                  className="rounded-md border"
                  disabled={(d) => d < startOfDay(new Date())}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Select New Time Slot</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {timeSlots.map(slot => (
                    isSlotBooked(
                      slot,
                      selectedBooking?.roomId || '',
                      rescheduleDate!,
                      allBookings,
                      1,
                      selectedBooking?.id
                    ) ?
                      <Button key={slot} variant="outline" disabled className="w-full justify-start line-through text-base" size="lg"><Clock className="mr-2 h-4 w-4" />{slot}</Button>
                      : <TimeSlot key={slot} time={slot} onSelect={setRescheduleTime} isSelected={rescheduleTime === slot} />
                  ))}
                </div>
              </div>
              {rescheduleTime && (
                <div className="space-y-4 pt-4">
                  <Label className="font-semibold text-lg">Booking Duration</Label>
                  <RadioGroup value={durationMode} onValueChange={(v) => setDurationMode(v as "preset" | "custom")} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="preset" id="r-preset" onClick={() => setDuration(1)} />
                      <Label htmlFor="r-preset">Preset</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="r-custom" />
                      <Label htmlFor="r-custom">Custom</Label>
                    </div>
                  </RadioGroup>

                  {durationMode === 'preset' && (
                    <RadioGroup value={String(duration)} onValueChange={(v) => setDuration(Number(v))} className="flex space-x-2 pt-2">
                      <Button
                        type="button"
                        variant={duration === 1 ? 'default' : 'outline'}
                        onClick={() => setDuration(1)}
                        disabled={isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, allBookings, 1, selectedBooking?.id)}
                      >
                        1 Hour
                      </Button>
                      <Button
                        type="button"
                        variant={duration === 2 ? 'default' : 'outline'}
                        onClick={() => setDuration(2)}
                        disabled={isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, allBookings, 2, selectedBooking?.id)}
                      >
                        2 Hours
                      </Button>
                    </RadioGroup>
                  )}

                  {durationMode === 'custom' && (
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="customDurationReschedule">Custom Hours: {customDuration}</Label>
                      </div>
                      <Slider
                        id="customDurationReschedule"
                        min={1}
                        max={4}
                        step={1}
                        value={[customDuration]}
                        onValueChange={(v) => setCustomDuration(v[0])}
                      />
                      {isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, allBookings, customDuration, selectedBooking?.id) &&
                        <p className="text-sm text-destructive">This duration conflicts with another booking.</p>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={handleConfirmReschedule}
              disabled={
                !rescheduleTime ||
                !rescheduleDate ||
                (durationMode === 'custom' && isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, allBookings, customDuration, selectedBooking?.id)) ||
                (durationMode === 'preset' && isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, allBookings, duration, selectedBooking?.id))
              }
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
