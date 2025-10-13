import type { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { company, users } from "@/lib/data";

export default function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const currentUser = users.find(u => u.role === 'Global Admin');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav companyName={company.name} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
