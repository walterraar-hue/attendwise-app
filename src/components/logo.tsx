import { cn } from "@/lib/utils";

export default function Logo({ 
  className, 
  logoTextClassName, 
  showSubtitle = true,
  showTitle = true,
}: { 
  className?: string, 
  logoTextClassName?: string,
  showSubtitle?: boolean,
  showTitle?: boolean,
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex flex-col">
        {showTitle && <span className={cn("text-2xl font-bold text-primary", logoTextClassName)}>Serlogint Attend</span>}
        {showSubtitle && <span className={cn("text-xs", "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
