import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No autorizado");
}

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  created_at: string;
  role: string;
};

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw error;

    const ids = list.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,name,username").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const roleById = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));

    return list.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      name: profileById.get(u.id)?.name ?? null,
      username: profileById.get(u.id)?.username ?? null,
      created_at: u.created_at,
      role: roleById.get(u.id) ?? "user",
    }));
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ userId: z.string().uuid(), role: z.enum(["user", "business", "admin"]) })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: delError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delError) throw delError;

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    return { ok: true };
  });
