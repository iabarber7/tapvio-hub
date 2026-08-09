import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Globe, Instagram, Facebook, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "./StarRating";
import { ReviewModal } from "./ReviewModal";
import {
  businessDetailsQuery,
  isOpenNow,
  DAYS,
  logInteraction,
  type Business,
} from "@/lib/tapvio";

export function BusinessProfile({
  business,
  deviceId,
  source = "direct",
  highlightCta = false,
}: {
  business: Business;
  deviceId?: string | null;
  source?: string;
  highlightCta?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const details = useQuery(businessDetailsQuery(business.id));
  const hours = details.data?.hours ?? [];
  const openNow = hours.length > 0 && isOpenNow(hours);

  useEffect(() => {
    void logInteraction({ business_id: business.id, device_id: deviceId, source, action: "view" });
  }, [business.id, deviceId, source]);

  return (
    <article>
      <div className="relative h-52 w-full overflow-hidden bg-muted md:h-72">
        {business.cover_url ? (
          <img
            src={business.cover_url}
            alt={`Portada de ${business.name}`}
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-12 flex items-end gap-4">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt=""
              className="h-24 w-24 rounded-2xl border-4 border-background object-cover shadow-lift"
            />
          ) : null}
          <div className="pb-2">
            {business.categories ? (
              <Badge variant="secondary">
                {business.categories.icon} {business.categories.name}
              </Badge>
            ) : null}
          </div>
          <div className="ml-auto pb-2">
            <FavoriteButton businessId={business.id} size={20} className="h-10 w-10" />
          </div>
        </div>

        <h1 className="mt-4 text-3xl font-bold md:text-4xl">{business.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StarRating value={Number(business.avg_rating)} size={18} />
          <span className="font-semibold">{Number(business.avg_rating).toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">
            {business.total_reviews} valoraciones
          </span>
          {hours.length > 0 ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                openNow ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {openNow ? "Abierto ahora" : "Cerrado"}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-muted-foreground">{business.description}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            size={highlightCta ? "lg" : "default"}
            className={highlightCta ? "flex-1 text-base" : "flex-1"}
            onClick={() => setOpen(true)}
          >
            {highlightCta ? "Valora tu experiencia" : "Valorar este negocio"}
          </Button>
          <Button variant="secondary" className="flex-1" asChild>
            <Link to="/explorar">Descubre más negocios</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Información</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {business.address ? (
                <li className="flex gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    {business.address}, {business.city}
                  </span>
                </li>
              ) : null}
              {business.phone ? (
                <li className="flex gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-primary" />
                  <a href={`tel:${business.phone}`} className="hover:underline">
                    {business.phone}
                  </a>
                </li>
              ) : null}
              {business.website ? (
                <li className="flex gap-2.5">
                  <Globe size={16} className="mt-0.5 shrink-0 text-primary" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {business.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              ) : null}
              {business.instagram ? (
                <li className="flex gap-2.5">
                  <Instagram size={16} className="mt-0.5 shrink-0 text-primary" />
                  {business.instagram}
                </li>
              ) : null}
              {business.facebook ? (
                <li className="flex gap-2.5">
                  <Facebook size={16} className="mt-0.5 shrink-0 text-primary" />
                  {business.facebook}
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock size={16} className="text-primary" /> Horario
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {hours.map((h) => (
                <li key={h.day_of_week} className="flex justify-between">
                  <span className="text-muted-foreground">{DAYS[h.day_of_week]}</span>
                  <span>
                    {h.is_closed
                      ? "Cerrado"
                      : `${(h.open_time ?? "").slice(0, 5)} – ${(h.close_time ?? "").slice(0, 5)}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {details.data?.promotions.length ? (
          <section className="mt-6">
            <h2 className="font-semibold">Promociones activas</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {details.data.promotions.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-accent/40 bg-accent/10 p-4"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <Tag size={15} /> {p.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {details.data?.photos.length ? (
          <section className="mt-8">
            <h2 className="font-semibold">Galería</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {details.data.photos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={`Foto de ${business.name}`}
                  loading="lazy"
                  className="h-32 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="font-semibold">Valoraciones ({business.total_reviews})</h2>
          <div className="mt-4 space-y-4">
            {details.data?.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <StarRating value={r.rating} size={14} className="mt-1" />
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
        <Separator className="mt-10" />
      </div>

      <ReviewModal
        open={open}
        onOpenChange={setOpen}
        businessId={business.id}
        businessName={business.name}
        googleReviewUrl={business.google_review_url}
        deviceId={deviceId}
        onSubmitted={() => void details.refetch()}
      />
    </article>
  );
}
