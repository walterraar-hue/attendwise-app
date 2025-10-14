
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, Timer, ClipboardCheck, History, CalendarDays, TrendingUp, ClipboardList, BarChartHorizontal } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import Logo from '../logo';
import { Badge } from '../ui/badge';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useMemo } from 'react';

const navItemsByRole = {
    'Global Admin': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
      { href: '/dashboard/my-history', icon: History, label: 'Mi Historial' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
      { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
    ],
    'CEO': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/gm-indicators', icon: BarChartHorizontal, label: 'Indicadores' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
    ],
    'Operations Manager': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/om-indicators', icon: BarChartHorizontal, label: 'Indicadores' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
    ],
    'Miembro': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
      { href: '/dashboard/my-history', icon: History, label: 'Mi Historial' },
    ],
    'Manager': [] // Default empty state
};


export function SidebarNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  // In a real app, you would get the user's role from your authentication data
  const userRole = 'Global Admin'; // Placeholder
  const navItems = useMemo(() => navItemsByRole[userRole] || navItemsByRole['Miembro'], [userRole]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;
  
  return (
    <>
      <SidebarHeader className="p-4 hidden md:flex">
        <div className="flex items-center gap-2">
            <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
                >
                <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
