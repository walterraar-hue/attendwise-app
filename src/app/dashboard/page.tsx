import { Clock, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Role } from '@/lib/types';
import { company, users, attendance } from '@/lib/data';
import AttendanceSummary from '@/components/dashboard/attendance-summary';


function getStats(role: Role) {
  const totalEmployees = users.filter(u => u.role !== 'Global Admin').length;
  const today = new Date().toISOString().split('T')[0]; // Using mock date for consistency
  const mockToday = '2024-07-23';
  
  const todaysAttendance = attendance.filter(a => a.date === mockToday);
  const presentToday = todaysAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const lateToday = todaysAttendance.filter(a => a.status === 'Late').length;
  const absentToday = totalEmployees - presentToday;

  let relevantAttendance = attendance;
  if(role === 'manager') {
    const manager = users.find(u => u.role === 'Manager');
    const teamMembers = users.filter(u => u.teamId === manager?.teamId);
    const teamMemberIds = teamMembers.map(u => u.id);
    relevantAttendance = attendance.filter(a => teamMemberIds.includes(a.userId));
  }
  
  return { presentToday, lateToday, absentToday, totalEmployees, relevantAttendance };
}


export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const role = searchParams?.role === 'admin' ? 'admin' : 'manager';
  const { presentToday, lateToday, absentToday, totalEmployees, relevantAttendance } = getStats(role);

  const currentUser = role === 'admin' 
    ? users.find(u => u.role === 'Global Admin')!
    : users.find(u => u.role === 'Manager')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header user={currentUser} title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday} / {totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Employees checked in today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentToday}</div>
            <p className="text-xs text-muted-foreground">Employees absent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{lateToday}</div>
            <p className="text-xs text-muted-foreground">Employees arrived late today</p>
          </CardContent>
        </Card>
         <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">At-Risk Patterns</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Active attendance concerns</p>
          </CardContent>
        </Card>
      </div>

      <AttendanceSummary 
        role={role}
        attendanceData={relevantAttendance}
        companyName={company.name}
        companyPolicies={company.policies}
      />
    </div>
  );
}
