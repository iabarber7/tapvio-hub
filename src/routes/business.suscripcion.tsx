import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/business/suscripcion")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { data: business, isLoading } = useMyBusiness();

  const subscription = useQuery({
    queryKey: ["business-subscription", business?.id],
    enabled: Boolean(business?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,plan,status,trial_ends_at,created_at")
        .eq("business_id", business!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
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
        <h1 className="text-2xl font-bold md:text-3xl">Suscripción</h1>
        <p className="text-muted-foreground">Plan actual de {business.name}.</p>
      </header>

      {subscription.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : subscription.data ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="capitalize">{subscription.data.plan}</Badge>
            <Badge variant="secondary" className="capitalize">
              {subscription.data.status}
            </Badge>
          </div>
          {subscription.data.trial_ends_at ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Prueba hasta el{" "}
              {new Date(subscription.data.trial_ends_at).toLocaleDateString("es-ES")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No hay ninguna suscripción activa. Contacta con TAPVIO para activar tu plan.
        </p>
      )}

      <Button variant="secondary" asChild>
        <Link to="/business">Volver al panel</Link>
      </Button>
    </div>
  );
}
