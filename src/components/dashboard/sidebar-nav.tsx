'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, Timer, ClipboardCheck, History, CalendarDays, TrendingUp } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Role } from '@/lib/types';
import Logo from '../logo';
import { Badge } from '../ui/badge';


export function SidebarNav({ role, companyName }: { role: Role, companyName: string }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
                <Timer className="size-5" />
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-lg">{companyName}</span>
                <Badge variant="secondary" className="w-fit">
                    {role === 'admin' ? 'Admin Portal' : 'Manager Portal'}
                </Badge>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard')}
              tooltip="Dashboard"
            >
              <Link href={`/dashboard?role=${role}`}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {role === 'admin' && (
            <SidebarMenuItem>
                <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard/gm-indicators')}
                tooltip="Indicadores Gerente General"
                >
                <Link href={`/dashboard/gm-indicators?role=${role}`}>
                    <TrendingUp />
                    <span>Indicadores Gerente General</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
           {role === 'manager' && (
            <SidebarMenuItem>
                <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard/om-indicators')}
                tooltip="Indicadores Gerente Op."
                >
                <Link href={`/dashboard/om-indicators?role=${role}`}>
                    <TrendingUp />
                    <span>Indicadores Gerente Op.</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/register-attendance')}
              tooltip="Registrar Asistencia"
            >
              <Link href={`/dashboard/register-attendance?role=${role}`}>
                <ClipboardCheck />
                <span>Registrar Asistencia</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/my-history')}
              tooltip="Mi Historial"
            >
              <Link href={`/dashboard/my-history?role=${role}`}>
                <History />
                <span>Mi Historial</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/attendance')}
              tooltip="Asistencia"
            >
              <Link href={`/dashboard/attendance?role=${role}`}>
                <CalendarDays />
                <span>Asistencia</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard/members')}
                tooltip="Members"
              >
                <Link href={`/dashboard/members?role=${role}`}>
                  <Users />
                  <span>Members</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={isActive('/dashboard/settings')}
              tooltip="Configuración">
              <Link href={`/dashboard/settings?role=${role}`}>
                <Settings />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
