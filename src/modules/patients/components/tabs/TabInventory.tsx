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
import { Package, Plus, Trash, QrCode, Tag, Calendar } from "@phosphor-icons/react";
import { format } from "date-fns";

// --- DIALOG DE ADICIONAR ITEM ---
function AddItemDialog({ patientId, masterItems, onSave }: any) {
    const [open, setOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [qty, setQty] = useState(1);
    const [serial, setSerial] = useState("");
    const [note, setNote] = useState("");

    // Encontra o item selecionado para saber se é rastreável (equipment)
    const selectedMaster = masterItems.find((i: any) => i.id === selectedItemId);
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
                                {masterItems.map((item: any) => (
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
    const inventory = (patient as any).inventory || [];
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
            <Card className="shadow-fluent border-none">
                <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                        <Package size={20} /> Inventário no Domicílio
                    </CardTitle>
                    <AddItemDialog patientId={patient.id} masterItems={masterItems} onSave={handleSave} />
                </CardHeader>
                <CardContent className="p-0">
                    {inventory.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Package size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>Nenhum item alocado neste domicílio.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {inventory.map((record: any) => (
                                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${record.item?.category === 'equipment' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {record.item?.category === 'equipment' ? <QrCode size={20}/> : <Tag size={20}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                {record.item?.name || 'Item sem nome'}
                                                {record.serial_number && <Badge variant="outline" className="font-mono text-[10px] text-slate-500">SN: {record.serial_number}</Badge>}
                                            </p>
                                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                <span className="font-semibold">Qtd: {record.current_quantity}</span>
                                                <span>•</span>
                                                <span>{record.location_note || "Sem local definido"}</span>
                                                {record.installed_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Calendar size={12}/> {format(new Date(record.installed_at), 'dd/MM/yyyy')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Badge className={record.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}>
                                            {record.status === 'active' ? 'Em Uso' : 'Devolvido'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => handleDelete(record.id)}>
                                            <Trash />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
