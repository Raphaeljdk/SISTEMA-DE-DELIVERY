"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  /** URL atual da imagem (se houver) */
  value?: string | null;
  /** Endpoint que recebe multipart/form-data com campo "file" */
  endpoint: string;
  /** Pasta no Cloudinary (ex: "produtos", "restaurantes") */
  folder?: string;
  /** Callback chamado após upload com a URL final */
  onChange: (url: string) => void;
  /** Tamanho do preview */
  size?: "sm" | "md" | "lg";
  /** Label exibido abaixo do botão */
  label?: string;
  className?: string;
}

const SIZE_PRESETS = {
  sm: { w: 64, h: 64 },
  md: { w: 120, h: 120 },
  lg: { w: 200, h: 200 },
};

export function ImageUpload({
  value,
  endpoint,
  folder = "food-delivery",
  onChange,
  size = "md",
  label,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { w, h } = SIZE_PRESETS[size];

  const handleFile = useCallback(
    async (file: File) => {
      // Validações básicas no client
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas arquivos de imagem são aceitos");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo excede 5 MB");
        return;
      }

      // Preview local imediato
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch(endpoint, {
          method: "PATCH", // ou POST se for endpoint genérico /api/upload
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Erro no upload");
          setPreview(value ?? null);
          return;
        }

        // data.url (genérico) ou data.upload.url (produto/restaurante)
        const finalUrl = data.url || data.upload?.url;
        if (finalUrl) {
          URL.revokeObjectURL(localUrl);
          setPreview(finalUrl);
          onChange(finalUrl);
          toast.success("Imagem atualizada!");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro de conexão no upload");
        setPreview(value ?? null);
      } finally {
        setUploading(false);
      }
    },
    [endpoint, folder, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Preview */}
      <div
        className={cn(
          "relative flex-shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40",
          uploading && "border-primary"
        )}
        style={{ width: w, height: h }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <Image src={preview} alt="Preview" fill sizes={`${w}px`} className="object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive hover:bg-background"
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <span className="mt-1 text-[10px]">Sem imagem</span>
          </div>
        )}
      </div>

      {/* Button + label */}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {value ? "Trocar imagem" : "Enviar imagem"}
            </>
          )}
        </Button>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <span className="text-[10px] text-muted-foreground">
          JPG, PNG ou WebP · máx 5 MB
        </span>
      </div>
    </div>
  );
}
