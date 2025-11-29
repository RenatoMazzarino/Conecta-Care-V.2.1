'use client';

import { useMemo, useState } from "react";
import { FullPatientDetails } from "../../patient.data";
import { createClient } from "@/lib/supabase/client";
import { upsertDocumentMeta, getDocuments as getDocumentsAction } from "@/app/(app)/patients/actions.documents";
import { getDocumentUrlAction, deleteDocumentAction } from "../../actions.documents";
import {
  PatientDocumentDTO,
  DocumentCategoryEnum,
  DocumentDomainEnum,
  DocumentOriginEnum,
  DocumentStatusEnum,
  StorageProviderEnum,
} from "@/data/definitions/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  DotsThree,
  MagnifyingGlass,
  FilePdf,
  ImageSquare,
  FileText,
} from "@phosphor-icons/react";

const categories = [
  { id: "all", label: "Todos", icon: FolderSimple },
  { id: "Identificacao", label: "Identificação", icon: IdentificationBadge },
  { id: "Juridico", label: "Jurídico", icon: Gavel },
  { id: "Financeiro", label: "Financeiro", icon: CurrencyCircleDollar },
  { id: "Clinico", label: "Clínico", icon: Scroll },
  { id: "Consentimento", label: "Consentimentos", icon: ShieldCheck },
  { id: "archived", label: "Arquivados", icon: Trash },
];

const iconForMime = (mime: string) => {
  if (mime.includes("pdf")) return <FilePdf className="w-4 h-4 text-rose-600" />;
  if (mime.includes("image")) return <ImageSquare className="w-4 h-4 text-sky-600" />;
  return <FileText className="w-4 h-4 text-slate-600" />;
};

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

type UploadSheetProps = {
  patientId: string;
  onDone: () => void;
};

function UploadSheet({ patientId, onDone }: UploadSheetProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(DocumentCategoryEnum.enum.Identificacao);
  const [domain, setDomain] = useState<string>(DocumentDomainEnum.enum.Administrativo);
  const [subcategory, setSubcategory] = useState("");
  const [origin, setOrigin] = useState(DocumentOriginEnum.enum.Ficha_Documentos);
  const [confidential, setConfidential] = useState(false);
  const [clinicalVisible, setClinicalVisible] = useState(true);
  const [adminVisible, setAdminVisible] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setTitle(f.name);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Selecione um arquivo.");
    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${patientId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const doc: PatientDocumentDTO = {
        patient_id: patientId,
        title: title || file.name,
        category: category as any,
        domain: domain as any,
        subcategory,
        origin_module: origin as any,
        document_status: DocumentStatusEnum.enum.Ativo,
        confidential,
        clinical_visible: clinicalVisible,
        admin_fin_visible: adminVisible,
        storage_provider: StorageProviderEnum.enum.Supabase,
        storage_path: filePath,
        original_file_name: file.name,
        file_name: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      };
      const res = await upsertDocumentMeta(doc);
      if (!res.success) throw new Error(res.error);
      toast.success("Documento salvo");
      setOpen(false);
      setFile(null);
      onDone();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-[#0F2B45] text-white gap-2"><UploadSimple className="w-4 h-4" /> Novo Documento</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Documento</SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-200 rounded-md p-4 text-center">
            <Input type="file" onChange={handleFile} />
            <p className="text-xs text-slate-500 mt-2">Arraste ou selecione um arquivo</p>
          </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: RG digitalizado" />
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
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DocumentOriginEnum.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={uploading || !file} className="bg-[#0F2B45] text-white">
            {uploading ? "Enviando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TabDocuments({ patient }: { patient: FullPatientDetails }) {
  const docs = (patient.documents as any[]) || [];
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const docStatus = d.document_status || d.status;
      const docCategory = d.category;
      const docOrigin = d.origin_module || d.origin;
      const docDomain = d.domain;

      if (filter === "archived" && docStatus !== "Arquivado") return false;
      if (filter !== "all" && filter !== "archived" && docCategory !== filter) return false;
      if (search && !(`${d.title} ${d.subcategory || ""}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (originFilter !== "all" && docOrigin !== originFilter) return false;
      if (statusFilter !== "all" && docStatus !== statusFilter) return false;
      if (domainFilter !== "all" && docDomain !== domainFilter) return false;
      return true;
    });
  }, [docs, filter, search, originFilter, statusFilter, domainFilter]);

  const refresh = async () => {
    // simple reload
    window.location.reload();
  };

  const handleDownload = async (filePath: string) => {
    const res = await getDocumentUrlAction(filePath);
    if (res.success && res.url) {
      window.open(res.url, "_blank");
    } else {
      toast.error("Erro ao gerar link");
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm("Arquivar/remover este documento?")) return;
    const res = await deleteDocumentAction(doc.id, doc.file_path, patient.id);
    if (!res.success) toast.error(res.error || "Erro");
    else {
      toast.success("Documento removido");
      refresh();
    }
  };

  const expiredCount = docs.filter((d) => d.status === "Arquivado").length;

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Navegação */}
      <div className="col-span-1 space-y-3">
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
        {expiredCount > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 flex items-center gap-2">
            {expiredCount} documento(s) arquivado(s)
          </div>
        )}
      </div>

      {/* Área principal */}
      <div className="col-span-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Input placeholder="Buscar documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
            </div>
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
          </div>
          <UploadSheet patientId={patient.id} onDone={refresh} />
        </div>

        <div className="rounded-md border border-slate-200 bg-white shadow-fluent">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Título</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-6">Nenhum documento encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{iconForMime(doc.mime_type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{doc.title}</span>
                        {doc.subcategory && <span className="text-xs text-slate-500">{doc.subcategory}</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{doc.origin_module || doc.origin || "Ficha"}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600">{doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : doc.uploaded_at ? format(new Date(doc.uploaded_at), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatSize(doc.file_size_bytes)}</TableCell>
                    <TableCell>
                      <Badge className={(doc.document_status || doc.status) === "Arquivado" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"}>
                        {doc.document_status || doc.status || "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path)}>
                        <DownloadSimple className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                        <DotsThree className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
