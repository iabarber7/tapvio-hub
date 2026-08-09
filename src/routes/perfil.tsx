import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Star, Heart, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/tapvio/Header";
import { Footer } from "@/components/tapvio/Footer";
import { BottomNav } from "@/components/tapvio/BottomNav";
import { BusinessCard } from "@/components/tapvio/BusinessCard";
import { StarRating } from "@/components/tapvio/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Business } from "@/lib/tapvio";

export const Route = createFileRoute("/perfil")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search['tab'] === "favoritos" ? "favoritos" : "valoraciones",
  }),
  head: () => ({
    meta: [
      { title: "Mi perfil | TAPVIO" },
      {
        name: "description",
        content: "Gestiona tu perfil TAPVIO, revisa tus valoraciones y tus negocios favoritos.",
      },
      { property: "og:title", content: "Mi perfil | TAPVIO" },
      {
        property: "og:description",
        content: "Tus valoraciones y negocios favoritos en TAPVIO.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

const BUSINESS_FIELDS =
  "id,name,slug,description,address,city,phone,website,google_review_url,instagram,facebook,logo_url,cover_url,avg_rating,total_reviews,category_id,categories(name,icon,slug)";

function initials(name: string | null | undefined, email: string | undefined) {
  const base = name?.trim() || email?.split("@")[0] || "U";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PerfilPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.info("Inicia sesión para ver tu perfil");
      void navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,username,avatar_url,created_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const reviews = useQuery({
    queryKey: ["my-reviews", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,businesses(name,slug)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        rating: number;
        comment: string | null;
        created_at: string;
        businesses: { name: string; slug: string } | null;
      }[];
    },
  });

  const favorites = useQuery({
    queryKey: ["favorite-businesses", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(`business_id,businesses(${BUSINESS_FIELDS})`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? [])
        .map((row) => (row as unknown as { businesses: Business | null }).businesses)
        .filter(Boolean) as Business[]);
    },
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen pb-16 md:pb-0">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const name = profile.data?.name ?? (user.user_metadata?.['name'] as string | undefined) ?? null;

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Avatar className="h-20 w-20 border-2 border-background shadow-card">
              {profile.data?.avatar_url ? (
                <AvatarImage src={profile.data.avatar_url} alt={name ?? "Avatar"} />
              ) : null}
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials(name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold">{name ?? "Usuario TAPVIO"}</h1>
              {profile.data?.username ? (
                <p className="text-sm text-muted-foreground">@{profile.data.username}</p>
              ) : null}
              {profile.data?.created_at ? (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <CalendarDays size={14} /> Miembro desde {formatDate(profile.data.created_at)}
                </p>
              ) : null}
            </div>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Editar perfil
            </Button>
          </div>
        </section>

        <Tabs
          value={tab}
          onValueChange={(value) =>
            navigate({ to: "/perfil", search: { tab: value as "valoraciones" | "favoritos" } })
          }
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valoraciones">
              <Star size={16} /> Mis valoraciones
            </TabsTrigger>
            <TabsTrigger value="favoritos">
              <Heart size={16} /> Mis favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="valoraciones" className="mt-6">
            {reviews.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : (reviews.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Star size={28} className="text-primary" />}
                title="Aún no has valorado ningún negocio"
                description="Escanea un TAP o busca un negocio para dejar tu primera valoración."
              />
            ) : (
              <ul className="space-y-3">
                {reviews.data!.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {review.businesses ? (
                        <Link
                          to="/negocio/$slug"
                          params={{ slug: review.businesses.slug }}
                          className="font-semibold hover:underline"
                        >
                          {review.businesses.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">Negocio</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StarRating value={review.rating} size={15} />
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="favoritos" className="mt-6">
            {favorites.isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ) : (favorites.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Heart size={28} className="text-primary" />}
                title="Aún no tienes favoritos"
                description="Pulsa el corazón en cualquier negocio para guardarlo aquí."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.data!.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <EditProfileDialog
        open={editing}
        onOpenChange={setEditing}
        userId={user.id}
        initial={{
          name: name ?? "",
          username: profile.data?.username ?? "",
          avatar_url: profile.data?.avatar_url ?? "",
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        }}
      />

      <Footer />
      <BottomNav />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-5" asChild>
        <Link to="/explorar">Explorar negocios</Link>
      </Button>
    </div>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  userId: string;
  initial: { name: string; username: string; avatar_url: string };
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        username: form.username.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "Ese nombre de usuario ya está en uso."
          : "No se ha podido guardar el perfil.",
      );
      return;
    }
    toast.success("Perfil actualizado");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="tu_usuario"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">URL del avatar</Label>
            <Input
              id="avatar"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null} Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
