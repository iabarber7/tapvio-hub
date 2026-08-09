import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-sm font-bold text-primary-foreground">
            T
          </span>
          <span className="text-lg font-bold tracking-tight">TAPVIO</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/explorar"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Explorar
          </Link>
          <a
            href="#negocios"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Soy un negocio
          </a>
          <Button size="sm" className="ml-2">
            Login
          </Button>
        </nav>
        <Link to="/explorar" className="md:hidden">
          <Button size="sm" variant="secondary">
            Explorar
          </Button>
        </Link>
      </div>
    </header>
  );
}
