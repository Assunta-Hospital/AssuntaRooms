"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Hourglass, XCircle, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StatusPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.status === 'approved')) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const getStatusDetails = () => {
        switch (user.status) {
            case 'pending':
                return {
                    icon: <Hourglass className="h-6 w-6 text-primary" />,
                    title: "Account Pending Approval",
                    message: "Your account has been created but is currently awaiting approval from an administrator. You will be notified once your account is activated."
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-6 w-6 text-destructive" />,
                    title: "Account Rejected",
                    message: "Your account application has been rejected. Please contact an administrator for more information."
                };
            case 'suspended':
                return {
                    icon: <UserX className="h-6 w-6 text-destructive" />,
                    title: "Account Suspended",
                    message: "Your account has been suspended. Please contact an administrator if you believe this is an error."
                };
            default:
                return { icon: null, title: "", message: "" };
        }
    }

    const { icon, title, message } = getStatusDetails();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        {icon}
                    </div>
                    <CardTitle className="text-2xl font-headline">
                        {title}
                    </CardTitle>
                    <CardDescription>
                        Hello, {user.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {message}
                    </p>
                    <Button onClick={logout} className="mt-6 w-full">
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
