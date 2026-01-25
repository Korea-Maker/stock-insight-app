"use client";

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface KeyValueItemProps {
  label: string;
  value: string | number | undefined | null;
  valueClassName?: string;
}

export function KeyValueItem({ label, value, valueClassName }: KeyValueItemProps) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

interface TextContentProps {
  content: string | undefined | null;
  className?: string;
}

export function TextContent({ content, className }: TextContentProps) {
  if (!content) return null;

  return (
    <p className={cn("text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap", className)}>
      {content}
    </p>
  );
}
