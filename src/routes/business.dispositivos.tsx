import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/business/dispositivos")({
  component: DevicesPage,
});

type DeviceRow = {
  id: string;
  code: string;
  label: string | null;
  type: string;
  status: string;
  total_scans: number;
};

const TYPE_LABELS: Record<string, { icon: string; name: string }> = {
  table: { icon: "🪑", name: "Mesa" },
  wall: { icon: "🧱", name: "Pared" },
  sticker: { icon: "🏷️", name: "Sticker" },
  mini: { icon: "📌", name: "Mini" },
};

const deviceUrl = (code: string) => `https://tapvio.es/t/${code}`;
const qrUrl = (code: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(deviceUrl(code))}`;

function DevicesPage() {
  const { data: business, isLoading } = useMyBusiness();
  const queryClient = useQueryClient();
  const [qrDevice, setQrDevice] = useState<DeviceRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const devices = useQuery({
    queryKey: ["business-devices", business?.id],
    enabled: Boolean(business?.id),
    queryFn: async (): Promise<DeviceRow[]> => {
      const { data, error } = await supabase
        .from("devices")
        .select("id,code,label,type,status,total_scans")
        .eq("business_id", business!.id)
        .order("code");
      if (error) throw error;
      return (data ?? []) as DeviceRow[];
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (device: DeviceRow) => {
      const next = device.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("devices")
        .update({ status: next })
        .eq("id", device.id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["business-devices", business?.id] });
      toast.success(next === "active" ? "Dispositivo activado" : "Dispositivo desactivado");
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(deviceUrl(code));
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!business) {
    return (
      <p className="text-muted-foreground">
        Tu negocio no está configurado aún. Contacta con TAPVIO.
      </p>
    );
  }

  const list = devices.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dispositivos</h1>
          <p className="text-muted-foreground">
            Tarjetas y adhesivos NFC vinculados a {business.name}.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Añadir dispositivo
        </Button>
      </header>

      {devices.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No tienes dispositivos activos. Contacta con TAPVIO para recibir tu primer punto TAP.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((device) => {
            const type = TYPE_LABELS[device.type] ?? TYPE_LABELS.sticker;
            const active = device.status === "active";
            return (
              <li
                key={device.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <Badge variant="secondary" className="font-mono tracking-tight">
                  {device.code}
                </Badge>
                <div className="min-w-[8rem] flex-1">
                  <p className="font-semibold">{device.label ?? "Sin etiqueta"}</p>
                  <p className="text-sm text-muted-foreground">
                    <span aria-hidden>{type.icon}</span> {type.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus.mutate(device)}
                  disabled={toggleStatus.isPending}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {active ? "Activo" : "Inactivo"}
                </button>

                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Smartphone size={15} /> {device.total_scans}
                </span>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQrDevice(device)}>
                    <QrCode size={15} /> Ver QR
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyLink(device.code)}>
                    <Copy size={15} /> Copiar enlace
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" asChild>
        <Link to="/business">Volver al panel</Link>
      </Button>

      <Dialog open={Boolean(qrDevice)} onOpenChange={(open) => !open && setQrDevice(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">{qrDevice?.code}</DialogTitle>
            <DialogDescription>
              Escanea o imprime este código para llevar a tus clientes a tu ficha TAPVIO.
            </DialogDescription>
          </DialogHeader>
          {qrDevice ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={qrUrl(qrDevice.code)}
                alt={`Código QR del dispositivo ${qrDevice.code}`}
                width={240}
                height={240}
                className="rounded-xl border border-border bg-white p-3"
              />
              <p className="break-all text-center text-xs text-muted-foreground">
                {deviceUrl(qrDevice.code)}
              </p>
              <Button variant="outline" size="sm" onClick={() => copyLink(qrDevice.code)}>
                <Copy size={15} /> Copiar enlace
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AddDeviceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businessId={business.id}
        onDone={() =>
          queryClient.invalidateQueries({ queryKey: ["business-devices", business.id] })
        }
      />
    </div>
  );
}

function AddDeviceDialog({
  open,
  onOpenChange,
  businessId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("sticker");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const normalized = code.trim().toUpperCase();
    if (!/^TAP-\d{4}$/.test(normalized)) {
      setError("El código debe tener el formato TAP-XXXX (por ejemplo, TAP-0010).");
      return;
    }
    if (!label.trim()) {
      setError("Añade una etiqueta para identificar el punto TAP.");
      return;
    }

    setSaving(true);
    try {
      const { data: existing, error: findError } = await supabase
        .from("devices")
        .select("id,business_id")
        .eq("code", normalized)
        .maybeSingle();
      if (findError) throw findError;
      if (!existing) {
        setError("No encontramos ningún dispositivo con ese código.");
        return;
      }
      if (existing.business_id && existing.business_id !== businessId) {
        setError("Ese dispositivo ya está asignado a otro negocio.");
        return;
      }

      const { data: updated, error: updateError } = await supabase
        .from("devices")
        .update({
          business_id: businessId,
          label: label.trim(),
          type,
          status: "active",
        })
        .eq("id", existing.id)
        .select("id");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        setError("No tienes permiso para asignar ese dispositivo.");
        return;
      }

      toast.success(`${normalized} asignado correctamente`);
      setCode("");
      setLabel("");
      setType("sticker");
      onDone();
      onOpenChange(false);
    } catch {
      setError("No se pudo asignar el dispositivo. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir dispositivo</DialogTitle>
          <DialogDescription>
            Vincula un punto TAP existente a tu negocio con su código.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-code">Código del dispositivo</Label>
            <Input
              id="device-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TAP-0010"
              className="font-mono"
              maxLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device-label">Etiqueta</Label>
            <Input
              id="device-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Mesa 3, Terraza, Barra..."
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device-type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="device-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">🪑 Mesa</SelectItem>
                <SelectItem value="wall">🧱 Pared</SelectItem>
                <SelectItem value="sticker">🏷️ Sticker</SelectItem>
                <SelectItem value="mini">📌 Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Asignando..." : "Asignar dispositivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
