'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, Timer, ClipboardCheck, History, CalendarDays, TrendingUp, ClipboardList } from 'lucide-react';
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


export function SidebarNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const role = 'admin'; // Show all links

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
                    Unified Portal
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
              <Link href={`/dashboard`}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/gm-indicators')}
              tooltip="Indicadores Gerente General"
              >
              <Link href={`/dashboard/gm-indicators`}>
                  <TrendingUp />
                  <span>Indicadores Gerente General</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/om-indicators')}
              tooltip="Indicadores Gerente Op."
              >
              <Link href={`/dashboard/om-indicators`}>
                  <TrendingUp />
                  <span>Indicadores Gerente Op.</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/registro')}
              tooltip="Registro"
            >
              <Link href={`/dashboard/registro`}>
                <ClipboardList />
                <span>Registro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/register-attendance')}
              tooltip="Registrar Asistencia"
            >
              <Link href={`/dashboard/register-attendance`}>
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
              <Link href={`/dashboard/my-history`}>
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
              <Link href={`/dashboard/attendance`}>
                <CalendarDays />
                <span>Asistencia</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/team-management')}
              tooltip="Gestión de Equipo"
            >
              <Link href={`/dashboard/team-management`}>
                <Users />
                <span>Gestión de Equipo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={isActive('/dashboard/settings')}
              tooltip="Configuración">
              <Link href={`/dashboard/settings`}>
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
