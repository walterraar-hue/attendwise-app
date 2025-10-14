import { cn } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";

export default function Logo({ 
  className, 
  logoTextClassName, 
  showSubtitle = true 
}: { 
  className?: string, 
  logoTextClassName?: string,
  showSubtitle?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex flex-col">
        <span className={cn("text-xl font-bold text-primary", logoTextClassName)}>Serlogint Attend</span>
        {showSubtitle && <span className={cn("text-xs", "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
