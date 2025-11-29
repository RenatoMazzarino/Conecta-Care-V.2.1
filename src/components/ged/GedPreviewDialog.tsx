'use client';

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storagePath?: string;
  mimeType?: string;
  title?: string;
  documentId?: string;
};

export function GedPreviewDialog({ open, onOpenChange, storagePath, mimeType, title, documentId }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!open || !storagePath) {
        setUrl(null);
        return;
      }
      const res = await fetch("/api/ged/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath, documentId, action: "Preview" }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setUrl(json.url);
      } else {
        setUrl(null);
        toast.error(json.error || "Preview não disponível");
      }
    }
    load();
  }, [open, storagePath]);

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || mimeType?.includes("pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title || "Visualização do Documento"}</DialogTitle>
        </DialogHeader>
        {!url ? (
          <div className="text-sm text-slate-500">Carregando preview...</div>
        ) : isImage ? (
          <img src={url} alt={title || "Documento"} className="max-h-[70vh] mx-auto" />
        ) : isPdf ? (
          <iframe src={url} className="w-full h-[70vh]" />
        ) : (
          <div className="text-sm text-slate-600 space-y-3">
            <p>Preview não disponível para este tipo de arquivo.</p>
            <Button onClick={() => window.open(url || "#", "_blank")}>Baixar arquivo</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
