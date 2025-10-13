'use client';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";
import { useUser } from "@/firebase";

export default function Header({ title }: { title: string }) {
  const { user } = useUser();

  if (!user) {
    return null; // or a loading state
  }

  const userProps = {
      id: user.uid,
      name: user.displayName || 'No Name',
      email: user.email || 'No Email',
      // The 'role' and 'status' would come from your Firestore user document
      role: 'Global Admin', 
      status: 'active',
      avatarUrl: user.photoURL || '',
  }

  return (
    <header className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">{title}</h1>
      </div>
      <UserNav user={userProps} />
    </header>
  );
}
