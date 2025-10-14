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
      <div className="bg-primary-foreground/10 p-2 rounded-full">
          <ClipboardCheck className={cn("size-6 text-primary", logoTextClassName && "text-primary-foreground")} />
      </div>
      <div className="flex flex-col">
        <span className={cn("text-xl font-bold", logoTextClassName)}>Serlogint Attend</span>
        {showSubtitle && <span className={cn("text-xs", logoTextClassName, "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
