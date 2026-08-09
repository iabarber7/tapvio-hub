import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Header } from "@/components/tapvio/Header";
import { Footer } from "@/components/tapvio/Footer";
import { BottomNav } from "@/components/tapvio/BottomNav";
import { BusinessCard } from "@/components/tapvio/BusinessCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesQuery, businessesQuery } from "@/lib/tapvio";

type ExploreSearch = { categoria?: string };

export const Route = createFileRoute("/explorar")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    categoria: typeof search["categoria"] === "string" ? search["categoria"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explorar negocios locales | TAPVIO" },
      {
        name: "description",
        content:
          "Filtra por categoría, ciudad y valoración para encontrar los mejores negocios locales en TAPVIO.",
      },
      { property: "og:title", content: "Explorar negocios locales | TAPVIO" },
      {
        property: "og:description",
        content: "Encuentra restaurantes, cafeterías, hoteles y más, valorados por clientes reales.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { categoria } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"rating" | "popular" | "new">("rating");

  const categories = useQuery(categoriesQuery);
  const businesses = useQuery(
    businessesQuery({
      key: `all-${sort}`,
      order: sort === "rating" ? "avg_rating" : sort === "popular" ? "total_reviews" : "created_at",
      limit: 60,
    }),
  );

  const list = useMemo(() => {
    let items = businesses.data ?? [];
    if (categoria) items = items.filter((b) => b.categories?.slug === categoria);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          (b.city ?? "").toLowerCase().includes(needle) ||
          (b.description ?? "").toLowerCase().includes(needle),
      );
    }
    return items;
  }, [businesses.data, categoria, q]);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold md:text-3xl">Explorar negocios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} negocios disponibles en Las Palmas de Gran Canaria
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
            <Search size={18} className="text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o ciudad"
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Select
            value={categoria ?? "all"}
            onValueChange={(v) =>
              navigate({ search: { categoria: v === "all" ? undefined : v } })
            }
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.data?.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Mejor valorados</SelectItem>
              <SelectItem value="popular">Más populares</SelectItem>
              <SelectItem value="new">Más nuevos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
            : list.map((b) => <BusinessCard key={b.id} business={b} />)}
        </div>
        {!businesses.isLoading && list.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No encontramos negocios con esos filtros.
          </p>
        ) : null}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
