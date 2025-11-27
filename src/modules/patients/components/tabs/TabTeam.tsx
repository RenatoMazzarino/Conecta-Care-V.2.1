'use client';

import { useMemo, useState } from "react";
import { FullPatientDetails, PatientRelatedPersonRecord, CareTeamMemberRecord } from "../../patient.data";
import { upsertRelatedPerson, deleteRelatedPerson, upsertTeamMember, deleteTeamMember } from "@/app/(app)/patients/actions.support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Plus,
  IdentificationCard,
  Siren,
  Wallet,
  ShieldCheck,
  Megaphone,
  WhatsappLogo,
  Phone,
  Envelope,
  Crown,
  Trash,
} from "@phosphor-icons/react";

type PersonForm = {
  id?: string;
  fullName: string;
  relation?: string;
  contactType?: string;
  priorityOrder?: number;
  phonePrimary?: string;
  phoneSecondary?: string;
  isWhatsapp?: boolean;
  email?: string;
  isLegalGuardian?: boolean;
  isFinancialResponsible?: boolean;
  isEmergencyContact?: boolean;
  canAuthorizeProcedures?: boolean;
  canAuthorizeFinancial?: boolean;
  livesWithPatient?: string;
  hasKeys?: boolean;
  contactWindow?: string;
  preferredContact?: string;
  receiveUpdates?: boolean;
  receiveAdmin?: boolean;
  optOutMarketing?: boolean;
  cpf?: string;
  birthDate?: string;
  rg?: string;
  rgIssuer?: string;
  rgState?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  notes?: string;
};

function RelatedPersonSheet({ patientId, defaultValues, onSaved }: { patientId: string; defaultValues?: PersonForm; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PersonForm>(
    defaultValues || {
      fullName: "",
      relation: "",
      priorityOrder: 1,
      isEmergencyContact: true,
      isWhatsapp: true,
    }
  );

  const handleSave = async () => {
    setSaving(true);
    const res = await upsertRelatedPerson({
      id: form.id,
      patientId,
      fullName: form.fullName,
      relation: form.relation,
      priorityOrder: form.priorityOrder,
      phonePrimary: form.phonePrimary,
      phoneSecondary: form.phoneSecondary,
      isWhatsapp: !!form.isWhatsapp,
      email: form.email,
      isLegalGuardian: !!form.isLegalGuardian,
      isFinancialResponsible: !!form.isFinancialResponsible,
      isEmergencyContact: !!form.isEmergencyContact,
      canAccessRecords: true,
      canAuthorizeProcedures: !!form.canAuthorizeProcedures,
      canAuthorizeFinancial: !!form.canAuthorizeFinancial,
      livesWithPatient: form.livesWithPatient as any,
      hasKeys: !!form.hasKeys,
      contactWindow: form.contactWindow,
      preferredContact: form.preferredContact,
      receiveUpdates: !!form.receiveUpdates,
      receiveAdmin: !!form.receiveAdmin,
      optOutMarketing: !!form.optOutMarketing,
      cpf: form.cpf,
      birthDate: form.birthDate,
      rg: form.rg,
      rgIssuer: form.rgIssuer,
      rgState: form.rgState,
      addressStreet: form.addressStreet,
      addressCity: form.addressCity,
      addressState: form.addressState,
      notes: form.notes,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.error || "Erro ao salvar contato");
    toast.success("Contato salvo");
    setOpen(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-2" /> Novo contato</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{form.id ? "Editar contato" : "Novo contato"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500">Identificação</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome completo</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Grau de parentesco</Label>
                <Input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="Filho, irmã..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Input type="number" value={form.priorityOrder ?? ""} onChange={(e) => setForm({ ...form, priorityOrder: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Tipo de vínculo</Label>
                <Select value={form.contactType} onValueChange={(v) => setForm({ ...form, contactType: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Responsável legal</SelectItem>
                    <SelectItem value="financeiro">Responsável financeiro</SelectItem>
                    <SelectItem value="emergencia">Emergência 24h</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="cuidador">Cuidador/Acompanhante</SelectItem>
                    <SelectItem value="vizinho">Vizinho/Síndico</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Mora com paciente?</Label>
                <Select value={form.livesWithPatient} onValueChange={(v) => setForm({ ...form, livesWithPatient: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="visita_frequente">Visita frequente</SelectItem>
                    <SelectItem value="visita_eventual">Visita eventual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500">Contato</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Celular</Label>
                <Input value={form.phonePrimary || ""} onChange={(e) => setForm({ ...form, phonePrimary: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox checked={!!form.isWhatsapp} onCheckedChange={(c) => setForm({ ...form, isWhatsapp: !!c })} />
                <Label>É WhatsApp?</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Telefone secundário</Label>
                <Input value={form.phoneSecondary || ""} onChange={(e) => setForm({ ...form, phoneSecondary: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Horário preferencial</Label>
                <Input value={form.contactWindow || ""} onChange={(e) => setForm({ ...form, contactWindow: e.target.value })} placeholder="Manhã/Tarde/Noite" />
              </div>
              <div className="space-y-1">
                <Label>Canal preferido</Label>
                <Input value={form.preferredContact || ""} onChange={(e) => setForm({ ...form, preferredContact: e.target.value })} placeholder="WhatsApp, telefone..." />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500">Dados civis (para responsáveis)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>CPF</Label>
                <Input value={form.cpf || ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>RG</Label>
                <Input value={form.rg || ""} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Orgão emissor</Label>
                <Input value={form.rgIssuer || ""} onChange={(e) => setForm({ ...form, rgIssuer: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>UF RG</Label>
                <Input value={form.rgState || ""} onChange={(e) => setForm({ ...form, rgState: e.target.value })} maxLength={2} />
              </div>
              <div className="space-y-1">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.birthDate || ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tem chaves?</Label>
                <Checkbox checked={!!form.hasKeys} onCheckedChange={(c) => setForm({ ...form, hasKeys: !!c })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input value={form.addressStreet || ""} onChange={(e) => setForm({ ...form, addressStreet: e.target.value })} placeholder="Rua, número" />
              </div>
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input value={form.addressCity || ""} onChange={(e) => setForm({ ...form, addressCity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>UF</Label>
                <Input value={form.addressState || ""} onChange={(e) => setForm({ ...form, addressState: e.target.value })} maxLength={2} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500">Autorizações e LGPD</h4>
            <div className="space-y-2 rounded border p-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.canAuthorizeProcedures} onCheckedChange={(c) => setForm({ ...form, canAuthorizeProcedures: !!c })} />
                <span>Autoriza decisões clínicas</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.canAuthorizeFinancial} onCheckedChange={(c) => setForm({ ...form, canAuthorizeFinancial: !!c })} />
                <span>Autoriza decisões financeiras</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.receiveUpdates} onCheckedChange={(c) => setForm({ ...form, receiveUpdates: !!c })} />
                <span>Recebe atualizações do paciente</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.receiveAdmin} onCheckedChange={(c) => setForm({ ...form, receiveAdmin: !!c })} />
                <span>Recebe notificações administrativas</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.optOutMarketing} onCheckedChange={(c) => setForm({ ...form, optOutMarketing: !!c })} />
                <span>Não receber comunicações de marketing</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: Não discutir finanças com este contato." />
          </div>
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#0F2B45] text-white">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type TeamForm = {
  id?: string;
  professionalId: string;
  role: string;
  professionalCategory?: string;
  caseRole?: string;
  regime: string;
  employmentType?: string;
  shiftSummary?: string;
  contactPhone?: string;
  contactEmail?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  isTechnicalResponsible?: boolean;
  isFamilyFocalPoint?: boolean;
  isPrimary?: boolean;
  notes?: string;
};

function TeamMemberSheet({ patientId, defaultValues, onSaved }: { patientId: string; defaultValues?: TeamForm; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TeamForm>(
    defaultValues || {
      professionalId: "",
      role: "",
      regime: "Plantão",
      status: "active",
    }
  );

  const handleSave = async () => {
    setSaving(true);
    const res = await upsertTeamMember({
      id: form.id,
      patientId,
      professionalId: form.professionalId,
      role: form.role || "Profissional",
      professionalCategory: form.professionalCategory,
      caseRole: form.caseRole,
      regime: form.regime as any,
      status: form.status as any,
      employmentType: form.employmentType,
      shiftSummary: form.shiftSummary,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
      startDate: form.startDate,
      endDate: form.endDate,
      isTechnicalResponsible: !!form.isTechnicalResponsible,
      isFamilyFocalPoint: !!form.isFamilyFocalPoint,
      isPrimary: !!form.isPrimary,
      notes: form.notes,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.error || "Erro ao salvar profissional");
    toast.success("Profissional vinculado");
    setOpen(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Adicionar profissional</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{form.id ? "Editar profissional" : "Adicionar profissional"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>ID do profissional</Label>
              <Input value={form.professionalId} onChange={(e) => setForm({ ...form, professionalId: e.target.value })} placeholder="Selecione da base" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.professionalCategory || ""} onChange={(e) => setForm({ ...form, professionalCategory: e.target.value })} placeholder="Enf, Médico, Fisio..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Função no caso</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Enf. referência, Médico resp., ..." />
            </div>
            <div className="space-y-1">
              <Label>Papel detalhado</Label>
              <Input value={form.caseRole || ""} onChange={(e) => setForm({ ...form, caseRole: e.target.value })} placeholder="Sobreaviso, apoio..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Regime</Label>
              <Select value={form.regime} onValueChange={(v) => setForm({ ...form, regime: v })}>
                <SelectTrigger><SelectValue placeholder="Regime" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Plantão">Plantão</SelectItem>
                  <SelectItem value="Sobreaviso">Sobreaviso</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Vínculo</Label>
              <Input value={form.employmentType || ""} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} placeholder="CLT, PJ, Coop..." />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="away">Afastado</SelectItem>
                  <SelectItem value="closed">Encerrado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Janela/escala resumida</Label>
              <Input value={form.shiftSummary || ""} onChange={(e) => setForm({ ...form, shiftSummary: e.target.value })} placeholder="Seg-Sex 7h-13h, plantões noturnos..." />
            </div>
            <div className="space-y-1">
              <Label>Referência técnica?</Label>
              <Checkbox checked={!!form.isTechnicalResponsible} onCheckedChange={(c) => setForm({ ...form, isTechnicalResponsible: !!c })} />
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded p-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <Checkbox checked={!!form.isFamilyFocalPoint} onCheckedChange={(c) => setForm({ ...form, isFamilyFocalPoint: !!c })} />
              <span>Ponto focal da família</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={!!form.isPrimary} onCheckedChange={(c) => setForm({ ...form, isPrimary: !!c })} />
              <span>Profissional de referência</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início no caso</Label>
              <Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Fim (se encerrado)</Label>
              <Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={form.contactPhone || ""} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.contactEmail || ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#0F2B45] text-white">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function initials(name?: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export function TabTeam({ patient }: { patient: FullPatientDetails }) {
  const related = (patient.related_persons as PatientRelatedPersonRecord[]) || [];
  const team = (patient.team as CareTeamMemberRecord[]) || [];

  const legal = related.filter((r) => r.is_legal_guardian || r.is_financial_responsible);
  const emergency = related.filter((r) => r.is_emergency_contact).sort((a, b) => (a.priority_order || 99) - (b.priority_order || 99));
  const others = related.filter((r) => !legal.includes(r) && !emergency.includes(r));

  const refresh = () => window.location.reload();

  const columnsTeam = useMemo(() => team, [team]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equipe profissional */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#0F2B45]">
              <Users className="w-5 h-5" /> Equipe Multidisciplinar
            </CardTitle>
            <CardDescription>Profissionais fixos, plantonistas e responsáveis técnicos.</CardDescription>
          </div>
          <TeamMemberSheet patientId={patient.id} onSaved={refresh} />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {columnsTeam.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-md text-slate-500">
              Nenhum profissional alocado. Adicione enfermeiros ou médicos fixos.
            </div>
          ) : (
            columnsTeam.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border">
                    <span className="text-sm font-semibold text-slate-700">{initials(m.professional?.full_name)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{m.professional?.full_name || "Profissional"}</span>
                      {m.is_technical_responsible && <Badge className="bg-indigo-100 text-indigo-800 text-[10px] flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> RT</Badge>}
                      {m.is_family_focal_point && <Badge className="bg-emerald-100 text-emerald-800 text-[10px] flex items-center gap-1"><Megaphone className="w-3 h-3" /> Focal</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Badge variant="outline" className="text-[10px]">{m.professional_category || "Categoria"}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{m.role || "Função"}</Badge>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{m.regime || "Regime"}</span>
                      {m.shift_summary && <span className="text-[10px] text-slate-500">{m.shift_summary}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${m.status === 'active' ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                    {m.status === 'active' ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => m.id && deleteTeamMember(m.id).then(refresh)}>
                    <Trash className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rede de apoio */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#0F2B45]">
              <IdentificationCard className="w-5 h-5" /> Rede de Apoio & Emergência
            </CardTitle>
            <CardDescription>Decisores, emergência 24h e demais contatos.</CardDescription>
          </div>
          <RelatedPersonSheet patientId={patient.id} onSaved={refresh} />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Decisores */}
          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Wallet className="w-4 h-4" /> Decisores (Legal/Financeiro)
            </div>
            {legal.length === 0 ? (
              <div className="text-sm text-amber-800">Nenhum responsável cadastrado.</div>
            ) : (
              legal.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-amber-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{p.full_name}</span>
                      {p.relation && <Badge variant="outline" className="text-[10px]">{p.relation}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-4 h-4" /> {p.phone_primary || "Sem telefone"}
                      {p.is_whatsapp && <WhatsappLogo className="w-4 h-4 text-emerald-600" />}
                      {p.email && <>· <Envelope className="w-4 h-4" /> {p.email}</>}
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      {p.can_authorize_procedures && <Badge className="bg-blue-100 text-blue-800">Autoriza Clínico</Badge>}
                      {p.can_authorize_financial && <Badge className="bg-emerald-100 text-emerald-800">Autoriza Financeiro</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => p.id && deleteRelatedPerson(p.id).then(refresh)}>
                    <Trash className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Emergência */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2B45]">
              <Siren className="w-4 h-4" /> Emergência 24h
            </div>
            {emergency.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum contato de emergência 24h cadastrado.</p>
            ) : (
              emergency.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{p.full_name}</span>
                      {p.priority_order && <Badge variant="secondary" className="text-[10px]">Prioridade {p.priority_order}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-4 h-4" /> <strong>{p.phone_primary || "Sem telefone"}</strong>
                      {p.is_whatsapp && <WhatsappLogo className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => p.id && deleteRelatedPerson(p.id).then(refresh)}>
                    <Trash className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Outros */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Crown className="w-4 h-4" /> Outros contatos
            </div>
            {others.length === 0 ? (
              <p className="text-xs text-slate-500">Sem contatos adicionais.</p>
            ) : (
              <div className="space-y-2">
                {others.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{p.full_name}</span>
                        {p.relation && <Badge variant="outline" className="text-[10px]">{p.relation}</Badge>}
                        {p.lives_with_patient && <Badge variant="secondary" className="text-[10px]">{p.lives_with_patient}</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {p.phone_primary || "Sem telefone"}
                        {p.is_whatsapp && <WhatsappLogo className="w-4 h-4 text-emerald-600" />}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => p.id && deleteRelatedPerson(p.id).then(refresh)}>
                      <Trash className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
