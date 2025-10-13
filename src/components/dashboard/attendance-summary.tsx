"use client";

import { useState } from "react";
import { Wand2, AlertCircle, CheckCircle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { attendanceSummarizationForGlobalAdmins } from "@/ai/flows/attendance-summarization-for-global-admins";
import { attendanceSummarizationForManagers } from "@/ai/flows/attendance-summarization-for-managers";
import { AttendanceRecord, Role } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "../ui/separator";

type SummaryState = {
  summary: string;
  areasOfConcern: string;
  suggestions?: string;
} | null;

export default function AttendanceSummary({
  role,
  attendanceData,
  companyName,
  companyPolicies,
}: {
  role: Role;
  attendanceData: AttendanceRecord[];
  companyName: string;
  companyPolicies: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryState>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    try {
      let result;
      const timePeriod = "monthly"; // or weekly, could be a dropdown

      if (role === "admin") {
        result = await attendanceSummarizationForGlobalAdmins({
          attendanceData: JSON.stringify(attendanceData),
          companyName,
          timePeriod,
        });
      } else {
        const managerResult = await attendanceSummarizationForManagers({
          employeeRecords: JSON.stringify(attendanceData),
          timePeriod,
          companyPolicies,
        });
        result = { 
            summary: managerResult.summary, 
            areasOfConcern: managerResult.atRiskPatterns 
        };
      }
      setSummary(result);
    } catch (e) {
      console.error(e);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 className="text-primary" />
                AI Attendance Summary
                </CardTitle>
                <CardDescription>
                Get AI-powered insights into attendance patterns.
                </CardDescription>
            </div>
            <Button onClick={generateSummary} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Summary"}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton />}
        {error && <ErrorMessage message={error} />}
        {summary && <SummaryDisplay summary={summary} role={role}/>}
        {!isLoading && !summary && !error && (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <BarChart className="mx-auto h-12 w-12" />
                <p className="mt-4 text-sm">Your generated summary will appear here.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-destructive">
      <AlertCircle className="h-6 w-6" />
      <div>
        <h3 className="font-semibold">An Error Occurred</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

function SummaryDisplay({ summary, role }: { summary: SummaryState, role: Role }) {
  if (!summary) return null;

  return (
    <div className="space-y-6 text-sm">
        <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <CheckCircle className="size-5 text-green-600" />
                Overall Summary
            </h3>
            <p className="text-muted-foreground">{summary.summary}</p>
        </div>
        
        <Separator />

        <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <AlertTriangle className="size-5 text-amber-600" />
                {role === 'admin' ? 'Areas of Concern' : 'At-Risk Patterns'}
            </h3>
            <p className="text-muted-foreground whitespace-pre-line">{summary.areasOfConcern}</p>
        </div>

        {summary.suggestions && (
            <>
                <Separator />
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <Wand2 className="size-5 text-blue-600" />
                        Suggestions
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line">{summary.suggestions}</p>
                </div>
            </>
        )}
    </div>
  );
}
