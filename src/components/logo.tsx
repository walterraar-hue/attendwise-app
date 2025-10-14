import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";

export default function Logo({ className, logoTextClassName }: { className?: string, logoTextClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="rounded-md bg-primary-foreground/20 p-2 text-primary-foreground">
        <Timer className="size-6" />
      </div>
      <div className="flex flex-col">
        <span className={cn("text-xl font-bold text-foreground", logoTextClassName)}>Serlogint Attend</span>
        <span className="text-xs text-primary-foreground/80">Developed by Core-AI</span>
      </div>
    </div>
  );
}
