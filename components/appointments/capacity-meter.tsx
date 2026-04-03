"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CapacityMeterProps {
  used: number;
  total?: number;
  label?: string;
}

export function CapacityMeter({ used, total = 5, label }: CapacityMeterProps) {
  const percentage = Math.min(100, Math.round((used / total) * 100));
  const isNearLimit = used >= total - 1;
  const isFull = used >= total;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label || "Workers Busy"}</span>
        <span className={cn("font-semibold text-foreground", isFull && "text-rose-500")}>
          {used}/{total}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          "h-2",
          isNearLimit && "[&>div]:bg-amber-500",
          isFull && "[&>div]:bg-rose-500",
        )}
      />
    </div>
  );
}
