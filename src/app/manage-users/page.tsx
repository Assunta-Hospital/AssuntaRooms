
'use client';

import {
  ShieldCheck,
  ShieldX,
  MoreVertical,
  UserX,
  UserCheck
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
  Badge // 2. Get user profile
    const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', authData?.user?.id || '')
    .single();

if (dbError || !dbUser) {
  toast({
    variant: "destructive",
    title: "Login Failed",
    description: "User profile not found",
    className: "bg-red-600 hover:bg-red-700",
  });
  return { success: false };
}

// 3. Handle account status with redirect for approved users
const statusConfig = {
  approved: {
    className: "bg-green-600 hover:bg-green-700",
    action: () => {
      setUser(dbUser);
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
        className: "bg-green-600 hover:bg-green-700",
      });
      router.push('/dashboard'); // Add this line
      return { success: true };
    }
  },
  pending: {
    className: "bg-yellow-500 hover:bg-yellow-600",
    action: () => {
      toast({
        title: "Account Pending",
        description: "Your account is awaiting approval",
        className: "bg-yellow-500 hover:bg-yellow-600",
      });
      return { success: false };
    }
  },
  rejected: {
    className: "bg-red-600 hover:bg-red-700",
    action: () => {
      toast({
        title: "Account Rejected",
        description: "Please contact administrator",
        className: "bg-red-600 hover:bg-red-700",
      });
      return { success: false };
    }
  },
  suspended: {
    className: "bg-slate-600 hover:bg-slate-700",
    action: () => {
      toast({
        title: "Account Suspended",
        description: "Please contact support",
        className: "bg-slate-600 hover:bg-slate-700",
      });
      return { success: false };
    }
  }
};

return statusConfig[dbUser.status as keyof typeof statusConfig].action();

  } catch (err: any) {
  console.error("Login error:", err);
  toast({
    variant: "destructive",
    title: "Login Failed",
    description: err.message || "Invalid credentials",
    className: "bg-red-600 hover:bg-red-700",
  });
  return { success: false };
}
};
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
import type { User, UserStatus } from '@/lib/types'; // make sure 'User' has `id`, `email`, `name`, `role`, `status`

const statuses: UserStatus[] = ['approved', 'pending', 'rejected', 'suspended'];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState('name-asc');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to load users' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: newStatus } : user));
    toast({
      title: 'User Status Updated',
      description: `User has been ${newStatus}`
    });

    // Optional: call API to persist change
    await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? users
      : users.filter(user => user.status === statusFilter);

    return filtered.sort((a, b) => {
      const [key, direction] = sortKey.split('-');
      const dir = direction === 'asc' ? 1 : -1;

      if (key === 'name') return a.username.localeCompare(b.username) * dir;
      if (key === 'status') return a.status.localeCompare(b.status) * dir;

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
              <Select value={statusFilter} onValueChange={val => setStatusFilter(val as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
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
                  <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                  <SelectItem value="status-desc">Status (Z-A)</SelectItem>
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
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAndSorted.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge className={cn('text-white', getStatusColor(user.status))}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === 'pending' && (
                          <>
                            <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'approved')}>
                              <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'rejected')}>
                              <ShieldX className="mr-2 h-4 w-4 text-red-500" />Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <DropdownMenuItem onSelect={() => handleStatusChange(user.id, 'suspended')}>
                            <UserX className="mr-2 h-4 w-4 text-red-500" />Suspend
                          </DropdownMenuItem>
                        )}
                        {(user.status === 'rejected' || user.status === 'suspended') && (
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
    </DashboardLayout>
  );
}
