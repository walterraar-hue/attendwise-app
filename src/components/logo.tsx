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
        <Image 
          src="/Logo.png"
          alt="Logo de Serlogint Attend"
          width={32}
          height={32}
          className="object-contain"
        />
      )}
      <div className="flex flex-col">
        <span className={cn("text-xl font-bold", logoTextClassName)}>Serlogint Attend</span>
        {showSubtitle && <span className={cn("text-xs", logoTextClassName, "opacity-80")}>Developed by Core-AI</span>}
      </div>
    </div>
  );
}
