import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function favoriteIdsQuery(userId: string | undefined) {
  return {
    queryKey: ["favorite-ids", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("business_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.business_id as string);
    },
  };
}

export function useFavorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const key = ["favorite-ids", user?.id];

  const { data: ids } = useQuery(favoriteIdsQuery(user?.id));

  const toggle = useMutation({
    mutationFn: async (businessId: string) => {
      const isFav = (ids ?? []).includes(businessId);
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user!.id)
          .eq("business_id", businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user!.id, business_id: businessId });
        if (error) throw error;
      }
      return !isFav;
    },
    onMutate: async (businessId: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(
        key,
        previous.includes(businessId)
          ? previous.filter((id) => id !== businessId)
          : [...previous, businessId],
      );
      return { previous };
    },
    onError: (_error, _businessId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("No se ha podido actualizar tus favoritos.");
    },
    onSuccess: (added) => {
      toast.success(added ? "Añadido a favoritos" : "Eliminado de favoritos");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["favorite-businesses", user?.id] });
    },
  });

  return {
    favoriteIds: ids ?? [],
    isFavorite: (businessId: string) => (ids ?? []).includes(businessId),
    toggleFavorite: (businessId: string) => {
      if (!user) {
        toast.info("Inicia sesión para guardar favoritos");
        void navigate({ to: "/login" });
        return;
      }
      toggle.mutate(businessId);
    },
  };
}
