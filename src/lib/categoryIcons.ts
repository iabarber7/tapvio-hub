import {
  UtensilsCrossed,
  Coffee,
  Scissors,
  Sparkles,
  BedDouble,
  Dumbbell,
  ShoppingBag,
  Wrench,
  Gamepad2,
  Store,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restaurantes: UtensilsCrossed,
  cafeterias: Coffee,
  peluquerias: Scissors,
  belleza: Sparkles,
  hoteles: BedDouble,
  gimnasios: Dumbbell,
  tiendas: ShoppingBag,
  servicios: Wrench,
  ocio: Gamepad2,
};

export function categoryIcon(slug?: string | null): LucideIcon {
  return (slug && CATEGORY_ICONS[slug]) || Store;
}
