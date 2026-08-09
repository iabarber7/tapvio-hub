import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyBusiness } from "@/hooks/useBusinessAccess";
import { categoriesQuery } from "@/lib/tapvio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/business/configuracion")({
  component: SettingsPage,
});

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

type Hours = { day_of_week: number; open_time: string; close_time: string; is_closed: boolean };

type Form = {
  name: string;
  description: string;
  category_id: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  google_review_url: string;
  instagram: string;
  facebook: string;
  logo_url: string;
  cover_url: string;
};

const EMPTY_FORM: Form = {
  name: "",
  description: "",
  category_id: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  google_review_url: "",
  instagram: "",
  facebook: "",
  logo_url: "",
  cover_url: "",
};

const defaultHours = (): Hours[] =>
  DAYS.map((_, index) => ({
    day_of_week: index + 1 === 7 ? 0 : index + 1,
    open_time: "09:00",
    close_time: "20:00",
    is_closed: false,
  }));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const { data: base, isLoading } = useMyBusiness();
  const businessId = base?.id;
  const categories = useQuery(categoriesQuery);

  const detail = useQuery({
    queryKey: ["business-settings", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const [biz, hours] = await Promise.all([
        supabase.from("businesses").select("*").eq("id", businessId!).single(),
        supabase
          .from("business_hours")
          .select("day_of_week,open_time,close_time,is_closed")
          .eq("business_id", businessId!),
      ]);
      if (biz.error) throw biz.error;
      if (hours.error) throw hours.error;
      return { business: biz.data as Record<string, unknown>, hours: hours.data ?? [] };
    },
  });

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [hours, setHours] = useState<Hours[]>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!detail.data) return;
    const b = detail.data.business;
    const str = (key: string) => (b[key] == null ? "" : String(b[key]));
    setForm({
      name: str("name"),
      description: str("description"),
      category_id: str("category_id"),
      phone: str("phone"),
      email: str("email"),
      website: str("website"),
      address: str("address"),
      city: str("city"),
      province: str("province"),
      postal_code: str("postal_code"),
      google_review_url: str("google_review_url"),
      instagram: str("instagram"),
      facebook: str("facebook"),
      logo_url: str("logo_url"),
      cover_url: str("cover_url"),
    });
    setHours(
      defaultHours().map((day) => {
        const existing = detail.data!.hours.find(
          (h: { day_of_week: number }) => h.day_of_week === day.day_of_week,
        ) as Partial<Hours> | undefined;
        if (!existing) return day;
        return {
          day_of_week: day.day_of_week,
          is_closed: Boolean(existing.is_closed),
          open_time: (existing.open_time ?? "09:00").slice(0, 5),
          close_time: (existing.close_time ?? "20:00").slice(0, 5),
        };
      }),
    );
  }, [detail.data]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(kind: "logo" | "cover", file: File) {
    if (!businessId) return;
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${businessId}/${kind}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data, error } = await supabase.storage
        .from("business-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (error || !data) throw error;
      set(kind === "logo" ? "logo_url" : "cover_url", data.signedUrl);
      toast.success("Imagen subida. Recuerda guardar los cambios.");
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    if (!businessId) return;
    if (!form.name.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const nullable = (value: string) => (value.trim() === "" ? null : value.trim());
      const { error } = await supabase
        .from("businesses")
        .update({
          name: form.name.trim(),
          description: nullable(form.description),
          category_id: form.category_id || null,
          phone: nullable(form.phone),
          email: nullable(form.email),
          website: nullable(form.website),
          address: nullable(form.address),
          city: nullable(form.city),
          province: nullable(form.province),
          postal_code: nullable(form.postal_code),
          google_review_url: nullable(form.google_review_url),
          instagram: nullable(form.instagram),
          facebook: nullable(form.facebook),
          logo_url: nullable(form.logo_url),
          cover_url: nullable(form.cover_url),
        })
        .eq("id", businessId);
      if (error) throw error;

      const { error: deleteError } = await supabase
        .from("business_hours")
        .delete()
        .eq("business_id", businessId);
      if (deleteError) throw deleteError;

      const { error: hoursError } = await supabase.from("business_hours").insert(
        hours.map((day) => ({
          business_id: businessId,
          day_of_week: day.day_of_week,
          is_closed: day.is_closed,
          open_time: day.is_closed ? null : day.open_time,
          close_time: day.is_closed ? null : day.close_time,
        })),
      );
      if (hoursError) throw hoursError;

      await detail.refetch();
      toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!base) {
    return (
      <p className="text-muted-foreground">
        Tu negocio no está configurado aún. Contacta con TAPVIO.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Configuración</h1>
          <p className="text-muted-foreground">Datos públicos de {base.name}.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || detail.isLoading}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </header>

      {detail.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          <Section title="Información básica">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={300}
                value={form.description}
                onChange={(e) => set("description", e.target.value.slice(0, 300))}
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.description.length}/300
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          </Section>

          <Section title="Ubicación">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Código postal</Label>
                <Input
                  id="postal"
                  value={form.postal_code}
                  onChange={(e) => set("postal_code", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Presencia digital">
            <div className="space-y-2">
              <Label htmlFor="google">Enlace de reseñas de Google</Label>
              <Input
                id="google"
                value={form.google_review_url}
                onChange={(e) => set("google_review_url", e.target.value)}
                placeholder="https://g.page/r/..."
              />
              <p className="text-xs text-muted-foreground">
                Pega aquí el enlace directo de tu ficha de Google.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^@+/, "");
                    set("instagram", raw ? `@${raw}` : "");
                  }}
                  placeholder="@tunegocio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={form.facebook}
                  onChange={(e) => set("facebook", e.target.value)}
                  placeholder="https://facebook.com/tunegocio"
                />
              </div>
            </div>
          </Section>

          <Section title="Imágenes">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo actual del negocio"
                      className="h-20 w-20 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                      Sin logo
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === "logo"}
                    onClick={() => logoInput.current?.click()}
                  >
                    <ImagePlus size={15} />
                    {uploading === "logo" ? "Subiendo..." : "Subir logo"}
                  </Button>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload("logo", file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Foto de portada</Label>
                <div className="space-y-3">
                  {form.cover_url ? (
                    <img
                      src={form.cover_url}
                      alt="Portada actual del negocio"
                      className="h-24 w-full rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                      Sin portada
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === "cover"}
                    onClick={() => coverInput.current?.click()}
                  >
                    <ImagePlus size={15} />
                    {uploading === "cover" ? "Subiendo..." : "Subir portada"}
                  </Button>
                  <input
                    ref={coverInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload("cover", file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Horarios">
            <ul className="space-y-3">
              {hours.map((day, index) => (
                <li
                  key={day.day_of_week}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="w-24 text-sm font-medium">{DAYS[index]}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`closed-${day.day_of_week}`}
                      checked={day.is_closed}
                      onCheckedChange={(checked) =>
                        setHours((prev) =>
                          prev.map((h, i) => (i === index ? { ...h, is_closed: checked } : h)),
                        )
                      }
                    />
                    <Label htmlFor={`closed-${day.day_of_week}`} className="text-sm">
                      Cerrado
                    </Label>
                  </div>
                  {!day.is_closed ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-32"
                        value={day.open_time}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((h, i) =>
                              i === index ? { ...h, open_time: e.target.value } : h,
                            ),
                          )
                        }
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={day.close_time}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((h, i) =>
                              i === index ? { ...h, close_time: e.target.value } : h,
                            ),
                          )
                        }
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/business">Volver al panel</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
