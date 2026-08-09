import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, Users, Nfc, Star } from "lucide-react";
import { Header } from "@/components/tapvio/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/useBusinessAccess";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de administración | TAPVIO" },
      {
        name: "description",
        content: "Administra negocios, usuarios, dispositivos NFC y valoraciones de TAPVIO.",
      },
      { property: "og:title", content: "Panel de administración | TAPVIO" },
      {
        property: "og:description",
        content: "Gestión interna de negocios, usuarios y dispositivos de TAPVIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Resumen", icon: BarChart3, emoji: "📊", exact: true },
  { to: "/admin/negocios", label: "Negocios", icon: Building2, emoji: "🏢", exact: false },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, emoji: "👥", exact: false },
  { to: "/admin/dispositivos", label: "Dispositivos", icon: Nfc, emoji: "📱", exact: false },
  { to: "/admin/valoraciones", label: "Valoraciones", icon: Star, emoji: "⭐", exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/", replace: true });
  }, [loading, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-navy p-2 text-navy-foreground md:flex-col md:overflow-visible">
            {navItems.map(({ to, label, icon: Icon, emoji, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                activeProps={{ className: "bg-white/15 text-navy-foreground" }}
                inactiveProps={{ className: "text-navy-foreground/70" }}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
              >
                <span aria-hidden>{emoji}</span>
                <Icon size={15} className="hidden md:block" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
