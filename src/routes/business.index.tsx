import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Nfc, MessageSquare, Star, ExternalLink, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { StarRating } from "@/components/tapvio/StarRating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/business/")({
  component: BusinessDashboard,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BusinessDashboard() {
  const businessQuery = useMyBusiness();
  const business = businessQuery.data;

  const stats = useQuery({
    queryKey: ["business-dashboard", business?.id],
    enabled: Boolean(business?.id),
    queryFn: async () => {
      const id = business!.id;
      const [total, nfc, reviews, devices] = await Promise.all([
        supabase
          .from("interactions")
          .select("id", { count: "exact", head: true })
          .eq("business_id", id),
        supabase
          .from("interactions")
          .select("id", { count: "exact", head: true })
          .eq("business_id", id)
          .eq("source", "nfc"),
        supabase
          .from("reviews")
          .select("id,rating,author_name,comment,created_at")
          .eq("business_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("devices")
          .select("id,code,label,status,total_scans")
          .eq("business_id", id)
          .order("code"),
      ]);
      return {
        totalInteractions: total.count ?? 0,
        nfcScans: nfc.count ?? 0,
        reviews: reviews.data ?? [],
        devices: devices.data ?? [],
      };
    },
  });

  if (businessQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!business) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <h1 className="text-xl font-bold">Panel de negocio</h1>
        <p className="mt-2 text-muted-foreground">
          Tu negocio no está configurado aún. Contacta con TAPVIO.
        </p>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total interacciones",
      value: stats.data?.totalInteractions ?? 0,
      icon: Activity,
    },
    { label: "Escaneos NFC", value: stats.data?.nfcScans ?? 0, icon: Nfc },
    { label: "Valoraciones", value: business.total_reviews, icon: MessageSquare },
    {
      label: "Puntuación media",
      value: `${Number(business.avg_rating).toFixed(1)} ⭐`,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Panel de negocio</h1>
          <p className="text-muted-foreground">{business.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <a href={`/negocio/${business.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Ver perfil público
            </a>
          </Button>
          <Button asChild>
            <Link to="/business/configuracion">
              <Pencil size={16} /> Editar negocio
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Icon size={17} className="text-primary" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Valoraciones recientes</h2>
          <Link
            to="/negocio/$slug"
            params={{ slug: business.slug }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {stats.isLoading ? (
          <Skeleton className="mt-4 h-32 w-full rounded-xl" />
        ) : (stats.data?.reviews.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no hay valoraciones para tu negocio.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {stats.data!.reviews.map((review) => (
              <li key={review.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} size={14} />
                    <span className="text-sm font-medium">
                      {review.author_name ?? "Cliente anónimo"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Mis dispositivos</h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/business/dispositivos">Gestionar dispositivos</Link>
          </Button>
        </div>
        {stats.isLoading ? (
          <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        ) : (stats.data?.devices.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no tienes dispositivos TAP asignados.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stats.data!.devices.map((device) => (
              <li
                key={device.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <Badge variant="secondary" className="font-mono">
                  {device.code}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {device.label ?? "Sin etiqueta"}
                </span>
                <span className="text-xs font-medium">
                  {device.status === "active" ? "🟢 Activo" : "🔴 Inactivo"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {device.total_scans} escaneos
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
