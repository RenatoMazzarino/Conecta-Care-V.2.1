'use client'

import { useState } from "react";
import { FullPatientDetails } from "../../patient.data";
import { deleteTeamMemberAction, upsertContactAction, deleteContactAction } from "../../actions.upsertTeam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Plus, Trash, Star, Phone, Envelope, CheckCircle, FirstAid } from "@phosphor-icons/react";
import { EmergencyContactDTO } from "@/data/definitions/team";

type TeamMemberRecord = {
    id: string;
    role?: string;
    is_primary?: boolean;
    professional?: {
        full_name?: string | null;
        contact_phone?: string | null;
    } | null;
};

type ContactRecord = EmergencyContactDTO & { id?: string };

// --- MODAL DE ADICIONAR CONTATO (SIMPLIFICADO PARA O EXEMPLO) ---
function AddContactDialog({ patientId, onSave }: { patientId: string; onSave: (data: EmergencyContactDTO) => Promise<{ success: boolean; error?: string }> }) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({ full_name: '', relation: '', phone: '', email: '', is_legal_representative: false });

    const handleSave = async () => {
        await onSave({
            patient_id: patientId,
            full_name: data.full_name,
            relation: data.relation,
            phone: data.phone,
            email: data.email ?? '',
            is_legal_representative: data.is_legal_representative,
            can_authorize_procedures: false,
            can_view_record: true,
        });
        setOpen(false);
        setData({ full_name: '', relation: '', phone: '', email: '', is_legal_representative: false });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="mr-2"/> Novo Contato</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Contato</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nome Completo</Label>
                        <Input value={data.full_name} onChange={e => setData({...data, full_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Parentesco</Label>
                            <Input value={data.relation} onChange={e => setData({...data, relation: e.target.value})} placeholder="Ex: Filho" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Telefone</Label>
                            <Input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="(00) 00000-0000" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded">
                        <Checkbox checked={data.is_legal_representative} onCheckedChange={(c) => setData({...data, is_legal_representative: !!c})} />
                        <Label>Responsável Legal (Assina pelo paciente)</Label>
                    </div>
                    <Button onClick={handleSave} className="w-full bg-[#D46F5D]">Salvar Contato</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function TabTeam({ patient }: { patient: FullPatientDetails }) {
    const contacts: ContactRecord[] = (patient.contacts as ContactRecord[]) || [];
    const team: TeamMemberRecord[] = (patient.team as TeamMemberRecord[]) || []; 

    const handleDeleteTeam = async (id: string) => {
        if (confirm("Remover este profissional da equipe?")) {
            await deleteTeamMemberAction(id, patient.id);
            toast.success("Profissional removido.");
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (confirm("Apagar este contato?")) {
            await deleteContactAction(id, patient.id);
            toast.success("Contato removido.");
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Equipe */}
            <div className="col-span-12 xl:col-span-7 space-y-4">
                <Card className="bg-white border border-slate-200 border-t-4 border-t-[#0F2B45] rounded-md shadow-fluent">
                    <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                            <Users size={18} /> Equipe Multidisciplinar
                        </CardTitle>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                            <Plus className="mr-2 h-3 w-3" /> Adicionar
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {team.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-md">
                                <p>Nenhum profissional alocado.</p>
                                <p className="text-xs">Inclua enfermeiros, técnicos ou médicos fixos.</p>
                            </div>
                        ) : (
                            team.map((member) => (
                                <div key={member.id} className="flex items-center justify-between px-3 py-3 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-slate-100">
                                            <AvatarFallback className="text-[#0F2B45] font-bold">
                                                {member.professional?.full_name?.substring(0, 2)?.toUpperCase() || "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-[#0F2B45] flex items-center gap-2">
                                                {member.professional?.full_name}
                                                {member.is_primary && (
                                                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 px-1.5">
                                                        <Star weight="fill" className="mr-1" /> Focal
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-[11px] font-semibold uppercase text-slate-500">{member.role}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500" onClick={() => handleDeleteTeam(member.id)}>
                                        <Trash size={16} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Contatos */}
            <div className="col-span-12 xl:col-span-5 space-y-4">
                <Card className="bg-white border border-slate-200 border-t-4 border-t-emerald-600 rounded-md shadow-fluent">
                    <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
                            <Phone size={18} /> Rede de Apoio & Emergência
                        </CardTitle>
                        <AddContactDialog patientId={patient.id} onSave={upsertContactAction} />
                    </CardHeader>
                    <CardContent className="p-0">
                        {contacts.length === 0 ? (
                            <p className="text-center py-8 text-slate-400">Nenhum contato cadastrado.</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {contacts.map((contact) => (
                                    <div key={contact.id || contact.full_name} className="flex items-start justify-between px-4 py-3 hover:bg-slate-50 transition">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900">{contact.full_name}</p>
                                                <Badge variant="outline" className="text-[10px] bg-slate-50">{contact.relation}</Badge>
                                                {contact.is_legal_representative && (
                                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                        <CheckCircle weight="fill" /> Legal
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Phone /> {contact.phone}</span>
                                                {contact.email && <span className="flex items-center gap-1"><Envelope /> {contact.email}</span>}
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                {contact.can_authorize_procedures && (
                                                    <span className="text-[10px] flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 rounded border border-emerald-100">
                                                        <CheckCircle /> Autoriza Proc.
                                                    </span>
                                                )}
                                                {contact.can_view_record && (
                                                    <span className="text-[10px] flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 rounded border border-blue-100">
                                                        <FirstAid /> Acesso Pront.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => contact.id && handleDeleteContact(contact.id)} disabled={!contact.id}>
                                            <Trash size={14} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
