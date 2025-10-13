import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";
import { User } from "@/lib/types";

export default function Header({ user, title }: { user: User, title: string }) {
  return (
    <header className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">{title}</h1>
      </div>
      <UserNav user={user} />
    </header>
  );
}
