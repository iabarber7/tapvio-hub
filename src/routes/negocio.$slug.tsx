import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/tapvio/Header";
import { Footer } from "@/components/tapvio/Footer";
import { BottomNav } from "@/components/tapvio/BottomNav";
import { BusinessProfile } from "@/components/tapvio/BusinessProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { businessBySlugQuery } from "@/lib/tapvio";

export const Route = createFileRoute("/negocio/$slug")({
  head: ({ params }) => {
    const pretty = params.slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${pretty} — opiniones y valoraciones | TAPVIO` },
        {
          name: "description",
          content: `Descubre ${pretty}: horarios, contacto, fotos y opiniones reales de clientes. Valora tu experiencia con un toque en TAPVIO.`,
        },
        { property: "og:title", content: `${pretty} | TAPVIO` },
        {
          property: "og:description",
          content: `Opiniones, horarios y contacto de ${pretty} en TAPVIO.`,
        },
      ],
    };
  },
  component: BusinessPage,
  errorComponent: () => (
    <p className="p-16 text-center text-muted-foreground">No se pudo cargar el negocio.</p>
  ),
  notFoundComponent: () => (
    <p className="p-16 text-center text-muted-foreground">Este negocio no existe.</p>
  ),
});

function BusinessPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useQuery(businessBySlugQuery(slug));

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="mx-auto max-w-4xl space-y-3 px-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : isError || !data ? (
        <p className="p-16 text-center text-muted-foreground">Este negocio no existe.</p>
      ) : (
        <BusinessProfile business={data} />
      )}
      <Footer />
      <BottomNav />
    </div>
  );
}

void notFound;
