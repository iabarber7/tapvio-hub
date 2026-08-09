import { Link } from "@tanstack/react-router";
import { Home, Search, Star, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/explorar", label: "Explorar", icon: Search },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
        <Link
          to="/explorar"
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
        >
          <Star size={20} strokeWidth={1.8} />
          Valorar
        </Link>
        <span className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
          <Heart size={20} strokeWidth={1.8} />
          Favoritos
        </span>
        <span className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
          <User size={20} strokeWidth={1.8} />
          Perfil
        </span>
      </div>
    </nav>
  );
}
