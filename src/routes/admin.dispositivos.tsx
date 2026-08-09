import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/admin/dispositivos")({
  component: AdminDevices,
});

const TYPES = [
  { value: "table", label: "Mesa" },
  { value: "wall", label: "Pared" },
  { value: "sticker", label: "Sticker" },
  { value: "mini", label: "Mini" },
];

function AdminDevices() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("sticker");
  const [reassign, setReassign] = useState<{ id: string; code: string } | null>(null);
  const [targetBusiness, setTargetBusiness] = useState<string>("none");

  const devices = useQuery({
    queryKey: ["admin-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("id,code,label,type,status,total_scans,business_id,businesses(name)")
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const businesses = useQuery({
    queryKey: ["admin-businesses-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-devices"] });

  const createDevice = useMutation({
    mutationFn: async () => {
      const value = code.trim().toUpperCase();
      if (!/^TAP-\d{4}$/.test(value)) throw new Error("El código debe tener el formato TAP-XXXX");
      const { error } = await supabase
        .from("devices")
        .insert({ code: value, type, status: "unassigned" });
      if (error) throw new Error(error.message.includes("duplicate") ? "Ese código ya existe" : error.message);
    },
    onSuccess: () => {
      toast.success("Dispositivo creado");
      setCreateOpen(false);
      setCode("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("devices")
        .update({ status: active ? "active" : "inactive" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo actualizar el dispositivo"),
  });

  const reassignDevice = useMutation({
    mutationFn: async () => {
      if (!reassign) return;
      const businessId = targetBusiness === "none" ? null : targetBusiness;
      const { error } = await supabase
        .from("devices")
        .update({
          business_id: businessId,
          status: businessId ? "active" : "unassigned",
        })
        .eq("id", reassign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispositivo reasignado");
      setReassign(null);
      invalidate();
    },
    onError: () => toast.error("No se pudo reasignar"),
  });

  const rows = useMemo(() => devices.data ?? [], [devices.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Dispositivos</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Crear dispositivo
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {devices.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-navy hover:bg-navy">
                  {["Código", "Negocio asignado", "Etiqueta", "Estado", "Escaneos", "Acciones"].map(
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
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Todavía no hay dispositivos.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-navy">
                          {d.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(d.businesses as { name: string } | null)?.name ?? "Sin asignar"}
                      </TableCell>
                      <TableCell>{d.label ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={d.status === "active"}
                            onCheckedChange={(active) => toggleStatus.mutate({ id: d.id, active })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {d.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Smartphone size={14} /> {d.total_scans}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setReassign({ id: d.id, code: d.code });
                            setTargetBusiness(d.business_id ?? "none");
                          }}
                        >
                          Reasignar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear dispositivo</DialogTitle>
            <DialogDescription>Añade un nuevo punto TAP al inventario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código del dispositivo</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TAP-0011"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createDevice.mutate()}
              disabled={createDevice.isPending}
            >
              {createDevice.isPending ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reassign)} onOpenChange={(open) => !open && setReassign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reasignar {reassign?.code}</DialogTitle>
            <DialogDescription>Elige el negocio al que pertenece este dispositivo.</DialogDescription>
          </DialogHeader>
          <Select value={targetBusiness} onValueChange={setTargetBusiness}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un negocio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asignar</SelectItem>
              {(businesses.data ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => reassignDevice.mutate()} disabled={reassignDevice.isPending}>
              {reassignDevice.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
