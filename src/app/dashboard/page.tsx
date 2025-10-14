'use client';
import { Clock, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import Header from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AttendanceSummary from '@/components/dashboard/attendance-summary';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Company, User as AppUser, AttendanceRecord } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return firestore ? firestore.collection('users').doc(user.uid) : null;
  }, [user, firestore]);
  // const { data: userData } = useDoc<AppUser>(userDocRef as any);

  // const companyId = userData?.companyId;

  // const companyDocRef = useMemoFirebase(() => {
  //     if (!companyId || !firestore) return null;
  //     return firestore.collection('companies').doc(companyId);
  // }, [companyId, firestore]);
  // const { data: companyData } = useDoc<Company>(companyDocRef as any);

  // const usersQuery = useMemoFirebase(() => {
  //     if (!companyId || !firestore) return null;
  //     return query(collection(firestore, 'users'), where('companyId', '==', companyId));
  // }, [companyId, firestore]);
  // const { data: companyUsers } = useCollection<AppUser>(usersQuery);

  // For now, we will use placeholders as we don't have real data.
  const presentToday = 0;
  const totalEmployees = 0;
  const absentToday = 0;
  const lateToday = 0;
  const atRiskPatterns = 0;
  const role = 'admin'; // default to admin
  const relevantAttendance: AttendanceRecord[] = [];
  const companyName = "AttendWise";
  const companyPolicies = "";
  const isLoading = false;


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{presentToday} / {totalEmployees}</div>}
            <p className="text-xs text-muted-foreground">Employees checked in today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{absentToday}</div>}
            <p className="text-xs text-muted-foreground">Employees absent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{lateToday}</div>}
            <p className="text-xs text-muted-foreground">Employees arrived late today</p>
          </CardContent>
        </Card>
         <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">At-Risk Patterns</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{atRiskPatterns}</div>}
            <p className="text-xs text-muted-foreground">Active attendance concerns</p>
          </CardContent>
        </Card>
      </div>

      <AttendanceSummary 
        role={role}
        attendanceData={relevantAttendance}
        companyName={companyName}
        companyPolicies={companyPolicies}
      />
    </div>
  );
}
