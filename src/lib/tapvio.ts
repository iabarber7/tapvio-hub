import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  google_review_url: string | null;
  instagram: string | null;
  facebook: string | null;
  logo_url: string | null;
  cover_url: string | null;
  avg_rating: number;
  total_reviews: number;
  category_id: string | null;
  categories?: { name: string; icon: string | null; slug: string } | null;
};

const BUSINESS_FIELDS =
  "id,name,slug,description,address,city,phone,website,google_review_url,instagram,facebook,logo_url,cover_url,avg_rating,total_reviews,category_id,categories(name,icon,slug)";

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return data as Category[];
  },
};

export function businessesQuery(opts: {
  key: string;
  order: "avg_rating" | "total_reviews" | "created_at";
  limit?: number;
}) {
  return {
    queryKey: ["businesses", opts.key],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_FIELDS)
        .eq("status", "active")
        .order(opts.order, { ascending: false })
        .limit(opts.limit ?? 12);
      if (error) throw error;
      return data as unknown as Business[];
    },
  };
}

export function businessBySlugQuery(slug: string) {
  return {
    queryKey: ["business", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_FIELDS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Business) ?? null;
    },
  };
}

export function businessDetailsQuery(businessId: string | undefined) {
  return {
    queryKey: ["business-details", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const id = businessId!;
      const [reviews, photos, hours, promos] = await Promise.all([
        supabase
          .from("reviews")
          .select("id,author_name,rating,comment,created_at")
          .eq("business_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase.from("business_photos").select("id,url").eq("business_id", id).order("order"),
        supabase
          .from("business_hours")
          .select("day_of_week,open_time,close_time,is_closed")
          .eq("business_id", id)
          .order("day_of_week"),
        supabase
          .from("promotions")
          .select("id,title,description")
          .eq("business_id", id)
          .eq("active", true),
      ]);
      return {
        reviews: reviews.data ?? [],
        photos: photos.data ?? [],
        hours: hours.data ?? [],
        promotions: promos.data ?? [],
      };
    },
  };
}

export const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function isOpenNow(
  hours: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[],
) {
  const now = new Date();
  const today = hours.find((h) => h.day_of_week === now.getDay());
  if (!today || today.is_closed || !today.open_time || !today.close_time) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return current >= toMin(today.open_time) && current <= toMin(today.close_time);
}

export async function logInteraction(input: {
  business_id: string;
  device_id?: string | null;
  source?: string;
  action?: string;
}) {
  await supabase.from("interactions").insert({
    business_id: input.business_id,
    device_id: input.device_id ?? null,
    source: input.source ?? "direct",
    action: input.action ?? "view",
  });
}
