import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { adminListUsers, adminSetUserRole } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const listUsers = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetUserRole);
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: "user" | "business" | "admin" }) =>
      setRole({ data: vars }),
    onSuccess: () => {
      toast.success("Rol actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("No se pudo cambiar el rol"),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = users.data ?? [];
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Usuarios</h1>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {users.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : users.isError ? (
          <p className="p-6 text-sm text-destructive">No se pudieron cargar los usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-navy hover:bg-navy">
                  {["Nombre", "Email", "Rol", "Fecha registro", "Acciones"].map((h) => (
                    <TableHead key={h} className="text-navy-foreground">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay usuarios que coincidan.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-navy">{u.name ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(role) =>
                            roleMutation.mutate({
                              userId: u.id,
                              role: role as "user" | "business" | "admin",
                            })
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="business">Negocio</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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
