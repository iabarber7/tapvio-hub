import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/hooks/useAuth";
import { AuthShell } from "@/components/tapvio/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión | TAPVIO" },
      {
        name: "description",
        content: "Accede a tu cuenta TAPVIO para gestionar tu negocio, valoraciones y favoritos.",
      },
      { property: "og:title", content: "Iniciar sesión | TAPVIO" },
      {
        property: "og:description",
        content: "Accede a tu cuenta TAPVIO para gestionar tu negocio y tus favoritos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(authErrorMessage(signInError.message));
      return;
    }

    toast.success("¡Bienvenido de nuevo!");
    const previous = typeof window !== "undefined" ? window.history.length > 1 : false;
    if (previous) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Accede a tu cuenta TAPVIO"
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-semibold text-primary hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Entrando…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
