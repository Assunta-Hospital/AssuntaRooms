
"use client";

import { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, ShieldX, MoreVertical, UserX, UserCheck } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { User, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const userStatuses: UserStatus[] = ['approved', 'pending', 'rejected', 'suspended'];

export default function ManageUsersPage() {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
    const [sortKey, setSortKey] = useState<string>('name-asc');
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        // Simulate loading data
        setTimeout(() => {
            setUsers(mockUsers);
            setIsLoading(false);
        }, 300);
    }, []);

    const handleStatusChange = (userId: string, newStatus: UserStatus) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast({
            title: "User Status Updated",
            description: `The user has been ${newStatus}.`
        });
    }

    const getStatusClass = (status: User['status']) => {
        switch (status) {
            case 'approved':
                return 'bg-green-600 hover:bg-green-700';
            case 'pending':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'rejected':
                return 'bg-red-600 hover:bg-red-700';
            case 'suspended':
                return 'bg-slate-600 hover:bg-slate-700';
            default:
                return '';
        }
    };
    
    const processedUsers = useMemo(() => {
        const filtered = statusFilter === 'all' 
            ? [...users] 
            : users.filter(user => user.status === statusFilter);

        return filtered.sort((a, b) => {
            const [key, direction] = sortKey.split('-');

            if (key === 'name') {
                 return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
             if (key === 'status') {
                 return direction === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
            }
            return 0;
        });
    }, [users, statusFilter, sortKey]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>View and manage all registered users.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2">
                                    <Label htmlFor="filter-status" className="text-sm font-medium">Filter by Status</Label>
                                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as UserStatus | 'all')}>
                                        <SelectTrigger id="filter-status" className="w-[180px]">
                                            <SelectValue placeholder="Filter by status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {userStatuses.map(status => (
                                                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="sort-users" className="text-sm font-medium">Sort by</Label>
                                    <Select value={sortKey} onValueChange={setSortKey}>
                                        <SelectTrigger id="sort-users" className="w-[180px]">
                                            <SelectValue placeholder="Sort by..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                                            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({length: 5}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : processedUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                        <TableCell>
                                            <Badge className={cn('text-white', getStatusClass(user.status))}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {user.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'approved')}>
                                                                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'rejected')}>
                                                                <ShieldX className="mr-2 h-4 w-4 text-destructive" />Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {user.status === 'approved' && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'suspended')}>
                                                            <UserX className="mr-2 h-4 w-4 text-destructive" />Suspend
                                                        </DropdownMenuItem>
                                                    )}
                                                     {(user.status === 'suspended' || user.status === 'rejected') && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'approved')}>
                                                            <UserCheck className="mr-2 h-4 w-4 text-green-500" />Reinstate
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
