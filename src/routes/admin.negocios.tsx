import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/negocios")({
  component: AdminBusinesses,
});

const PER_PAGE = 10;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Pendiente",
};

function AdminBusinesses() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const businesses = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,city,status,avg_rating,total_reviews,categories(name),subscriptions(plan,status)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const next = status === "active" ? "suspended" : "active";
      const { error } = await supabase.from("businesses").update({ status: next }).eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next === "active" ? "Negocio activado" : "Negocio suspendido");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = businesses.data ?? [];
    return q ? rows.filter((b) => b.name.toLowerCase().includes(q)) : rows;
  }, [businesses.data, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Negocios</h1>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nombre"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {businesses.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-navy hover:bg-navy">
                  {[
                    "Nombre",
                    "Ciudad",
                    "Categoría",
                    "Plan",
                    "Estado",
                    "Valoración",
                    "Reseñas",
                    "Acciones",
                  ].map((h) => (
                    <TableHead key={h} className="text-navy-foreground">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No hay negocios que coincidan.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((b) => {
                    const sub = (b.subscriptions as { plan: string }[] | null)?.[0];
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-navy">{b.name}</TableCell>
                        <TableCell>{b.city ?? "—"}</TableCell>
                        <TableCell>
                          {(b.categories as { name: string } | null)?.name ?? "—"}
                        </TableCell>
                        <TableCell className="capitalize">{sub?.plan ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {STATUS_LABELS[b.status] ?? b.status}
                          </span>
                        </TableCell>
                        <TableCell>⭐ {Number(b.avg_rating).toFixed(1)}</TableCell>
                        <TableCell>{b.total_reviews}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" asChild>
                              <a
                                href={`/negocio/${b.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1"
                              >
                                Ver <ExternalLink size={13} />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant={b.status === "active" ? "destructive" : "default"}
                              disabled={toggleStatus.isPending}
                              onClick={() => toggleStatus.mutate({ id: b.id, status: b.status })}
                            >
                              {b.status === "active" ? "Suspender" : "Activar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} negocio{filtered.length === 1 ? "" : "s"} · Página {current + 1} de{" "}
          {pages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
