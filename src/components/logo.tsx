import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-primary", className)}>
      <div className="rounded-lg bg-primary p-2 text-primary-foreground">
        <Timer className="size-6" />
      </div>
      <span className="text-xl font-bold text-foreground">AttendWise</span>
    </div>
  );
}
