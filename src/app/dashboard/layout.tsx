'use client';

import type { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav companyName={"AttendWise"} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
