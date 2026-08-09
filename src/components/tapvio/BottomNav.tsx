import { Link } from "@tanstack/react-router";
import { Home, Search, Star, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true, search: undefined },
  { to: "/explorar", label: "Explorar", icon: Search, exact: false, search: undefined },
  { to: "/explorar", label: "Valorar", icon: Star, exact: false, search: undefined },
  {
    to: "/perfil",
    label: "Favoritos",
    icon: Heart,
    exact: false,
    search: { tab: "favoritos" as const },
  },
  {
    to: "/perfil",
    label: "Perfil",
    icon: User,
    exact: false,
    search: { tab: "valoraciones" as const },
  },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact, search }) => (
          <Link
            key={label}
            to={to}
            search={search as never}
            activeOptions={{ exact }}
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
