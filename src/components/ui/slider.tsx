import * as React from "react";

import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  showFill?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 0.1, onValueChange, showFill = true, ...props }, ref) => {
    const percent = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
    return (
      <input
        ref={ref}
        type="range"
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className={cn("slider w-full", className)}
        min={min}
        max={max}
        step={step}
        value={value}
        style={
          showFill
            ? {
                background: `linear-gradient(to right, var(--color-primary) ${percent}%, color-mix(in oklch, var(--color-muted-foreground) 25%, transparent) ${percent}%)`,
              }
            : undefined
        }
        onChange={(e) => onValueChange?.(Number(e.target.value))}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";
