"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
import {
  Building,
  LayoutDashboard,
  CalendarDays,
  Users,
  User,
  Shield,
  BookMarked,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

//types for menu items
type MenuItem = {
  type?: 'divider' | 'heading';
  href?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles: string[];
};

// in db must follow lowercase if not cant show menuItems
const menuItems: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays, roles: ["admin", "manager", "user"] },
  { href: "/profile", label: "My Profile", icon: User, roles: ["admin", "manager", "user"] },
  { type: 'divider', roles: ["admin", "manager"] },
  { type: 'heading', label: 'Management', roles: ["admin", "manager"] },
  { href: "/manage-venues", label: "Manage Venues", icon: Building, roles: ["admin", "manager"] },
  { href: "/manage-users", label: "User Management", icon: Users, roles: ["admin"] },
  { href: "/admin-settings", label: "Admin Dashboard", icon: Shield, roles: ["admin"] },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppSidebar = ({ isCollapsed, toggleSidebar }: AppSidebarProps) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const userHasRole = (roles: string[]) => !!user && roles.includes(user.role);

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (!userHasRole(item.roles)) return null;

    if (item.type === 'divider') {
      return <hr key={`divider-${index}`} className={cn("my-3", isCollapsed ? 'mx-2' : 'mx-4')} />;
    }

    if (item.type === 'heading') {
      if (isCollapsed) return null;
      return (
        <p key={`heading-${item.label}`} className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {item.label}
        </p>
      );
    }

    if (!item.href || !item.label || !item.icon) return null;

    const isActive = pathname === item.href;
    const IconComponent = item.icon;
    const linkContent = (
      <>
        <IconComponent className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
        <span className={cn("truncate", isCollapsed && "hidden")}>{item.label}</span>
      </>
    );

    const linkClasses = cn(
      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10",
      isActive && "bg-primary/10 text-primary font-semibold",
      isCollapsed && "justify-center"
    );

    if (isCollapsed) {
      return (
        <TooltipProvider key={item.href} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={item.href} className={linkClasses}>
                {linkContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={linkClasses}>
        {linkContent}
      </Link>
    );
  };

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-card h-screen fixed transition-all duration-300 ease-in-out border-r z-40",
      isCollapsed ? "w-20" : "w-60"
    )}>
      <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-2 font-bold text-lg text-destructive", isCollapsed && "hidden")}
        >
          <span className="transition-opacity font-headline">Menu</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10">
          {isCollapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>
      <div className={cn("mt-auto p-4 border-t flex", isCollapsed ? "justify-center" : "justify-end")}>
        <ThemeToggle />
      </div>
    </div>
  );
};

interface DashboardLayoutContentProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutContentProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const userHasRole = (roles: string[]) => !!user && roles.includes(user.role);
  const currentPage = menuItems.find(item =>
    item.href && pathname.startsWith(item.href) && userHasRole(item.roles)
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/80 backdrop-blur-sm px-6 border-b">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-72 p-0 bg-card border-r">
                <div className="flex h-20 items-center justify-center border-b px-6">
                  <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-destructive">
                    <Building className="h-6 w-6" />
                    <span className="font-headline">Assunta Booking</span>
                  </Link>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {menuItems.map((item, index) => {
                    if (!userHasRole(item.roles)) return null;
                    if (item.type === 'divider') return (
                      <hr key={`divider-mob-${index}`} className="my-3 border-border" />
                    );
                    if (item.type === 'heading') return (
                      <p key={`heading-mob-${index}`} className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                        {item.label}
                      </p>
                    );
                    if (!item.href || !item.label || !item.icon) return null;

                    const isActive = pathname === item.href;
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10",
                          isActive && "bg-primary/10 text-primary font-semibold"
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-auto p-4 border-t flex justify-end">
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <Building className="h-6 w-6 text-destructive" />
              <span className="font-headline text-foreground whitespace-nowrap">
                Assunta Booking
              </span>
            </Link>
            {currentPage?.label && (
              <>
                <span className="text-muted-foreground text-xl">/</span>
                <h1 className="text-lg font-semibold text-foreground">{currentPage.label}</h1>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prevState => {
      const newState = !prevState;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <AppSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-60"
        )}>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </div>
      </div>
    </AuthGuard>
  );
}
