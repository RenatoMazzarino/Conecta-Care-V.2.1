'use client';

import { useMemo } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generatePreviewUrl, getDocumentDetails, getDocumentLogs, getDocumentVersions } from "@/app/(app)/ged/actions";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

type Props = {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "meta" | "versions" | "logs";
};

const fetcher = async (key: string, fn: (...args: any[]) => Promise<any>, ...args: any[]) => {
  const data = await fn(...args);
  return data;
};

export function GedDetailsSheet({ documentId, open, onOpenChange, initialTab = "meta" }: Props) {
  const enabled = useMemo(() => open && !!documentId, [open, documentId]);
  const { data: details } = useSWR(enabled ? ["doc-details", documentId] : null, ([, id]) => fetcher("details", getDocumentDetails, id));
  const { data: versions } = useSWR(enabled ? ["doc-versions", documentId] : null, ([, id]) => fetcher("versions", getDocumentVersions, id));
  const { data: logs } = useSWR(enabled ? ["doc-logs", documentId] : null, ([, id]) => fetcher("logs", getDocumentLogs, id));

  const handleDownload = async (storagePath?: string) => {
    if (!storagePath || !documentId) return;
    const res = await generatePreviewUrl(storagePath, { documentId, action: "Download" });
    if (!res.success || !res.url) return toast.error(res.error || "Erro ao gerar link");
    window.open(res.url, "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto px-6 py-6">
        <SheetHeader>
          <SheetTitle>Detalhes do Documento</SheetTitle>
        </SheetHeader>

        {!details ? (
          <div className="text-slate-500 text-sm mt-4">Carregando...</div>
        ) : (
          <Tabs defaultValue={initialTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="meta">Metadados</TabsTrigger>
              <TabsTrigger value="versions">Versões</TabsTrigger>
              <TabsTrigger value="logs">Auditoria</TabsTrigger>
            </TabsList>

            <TabsContent value="meta" className="space-y-3 mt-3">
              <div className="border rounded-md p-3">
                <p className="text-sm font-semibold">{details.title}</p>
                <p className="text-sm text-slate-600">{details.description || "—"}</p>
                {details.external_ref && <p className="text-xs text-slate-500">Ref. externa: {details.external_ref}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase text-slate-500">Hash</p>
                  <p className="font-mono text-xs break-all">{details.file_hash || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase text-slate-500">Caminho</p>
                  <p className="font-mono text-xs break-all">{details.storage_path || details.file_path || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase text-slate-500">Mime / Tamanho</p>
                  <p>{details.mime_type || "—"} ({(details.file_size_bytes || 0) / 1024 > 0 ? `${((details.file_size_bytes || 0) / 1024).toFixed(1)} KB` : "0 KB"})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase text-slate-500">Assinatura</p>
                  <p>{details.signature_type || "Nenhuma"} {details.signature_date ? `em ${format(new Date(details.signature_date), "dd/MM/yyyy")}` : ""}</p>
                  {details.signature_summary && <p className="text-xs text-slate-500">{details.signature_summary}</p>}
                  {details.external_signature_id && <p className="text-xs text-slate-500">ID externa: {details.external_signature_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Badge variant="secondary">Domínio: {details.domain || "—"}</Badge>
                <Badge variant="secondary">Categoria: {details.category || "—"}</Badge>
                <Badge variant="outline">Subcategoria: {details.subcategory || "—"}</Badge>
                <Badge variant="outline">Origem: {details.origin_module || "—"}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {details.confidential && <Badge variant="destructive">Confidencial</Badge>}
                {details.clinical_visible && <Badge variant="secondary">Visível Clínico</Badge>}
                {details.admin_fin_visible && <Badge variant="secondary">Visível Adm/Fin</Badge>}
                {details.min_access_role && <Badge variant="outline">Perfil: {details.min_access_role}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>Contrato: {details.admin_contract_id || "—"}</p>
                <p>Financeiro: {details.finance_entry_id || "—"}</p>
                <p>Visita Clínica: {details.clinical_visit_id || "—"}</p>
                <p>Evolução Clínica: {details.clinical_evolution_id || "—"}</p>
                <p>Prescrição: {details.prescription_id || "—"}</p>
                <p>Objeto Relacionado: {details.related_object_id || "—"}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {(details.tags || []).map((t: string) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
                {(!details.tags || details.tags.length === 0) && <span className="text-xs text-slate-500">Sem tags</span>}
              </div>

              <div className="border rounded-md p-3 space-y-1">
                <p className="text-[11px] uppercase text-slate-500">Ciclo de Vida</p>
                {details.uploaded_at && (
                  <p className="text-sm text-slate-700">
                    Enviado em {format(new Date(details.uploaded_at), "dd/MM/yyyy HH:mm")} por {details.uploaded_by_name || "—"}
                  </p>
                )}
                {details.updated_at && (
                  <p className="text-sm text-slate-700">
                    Última edição em {format(new Date(details.updated_at), "dd/MM/yyyy HH:mm")} por {details.updated_by_name || "—"}
                  </p>
                )}
                {details.document_status === "Arquivado" && details.deleted_at && (
                  <p className="text-sm text-slate-700">
                    Arquivado em {format(new Date(details.deleted_at), "dd/MM/yyyy HH:mm")} por {details.deleted_by_name || "—"}
                  </p>
                )}
                {!details.uploaded_at && !details.updated_at && !(details.document_status === "Arquivado" && details.deleted_at) && (
                  <p className="text-sm text-slate-500">Dados de ciclo de vida indisponíveis.</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleDownload(details.storage_path || details.file_path)}>Baixar</Button>
              </div>
            </TabsContent>

            <TabsContent value="versions" className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Versão</TableHead>
                    <TableHead>Enviado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(versions || []).map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell>V{v.version || 1}</TableCell>
                      <TableCell className="text-sm text-slate-700">{v.uploaded_by_name || "—"}</TableCell>
                      <TableCell className="text-sm text-slate-700">{v.uploaded_at ? format(new Date(v.uploaded_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => handleDownload(v.storage_path || v.file_path)}><DownloadSimple className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="logs" className="mt-3 space-y-3">
              {(logs || []).map((l: any) => (
                <div key={l.id} className="border rounded-md p-2 text-sm">
                  <p className="font-semibold">{format(new Date(l.happened_at), "dd/MM/yyyy HH:mm")} — {l.action}</p>
                  <p className="text-slate-600 text-xs">por {l.user_name || "Sistema"}</p>
                  {l.details && <pre className="bg-slate-50 text-xs p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(l.details, null, 2)}</pre>}
                </div>
              ))}
              {(logs || []).length === 0 && <p className="text-sm text-slate-500">Nenhum log registrado.</p>}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
