import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-base font-bold text-primary-foreground">
          T
        </span>
        <span className="text-xl font-bold tracking-tight">TAPVIO</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
