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
import { categoryIcon } from "@/lib/categoryIcons";
import heroArt from "@/assets/tapvio-hero.png.asset.json";


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
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/15 bg-navy-foreground/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
              <Nfc size={14} className="text-brand-purple" /> Tecnología NFC + QR para negocios
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              <span className="block">CONECTA.</span>
              <span className="block text-brand-gradient">VALORA.</span>
              <span className="block text-brand-gradient">DESCUBRE.</span>
            </h1>

            <div className="mt-6 h-px w-24 bg-brand-gradient" />

            <p className="mt-6 max-w-md text-base text-navy-foreground/70 md:text-lg">
              La forma más fácil y elegante de conectar tu negocio con las personas. Sin apps, sin
              registros: un toque y listo.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Nfc, title: "TAP", text: "Acerca y conecta al instante." },
                { icon: Star, title: "VALORA", text: "Recibe reseñas y mejora tu reputación." },
                { icon: Compass, title: "DESCUBRE", text: "Ofertas, menús, redes y mucho más." },
              ].map((f) => (
                <div key={f.title} className="flex items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-navy-foreground/15 bg-navy-foreground/5">
                    <f.icon size={18} className="text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wide">{f.title}</p>
                    <p className="text-sm text-navy-foreground/60">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl border border-search-border bg-search p-2 shadow-lift sm:flex-row">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search size={18} className="text-search-muted" />
                <Input
                  placeholder="Busca un restaurante, café, hotel…"
                  className="border-0 bg-transparent px-0 text-search-foreground shadow-none placeholder:text-search-muted focus-visible:ring-0"
                />
              </div>
              <div className="hidden items-center gap-2 border-l border-search-border px-3 text-sm text-search-muted sm:flex">
                <MapPin size={16} /> Las Palmas GC
              </div>
              <Link to="/explorar">
                <Button className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto">
                  Explorar
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-8 rounded-full bg-brand-gradient opacity-25 blur-3xl" />
            <img
              src={heroArt.url}
              alt="Punto NFC de TAPVIO junto a un móvil mostrando el perfil de un negocio"
              className="relative mx-auto w-full max-w-lg rounded-3xl object-cover"
              loading="eager"
            />
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
              : categories.data?.map((c) => {
                  const Icon = categoryIcon(c.slug);
                  return (
                    <Link
                      key={c.id}
                      to="/explorar"
                      search={{ categoria: c.slug }}
                      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
                    >
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient/10 bg-secondary text-primary transition-colors group-hover:bg-brand-gradient group-hover:text-primary-foreground">
                        <Icon size={20} strokeWidth={1.75} />
                      </span>
                      <span className="text-xs font-medium leading-tight">{c.name}</span>
                    </Link>
                  );
                })}
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
