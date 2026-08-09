import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Nfc, Star, Compass } from "lucide-react";
import { Header } from "@/components/tapvio/Header";
import { Footer } from "@/components/tapvio/Footer";
import { BottomNav } from "@/components/tapvio/BottomNav";
import { BusinessCard } from "@/components/tapvio/BusinessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesQuery, businessesQuery } from "@/lib/tapvio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TAPVIO — Descubre, valora y conecta con negocios locales" },
      {
        name: "description",
        content:
          "TAPVIO conecta negocios físicos con sus clientes mediante NFC y QR. Descubre restaurantes, cafeterías y hoteles y valora tu experiencia con un toque.",
      },
      { property: "og:title", content: "TAPVIO — Conecta. Fideliza. Crece." },
      {
        property: "og:description",
        content: "Descubre negocios locales y valóralos con un simple toque NFC o escaneo QR.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const categories = useQuery(categoriesQuery);
  const featured = useQuery(businessesQuery({ key: "featured", order: "total_reviews", limit: 6 }));
  const top = useQuery(businessesQuery({ key: "top", order: "avg_rating", limit: 3 }));

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />

      <section className="relative overflow-hidden bg-hero-gradient text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/10 px-3 py-1 text-xs font-medium">
            <Nfc size={14} /> {"Conecta. Fideliza. Crece."}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl" suppressHydrationWarning>
            {"Descubre. Valora. Conecta."}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-navy-foreground/75 md:text-lg">
            Un toque con tu móvil y ya está. Encuentra los mejores negocios de tu ciudad y comparte
            tu experiencia en segundos.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-background p-2 shadow-lift sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search size={18} className="text-muted-foreground" />
              <Input
                placeholder="Busca un restaurante, café, hotel…"
                className="border-0 px-0 text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="hidden items-center gap-2 border-l border-border px-3 text-sm text-muted-foreground sm:flex">
              <MapPin size={16} /> Las Palmas GC
            </div>
            <Link to="/explorar">
              <Button className="w-full sm:w-auto">Buscar</Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-12">
          <h2 className="text-xl font-bold md:text-2xl">Explora por categoría</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {categories.isLoading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))
              : categories.data?.map((c) => (
                  <Link
                    key={c.id}
                    to="/explorar"
                    search={{ categoria: c.slug }}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
                  >
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-xs font-medium leading-tight">{c.name}</span>
                  </Link>
                ))}
          </div>
        </section>

        <section id="negocios" className="py-8">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold md:text-2xl">Negocios destacados</h2>
            <Link to="/explorar" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))
              : featured.data?.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        </section>

        <section className="py-8">
          <h2 className="text-xl font-bold md:text-2xl">Los mejor valorados</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {top.data?.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        </section>

        <section className="my-12 rounded-3xl bg-navy px-6 py-12 text-navy-foreground md:px-12">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Descubre TAPVIO</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-navy-foreground/70">
            Sin apps, sin registros. Solo acerca el móvil y listo.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Nfc,
                title: "1. Acerca tu móvil",
                text: "Toca el punto NFC o escanea el QR en la mesa, barra o recepción.",
              },
              {
                icon: Star,
                title: "2. Valora al instante",
                text: "Puntúa tu experiencia en 10 segundos y compártela también en Google.",
              },
              {
                icon: Compass,
                title: "3. Descubre más",
                text: "Explora otros negocios recomendados cerca de ti y guárdalos en favoritos.",
              },
            ].map((s) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient">
                  <s.icon size={22} className="text-primary-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-navy-foreground/70">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
