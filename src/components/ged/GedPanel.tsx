'use client';

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FolderSimple,
  IdentificationBadge,
  Gavel,
  CurrencyCircleDollar,
  Scroll,
  ShieldCheck,
  Trash,
  DownloadSimple,
  UploadSimple,
  MagnifyingGlass,
  FilePdf,
  ImageSquare,
  FileText,
  LinkSimple,
  ArrowCounterClockwise,
  Eye,
  Info,
  DotsThreeVertical,
  PencilSimple,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  DocumentCategoryEnum,
  DocumentDomainEnum,
  DocumentOriginEnum,
  DocumentStatusEnum,
  StorageProviderEnum,
  SignatureTypeEnum,
} from "@/data/definitions/documents";
import type { PatientDocument } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GedDetailsSheet } from "@/components/ged/GedDetailsSheet";
import { GedPreviewDialog } from "@/components/ged/GedPreviewDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type GedPanelFilters = {
  category?: string;
  domain?: string;
  origin?: string;
  status?: string;
  tags?: string;
  subcategory?: string;
  min_access_role?: string;
  fromDate?: string;
  toDate?: string;
};

export type GedPanelPatientInfo = {
  name?: string | null;
  status?: string | null;
  identifier?: string | null;
};

type Props = {
  patientId: string;
  initialFilters?: Partial<GedPanelFilters> | null;
  patientInfo?: GedPanelPatientInfo | null;
};

const categories = [
  { id: "all", label: "Todos", icon: FolderSimple },
  { id: "Identificacao", label: "Identificação", icon: IdentificationBadge },
  { id: "Juridico", label: "Jurídico", icon: Gavel },
  { id: "Financeiro", label: "Financeiro", icon: CurrencyCircleDollar },
  { id: "Clinico", label: "Clínico", icon: Scroll },
  { id: "Consentimento", label: "Consentimentos", icon: ShieldCheck },
  { id: "archived", label: "Arquivados", icon: Trash },
];

const accessRoles = ["all", "Basico", "Coordenacao", "Diretoria", "Juridico", "TI"] as const;

const iconForMime = (mime?: string, extension?: string | null) => {
  const ext = extension?.toLowerCase();
  if ((mime && mime.includes("pdf")) || ext === "pdf") return <FilePdf className="w-4 h-4 text-rose-600" />;
  if ((mime && mime.includes("image")) || (ext && ["jpg", "jpeg", "png", "gif"].includes(ext))) {
    return <ImageSquare className="w-4 h-4 text-sky-600" />;
  }
  return <FileText className="w-4 h-4 text-slate-600" />;
};

type DocumentsResponse = { data: PatientDocument[]; page: number; pageSize: number; total: number };

const listFetcher = async (url: string | null): Promise<DocumentsResponse | null> => {
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao carregar GED");
  return res.json();
};

type UploadSheetProps = {
  patientId: string;
  onDone: () => void;
  previous?: PatientDocument | null;
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  triggerVariant?: "primary" | "ghost";
  mode?: "create" | "version" | "edit";
};

function UploadSheet({ patientId, onDone, previous, triggerContent, triggerClassName, triggerVariant = "primary", mode }: UploadSheetProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(previous?.title || "");
  const [description, setDescription] = useState(previous?.description || "");
  const [category, setCategory] = useState<string>(previous?.category || DocumentCategoryEnum.enum.Identificacao);
  const [domain, setDomain] = useState<string>((previous as any)?.domain || DocumentDomainEnum.enum.Administrativo);
  const [subcategory, setSubcategory] = useState(previous?.subcategory || "");
  const [origin, setOrigin] = useState((previous as any)?.origin_module || DocumentOriginEnum.enum.Ficha_Documentos);
  const [status, setStatus] = useState<string>((previous as any)?.document_status || DocumentStatusEnum.enum.Ativo);
  const [confidential, setConfidential] = useState(!!previous?.confidential);
  const [clinicalVisible, setClinicalVisible] = useState(previous?.clinical_visible !== false);
  const [adminVisible, setAdminVisible] = useState(previous?.admin_fin_visible !== false);
  const [tags, setTags] = useState(previous?.tags?.join(", ") || "");
  const [expiresAt, setExpiresAt] = useState(
    (previous as any)?.expires_at ? new Date((previous as any).expires_at).toISOString().slice(0, 10) : ""
  );
  const [isVerified, setIsVerified] = useState(!!(previous as any)?.is_verified);
  const [minAccessRole, setMinAccessRole] = useState((previous as any)?.min_access_role || "");
  const [storageProvider, setStorageProvider] = useState<string>((previous as any)?.storage_provider || StorageProviderEnum.enum.Supabase);
  const [signatureType, setSignatureType] = useState<string>((previous as any)?.signature_type || SignatureTypeEnum.enum.Nenhuma);
  const [signatureDate, setSignatureDate] = useState(previous?.signature_date ? new Date(previous.signature_date).toISOString().slice(0, 10) : "");
  const [signatureSummary, setSignatureSummary] = useState((previous as any)?.signature_summary || "");
  const [publicNotes, setPublicNotes] = useState((previous as any)?.public_notes || "");
  const [internalNotes, setInternalNotes] = useState((previous as any)?.internal_notes || "");
  const [adminContractId, setAdminContractId] = useState((previous as any)?.admin_contract_id || "");
  const [financeEntryId, setFinanceEntryId] = useState((previous as any)?.finance_entry_id || "");
  const [clinicalVisitId, setClinicalVisitId] = useState((previous as any)?.clinical_visit_id || "");
  const [clinicalEvolutionId, setClinicalEvolutionId] = useState((previous as any)?.clinical_evolution_id || "");
  const [prescriptionId, setPrescriptionId] = useState((previous as any)?.prescription_id || "");
  const [relatedObjectId, setRelatedObjectId] = useState((previous as any)?.related_object_id || "");
  const [externalSignatureId, setExternalSignatureId] = useState((previous as any)?.external_signature_id || "");
  const [uploading, setUploading] = useState(false);
  const [externalRef, setExternalRef] = useState((previous as any)?.external_ref || "");

  const effectiveMode = mode ?? (previous ? "version" : "create");
  const isNewVersion = effectiveMode === "version";
  const isEditMode = effectiveMode === "edit";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setTitle(f.name);
    }
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      if (!previous?.id) {
        toast.error("Documento inválido para edição.");
        return;
      }
      setUploading(true);
      try {
        const tagList = tags
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined;
        const payload = {
          title,
          description,
          externalRef: externalRef || null,
          category,
          domain,
          originModule: origin,
          subcategory,
          status,
          isConfidential: confidential,
          isVisibleClinical: clinicalVisible,
          isVisibleAdmin: adminVisible,
          minAccessRole: minAccessRole || null,
          adminContractId: adminContractId || null,
          financeEntryId: financeEntryId || null,
          clinicalVisitId: clinicalVisitId || null,
          clinicalEvolutionId: clinicalEvolutionId || null,
          prescriptionId: prescriptionId || null,
          relatedObjectId: relatedObjectId || null,
          signatureType,
          signatureDate: signatureDate || null,
          signatureSummary,
          externalSignatureId: externalSignatureId || null,
          publicNotes,
          internalNotes,
          tags: tagList,
          expiresAt: expiresAt || null,
          isVerified: isVerified,
        };
        const res = await fetch(`/api/patients/${patientId}/documents/${previous.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Erro ao atualizar documento");
        toast.success("Metadados atualizados");
        setOpen(false);
        onDone();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Erro ao salvar metadados");
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!file && isNewVersion) {
      return toast.error("Selecione o arquivo da nova versão.");
    }
    if (!file && !isNewVersion) {
      return toast.error("Selecione um arquivo para enviar.");
    }
    if (isNewVersion && !previous?.id) {
      return toast.error("Documento anterior inválido.");
    }
    setUploading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      fd.append("patient_id", patientId);
      if (previous?.id) fd.append("previous_id", previous.id);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("category", category);
      fd.append("domain", domain);
      fd.append("subcategory", subcategory);
      fd.append("origin_module", origin);
      fd.append("document_status", status);
      fd.append("confidential", String(confidential));
      fd.append("clinical_visible", String(clinicalVisible));
      fd.append("admin_fin_visible", String(adminVisible));
      fd.append("min_access_role", minAccessRole);
      fd.append("storage_provider", storageProvider);
      fd.append("signature_type", signatureType);
      if (signatureDate) fd.append("signature_date", signatureDate);
      fd.append("signature_summary", signatureSummary);
      fd.append("public_notes", publicNotes);
      fd.append("internal_notes", internalNotes);
      fd.append("admin_contract_id", adminContractId);
      fd.append("finance_entry_id", financeEntryId);
      fd.append("clinical_visit_id", clinicalVisitId);
      fd.append("clinical_evolution_id", clinicalEvolutionId);
      fd.append("prescription_id", prescriptionId);
      fd.append("related_object_id", relatedObjectId);
      fd.append("external_signature_id", externalSignatureId);
      fd.append("external_ref", externalRef);
      if (tags) fd.append("tags", tags);
      if (expiresAt) fd.append("expires_at", expiresAt);
      fd.append("is_verified", String(isVerified));

      const url = isNewVersion
        ? `/api/patients/${patientId}/documents/${previous?.id}/version`
        : `/api/patients/${patientId}/documents`;
      const res = await fetch(url, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Erro ao salvar");
      toast.success(isNewVersion ? "Nova versão enviada" : "Documento salvo");
      setOpen(false);
      setFile(null);
      onDone();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const titleTrigger = isEditMode ? `Editar Metadados (${previous?.title || "Documento"})` : isNewVersion ? `Nova versão (${previous?.title})` : "Novo Documento";
  const triggerNode =
    triggerContent ||
    (triggerVariant === "ghost" ? (
      <Button variant="ghost" size="icon" className={triggerClassName}>
        <ArrowCounterClockwise className="w-4 h-4" />
      </Button>
    ) : (
      <Button className={`bg-[#0F2B45] text-white gap-2 ${triggerClassName || ""}`}><UploadSimple className="w-4 h-4" /> {titleTrigger}</Button>
    ));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerNode}
      </SheetTrigger>
      <SheetContent className="sm:max-w-5xl space-y-4 overflow-y-auto px-6 py-6">
        <SheetHeader>
          <SheetTitle>{titleTrigger}</SheetTitle>
        </SheetHeader>

        {!isEditMode && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Arquivo</Label>
              <Input type="file" onChange={handleFile} />
              {isNewVersion && !file && (
                <p className="text-xs text-amber-600">Selecione o arquivo da versão {((previous?.version || 1) + 1)}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: RG digitalizado" />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Resumo do documento" />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DocumentCategoryEnum.options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Domínio</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DocumentDomainEnum.options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Subcategoria</Label>
            <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Origem</Label>
            <Select value={origin} onValueChange={(v) => setOrigin(v as typeof origin)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DocumentOriginEnum.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DocumentStatusEnum.options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ref. Externa</Label>
            <Input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="Protocolo / Dossiê" />
          </div>
          <div className="space-y-1">
            <Label>Data de validade</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Documento verificado?</Label>
            <div className="flex items-center gap-2 h-10 border rounded-md px-3">
              <Checkbox checked={isVerified} onCheckedChange={(v) => setIsVerified(!!v)} />
              <span className="text-sm text-slate-600">Marcar como conferido</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Contrato (ID)</Label>
            <Input value={adminContractId} onChange={(e) => setAdminContractId(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Lançamento Financeiro (ID)</Label>
            <Input value={financeEntryId} onChange={(e) => setFinanceEntryId(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Visita Clínica (ID)</Label>
            <Input value={clinicalVisitId} onChange={(e) => setClinicalVisitId(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Evolução Clínica (ID)</Label>
            <Input value={clinicalEvolutionId} onChange={(e) => setClinicalEvolutionId(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Prescrição (ID)</Label>
            <Input value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Objeto Relacionado (ID)</Label>
            <Input value={relatedObjectId} onChange={(e) => setRelatedObjectId(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Provedor de Storage</Label>
            <Select value={storageProvider} onValueChange={(v) => setStorageProvider(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {StorageProviderEnum.options.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Perfil mínimo de acesso</Label>
            <Input value={minAccessRole} onChange={(e) => setMinAccessRole(e.target.value)} placeholder="Basico / Coordenação / Jurídico..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipo de Assinatura</Label>
            <Select value={signatureType} onValueChange={(v) => setSignatureType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SignatureTypeEnum.options.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Data Assinatura</Label>
            <Input type="date" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Resumo de Assinatura</Label>
            <Input value={signatureSummary} onChange={(e) => setSignatureSummary(e.target.value)} placeholder="Assinado por ..." />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>ID Assinatura Externa</Label>
            <Input value={externalSignatureId} onChange={(e) => setExternalSignatureId(e.target.value)} placeholder="ID no provedor de assinatura" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Segurança</Label>
          <div className="flex items-center gap-2">
            <Checkbox checked={confidential} onCheckedChange={(v) => setConfidential(!!v)} /> <span>Confidencial</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={clinicalVisible} onCheckedChange={(v) => setClinicalVisible(!!v)} /> <span>Visível para Clínico</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={adminVisible} onCheckedChange={(v) => setAdminVisible(!!v)} /> <span>Visível para Administrativo/Financeiro</span>
          </div>
          <div className="space-y-1">
            <Label>Tags (vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="judicial, urgente" />
            <p className="text-[11px] text-slate-500">Separe as tags por vírgula (ex: contrato, assinado)</p>
          </div>
          <div className="space-y-1">
            <Label>Notas internas</Label>
            <Input value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notas públicas</Label>
            <Input value={publicNotes} onChange={(e) => setPublicNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!isEditMode && !file && !isNewVersion)}
            className="bg-[#0F2B45] text-white"
          >
            {uploading ? (isEditMode ? "Salvando..." : "Enviando...") : isEditMode ? "Salvar alterações" : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function GedPanel({ patientId, initialFilters, patientInfo }: Props) {
  const [filter, setFilter] = useState(initialFilters?.category || "all");
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>(initialFilters?.origin || "all");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters?.status || "all");
  const [domainFilter, setDomainFilter] = useState<string>(initialFilters?.domain || "all");
  const [fromDate, setFromDate] = useState<string>(initialFilters?.fromDate || "");
  const [toDate, setToDate] = useState<string>(initialFilters?.toDate || "");
  const [orderBy, setOrderBy] = useState<"uploaded_at" | "title">("uploaded_at");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [tagFilter, setTagFilter] = useState<string>(initialFilters?.tags || "");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(initialFilters?.subcategory || "");
  const [minAccessFilter, setMinAccessFilter] = useState<string>(initialFilters?.min_access_role || "all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"meta" | "versions" | "logs">("meta");
  const [previewDoc, setPreviewDoc] = useState<{ id: string; path: string; mime?: string; title?: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filtersKey = JSON.stringify(initialFilters || {});
  useEffect(() => {
    if (!initialFilters) {
      setFilter("all");
      setOriginFilter("all");
      setStatusFilter("all");
      setDomainFilter("all");
      setFromDate("");
      setToDate("");
      setTagFilter("");
      setSubcategoryFilter("");
      setMinAccessFilter("all");
      return;
    }
    setFilter(initialFilters.category || "all");
    setOriginFilter(initialFilters.origin || "all");
    setStatusFilter(initialFilters.status || "all");
    setDomainFilter(initialFilters.domain || "all");
    setFromDate(initialFilters.fromDate || "");
    setToDate(initialFilters.toDate || "");
    setTagFilter(initialFilters.tags || "");
    setSubcategoryFilter(initialFilters.subcategory || "");
    setMinAccessFilter(initialFilters.min_access_role || "all");
  }, [filtersKey]);

  const effectiveStatus = filter === "archived" ? DocumentStatusEnum.enum.Arquivado : statusFilter;
  const effectiveCategory = filter === "archived" ? "all" : filter;

  const documentsKey = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("category", effectiveCategory || "all");
    params.set("status", effectiveStatus || "all");
    params.set("domain", domainFilter || "all");
    params.set("origin", originFilter || "all");
    params.set("orderBy", orderBy);
    params.set("orderDir", orderDir);
    params.set("minAccessRole", minAccessFilter);
    if (search) params.set("text", search);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (tagFilter) params.set("tags", tagFilter);
    if (subcategoryFilter) params.set("subcategory", subcategoryFilter);
    return `/api/patients/${patientId}/documents?${params.toString()}`;
  }, [
    patientId,
    effectiveCategory,
    effectiveStatus,
    domainFilter,
    originFilter,
    orderBy,
    orderDir,
    minAccessFilter,
    search,
    fromDate,
    toDate,
    tagFilter,
    subcategoryFilter,
  ]);

  const { data, error, mutate } = useSWR<{ data: PatientDocument[]; page: number; pageSize: number; total: number } | null>(
    documentsKey,
    listFetcher,
  );

  const docs = data?.data || [];
  const loading = !data && !error;

  // Counters mirror the same metadata filters used by the table so we can rely on them to match back-end queries:
  // - "Ativos" considers every document whose GED status !== "Arquivado" (same flag used by the status filter)
  // - "Arquivados" are the ones explicitly marked as "Arquivado" via document_status
  // - "Vencidos" look at expires_at < now to warn about outdated files regardless of status
  // - "Pendentes de assinatura" require a signature_type different from "Nenhuma" without a recorded signature_date
  const stats = React.useMemo(() => {
    const summary = {
      total: data?.total ?? docs.length,
      active: 0,
      archived: 0,
      expired: 0,
      pendingSignature: 0,
    };
    docs.forEach((doc) => {
      const status = (doc as any).document_status;
      if (status === "Arquivado") summary.archived += 1;
      else summary.active += 1;

      const expiresAtDate = (doc as any).expires_at ? new Date((doc as any).expires_at) : null;
      if (expiresAtDate && expiresAtDate.getTime() < now) summary.expired += 1;

      const requiresSignature = (doc as any).signature_type && (doc as any).signature_type !== SignatureTypeEnum.enum.Nenhuma;
      if (requiresSignature && !(doc as any).signature_date) summary.pendingSignature += 1;
    });
    return summary;
  }, [docs, data?.total, now]);

  const headerIdentifier = React.useMemo(() => {
    if (patientInfo?.identifier) return patientInfo.identifier;
    if (!patientId) return null;
    const clean = patientId.replace(/-/g, "");
    if (!clean) return null;
    return `PAC-${clean.slice(0, 8).toUpperCase()}`;
  }, [patientInfo?.identifier, patientId]);

  const statusBadgeClass = React.useMemo(() => {
    if (!patientInfo?.status) return null;
    const normalized = patientInfo.status.toLowerCase();
    if (normalized.includes("ativo") || normalized === "active") return "bg-emerald-100 text-emerald-700";
    if (normalized.includes("onboard") || normalized.includes("andamento") || normalized.includes("rasc")) return "bg-amber-100 text-amber-800";
    if (normalized.includes("inativo") || normalized.includes("arquiv") || normalized.includes("susp")) return "bg-slate-200 text-slate-700";
    return "bg-sky-100 text-sky-700";
  }, [patientInfo?.status]);

  const statCards = [
    { label: "Ativos", value: stats.active, detail: `Total: ${stats.total}` },
    { label: "Arquivados", value: stats.archived, highlight: stats.archived > 0 },
    { label: "Vencidos", value: stats.expired, warning: stats.expired > 0 },
    { label: "Pendentes de assinatura", value: stats.pendingSignature, warning: stats.pendingSignature > 0 },
  ];

  const archivedCount = stats.archived;

  const handleDownload = async (doc: PatientDocument) => {
    const storagePath = (doc as any).storage_path || doc.file_path;
    if (!storagePath) return toast.error("Arquivo não disponível");
    const res = await fetch("/api/ged/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath, documentId: doc.id, action: "Download" }),
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      return toast.error(json.error || "Erro ao baixar");
    }
    window.open(json.url, "_blank");
  };

  const handleArchive = async (doc: PatientDocument) => {
    const res = await fetch("/api/ged/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      toast.error(json.error || "Erro ao arquivar");
    } else {
      toast.success("Documento arquivado");
      mutate();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-200 bg-white shadow-fluent">
        <div className="flex flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-[#0F2B45]">{patientInfo?.name || "GED do Paciente"}</h2>
              {patientInfo?.status && statusBadgeClass && <Badge className={`${statusBadgeClass} text-xs px-2 py-0.5`}>{patientInfo.status}</Badge>}
              <Badge variant="secondary" className="text-[11px]">GED</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {headerIdentifier ? `ID ${headerIdentifier}` : "Paciente sem identificação"} · {stats.total} documento(s) cadastrados
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-1">
              <ArrowCounterClockwise className="w-4 h-4" /> Atualizar lista
            </Button>
            <UploadSheet patientId={patientId} onDone={mutate} triggerClassName="h-9" />
          </div>
        </div>
        <div className="grid gap-3 px-4 pb-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 lg:px-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border px-4 py-3 shadow-sm ${
                card.warning
                  ? "border-amber-200 bg-amber-50"
                  : card.highlight
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              {card.detail && <p className="text-[11px] text-slate-500">{card.detail}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 px-4 pb-6 lg:px-6 lg:grid-cols-4 xl:grid-cols-5">
        <div className="space-y-3 lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-white shadow-fluent divide-y">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${filter === c.id ? "bg-slate-100 font-semibold text-[#0F2B45]" : "text-slate-600"}`}
                onClick={() => setFilter(c.id)}
              >
                <c.icon className="w-4 h-4" /> {c.label}
              </button>
            ))}
          </div>
          {archivedCount > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 flex items-center gap-2">
              {archivedCount} documento(s) arquivado(s)
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-3 xl:col-span-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Input placeholder="Buscar documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
            </div>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" />
            <Input placeholder="Subcategoria" value={subcategoryFilter} onChange={(e) => setSubcategoryFilter(e.target.value)} className="w-40" />
            <Input placeholder="Tags (ex: judicial, urgente)" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="w-44" />
            <Select value={minAccessFilter} onValueChange={(v) => setMinAccessFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Perfil mínimo" /></SelectTrigger>
              <SelectContent>
                {accessRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role === "all" ? "Todos perfis" : role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={(v) => setOriginFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                {DocumentOriginEnum.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Domínio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {DocumentDomainEnum.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {DocumentStatusEnum.options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={orderBy} onValueChange={(v) => setOrderBy(v as any)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded_at">Data</SelectItem>
                <SelectItem value="title">Título</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderDir} onValueChange={(v) => setOrderDir(v as any)}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Direção" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-fluent">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-slate-500 py-6">Carregando...</TableCell></TableRow>
              ) : docs.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-slate-500 py-6">Nenhum documento encontrado.</TableCell></TableRow>
              ) : (
                docs.map((doc) => {
                  const expiresAtDate = (doc as any).expires_at ? new Date((doc as any).expires_at) : null;
                  const isExpiredDoc = expiresAtDate ? expiresAtDate.getTime() < now : false;
                  const isVerifiedDoc = !!(doc as any).is_verified;
                  return (
                    <TableRow key={doc.id}>
                    <TableCell>{iconForMime((doc as any).mime_type, (doc as any).extension)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 flex items-center gap-2">
                          {doc.title}
                          {(doc as any).confidential && <span title="Confidencial">🔒</span>}
                          {(doc as any).clinical_visible && <span title="Visível Clínico">👁️</span>}
                          {(doc as any).min_access_role && <Badge variant="outline" className="text-[10px]">{(doc as any).min_access_role}</Badge>}
                          {isVerifiedDoc && (
                            <span title="Verificado">
                              <CheckCircle className="w-4 h-4 text-sky-600" />
                            </span>
                          )}
                          {isExpiredDoc && (
                            <span title="Documento vencido">
                              <WarningCircle className="w-4 h-4 text-rose-500" />
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {doc.version ? <Badge variant="secondary" className="text-[10px]">V{doc.version}</Badge> : null}
                          {(doc as any).extension && (
                            <Badge variant="outline" className="text-[10px] uppercase">.{(doc as any).extension}</Badge>
                          )}
                          {expiresAtDate && (
                            <span className="text-[11px] text-slate-500">Válido até {format(expiresAtDate, "dd/MM/yyyy")}</span>
                          )}
                        </div>
                        {doc.description && <span className="text-[11px] text-slate-500 line-clamp-1">{doc.description}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{(doc as any).subcategory || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{(doc as any).category || "—"}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{(doc as any).domain || "—"}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{(doc as any).origin_module || "Ficha"}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {(doc as any).admin_contract_id && <Badge variant="outline" className="text-[10px] flex items-center gap-1"><LinkSimple className="w-3 h-3" /> Contrato</Badge>}
                        {(doc as any).finance_entry_id && <Badge variant="outline" className="text-[10px] flex items-center gap-1"><LinkSimple className="w-3 h-3" /> Financeiro</Badge>}
                        {(doc as any).clinical_evolution_id && <Badge variant="outline" className="text-[10px]">🩺 Evolução</Badge>}
                        {(doc as any).prescription_id && <Badge variant="outline" className="text-[10px]">💊 Prescrição</Badge>}
                        {(doc as any).related_object_id && <Badge variant="outline" className="text-[10px]">📦 Objeto</Badge>}
                        {!(doc as any).admin_contract_id &&
                          !(doc as any).finance_entry_id &&
                          !(doc as any).clinical_evolution_id &&
                          !(doc as any).prescription_id &&
                          !(doc as any).related_object_id && "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {doc.uploaded_at ? format(new Date(doc.uploaded_at), "dd/MM/yyyy") : "—"}
                      {(doc as any).uploaded_by_name && <span className="block text-[11px] text-slate-500">{(doc as any).uploaded_by_name}</span>}
                      <span className="block text-[11px] text-slate-500">{((doc as any).file_size_bytes ? ((doc as any).file_size_bytes / 1024).toFixed(1) : "0")} KB</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={(doc as any).document_status === "Arquivado" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"}>
                          {(doc as any).document_status || "Ativo"}
                        </Badge>
                        {isVerifiedDoc && <Badge className="bg-sky-100 text-sky-700">Verificado</Badge>}
                        {isExpiredDoc && <Badge variant="destructive">Vencido</Badge>}
                        {(doc as any).tags &&
                          Array.isArray((doc as any).tags) &&
                          (doc as any).tags.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-600"
                          title="Visualizar documento"
                          onClick={() => setPreviewDoc({ id: doc.id, path: (doc as any).storage_path || (doc as any).file_path, mime: (doc as any).mime_type, title: doc.title })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-600"
                          title="Baixar documento"
                          onClick={() => handleDownload(doc)}
                        >
                          <DownloadSimple className="w-4 h-4" />
                        </Button>
                        <UploadSheet
                          patientId={patientId}
                          onDone={mutate}
                          previous={doc}
                          mode="version"
                          triggerContent={(
                            <Button variant="ghost" size="icon" className="text-slate-600" title="Substituir / nova versão">
                              <ArrowCounterClockwise className="w-4 h-4" />
                            </Button>
                          )}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <DotsThreeVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => { setDetailTab("meta"); setDetailId(doc.id); }}>
                              <Info className="w-4 h-4 mr-2" /> Metadados & logs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setDetailTab("versions"); setDetailId(doc.id); }}>
                              <ArrowCounterClockwise className="w-4 h-4 mr-2" /> Histórico de versões
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <UploadSheet
                              patientId={patientId}
                              onDone={mutate}
                              previous={doc}
                              mode="edit"
                              triggerContent={(
                                <DropdownMenuItem>
                                  <PencilSimple className="w-4 h-4 mr-2" /> ✏️ Editar metadados
                                </DropdownMenuItem>
                              )}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchive(doc)} className="text-red-600 focus:text-red-600">
                              <Trash className="w-4 h-4 mr-2" /> Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      </div>
      <GedDetailsSheet
        patientId={patientId}
        documentId={detailId}
        open={!!detailId}
        initialTab={detailTab}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
      <GedPreviewDialog
        storagePath={previewDoc?.path || ""}
        mimeType={previewDoc?.mime}
        documentId={previewDoc?.id}
        title={previewDoc?.title}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />
    </div>
  );
}
