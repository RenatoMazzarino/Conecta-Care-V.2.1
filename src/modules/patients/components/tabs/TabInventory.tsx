'use client'

import { useState, useEffect } from "react";
import { FullPatientDetails } from "../../patient.data";
import { 
    getMasterInventoryAction, 
    upsertPatientItemAction, 
    deletePatientItemAction 
} from "../../actions.inventory";
import { MasterItemSelect, PatientInventoryDTO } from "@/data/definitions/inventory";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, Trash, QrCode, Tag, ArrowUUpLeft } from "@phosphor-icons/react";
import { format } from "date-fns";

// --- DIALOG DE ADICIONAR ITEM ---
type AddItemDialogProps = {
    patientId: string;
    masterItems: MasterItemSelect[];
    onSave: (data: PatientInventoryDTO) => Promise<void>;
};

type InventoryRecord = PatientInventoryDTO & {
    id: string;
    item?: { category?: string; name?: string };
};

function AddItemDialog({ patientId, masterItems, onSave }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [qty, setQty] = useState(1);
    const [serial, setSerial] = useState("");
    const [note, setNote] = useState("");

    // Encontra o item selecionado para saber se é rastreável (equipment)
    const selectedMaster = masterItems.find((i) => i.id === selectedItemId);
    const isTrackable = selectedMaster?.is_trackable;

    const handleSave = async () => {
        if (!selectedItemId) return toast.error("Selecione um item.");
        if (isTrackable && !serial) return toast.error("Número de série obrigatório para equipamentos.");

        const payload: PatientInventoryDTO = {
            patient_id: patientId,
            item_id: selectedItemId,
            current_quantity: qty,
            serial_number: serial,
            location_note: note,
            status: "active",
            installed_at: new Date()
        };

        await onSave(payload);
        setOpen(false);
        // Reset form
        setSelectedItemId("");
        setQty(1);
        setSerial("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-[#0F2B45] text-white"><Plus className="mr-2"/> Alocar Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Alocar Item ao Paciente</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Item do Catálogo</Label>
                        <Select onValueChange={setSelectedItemId} value={selectedItemId}>
                            <SelectTrigger><SelectValue placeholder="Buscar no catálogo..." /></SelectTrigger>
                            <SelectContent>
                                {masterItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} {item.brand ? `(${item.brand})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Quantidade</Label>
                            <Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
                        </div>
                        
                        {isTrackable && (
                            <div className="grid gap-2">
                                <Label className="text-blue-600 font-bold">Nº de Série / Patrimônio</Label>
                                <Input value={serial} onChange={e => setSerial(e.target.value)} placeholder="SN-123456" />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Local / Observação</Label>
                        <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Quarto, Mesa de cabeceira" />
                    </div>

                    <Button onClick={handleSave} className="w-full bg-[#D46F5D]">Confirmar Alocação</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function TabInventory({ patient }: { patient: FullPatientDetails }) {
    const inventory = (patient.inventory as InventoryRecord[] | undefined) || [];
    const [masterItems, setMasterItems] = useState<MasterItemSelect[]>([]);

    // Carrega o catálogo mestre ao montar a aba
    useEffect(() => {
        getMasterInventoryAction().then(setMasterItems);
    }, []);

    const handleSave = async (data: PatientInventoryDTO) => {
        const res = await upsertPatientItemAction(data);
        if (res.success) toast.success("Item alocado com sucesso!");
        else toast.error(res.error);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Devolver/Remover este item?")) {
            await deletePatientItemAction(id, patient.id);
            toast.success("Item removido.");
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white border border-slate-200 border-t-4 border-t-cyan-600 rounded-md shadow-fluent">
                <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cyan-800">
                        <Package size={18} /> Inventário no Domicílio
                    </CardTitle>
                    <AddItemDialog patientId={patient.id} masterItems={masterItems} onSave={handleSave} />
                </CardHeader>
                <CardContent className="p-0">
                    {inventory.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Package size={40} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum item alocado neste domicílio.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Item</th>
                                        <th className="px-4 py-3 text-left">Detalhes</th>
                                        <th className="px-4 py-3 text-left">Local</th>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${record.item?.category === 'equipment' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {record.item?.category === 'equipment' ? <QrCode size={18}/> : <Tag size={18}/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{record.item?.name || 'Item sem nome'}</p>
                                                        {record.serial_number && (
                                                            <Badge variant="outline" className="font-mono text-[10px] text-slate-600 mt-1">SN: {record.serial_number}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold">Qtd: {record.current_quantity}</span>
                                                    <span className="text-slate-500">{record.status === 'active' ? 'Em uso' : 'Devolvido'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600">
                                                {record.location_note || "Sem local definido"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600">
                                                {record.installed_at ? format(new Date(record.installed_at), 'dd/MM/yyyy') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs flex items-center gap-1"
                                                        onClick={() => handleDelete(record.id)}
                                                    >
                                                        <ArrowUUpLeft size={14} /> Devolver
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-300 hover:text-rose-500"
                                                        onClick={() => handleDelete(record.id)}
                                                    >
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
