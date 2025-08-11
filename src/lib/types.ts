
export type Role = "Admin" | "Manager" | "User";
export type UserStatus = "approved" | "pending" | "rejected" | "suspended";

export type Department = "Nursing" | "Radiology" | "Cardiology" | "Oncology" | "Neurology" | "Pediatrics" | "Surgery" | "Emergency" | "Pharmacy" | "Laboratory" | "Physiotherapy" | "IT" | "Operations" | "Marketing" | "Sales" | "HR" | "others";

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: Role;
  status: UserStatus;
  avatar: string;
  department: Department;
  createdAt: string;
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
