"use client";

import { useDesignTheme, type DesignTheme } from './DesignThemeProvider';
import { cn } from '@/lib/utils';
import { Palette, Terminal, Newspaper, Leaf, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const themes: {
  value: DesignTheme;
  icon: typeof Palette;
  label: string;
  description: string;
  colors: string[];
}[] = [
  {
    value: 'default',
    icon: Palette,
    label: 'Default',
    description: '기본 미니멀 테마',
    colors: ['#6366f1', '#f8fafc', '#1e293b'],
  },
  {
    value: 'bloomberg',
    icon: Terminal,
    label: 'Bloomberg',
    description: '터미널 스타일 데이터 중심',
    colors: ['#00ffd5', '#0d1117', '#ffd700'],
  },
  {
    value: 'editorial',
    icon: Newspaper,
    label: 'Editorial',
    description: '매거진 스타일 럭셔리',
    colors: ['#e85a1f', '#faf8f5', '#1a1a1a'],
  },
  {
    value: 'calm',
    icon: Leaf,
    label: 'Calm',
    description: '차분한 자연 친화적',
    colors: ['#1e3a29', '#f5f9f5', '#ff6b5b'],
  },
];

export function DesignThemeSwitcher() {
  const { designTheme, setDesignTheme } = useDesignTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes.find(t => t.value === designTheme) ?? themes[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
          "border border-border bg-background/50 backdrop-blur-sm",
          "hover:bg-accent hover:border-primary/20",
          isOpen && "border-primary/30 bg-accent"
        )}
      >
        <currentTheme.icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium hidden sm:inline">{currentTheme.label}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute right-0 top-full mt-2 w-72 z-50",
          "bg-card border border-border rounded-xl shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}>
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              디자인 테마 선택
            </div>

            <div className="space-y-1">
              {themes.map((theme) => {
                const Icon = theme.icon;
                const isSelected = designTheme === theme.value;

                return (
                  <button
                    key={theme.value}
                    onClick={() => {
                      setDesignTheme(theme.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                      "hover:bg-accent",
                      isSelected && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary"
                        )}>
                          {theme.label}
                        </span>
                        {isSelected && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            사용 중
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {theme.description}
                      </p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {theme.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground text-center">
              A/B 테스트를 위한 디자인 비교
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
