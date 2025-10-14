
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, ClipboardCheck, History, ClipboardList, BarChartHorizontal } from 'lucide-react';
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
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { UserRole } from '@/lib/types';

export const navItemsByRole = {
    'Global Admin': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Centro de Control' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
      { href: '/dashboard/my-history', icon: History, label: 'Mi Historial' },
      { href: '/dashboard/attendance', icon: ClipboardList, label: 'Asistencia Equipo' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
      { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
    ],
    'CEO': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Centro de Control' },
      { href: '/dashboard/gm-indicators', icon: BarChartHorizontal, label: 'Indicadores' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
    ],
    'Operations Manager': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Centro de Control' },
      { href: '/dashboard/om-indicators', icon: BarChartHorizontal, label: 'Indicadores' },
      { href: '/dashboard/attendance', icon: ClipboardList, label: 'Asistencia Equipo' },
      { href: '/dashboard/team-management', icon: Users, label: 'Gestión de Equipo' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
    ],
    'Miembro': [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Centro de Control' },
      { href: '/dashboard/register-attendance', icon: ClipboardCheck, label: 'Registrar Asistencia' },
      { href: '/dashboard/my-history', icon: History, label: 'Mi Historial' },
    ],
    'Manager': [] // Default empty state
};


export function SidebarNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const navItems = useMemo(() => navItemsByRole[userRole] || navItemsByRole['Miembro'], [userRole]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
        return pathname === path;
    }
    return pathname.startsWith(path);
  }
  
  return (
    <>
      <SidebarHeader className="p-4 flex">
        <div className="flex items-center gap-2">
            <Logo showIcon={true} showSubtitle={false} />
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
