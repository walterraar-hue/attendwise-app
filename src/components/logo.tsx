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
          <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10.5 16.5L6 12L7.41 10.59L10.5 13.67L16.59 7.59L18 9L10.5 16.5Z"
              fill="currentColor"
          />
        </svg>
      )}
      <div className="flex flex-col">
        {showTitle && <span className={cn("text-xl font-bold text-primary", logoTextClassName)}>Serlogint Attend</span>}
        {showSubtitle && <span className={cn("text-xs -mt-1", "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
