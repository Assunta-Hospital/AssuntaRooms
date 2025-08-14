import {
  isSameDay,
  parseISO,
  addHours,
  areIntervalsOverlapping,
  format as formatDateFns,
  startOfDay
} from "date-fns";
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
  date: Date | undefined,
  allBookings: Booking[],
  duration: number = 1,
  excludedBookingId?: string
): boolean => {
  // Return true (booked) if any required parameter is missing
  if (!startTime || !roomId || !date) return true;

  try {
    const dateString = formatDate(date);
    const proposedStartTime = new Date(`${dateString}T${startTime}:00`);
    const proposedEndTime = addHours(proposedStartTime, duration);

    // Check if the booking extends beyond available slots
    const lastSlotTime = new Date(`${dateString}T${timeSlots[timeSlots.length - 1]}:00`);
    const bookingDeadline = addHours(lastSlotTime, 1);
    if (proposedEndTime > bookingDeadline) {
      return true;
    }

    const proposedInterval = { start: proposedStartTime, end: proposedEndTime };

    return allBookings.some(booking => {
      // Skip if this is the booking we're excluding (for rescheduling)
      if (booking.bookings_id === excludedBookingId) return false;
      // Skip if not for this room or cancelled
      if (booking.room_id !== roomId || booking.status === 'cancelled') return false;

      const existingStartTime = new Date(booking.start_time);
      const existingEndTime = new Date(booking.end_time);
      const existingInterval = { start: existingStartTime, end: existingEndTime };

      return areIntervalsOverlapping(proposedInterval, existingInterval, { inclusive: false });
    });
  } catch (error) {
    console.error('Error in isSlotBooked:', error);
    return true; // If there's an error, consider the slot booked to be safe
  }
};

// Helper to format date consistently
const formatDate = (date: Date): string => {
  // Use startOfDay to normalize the date and prevent timezone issues
  return formatDateFns(startOfDay(date), 'yyyy-MM-dd');
};
