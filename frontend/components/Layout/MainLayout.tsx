"use client";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans">
      {children}
    </div>
  );
};
