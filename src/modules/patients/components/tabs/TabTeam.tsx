'use client'

import { useState } from "react";
import { FullPatientDetails } from "../../patient.data";
import { upsertTeamMemberAction, deleteTeamMemberAction, upsertContactAction, deleteContactAction } from "../../actions.upsertTeam";
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

// --- COMPONENTES DE UI ---

function TeamMemberCard({ member, onDelete }: any) {
    const initials = member.professional?.full_name?.substring(0, 2)?.toUpperCase() || "??";
    
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-slate-100">
                    <AvatarFallback className="text-[#0F2B45] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-[#0F2B45] text-sm flex items-center gap-2">
                        {member.professional?.full_name}
                        {member.is_primary && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 px-1.5"><Star weight="fill" className="mr-1"/> Focal</Badge>}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{member.role}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{member.professional?.contact_phone || "Sem telefone"}</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => onDelete(member.id)}>
                <Trash />
            </Button>
        </div>
    );
}

function ContactRow({ contact, onDelete }: any) {
    return (
        <div className="flex items-start justify-between p-4 border-b border-slate-100 last:border-0">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{contact.full_name}</p>
                    <Badge variant="outline" className="text-[10px] bg-slate-50">{contact.relation}</Badge>
                    {contact.is_legal_representative && <Badge className="text-[10px] bg-[#0F2B45] hover:bg-[#0F2B45]">Legal</Badge>}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone/> {contact.phone}</span>
                    {contact.email && <span className="flex items-center gap-1"><Envelope/> {contact.email}</span>}
                </div>
                <div className="flex gap-2 mt-2">
                    {contact.can_authorize_procedures && <span className="text-[10px] flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 rounded border border-emerald-100"><CheckCircle/> Autoriza Proc.</span>}
                    {contact.can_view_record && <span className="text-[10px] flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 rounded border border-blue-100"><FirstAid/> Acesso Pront.</span>}
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => onDelete(contact.id)}>
                <Trash size={14} />
            </Button>
        </div>
    );
}

// --- MODAL DE ADICIONAR CONTATO (SIMPLIFICADO PARA O EXEMPLO) ---
function AddContactDialog({ patientId, onSave }: any) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({ full_name: '', relation: '', phone: '', is_legal_representative: false });

    const handleSave = async () => {
        await onSave({ ...data, patient_id: patientId });
        setOpen(false);
        setData({ full_name: '', relation: '', phone: '', is_legal_representative: false });
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
    const contacts = patient.contacts || [];
    const team = patient.team || []; 

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
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* COLUNA ESQUERDA: EQUIPE TÉCNICA */}
                <div className="xl:col-span-7 space-y-6">
                    <Card className="shadow-fluent border-none">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                                <Users size={20} /> Equipe Multidisciplinar Fixa
                            </CardTitle>
                            <Button size="sm" className="bg-[#0F2B45] text-white h-8">
                                <Plus className="mr-2"/> Adicionar Profissional
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-3">
                            {team.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                                    <p>Nenhum profissional alocado fixamente.</p>
                                    <p className="text-xs">Use a busca para adicionar médicos, enfermeiros ou técnicos.</p>
                                </div>
                            ) : (
                                team.map((member: any) => (
                                    <TeamMemberCard key={member.id} member={member} onDelete={handleDeleteTeam} />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* COLUNA DIREITA: REDE DE APOIO */}
                <div className="xl:col-span-5 space-y-6">
                    <Card className="shadow-fluent border-none">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
                                <Phone size={20} /> Rede de Apoio & Emergência
                            </CardTitle>
                            <AddContactDialog patientId={patient.id} onSave={upsertContactAction} />
                        </CardHeader>
                        <CardContent className="p-0">
                            {contacts.length === 0 ? (
                                <p className="text-center py-8 text-slate-400">Nenhum contato cadastrado.</p>
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto">
                                    {contacts.map((contact: any) => (
                                        <ContactRow key={contact.id} contact={contact} onDelete={handleDeleteContact} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
