import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/business/configuracion")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: business, isLoading } = useMyBusiness();

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
        <h1 className="text-2xl font-bold md:text-3xl">Configuración</h1>
        <p className="text-muted-foreground">Datos públicos de {business.name}.</p>
      </header>

      <dl className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:grid-cols-2">
        {[
          ["Nombre", business.name],
          ["Dirección", business.address],
          ["Ciudad", business.city],
          ["Teléfono", business.phone],
          ["Web", business.website],
          ["Instagram", business.instagram],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 truncate text-sm font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-muted-foreground">
        La edición de estos datos llegará muy pronto al panel.
      </p>

      <Button variant="secondary" asChild>
        <Link to="/business">Volver al panel</Link>
      </Button>
    </div>
  );
}
