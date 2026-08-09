import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Nfc, Star, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const count = async (table: string) => {
        const { count: c, error } = await supabase
          .from(table as never)
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        return c ?? 0;
      };
      const [businesses, users, devices, reviews, interactions] = await Promise.all([
        count("businesses"),
        count("profiles"),
        count("devices"),
        count("reviews"),
        count("interactions"),
      ]);
      return { businesses, users, devices, reviews, interactions };
    },
  });

  const latest = useQuery({
    queryKey: ["admin-latest-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,city,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cards = [
    { label: "Total negocios", value: stats.data?.businesses, icon: Building2 },
    { label: "Total usuarios", value: stats.data?.users, icon: Users },
    { label: "Total dispositivos", value: stats.data?.devices, icon: Nfc },
    { label: "Total valoraciones", value: stats.data?.reviews, icon: Star },
    { label: "Total interacciones", value: stats.data?.interactions, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Resumen</h1>
        <p className="text-sm text-muted-foreground">Vista general de la plataforma TAPVIO.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon size={16} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            {stats.isLoading ? (
              <Skeleton className="mt-3 h-8 w-16" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-navy">{value ?? 0}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-navy">Últimos negocios registrados</h2>
        <div className="mt-3 divide-y divide-border">
          {latest.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (latest.data ?? []).length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Todavía no hay negocios.</p>
          ) : (
            latest.data!.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to="/negocio/$slug"
                    params={{ slug: b.slug }}
                    className="truncate font-medium text-navy hover:underline"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {b.city} · {new Date(b.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <Badge variant="secondary">{b.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
