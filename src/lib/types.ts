
export type Role = "Admin" | "Manager" | "User";
export type UserStatus = "approved" | "pending" | "rejected" | "suspended";

export type Department = "Nursing" | "Radiology" | "Cardiology" | "Oncology" | "Neurology" | "Pediatrics" | "Surgery" | "Emergency" | "Pharmacy" | "Laboratory" | "Physiotherapy" | "IT" | "Operations" | "Marketing" | "Sales" | "HR" | "others";

export interface User {
  id: string; // change to appropriate id alksdfjla;sdk
  username: string;
  email: string;
  password?: string; // Note: In a real app, never send passwords to the client.
  role: Role;
  status: UserStatus;
  avatar: string;
  department: Department;
  createdAt: string; // YYYY-MM-DD format
}

export type Amenity = "Projector" | "Whiteboard" | "Video Conferencing" | "TV Screen" | "Coffee Machine" | "LAN Cable" | "HDMI Cable";


export interface Room {
  id: string;
  name: string;
  capacity: number;
  level: number;
  amenities: Amenity[];
  image: string;
  dataAiHint: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  title: string;
  status: BookingStatus;
}
