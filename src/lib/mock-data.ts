
import type { User, Amenity, Department, Room, Booking } from "@/lib/types";
import { format, addDays, subDays } from 'date-fns';

const futureDate = (days: number) => format(addDays(new Date(), days), 'yyyy-MM-dd');
const pastDate = (days: number) => format(subDays(new Date(), days), 'yyyy-MM-dd');

export const hospitalDepartments: Department[] = [
  "Nursing",
  "Radiology",
  "Cardiology",
  "Oncology",
  "Neurology",
  "Pediatrics",
  "Surgery",
  "Emergency",
  "Pharmacy",
  "Laboratory",
  "Physiotherapy",
  "IT",
  "Operations",
  "Marketing",
  "Sales",
  "HR",
];

export const mockUsers: User[] = [
  { 
    id: "a1b2c3d4-e5f6-7890-1234-567890abcdef", 
    name: "Loke Yao Ren", 
    email: "admin@gmail.com", 
    password: "12345678", 
    role: "Admin", 
    status: "approved", 
    avatar: "https://i.pravatar.cc/150?u=admin@gmail.com", 
    department: "IT", 
    createdAt: "2023-01-15" 
  },
  { 
    id: "b2c3d4e5-f6a7-8901-2345-67890abcdef1", 
    name: "Manager Alice", 
    email: "manager@gmail.com", 
    password: "12345678", 
    role: "Manager", 
    status: "approved", 
    avatar: "https://i.pravatar.cc/150?u=manager@gmail.com", 
    department: "Operations", 
    createdAt: "2023-02-20" 
  },
  { 
    id: "c3d4e5f6-a7b8-9012-3456-7890abcdef23", 
    name: "User Bob", 
    email: "user@gmail.com", 
    password: "12345678", 
    role: "User", 
    status: "approved", 
    avatar: "https://i.pravatar.cc/150?u=user@gmail.com", 
    department: "Nursing", 
    createdAt: "2023-03-25" 
  },
  { 
    id: "d4e5f6a7-b8c9-0123-4567-890abcdef345", 
    name: "Pending Penny", 
    email: "pending@assunta.com", 
    password: "12345678", 
    role: "User", 
    status: "pending", 
    avatar: "https://i.pravatar.cc/150?u=pending@assunta.com", 
    department: "Radiology", 
    createdAt: "2023-04-01" 
  }
];

export const allAmenities: Amenity[] = ["Projector", "Whiteboard", "Video Conferencing", "TV Screen", "Coffee Machine", "LAN Cable", "HDMI Cable"];

export const mockRooms: Room[] = [
    { 
      id: "room-1", 
      name: "The Boardroom", 
      capacity: 12, 
      level: 3, 
      amenities: ["Projector", "Whiteboard", "Video Conferencing", "Coffee Machine"], 
      image: "https://placehold.co/600x400.png",
      dataAiHint: "boardroom meeting"
    },
    { 
      id: "room-2", 
      name: "Focus Hub", 
      capacity: 4, 
      level: 5, 
      amenities: ["Whiteboard", "TV Screen", "HDMI Cable"], 
      image: "https://placehold.co/600x400.png",
      dataAiHint: "small office"
    },
    { 
      id: "room-3", 
      name: "The Collab Space", 
      capacity: 8, 
      level: 3, 
      amenities: ["TV Screen", "LAN Cable", "Whiteboard"], 
      image: "https://placehold.co/600x400.png",
      dataAiHint: "collaborative space"
    },
     { 
      id: "room-4", 
      name: "Training Center", 
      capacity: 20, 
      level: 1, 
      amenities: ["Projector", "Whiteboard", "Video Conferencing"], 
      image: "https://placehold.co/600x400.png",
      dataAiHint: "training room"
    },
];

export const mockBookings: Booking[] = [
    { 
        id: "booking-1", 
        roomId: "room-1", 
        userId: "c3d4e5f6-a7b8-9012-3456-7890abcdef23", // User Bob
        date: futureDate(2), 
        startTime: "10:00", 
        endTime: "11:00", 
        title: "Quarterly Review", 
        status: "confirmed",
    },
    { 
        id: "booking-2", 
        roomId: "room-2", 
        userId: "b2c3d4e5-f6a7-8901-2345-67890abcdef1", // Manager Alice
        date: futureDate(3), 
        startTime: "14:00", 
        endTime: "16:00", 
        title: "Project Alpha Sync", 
        status: "confirmed",
    },
     { 
        id: "booking-3", 
        roomId: "room-1", 
        userId: "c3d4e5f6-a7b8-9012-3456-7890abcdef23", // User Bob
        date: futureDate(5), 
        startTime: "11:00", 
        endTime: "12:00", 
        title: "Client Follow-up", 
        status: "confirmed",
    },
    { 
        id: "booking-4", 
        roomId: "room-3", 
        userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Admin
        date: pastDate(1), 
        startTime: "09:00", 
        endTime: "10:00", 
        title: "IT Dept Meeting", 
        status: "cancelled",
    },
];
