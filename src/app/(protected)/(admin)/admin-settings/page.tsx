"use client";

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Clock, Users, Building2, Calendar } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, PieChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, Cell } from 'recharts';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import type { Booking, Room, User } from '@/lib/types';

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
  const [error, setError] = useState<string | null>(null);

  // Helper function to get department name from ID
  const getDepartmentName = (deptId: string): string | null => {
    const departmentMap: Record<string, string> = {};
    return departmentMap[deptId] || null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [
          { data: bookingsData, error: bookingsError },
          { data: usersData, error: usersError },
          { data: roomsData, error: roomsError }
        ] = await Promise.all([
          supabase.from('bookings').select('*'),
          supabase.from('users').select('*'),
          supabase.from('rooms').select('*')
        ]);

        if (bookingsError) throw bookingsError;
        if (usersError) throw usersError;
        if (roomsError) throw roomsError;

        setBookings(bookingsData || []);
        setUsers(usersData || []);
        setRooms(roomsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const {
    totalBookings,
    mostPopularRoomName,
    mostPopularRoomPercentage,
    bookingFrequencyData,
    roomPopularityData,
    departmentBookingData,
    chartConfig,
    activeUsersCount
  } = useMemo(() => {
    if (!bookings.length || !users.length || !rooms.length) {
      return {
        totalBookings: 0,
        mostPopularRoomName: 'N/A',
        mostPopularRoomPercentage: '0',
        bookingFrequencyData: bookingFrequencyDataTemplate,
        roomPopularityData: [],
        departmentBookingData: [],
        chartConfig: {},
        activeUsersCount: 0
      };
    }

    // Booking Frequency
    const freqData = [...bookingFrequencyDataTemplate];
    bookings.forEach(booking => {
      const dayIndex = new Date(booking.booked_at).getDay();
      const adjustedIndex = (dayIndex === 0) ? 6 : dayIndex - 1;
      freqData[adjustedIndex].bookings++;
    });

    // Room Popularity
    const roomCounts: { [key: string]: number } = {};
    bookings.forEach(booking => {
      roomCounts[booking.room_id] = (roomCounts[booking.room_id] || 0) + 1;
    });
    const popData = Object.entries(roomCounts).map(([roomId, value], index) => {
      const room = rooms.find(r => r.room_id === roomId);
      return {
        name: room?.name || `Room ${roomId}`,
        value,
        color: `hsl(var(--chart-${(index % 5) + 1}))`
      }
    });

    // Department Bookings
    const departmentCounts: { [key: string]: number } = {};
    const activeUsers = new Set<string>();
    bookings.forEach(booking => {
      const user = users.find(u => u.user_id === booking.user_id);
      if (user) {
        activeUsers.add(user.user_id);
        if (user.dept_id) {
          const departmentName = getDepartmentName(user.dept_id);
          if (departmentName) {
            departmentCounts[departmentName] = (departmentCounts[departmentName] || 0) + 1;
          }
        }
      }
    });

    const deptColors: { [key: string]: string } = {
      'IT': "hsl(var(--chart-1))",
      'Operations': "hsl(var(--chart-2))",
      'Marketing': "hsl(var(--chart-3))",
      'Sales': "hsl(var(--chart-4))",
      'HR': "hsl(var(--chart-5))",
      'Nursing': "hsl(var(--chart-6))",
      'Radiology': "hsl(var(--chart-7))",
      'Cardiology': "hsl(var(--chart-8))"
    };

    const deptData = Object.entries(departmentCounts).map(([name, value]) => ({
      name,
      value,
      color: deptColors[name] || `hsl(var(--chart-${Math.floor(Math.random() * 10) + 1}))`,
    }));

    // Chart Config
    const config: any = { bookings: { label: "Bookings", color: "hsl(var(--chart-1))" } };
    popData.forEach(item => { config[item.name] = { label: item.name, color: item.color }; });
    deptData.forEach(item => { config[item.name] = { label: item.name, color: item.color }; });

    const tb = bookings.length;
    const mostPopRoom = popData.reduce((prev, current) => (prev.value > current.value) ? prev : current, { value: 0, name: 'N/A' });

    return {
      totalBookings: tb,
      mostPopularRoomName: mostPopRoom.name,
      mostPopularRoomPercentage: tb > 0 ? ((mostPopRoom.value / tb) * 100).toFixed(0) : '0',
      bookingFrequencyData: freqData,
      roomPopularityData: popData,
      departmentBookingData: deptData,
      chartConfig: config,
      activeUsersCount: activeUsers.size
    };

  }, [bookings, users, rooms]);

  const calculateAverageDuration = () => {
    if (!bookings.length) return '0 hours';

    let totalMinutes = 0;
    bookings.forEach(booking => {
      const start = new Date(`${booking.date}T${booking.start_time}`);
      const end = new Date(`${booking.date}T${booking.end_time}`);
      totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    });

    const avgMinutes = totalMinutes / bookings.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);

    return hours > 0 ? `${hours}.${Math.floor(minutes / 6)} hours` : `${minutes} minutes`;
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-red-500 p-4 border border-red-500 rounded-md">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">An overview of meeting room usage and statistics.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>This month</span>
          </div>
        </div>

        {/* Top Cards - 4 columns */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeUsersCount}</div>
                  <p className="text-xs text-muted-foreground">Unique users booking</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{calculateAverageDuration()}</div>
                  <p className="text-xs text-muted-foreground">-5% from last month</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Room</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{mostPopularRoomName}</div>
                  <p className="text-xs text-muted-foreground">{mostPopularRoomPercentage}% of all bookings</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Charts - 2 columns */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">Weekly Bookings</CardTitle>
              <CardDescription>Number of bookings per day of the week</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart accessibilityLayer data={bookingFrequencyData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar
                        dataKey="bookings"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">Room Popularity</CardTitle>
              <CardDescription>Distribution of bookings across rooms</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Pie
                        data={roomPopularityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {roomPopularityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
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
