import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Business } from "@/lib/tapvio";

export function useUserRoles() {
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const roles = query.data ?? [];
  return {
    user,
    roles,
    isBusiness: roles.includes("business") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    loading: loading || (Boolean(user) && query.isLoading),
  };
}

const BUSINESS_FIELDS =
  "id,name,slug,description,address,city,phone,website,google_review_url,instagram,facebook,logo_url,cover_url,avg_rating,total_reviews,category_id,categories(name,icon,slug)";

export function useMyBusiness() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-business", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_FIELDS)
        .eq("owner_id", user!.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Business) ?? null;
    },
  });
}
