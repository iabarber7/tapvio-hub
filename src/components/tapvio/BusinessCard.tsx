import { Link } from "@tanstack/react-router";
import { StarRating } from "./StarRating";
import type { Business } from "@/lib/tapvio";

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      to="/negocio/$slug"
      params={{ slug: business.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative h-40 overflow-hidden bg-muted">
        {business.cover_url ? (
          <img
            src={business.cover_url}
            alt={`Foto de ${business.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {business.categories ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
            {business.categories.icon} {business.categories.name}
          </span>
        ) : null}
      </div>
      <div className="flex gap-3 p-4">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt=""
            loading="lazy"
            className="-mt-9 h-12 w-12 shrink-0 rounded-xl border-2 border-background object-cover shadow-card"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{business.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{business.city}</p>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={Number(business.avg_rating)} size={14} />
            <span className="text-sm font-medium">{Number(business.avg_rating).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({business.total_reviews})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
