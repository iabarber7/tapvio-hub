import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/business/dispositivos")({
  component: DevicesPage,
});

function DevicesPage() {
  const { data: business, isLoading } = useMyBusiness();

  const devices = useQuery({
    queryKey: ["business-devices", business?.id],
    enabled: Boolean(business?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("id,code,label,type,status,total_scans,created_at")
        .eq("business_id", business!.id)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!business) {
    return (
      <p className="text-muted-foreground">
        Tu negocio no está configurado aún. Contacta con TAPVIO.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Dispositivos</h1>
        <p className="text-muted-foreground">
          Tarjetas y adhesivos NFC vinculados a {business.name}.
        </p>
      </header>

      {devices.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (devices.data?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Aún no tienes dispositivos TAP asignados. Contacta con TAPVIO para solicitarlos.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {devices.data!.map((device) => (
            <li key={device.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-mono">
                  {device.code}
                </Badge>
                <span className="text-xs font-medium">
                  {device.status === "active" ? "🟢 Activo" : "🔴 Inactivo"}
                </span>
              </div>
              <p className="mt-3 font-semibold">{device.label ?? "Sin etiqueta"}</p>
              <p className="text-sm text-muted-foreground">
                Tipo: {device.type} · {device.total_scans} escaneos
              </p>
              <Button variant="ghost" size="sm" className="mt-3 px-0" asChild>
                <a href={`/t/${device.code}`} target="_blank" rel="noreferrer">
                  Probar enlace →
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" asChild>
        <Link to="/business">Volver al panel</Link>
      </Button>
    </div>
  );
}
