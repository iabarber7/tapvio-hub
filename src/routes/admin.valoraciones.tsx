import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/valoraciones")({
  component: AdminReviews,
});

const STATUS_LABELS: Record<string, string> = {
  published: "Publicada",
  reported: "Reportada",
  removed: "Eliminada",
};

function AdminReviews() {
  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,comment,status,created_at,author_name,businesses(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setReviewStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await supabase.from("reviews").update({ status: next }).eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next === "removed" ? "Valoración eliminada" : "Valoración restaurada");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("No se pudo actualizar la valoración"),
  });

  const rows = useMemo(() => {
    const list = reviews.data ?? [];
    return status === "all" ? list : list.filter((r) => r.status === status);
  }, [reviews.data, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Valoraciones</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="reported">Reportadas</SelectItem>
            <SelectItem value="removed">Eliminadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        {reviews.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-navy hover:bg-navy">
                  {["Negocio", "Autor", "Puntuación", "Comentario", "Estado", "Fecha", "Acciones"].map(
                    (h) => (
                      <TableHead key={h} className="text-navy-foreground">
                        {h}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay valoraciones con este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow
                      key={r.id}
                      className={r.status === "reported" ? "bg-amber-50 hover:bg-amber-100" : ""}
                    >
                      <TableCell className="font-medium text-navy">
                        {(r.businesses as { name: string } | null)?.name ?? "—"}
                      </TableCell>
                      <TableCell>{r.author_name ?? "Anónimo"}</TableCell>
                      <TableCell>⭐ {r.rating}</TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {r.comment ?? "—"}
                      </TableCell>
                      <TableCell>{STATUS_LABELS[r.status] ?? r.status}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>
                        {r.status === "removed" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReviewStatus.mutate({ id: r.id, next: "published" })}
                          >
                            Restaurar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setReviewStatus.mutate({ id: r.id, next: "removed" })}
                          >
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
