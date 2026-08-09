import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Nfc } from "lucide-react";
import { Header } from "@/components/tapvio/Header";
import { Footer } from "@/components/tapvio/Footer";
import { BusinessProfile } from "@/components/tapvio/BusinessProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/tapvio";

export const Route = createFileRoute("/t/$deviceCode")({
  head: () => ({
    meta: [
      { title: "Valora tu experiencia | TAPVIO" },
      {
        name: "description",
        content:
          "Has activado un punto TAPVIO. Valora tu experiencia en este negocio en 10 segundos, sin registro.",
      },
      { property: "og:title", content: "Valora tu experiencia | TAPVIO" },
      {
        property: "og:description",
        content: "Un toque, una valoración. Comparte tu experiencia con TAPVIO.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TapLanding,
  errorComponent: () => (
    <p className="p-16 text-center text-muted-foreground">No se pudo cargar el dispositivo.</p>
  ),
});

function TapLanding() {
  const { deviceCode } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["device", deviceCode],
    queryFn: async () => {
      const { data: device, error } = await supabase
        .from("devices")
        .select("id,code,business_id,status")
        .eq("code", deviceCode.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!device?.business_id) return null;

      const { data: business } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,description,address,city,phone,website,google_review_url,instagram,facebook,logo_url,cover_url,avg_rating,total_reviews,category_id,categories(name,icon,slug)",
        )
        .eq("id", device.business_id)
        .maybeSingle();
      if (!business) return null;

      await supabase.from("interactions").insert({
        business_id: device.business_id,
        device_id: device.id,
        source: "nfc",
        action: "scan",
      });

      return { deviceId: device.id, business: business as unknown as Business };
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="bg-hero-gradient px-4 py-3 text-center text-sm font-medium text-navy-foreground">
        <span className="inline-flex items-center gap-2">
          <Nfc size={16} /> Punto TAPVIO {deviceCode.toUpperCase()} activado
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="mx-auto max-w-4xl space-y-3 px-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : !data ? (
        <p className="p-16 text-center text-muted-foreground">
          Este dispositivo no está asignado a ningún negocio todavía.
        </p>
      ) : (
        <BusinessProfile
          business={data.business}
          deviceId={data.deviceId}
          source="nfc"
          highlightCta
        />
      )}
      <Footer />
    </div>
  );
}
