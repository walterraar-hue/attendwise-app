'use client';
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        {/* SidebarTrigger is now handled in the main layout for a sticky header */}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">{title}</h1>
      </div>
      {/* UserNav is now in the main layout header */}
    </header>
  );
}
