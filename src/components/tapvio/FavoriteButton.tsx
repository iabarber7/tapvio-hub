import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({
  businessId,
  size = 18,
  className = "",
}: {
  businessId: string;
  size?: number;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(businessId);

  return (
    <button
      type="button"
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(businessId);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-card backdrop-blur transition-transform hover:scale-110 active:scale-95 ${className}`}
    >
      <Heart
        size={size}
        strokeWidth={1.8}
        className={active ? "fill-destructive text-destructive" : "text-muted-foreground"}
      />
    </button>
  );
}
