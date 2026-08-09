import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/hooks/useAuth";
import { AuthShell } from "@/components/tapvio/AuthShell";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta | TAPVIO" },
      {
        name: "description",
        content:
          "Crea tu cuenta gratuita en TAPVIO y empieza a descubrir, valorar y fidelizar negocios locales.",
      },
      { property: "og:title", content: "Crear cuenta | TAPVIO" },
      {
        property: "og:description",
        content: "Regístrate gratis en TAPVIO y conecta con negocios locales mediante NFC y QR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Introduce tu nombre.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name: name.trim() },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(authErrorMessage(signUpError.message));
      return;
    }

    if (data.session && data.user) {
      await supabase.from("profiles").update({ name: name.trim() }).eq("id", data.user.id);
      setLoading(false);
      toast.success("¡Cuenta creada! Bienvenido a TAPVIO.");
      navigate({ to: "/" });
      return;
    }

    setLoading(false);
    toast.success("Te hemos enviado un email para confirmar tu cuenta.");
    navigate({ to: "/login" });
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Únete a TAPVIO en menos de un minuto"
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            required
            maxLength={100}
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            maxLength={72}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Repetir contraseña</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            maxLength={72}
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Creando cuenta…
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
