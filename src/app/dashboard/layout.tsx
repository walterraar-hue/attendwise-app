
'use client';

import type { ReactNode } from "react";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/dashboard/breadcrumbs";
import type { User as AppUser } from "@/lib/types";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardHeader() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toggleSidebar } = useSidebar();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<AppUser>(userDocRef);
  
  if (isUserDataLoading || !user || !userData) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-primary text-primary-foreground">
            <div className="flex h-full w-full items-center gap-4 px-4 sm:px-6">
                 <Skeleton className="h-8 w-8 rounded-full md:hidden" />
                 <div className="hidden md:block">
                     <Skeleton className="h-8 w-36" />
                 </div>
                 <div className="flex-1" />
                 <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </header>
    );
  }

  const userProps = {
      id: user.uid,
      name: userData.name || user.displayName || 'No Name',
      email: userData.email || user.email || 'No Email',
      role: userData.role || 'Miembro', 
      status: userData.status || 'active',
      avatarUrl: user.photoURL || '',
      companyId: userData.companyId || '',
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-primary text-primary-foreground">
       <div className="flex h-full w-full items-center gap-4 px-4 sm:px-6">
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
                <Logo logoTextClassName="text-primary-foreground" />
            </div>
            <div className="flex-1 flex justify-center">
                <Breadcrumbs userRole={userProps.role} />
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
        <div className="flex h-screen flex-col bg-background">
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
