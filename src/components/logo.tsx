import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Logo({ 
  className, 
  logoTextClassName, 
  showIcon = true,
  showSubtitle = true 
}: { 
  className?: string, 
  logoTextClassName?: string,
  showIcon?: boolean,
  showSubtitle?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && (
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-foreground/10 border border-primary-foreground/20">
          <Image 
            src="/logo.png"
            alt="Logo de Serlogint Attend"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      )}
      <div className="flex flex-col">
        <span className={cn("text-xl font-bold", logoTextClassName)}>Serlogint Attend</span>
        {showSubtitle && <span className={cn("text-xs", logoTextClassName, "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
