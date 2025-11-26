'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDocumentRecordAction, deleteDocumentAction, getDocumentUrlAction } from "../../actions.documents";
import { FullPatientDetails } from "../../patient.data";
import { 
    FolderSimple, IdentificationBadge, Gavel, CurrencyCircleDollar, Scroll, ShieldCheck, 
    DotsThreeCircle, UploadSimple, FilePdf, ImageSquare, FileText, Trash, CheckCircle, WarningCircle,
    DownloadSimple
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- HELPERS ---
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return { icon: FilePdf, color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (mime.includes('image')) return { icon: ImageSquare, color: 'text-sky-600 bg-sky-50 border-sky-100' };
    return { icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' };
};

const CATEGORIES = [
    { id: 'identity', label: 'Identificação', icon: IdentificationBadge },
    { id: 'legal', label: 'Jurídico', icon: Gavel },
    { id: 'financial', label: 'Financeiro', icon: CurrencyCircleDollar },
    { id: 'clinical', label: 'Clínico', icon: Scroll },
    { id: 'consent', label: 'Consentimento', icon: ShieldCheck },
    { id: 'other', label: 'Outros', icon: DotsThreeCircle },
];

// --- COMPONENTE DE UPLOAD ---
function UploadDialog({ patientId, onUploadComplete }: any) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("other");
    const [title, setTitle] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setTitle(f.name); // Auto-preenche título
        }
    };

    const handleUpload = async () => {
        if (!file) return toast.error("Selecione um arquivo.");
        setUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const filePath = `${patientId}/${Date.now()}.${fileExt}`;

            // 1. Upload Binário
            const { error: uploadError } = await supabase.storage
                .from('patient-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Salvar Metadados
            const res = await createDocumentRecordAction({
                patient_id: patientId,
                title,
                category: category as any,
                file_name: file.name,
                file_path: filePath,
                file_size_bytes: file.size,
                mime_type: file.type
            });

            if (!res.success) throw new Error(res.error);

            toast.success("Documento enviado!");
            setOpen(false);
            setFile(null);
            setTitle("");
            onUploadComplete?.();

        } catch (err: any) {
            console.error(err);
            toast.error("Erro no upload: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#0F2B45] text-white gap-2"><UploadSimple size={18}/> Novo Documento</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upload de Documento</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Arquivo</Label>
                        <Input type="file" onChange={handleFileSelect} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Título</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: RG Digitalizado" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleUpload} disabled={uploading} className="w-full bg-[#D46F5D]">
                        {uploading ? "Enviando..." : "Confirmar Upload"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- TAB PRINCIPAL ---
export function TabDocuments({ patient }: { patient: FullPatientDetails }) {
    const documents = (patient as any).documents || []; // Assumindo que atualizamos patient.data.ts
    const [filter, setFilter] = useState('all');

    const filteredDocs = filter === 'all' 
        ? documents 
        : documents.filter((d: any) => d.category === filter);

    const expiredCount = documents.filter((doc: any) => {
        if (!doc?.expires_at) return false;
        const exp = new Date(doc.expires_at);
        return !Number.isNaN(exp.getTime()) && exp.getTime() < Date.now();
    }).length;

    const handleDownload = async (path: string) => {
        const res = await getDocumentUrlAction(path);
        if (res.success && res.url) {
            window.open(res.url, '_blank');
        } else {
            toast.error("Erro ao gerar link: " + res.error);
        }
    };

    const handleDelete = async (id: string, path: string) => {
        if (confirm("Tem certeza que deseja excluir este documento?")) {
            await deleteDocumentAction(id, path, patient.id);
            toast.success("Documento excluído.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 pb-20">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-md border border-slate-200 shadow-fluent p-2 space-y-2">
                    <p className="px-3 py-2 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Pastas Digitais</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-all border border-transparent",
                                filter === 'all'
                                    ? "bg-slate-50 text-[#0F2B45] border-l-4 border-l-[#0F2B45]"
                                    : "text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <FolderSimple size={18} weight={filter === 'all' ? 'fill' : 'regular'} />
                            Todos
                            <Badge variant="secondary" className="ml-auto bg-white">{documents.length}</Badge>
                        </button>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter(cat.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-all border border-transparent",
                                    filter === cat.id
                                        ? "bg-slate-50 text-[#0F2B45] border-l-4 border-l-[#0F2B45]"
                                        : "text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                <cat.icon size={18} weight={filter === cat.id ? 'fill' : 'regular'} />
                                {cat.label}
                            </button>
                                ))}
                    </div>

                    {expiredCount > 0 && (
                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 flex items-center gap-2">
                            <WarningCircle weight="fill" /> {expiredCount} documento{expiredCount > 1 ? 's' : ''} vencido{expiredCount > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#0F2B45] uppercase tracking-wide">
                        {filter === 'all' ? 'Todos os Documentos' : CATEGORIES.find(c => c.id === filter)?.label}
                    </h3>
                    <UploadDialog patientId={patient.id} />
                </div>

                {/* Área de upload rápida */}
                <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center bg-white hover:border-slate-300 transition">
                    <UploadSimple className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 mt-2">Arraste arquivos ou clique para selecionar</p>
                    <p className="text-xs text-slate-500">PDF, imagens ou outros formatos permitidos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredDocs.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-white">
                            <FolderSimple size={48} className="mx-auto text-slate-300 mb-2"/>
                            <p className="text-slate-500 font-medium">Nenhum documento encontrado.</p>
                            <p className="text-xs text-slate-400">Faça upload para começar.</p>
                        </div>
                    ) : (
                        filteredDocs.map((doc: any) => {
                            const expiresAt = doc.expires_at ? new Date(doc.expires_at) : null;
                            const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                            const visual = getFileIcon(doc.mime_type);
                            return (
                                <div key={doc.id} className="group bg-white border border-slate-200 rounded-lg p-4 shadow-fluent hover:shadow-fluent-hover transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg border", visual.color)}>
                                            <visual.icon size={20} weight="duotone" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate" title={doc.title}>{doc.title}</p>
                                            <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{formatFileSize(doc.file_size_bytes)}</Badge>
                                                {doc.is_verified ? 
                                                    <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle weight="fill"/> Validado</span> : 
                                                    <span className="text-[9px] text-amber-600 flex items-center gap-1 font-bold"><WarningCircle weight="fill"/> Pendente</span>
                                                }
                                                {expiresAt && (
                                                    <Badge variant={isExpired ? "destructive" : "secondary"} className="text-[9px] px-1 py-0 h-4">
                                                        {isExpired ? "Vencido" : `Válido até ${format(expiresAt, "dd/MM/yyyy")}`}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc.file_path)}>
                                                <DownloadSimple />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(doc.id, doc.file_path)}>
                                                <Trash />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                                        <span>{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}</span>
                                        <span className="uppercase font-semibold">{doc.category}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
