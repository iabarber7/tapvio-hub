import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Store, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName =
    (user?.user_metadata?.["name"] as string | undefined) || user?.email?.split("@")[0] || "Cuenta";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

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

          {loading ? (
            <div className="ml-2 h-9 w-24 animate-pulse rounded-lg bg-secondary" />
          ) : user ? (
            <UserMenu
              displayName={displayName}
              initials={initials}
              email={user.email ?? ""}
              onSignOut={handleSignOut}
            />
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/registro">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {!loading && user ? (
            <UserMenu
              displayName={displayName}
              initials={initials}
              email={user.email ?? ""}
              onSignOut={handleSignOut}
            />
          ) : (
            <Link to="/login">
              <Button size="sm" variant="secondary">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu({
  displayName,
  initials,
  email,
  onSignOut,
}: {
  displayName: string;
  initials: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ml-2 flex items-center gap-2 rounded-full border border-border/70 py-1 pl-1 pr-3 transition-colors hover:bg-secondary">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate text-sm font-medium">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold">{displayName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil" search={{ tab: "valoraciones" }}>
            <UserIcon className="mr-2 h-4 w-4" /> Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/business">
            <Store className="mr-2 h-4 w-4" /> Acceso Business
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
