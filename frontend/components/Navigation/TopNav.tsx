"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BrainCircuit, History, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/Theme/ThemeToggle';
import { motion } from 'framer-motion';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: '홈',
    href: '/',
    icon: Home,
  },
  {
    title: '분석',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '히스토리',
    href: '/history',
    icon: History,
  },
];

export function TopNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none"
    >
      <header className="pointer-events-auto flex items-center justify-between gap-4 pl-3 pr-3 py-2 rounded-full border border-white/10 bg-background/60 backdrop-blur-2xl shadow-2xl shadow-black/10 ring-1 ring-white/20 dark:ring-white/10 w-fit max-w-[95vw] md:max-w-3xl transition-all duration-500 hover:bg-background/80 hover:ring-white/30 hover:shadow-primary/5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pr-2 group flex-shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-tr from-primary/20 via-primary/10 to-transparent group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 ring-1 ring-primary/20 group-hover:scale-110 group-active:scale-95">
            <BrainCircuit className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform duration-500 ease-out" />
          </div>
          <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground/90 to-foreground/70 font-heading group-hover:to-foreground transition-all duration-500">
            Stock Deep Research
          </span>
        </Link>

        {/* Separator */}
        <div className="h-5 w-px bg-linear-to-b from-transparent via-border/60 to-transparent hidden md:block" />

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative group/nav-item"
              >
                <div className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium transition-all duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="activeTopNavPill"
                      className="absolute inset-0 bg-primary shadow-[0_0_20px_-5px_var(--color-primary)] rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  {/* Hover background for non-active items */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-full bg-muted/0 group-hover/nav-item:bg-muted/60 transition-colors duration-300" />
                  )}

                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover/nav-item:scale-110", isActive && "stroke-[2.5px]")} />
                    <span className="hidden sm:inline-block tracking-tight">{item.title}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="h-5 w-px bg-linear-to-b from-transparent via-border/60 to-transparent hidden md:block" />

        {/* Right Side - Theme Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-background/40 backdrop-blur-sm rounded-full border border-white/5 hover:border-white/20 transition-colors duration-300">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </motion.div>
  );
};
