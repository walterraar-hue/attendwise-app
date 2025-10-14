import { cn } from "@/lib/utils";

export default function Logo({ 
  className, 
  logoTextClassName, 
  showSubtitle = true,
  showTitle = true,
  showIcon = true,
}: { 
  className?: string, 
  logoTextClassName?: string,
  showSubtitle?: boolean,
  showTitle?: boolean,
  showIcon?: boolean,
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && (
        <svg
          className="size-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="currentColor" />
          <path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      <div className="flex flex-col">
        {showTitle && <span className={cn("text-xl font-bold text-primary", logoTextClassName)}>Serlogint Attend</span>}
        {showSubtitle && <span className={cn("text-xs", "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
