'use client';

import {
  ShieldCheck,
  ShieldX,
  MoreVertical,
  UserX,
  UserCheck,
  Loader2
} from 'lucide-react';
import {
  Button
} from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardDescription, CardTitle
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Badge
} from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Label
} from '@/components/ui/label';
import {
  Skeleton
} from '@/components/ui/skeleton';
import {
  DashboardLayout
} from '@/components/dashboard-layout';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User, UserStatus } from '@/lib/types';

const statuses: UserStatus[] = ['approved', 'pending', 'rejected', 'suspended'];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState('name-asc');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load users',
          description: error instanceof Error ? error.message : 'An error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setIsUpdating(true);
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user =>
        user.user_id === userId ? { ...user, status: newStatus } : user
      ));

      toast({
        title: 'User Status Updated',
        description: `User status changed to ${newStatus}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update user status'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? users
      : users.filter(user => user.status === statusFilter);

    return filtered.sort((a, b) => {
      const [key, direction] = sortKey.split('-');
      const dir = direction === 'asc' ? 1 : -1;

      if (key === 'name') return a.username.localeCompare(b.username) * dir;
      if (key === 'status') return (a.status || '').localeCompare(b.status || '') * dir;
      if (key === 'date') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime() * dir;

      return 0;
    });
  }, [users, statusFilter, sortKey]);

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-600 hover:bg-green-700';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'rejected': return 'bg-red-600 hover:bg-red-700';
      case 'suspended': return 'bg-slate-600 hover:bg-slate-700';
      default: return '';
    }
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all registered users.</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label>Filter by Status</Label>
              <Select
                value={statusFilter}
                onValueChange={val => setStatusFilter(val as UserStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Sort by</Label>
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAndSorted.length > 0 ? (
                filteredAndSorted.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-white', getStatusColor(user.status))}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.dept_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating}>
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onSelect={() => handleStatusChange(user.user_id, 'approved')}
                                disabled={isUpdating}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleStatusChange(user.user_id, 'rejected')}
                                disabled={isUpdating}
                              >
                                <ShieldX className="mr-2 h-4 w-4 text-red-500" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === 'approved' && (
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(user.user_id, 'suspended')}
                              disabled={isUpdating}
                            >
                              <UserX className="mr-2 h-4 w-4 text-red-500" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {(user.status === 'rejected' || user.status === 'suspended') && (
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(user.user_id, 'approved')}
                              disabled={isUpdating}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                              Reinstate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
