
"use client";

import { useState, useEffect } from 'react';
import { format, parseISO, addHours, isSameDay } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { mockBookings, mockUsers, mockRooms } from '@/lib/mock-data';

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
import { Clock } from 'lucide-react';

function TimeSlot({ time, onSelect, isSelected }: { time: string, onSelect: (time: string) => void, isSelected: boolean }) {
    return (
        <Button 
            variant={isSelected ? 'default' : 'outline'} 
            onClick={() => onSelect(time)}
            className="w-full justify-start text-base"
            size="lg"
        >
            <Clock className="mr-2 h-4 w-4"/>
            {time}
        </Button>
    )
}

export default function ManageBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>(mockBookings);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [rooms, setRooms] = useState<Room[]>(mockRooms);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());
    const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    
    const [duration, setDuration] = useState(1);
    const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
    const [customDuration, setCustomDuration] = useState(1);
    
    const { toast } = useToast();

    useEffect(() => {
      setIsLoading(true);
      const sortedBookings = [...mockBookings].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookings(sortedBookings);
      setTimeout(() => setIsLoading(false), 300);
    }, []);
    
    const getUserById = (id: string): User | undefined => users.find(u => u.id === id);
    const getRoomById = (id: string): Room | undefined => rooms.find(r => r.id === id);

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

    const handleConfirmReschedule = () => {
        if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;
        
        const finalDuration = durationMode === 'preset' ? duration : customDuration;
        const newEndTime = format(addHours(parseISO(`${format(rescheduleDate, "yyyy-MM-dd")}T${rescheduleTime}`), finalDuration), "HH:mm");

        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? {
            ...b,
            date: format(rescheduleDate, "yyyy-MM-dd"),
            startTime: rescheduleTime!,
            endTime: newEndTime,
            status: 'confirmed',
        } : b));

        toast({
            title: "Booking Rescheduled",
            description: `Booking for "${selectedBooking.title}" moved to ${format(rescheduleDate, "PPP")} at ${rescheduleTime}.`
        });
            
        setIsRescheduleOpen(false);
        setSelectedBooking(null);
        setRescheduleTime(null);
    };

    const handleCancelBooking = (bookingId: string) => {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        toast({
            variant: "destructive",
            title: "Booking Cancelled",
            description: "The booking has been successfully cancelled.",
        });
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
                                            <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : bookings.map(booking => {
                                    const room = getRoomById(booking.roomId);
                                    const bookingUser = getUserById(booking.userId);
                                    const isPast = new Date(booking.date) < new Date() && !isSameDay(new Date(booking.date), new Date());
                                    const canAct = !isPast && booking.status !== 'cancelled';
                                    
                                    return (
                                    <TableRow key={booking.id} className={cn(isPast && 'text-muted-foreground', booking.status === 'cancelled' && 'line-through text-muted-foreground')}>
                                        <TableCell>{bookingUser?.name || 'Unknown'}</TableCell>
                                        <TableCell>{room?.name}</TableCell>
                                        <TableCell className="font-medium">{booking.title}</TableCell>
                                        <TableCell>
                                            {`${format(parseISO(booking.date), "PPP")} @ ${booking.startTime}`}
                                        </TableCell>
                                        <TableCell>
                                             <Badge variant={booking.status === 'confirmed' ? 'default' : 'destructive'}
                                                className={cn(booking.status === 'confirmed' && 'bg-green-600')}
                                             >
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-0.5">
                                            {canAct && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleOpenReschedule(booking)}><Pencil className="h-4 w-4"/></Button>
                                                    
                                                     <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
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
                                                                    <Button variant="destructive" onClick={() => handleCancelBooking(booking.id)}>Yes, Cancel</Button>
                                                                </DialogClose>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Reschedule Booking: "{selectedBooking?.title}"</DialogTitle>
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
                                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Select New Time Slot</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {timeSlots.map(slot => (
                                    isSlotBooked(slot, selectedBooking?.roomId || '', rescheduleDate!, bookings, 1, selectedBooking?.id) ? 
                                    <Button key={slot} variant="outline" disabled className="w-full justify-start line-through text-base" size="lg"><Clock className="mr-2 h-4 w-4"/>{slot}</Button> 
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
                                            <Button type="button" variant={duration === 1 ? 'default' : 'outline'} onClick={() => setDuration(1)} disabled={isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, bookings, 1, selectedBooking?.id)}>1 Hour</Button>
                                            <Button type="button" variant={duration === 2 ? 'default' : 'outline'} onClick={() => setDuration(2)} disabled={isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, bookings, 2, selectedBooking?.id)}>2 Hours</Button>
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
                                            {isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, bookings, customDuration, selectedBooking?.id) && <p className="text-sm text-destructive">This duration conflicts with another booking.</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmReschedule} disabled={!rescheduleTime || !rescheduleDate || (durationMode === 'custom' && isSlotBooked(rescheduleTime, selectedBooking!.roomId, rescheduleDate!, bookings, customDuration, selectedBooking?.id))}>Confirm Reschedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
