"use client";

import { cn } from '@/lib/utils';
import type { InvestmentTimeframe } from '@/types/stock';

interface TimeframeOption {
  value: InvestmentTimeframe;
  label: string;
  description: string;
}

const timeframeOptions: TimeframeOption[] = [
  {
    value: 'short',
    label: '단기',
    description: '1-3개월',
  },
  {
    value: 'mid',
    label: '중기',
    description: '3-12개월',
  },
  {
    value: 'long',
    label: '장기',
    description: '1년+',
  },
];

interface TimeframePickerProps {
  value: InvestmentTimeframe;
  onChange: (value: InvestmentTimeframe) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeframePicker({
  value,
  onChange,
  disabled = false,
  className,
}: TimeframePickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-muted-foreground">
        투자 기간 선택
      </label>
      <div className="flex gap-3">
        {timeframeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 px-4 py-4 rounded-xl border-2 transition-all duration-300",
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="font-semibold text-lg">{option.label}</span>
            <span className="text-sm text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
