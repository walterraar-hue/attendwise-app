
'use client';

import type { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

function DashboardHeader() {
  const { user } = useUser();
  const { toggleSidebar } = useSidebar();
  
  if (!user) {
    return null; // Or a loading skeleton
  }

  const userProps = {
      id: user.uid,
      name: user.displayName || 'No Name',
      email: user.email || 'No Email',
      role: 'Global Admin', 
      status: 'active',
      avatarUrl: user.photoURL || '',
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-primary text-primary-foreground">
       <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <Button
                size="icon"
                variant="ghost"
                className="md:hidden -ml-2 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={toggleSidebar}
            >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <div className="hidden md:block">
                <Logo showSubtitle={false} showIcon={false} logoTextClassName="text-primary-foreground" />
            </div>
            <div className="ml-auto flex items-center gap-4">
                <UserNav user={userProps} />
            </div>
       </div>
    </header>
  );
}


export default function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    // You can show a loading spinner here
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen flex-col">
           <DashboardHeader />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar>
                    <SidebarNav />
                </Sidebar>
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
