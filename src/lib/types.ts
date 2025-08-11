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
  tags: [];
  capacity: number;
  location: string;
  room_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  booking_id: string;
  room_id: string;
  id: string; // suppoesd to be user_id, didnt change cuz already integrated oops
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  title: string;
  status: BookingStatus;
}
