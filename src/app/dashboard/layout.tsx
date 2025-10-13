import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Role } from "@/lib/types";
import { company, users } from "@/lib/data";

export default function DashboardLayout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const role = searchParams?.role === 'admin' ? 'admin' : 'manager';

  if (!role) {
    redirect('/');
  }

  const currentUser = role === 'admin' 
    ? users.find(u => u.role === 'Global Admin') 
    : users.find(u => u.role === 'Manager');

  if (!currentUser) {
    // Fallback if no user of that role is found in mock data
    redirect('/');
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav role={role} companyName={company.name} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
