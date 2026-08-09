import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { logInteraction } from "@/lib/tapvio";

export function ReviewModal({
  open,
  onOpenChange,
  businessId,
  businessName,
  googleReviewUrl,
  deviceId,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  businessName: string;
  googleReviewUrl?: string | null | undefined;
  deviceId?: string | null | undefined;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setRating(0);
    setName("");
    setComment("");
    setDone(false);
  };

  async function submit() {
    if (rating === 0) {
      toast.error("Selecciona una puntuación");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      business_id: businessId,
      device_id: deviceId ?? null,
      author_name: name.trim() || "Anónimo",
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo enviar la valoración");
      return;
    }
    void logInteraction({
      business_id: businessId,
      device_id: deviceId,
      action: "review_completed",
      source: deviceId ? "nfc" : "direct",
    });
    setDone(true);
    onSubmitted?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-2xl">
              🎉
            </div>
            <DialogTitle className="mt-4 text-xl">¡Gracias por tu valoración!</DialogTitle>
            <DialogDescription className="mt-1">
              Tu opinión ayuda a {businessName} a seguir creciendo.
            </DialogDescription>
            <div className="mt-6 space-y-2">
              {googleReviewUrl ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    void logInteraction({
                      business_id: businessId,
                      device_id: deviceId,
                      action: "google_click",
                      source: deviceId ? "nfc" : "direct",
                    });
                    window.open(googleReviewUrl, "_blank", "noopener");
                  }}
                >
                  ¿Compartir también en Google?
                </Button>
              ) : null}
              <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
                Descubre más negocios
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Valora {businessName}</DialogTitle>
              <DialogDescription>
                No necesitas registrarte. Solo cuéntanos cómo fue tu experiencia.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${i} estrellas`}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={38}
                      strokeWidth={1.4}
                      className={cn(
                        i <= (hover || rating)
                          ? "fill-star text-star"
                          : "fill-muted text-muted-foreground/40",
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-name">Tu nombre</Label>
                <Input
                  id="rv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. María G."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-comment">Comentario</Label>
                <Textarea
                  id="rv-comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="¿Qué te ha parecido?"
                />
              </div>
              <Button className="w-full" onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Enviar valoración
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
