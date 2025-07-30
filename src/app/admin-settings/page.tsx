
"use client";

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Building2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, PieChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, Cell } from 'recharts';
import { DashboardLayout } from "@/components/dashboard-layout";
import { mockBookings, mockRooms, mockUsers } from '@/lib/mock-data';
import type { Booking, Room, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const bookingFrequencyDataTemplate = [
    { day: "Mon", bookings: 0 },
    { day: "Tue", bookings: 0 },
    { day: "Wed", bookings: 0 },
    { day: "Thu", bookings: 0 },
    { day: "Fri", bookings: 0 },
    { day: "Sat", bookings: 0 },
    { day: "Sun", bookings: 0 },
];

export default function AdminDashboardPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setBookings(mockBookings);
            setUsers(mockUsers);
            setRooms(mockRooms);
            setIsLoading(false);
        }, 500);
    }, []);
    
    const {
        totalBookings,
        mostPopularRoomName,
        mostPopularRoomPercentage,
        bookingFrequencyData,
        roomPopularityData,
        departmentBookingData,
        chartConfig
    } = useMemo(() => {
        if (!bookings.length || !users.length || !rooms.length) {
            return { totalBookings: 0, mostPopularRoomName: 'N/A', mostPopularRoomPercentage: '0', bookingFrequencyData: bookingFrequencyDataTemplate, roomPopularityData: [], departmentBookingData: [], chartConfig: {} };
        }

        // Booking Frequency
        const freqData = [...bookingFrequencyDataTemplate];
        bookings.forEach(booking => {
            const dayIndex = new Date(booking.date).getDay(); // Sunday = 0
            const adjustedIndex = (dayIndex === 0) ? 6 : dayIndex - 1; // Mon = 0, Sun = 6
            freqData[adjustedIndex].bookings++;
        });

        // Room Popularity
        const roomCounts: { [key: string]: number } = {};
        bookings.forEach(booking => {
            roomCounts[booking.roomId] = (roomCounts[booking.roomId] || 0) + 1;
        });
        const popData = Object.entries(roomCounts).map(([roomId, value], index) => {
            const room = rooms.find(r => r.id === roomId);
            return {
                name: room?.name || `Room ${roomId}`,
                value,
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });

        // Department Bookings
        const departmentCounts: { [key: string]: number } = {};
        bookings.forEach(booking => {
            const user = users.find(u => u.id === booking.userId);
            if (user && user.department) {
                departmentCounts[user.department] = (departmentCounts[user.department] || 0) + 1;
            }
        });
        const deptColors: { [key: string]: string } = { 'IT': "hsl(var(--chart-1))", 'Operations': "hsl(var(--chart-2))", 'Marketing': "hsl(var(--chart-3))", 'Sales': "hsl(var(--chart-4))", 'HR': "hsl(var(--chart-5))" };
        const deptData = Object.entries(departmentCounts).map(([name, value], index) => ({
            name, value, color: deptColors[name] || `hsl(var(--chart-${(index % 5) + 1}))`,
        }));
        
        // Chart Config
        const config: any = { bookings: { label: "Bookings", color: "hsl(var(--chart-1))" } };
        popData.forEach(item => { config[item.name] = { label: item.name, color: item.color }; });
        deptData.forEach(item => { config[item.name] = { label: item.name, color: item.color }; });

        const tb = bookings.length;
        const mostPopRoom = popData.reduce((prev, current) => (prev.value > current.value) ? prev : current, {value: 0, name: 'N/A'});
        
        return {
            totalBookings: tb,
            mostPopularRoomName: mostPopRoom.name,
            mostPopularRoomPercentage: tb > 0 ? ((mostPopRoom.value / tb) * 100).toFixed(0) : '0',
            bookingFrequencyData: freqData,
            roomPopularityData: popData,
            departmentBookingData: deptData,
            chartConfig: config
        };

    }, [bookings, users, rooms]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <p className="text-muted-foreground -mt-4">An overview of meeting room usage and statistics.</p>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalBookings}</div> }
                             {isLoading ? <Skeleton className="h-4 w-1/3 mt-1" /> : <p className="text-xs text-muted-foreground">+20.1% from last month</p> }
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Booking Duration</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">1.2 hours</div> }
                            {isLoading ? <Skeleton className="h-4 w-1/3 mt-1" /> : <p className="text-xs text-muted-foreground">-5% from last month</p> }
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Most Popular Room</CardTitle>
                            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{mostPopularRoomName}</div> }
                             {isLoading ? <Skeleton className="h-4 w-1/3 mt-1" /> : <p className="text-xs text-muted-foreground">{mostPopularRoomPercentage}% of all bookings</p> }
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Booking Frequency</CardTitle>
                            <CardDescription>Number of bookings per day of the week.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart accessibilityLayer data={bookingFrequencyData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Bar dataKey="bookings" fill="var(--color-bookings)" radius={8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Room Popularity</CardTitle>
                            <CardDescription>Distribution of bookings across available rooms.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                             {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart accessibilityLayer>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Pie 
                                                data={roomPopularityData} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={100} 
                                                innerRadius={60}
                                                paddingAngle={5}
                                                labelLine={false}
                                            >
                                                {roomPopularityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                             )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Bookings by Department</CardTitle>
                            <CardDescription>Distribution of bookings across departments.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart accessibilityLayer>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Pie 
                                                data={departmentBookingData} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={100} 
                                                innerRadius={60}
                                                paddingAngle={5}
                                                labelLine={false}
                                            >
                                                {departmentBookingData.map((entry, index) => (
                                                    <Cell key={`cell-dept-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
