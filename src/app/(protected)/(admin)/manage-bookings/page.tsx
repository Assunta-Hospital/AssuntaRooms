'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, addHours, isSameDay } from 'date-fns';
import { Pencil, Trash2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import type { Booking, User, Room } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { isSlotBooked, timeSlots } from "@/lib/booking-utils";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [duration, setDuration] = useState(1);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [customDuration, setCustomDuration] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: bookingsData, error: bookingsError },
          { data: usersData, error: usersError },
          { data: roomsData, error: roomsError }
        ] = await Promise.all([
          supabase.from("bookings").select("*"),
          supabase.from("users").select("*"),
          supabase.from("rooms").select("*")
        ]);

        if (bookingsError || usersError || roomsError) {
          throw bookingsError || usersError || roomsError;
        }

        const sortedBookings = bookingsData?.sort((a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        ) || [];

        setBookings(sortedBookings);
        setUsers(usersData || []);
        setRooms(roomsData || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to fetch data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setRescheduleDate(new Date(booking.start_time));
    setRescheduleTime(format(new Date(booking.start_time), "HH:mm"));

    const durationHours = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60);
    if ([1, 2].includes(durationHours)) {
      setDurationMode('preset');
      setDuration(durationHours);
    } else {
      setDurationMode('custom');
      setCustomDuration(durationHours);
    }

    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select both date and time"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const finalDuration = durationMode === 'preset' ? duration : customDuration;
      const newStartTime = new Date(rescheduleDate);
      const [hours, minutes] = rescheduleTime.split(':').map(Number);
      newStartTime.setHours(hours, minutes, 0, 0);

      const newEndTime = new Date(newStartTime);
      newEndTime.setHours(newStartTime.getHours() + finalDuration);

      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'confirmed'
        })
        .eq('bookings_id', selectedBooking.bookings_id);

      if (error) throw error;

      setBookings(prev => prev.map(b =>
        b.bookings_id === selectedBooking.bookings_id ? {
          ...b,
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'confirmed'
        } : b
      ));

      toast({
        title: "Booking Rescheduled",
        description: `Booking moved to ${format(newStartTime, "PPP")} at ${rescheduleTime}`
      });

      setIsRescheduleOpen(false);
      setSelectedBooking(null);
      setRescheduleTime(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reschedule Failed",
        description: error instanceof Error ? error.message : "Failed to update booking"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('bookings_id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b =>
        b.bookings_id === bookingId ? { ...b, status: 'cancelled' } : b
      ));

      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel booking"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoomById = (roomId: string) => rooms.find(room => room.room_id === roomId);
  const getUserById = (userId: string) => users.find(user => user.user_id === userId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600 hover:bg-green-700">Confirmed</Badge>;
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
            <CardTitle>Manage All Bookings</CardTitle>
            <CardDescription>Review, reschedule, or cancel any booking in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Skeleton className="h-8 w-8 rounded-md inline-block" />
                        <Skeleton className="h-8 w-8 rounded-md inline-block" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : bookings.length > 0 ? (
                  bookings.map(booking => {
                    const room = getRoomById(booking.room_id);
                    const bookingUser = getUserById(booking.user_id);
                    const isPast = new Date(booking.end_time) < new Date() &&
                      !isSameDay(new Date(booking.end_time), new Date());
                    const canAct = !isPast && booking.status !== 'cancelled';

                    return (
                      <TableRow
                        key={booking.bookings_id}
                        className={cn(
                          isPast && 'text-muted-foreground',
                          booking.status === 'cancelled' && 'line-through text-muted-foreground'
                        )}
                      >
                        <TableCell>{bookingUser?.username || 'Unknown'}</TableCell>
                        <TableCell>{room?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-medium">{booking.title}</TableCell>
                        <TableCell>
                          {format(new Date(booking.start_time), "PPP")} @ {format(new Date(booking.start_time), "HH:mm")}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell className="text-right space-x-0.5">
                          {canAct && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() => handleOpenReschedule(booking)}
                                disabled={isUpdating}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    disabled={isUpdating}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Cancel this booking?</DialogTitle>
                                  </DialogHeader>
                                  <p>Are you sure you want to cancel the booking for "{booking.title}"?</p>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Back</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleCancelBooking(booking.bookings_id)}
                                        disabled={isUpdating}
                                      >
                                        {isUpdating ? 'Processing...' : 'Yes, Cancel'}
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No bookings found
                    </TableCell>
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
            <DialogTitle className="font-headline text-2xl">
              Reschedule Booking: "{selectedBooking?.title}"
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select New Date</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  className="rounded-md border"
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
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
                      selectedBooking?.room_id || '',
                      rescheduleDate!,
                      bookings,
                      1,
                      selectedBooking?.bookings_id
                    ) ? (
                      <Button
                        key={slot}
                        variant="outline"
                        disabled
                        className="w-full justify-start line-through text-base"
                        size="lg"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {slot}
                      </Button>
                    ) : (
                      <TimeSlot
                        key={slot}
                        time={slot}
                        onSelect={setRescheduleTime}
                        isSelected={rescheduleTime === slot}
                      />
                    )
                  ))}
                </div>
              </div>
              {rescheduleTime && (
                <div className="space-y-4 pt-4">
                  <Label className="font-semibold text-lg">Booking Duration</Label>
                  <RadioGroup
                    value={durationMode}
                    onValueChange={(v) => setDurationMode(v as "preset" | "custom")}
                    className="flex space-x-4"
                  >
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
                    <RadioGroup
                      value={String(duration)}
                      onValueChange={(v) => setDuration(Number(v))}
                      className="flex space-x-2 pt-2"
                    >
                      <Button
                        type="button"
                        variant={duration === 1 ? 'default' : 'outline'}
                        onClick={() => setDuration(1)}
                        disabled={isSlotBooked(
                          rescheduleTime,
                          selectedBooking!.room_id,
                          rescheduleDate!,
                          bookings,
                          1,
                          selectedBooking?.bookings_id
                        )}
                      >
                        1 Hour
                      </Button>
                      <Button
                        type="button"
                        variant={duration === 2 ? 'default' : 'outline'}
                        onClick={() => setDuration(2)}
                        disabled={isSlotBooked(
                          rescheduleTime,
                          selectedBooking!.room_id,
                          rescheduleDate!,
                          bookings,
                          2,
                          selectedBooking?.bookings_id
                        )}
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
                      {isSlotBooked(
                        rescheduleTime,
                        selectedBooking!.room_id,
                        rescheduleDate!,
                        bookings,
                        customDuration,
                        selectedBooking?.bookings_id
                      ) && (
                          <p className="text-sm text-destructive">
                            This duration conflicts with another booking.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReschedule}
              disabled={
                !rescheduleTime ||
                !rescheduleDate ||
                isUpdating ||
                (durationMode === 'custom' &&
                  isSlotBooked(
                    rescheduleTime,
                    selectedBooking!.room_id,
                    rescheduleDate!,
                    bookings,
                    customDuration,
                    selectedBooking?.bookings_id
                  )
                )
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
