import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert, LayoutDashboard, Nfc, Settings, CreditCard } from "lucide-react";
import { Header } from "@/components/tapvio/Header";
import { BottomNav } from "@/components/tapvio/BottomNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRoles } from "@/hooks/useBusinessAccess";

export const Route = createFileRoute("/business")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de negocio | TAPVIO" },
      {
        name: "description",
        content:
          "Gestiona tu negocio en TAPVIO: métricas de interacciones, valoraciones, dispositivos NFC y suscripción.",
      },
      { property: "og:title", content: "Panel de negocio | TAPVIO" },
      {
        property: "og:description",
        content: "Métricas, valoraciones y dispositivos NFC de tu negocio en TAPVIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessLayout,
});

const navItems = [
  { to: "/business", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/business/dispositivos", label: "Dispositivos", icon: Nfc, exact: false },
  { to: "/business/configuracion", label: "Configuración", icon: Settings, exact: false },
  { to: "/business/suscripcion", label: "Suscripción", icon: CreditCard, exact: false },
] as const;

function BusinessLayout() {
  const { user, isBusiness, loading } = useUserRoles();

  if (loading) {
    return (
      <div className="min-h-screen pb-16 md:pb-0">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user || !isBusiness) {
    return (
      <div className="min-h-screen pb-16 md:pb-0">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldAlert size={30} className="text-destructive" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Acceso denegado</h1>
          <p className="mt-2 text-muted-foreground">
            Esta zona es exclusiva para cuentas de negocio. Si crees que es un error, contacta con
            TAPVIO.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {!user ? (
              <Button asChild>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            ) : null}
            <Button variant="secondary" asChild>
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      <div className="border-b border-border bg-navy text-navy-foreground">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              activeProps={{
                className: "border-b-2 border-accent text-navy-foreground",
              }}
              inactiveProps={{ className: "border-b-2 border-transparent text-navy-foreground/65" }}
              className="flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors hover:text-navy-foreground"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
