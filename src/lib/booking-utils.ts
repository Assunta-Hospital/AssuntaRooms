import { isSameDay, parseISO, addHours, areIntervalsOverlapping, format as formatDateFns } from "date-fns";
import type { Booking } from "@/lib/types";

export const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

/**
 * Checks if a proposed booking slot conflicts with existing bookings.
 * @param startTime - The start time of the slot to check (e.g., "09:00").
 * @param roomId - The ID of the room for the booking.
 * @param date - The date of the booking.
 * @param allBookings - An array of all existing bookings.
 * @param duration - The duration of the proposed booking in hours.
 * @param excludedBookingId - An optional ID of a booking to exclude from the check (used for rescheduling).
 * @returns A boolean indicating if the slot is booked.
 */
export const isSlotBooked = (
  startTime: string,
  roomId: string,
  date: Date,
  allBookings: Booking[],
  duration: number = 1,
  excludedBookingId?: string
): boolean => {
  if (!startTime) return true;

  const proposedStartTime = parseISO(`${formatDate(date)}T${startTime}`);
  const proposedEndTime = addHours(proposedStartTime, duration);

  const lastSlotTime = parseISO(`${formatDate(date)}T${timeSlots[timeSlots.length - 1]}`);
  const bookingDeadline = addHours(lastSlotTime, 1);
  if (proposedEndTime > bookingDeadline) {
    return true;
  }

  const proposedInterval = { start: proposedStartTime, end: proposedEndTime };

  const conflictingBookings = allBookings.filter(booking =>
    booking.user_id !== excludedBookingId &&
    booking.room_id === roomId &&
    booking.status !== 'cancelled'
  );

  for (const booking of conflictingBookings) {
    const existingStartTime = parseISO(`${booking.date}T${booking.start_time}`);
    const existingEndTime = parseISO(`${booking.date}T${booking.end_time}`);
    const existingInterval = { start: existingStartTime, end: existingEndTime };

    if (areIntervalsOverlapping(proposedInterval, existingInterval, { inclusive: false })) {
      return true;
    }
  }

  return false;
};

// Helper to format date consistently
const formatDate = (date: Date) => {
  return formatDateFns(date, 'yyyy-MM-dd');
};
