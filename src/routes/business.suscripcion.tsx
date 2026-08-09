import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/business/suscripcion")({
  component: SubscriptionPage,
});

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "9,90€",
    popular: false,
    features: [
      "Perfil TAPVIO completo",
      "1 dispositivo NFC/QR",
      "Estadísticas básicas",
      "Enlace de reseñas Google",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "19,90€",
    popular: true,
    features: [
      "Todo lo de Starter",
      "Hasta 10 dispositivos",
      "Estadísticas avanzadas",
      "Gestión de valoraciones",
      "Promociones",
    ],
  },
  {
    id: "multi",
    name: "Multi",
    price: "39,90€",
    popular: false,
    features: [
      "Todo lo de Business",
      "Hasta 30 dispositivos",
      "Estadísticas premium",
      "Soporte prioritario",
    ],
  },
] as const;

const STATUS_LABELS: Record<string, string> = {
  trial: "Prueba gratuita",
  active: "Activa",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const FAQ = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí, el cambio se aplica al siguiente ciclo de facturación.",
  },
  {
    q: "¿Qué pasa si cancelo?",
    a: "Tu perfil se mantiene pero los dispositivos quedan inactivos.",
  },
  { q: "¿Hay permanencia?", a: "No, mes a mes sin compromiso." },
];

function daysLeft(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

function SubscriptionPage() {
  const { data: business, isLoading } = useMyBusiness();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const selectPlan = useMutation({
    mutationFn: async (plan: string) => {
      if (!subscription.data?.id) return;
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan })
        .eq("id", subscription.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDialogOpen(true);
      void queryClient.invalidateQueries({ queryKey: ["business-subscription", business?.id] });
    },
    onError: () => toast.error("No se ha podido actualizar el plan"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!business) {
    return (
      <p className="text-muted-foreground">
        Tu negocio no está configurado aún. Contacta con TAPVIO.
      </p>
    );
  }

  const sub = subscription.data;
  const currentPlan = sub?.plan ?? null;
  const renewal = sub
    ? new Date(new Date(sub.created_at).setMonth(new Date(sub.created_at).getMonth() + 1))
    : null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Suscripción</h1>
        <p className="text-muted-foreground">Plan actual de {business.name}.</p>
      </header>

      {subscription.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : sub ? (
        <div className="space-y-4">
          {sub.status === "suspended" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>Tu cuenta está suspendida. Reactiva tu plan para continuar.</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="capitalize">{sub.plan}</Badge>
              <Badge variant="secondary">{STATUS_LABELS[sub.status] ?? sub.status}</Badge>
            </div>
            {sub.status === "trial" && sub.trial_ends_at ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Te quedan {daysLeft(sub.trial_ends_at)} días de prueba gratuita · finaliza el{" "}
                {new Date(sub.trial_ends_at).toLocaleDateString("es-ES")}
              </p>
            ) : renewal ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Próxima renovación: {renewal.toLocaleDateString("es-ES")}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No hay ninguna suscripción activa. Contacta con TAPVIO para activar tu plan.
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card",
                isCurrent ? "border-primary ring-2 ring-primary/25" : "border-border",
              )}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  <Sparkles size={12} /> Más popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-1 text-3xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                disabled={isCurrent || selectPlan.isPending || !sub}
                onClick={() => selectPlan.mutate(plan.id)}
              >
                {isCurrent ? "Plan actual" : "Seleccionar"}
              </Button>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="mt-2">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Button variant="secondary" asChild>
        <Link to="/business">Volver al panel</Link>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambio de plan registrado</DialogTitle>
            <DialogDescription>
              Próximamente podrás gestionar tu suscripción directamente. Contacta con nosotros en
              hola@tapvio.es para cambiar de plan.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDialogOpen(false)}>Entendido</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
