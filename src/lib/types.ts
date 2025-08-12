import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export type Role = "Admin" | "Manager" | "User";
export type UserStatus = "approved" | "pending" | "rejected" | "suspended";
export type Department = "Nursing" | "Radiology" | "Cardiology" | "Oncology" | "Neurology" | "Pediatrics" | "Surgery" | "Emergency" | "Pharmacy" | "Laboratory" | "Physiotherapy" | "IT" | "Operations" | "Marketing" | "Sales" | "HR" | "others";

export interface User {
  user_id: string;     // Changed from id to user_id
  username: string;
  email: string;
  dept_id: string;     // Changed from department to dept_id
  pfp_url?: string;    // Changed from avatar to pfp_url
  role: Role;
  status: UserStatus;
  created_at: string;  // Changed from createdAt to created_at
}

export type Amenity = "Projector" | "Whiteboard" | "Video Conferencing" | "TV Screen" | "Coffee Machine" | "LAN Cable" | "HDMI Cable";

export interface Room {
  room_id: string;
  name: string;
  tags: string[];
  capacity: number;
  location: string;
  room_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled";

export interface Booking {
  bookings_id: string;
  room_id: string;
  user_id: string; // suppoesd to be user_id, didnt change cuz already integrated oops
  date: string; // YYYY-MM-DD format
  booked_at: string;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_active: boolean;
  status: BookingStatus;
  updated_at: string;
  title: string;

}
