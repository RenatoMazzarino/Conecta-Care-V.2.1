'use client';

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientAdminInfoZ, PatientAdminInfoForm } from "@/schemas/patient.adminInfo";
import { upsertAdministrativeAction } from "../../actions.upsertAdministrative";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, ShieldCheck, ListChecks, ClipboardText } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";

const fetcher = (url: string) => fetch(url).then(r => r.json());
const dateStr = (v?: string | null) => (v ? v.split("T")[0] : "");
const todayIso = () => new Date().toISOString().slice(0, 10);

type DocLinkProps = {
  name: keyof PatientAdminInfoForm;
  docs: any[];
  label: string;
  form: any;
};

function ChecklistItem({ name, dateName, byName, label, form }: { name: keyof PatientAdminInfoForm; dateName: keyof PatientAdminInfoForm; byName: keyof PatientAdminInfoForm; label: string; form: any; }) {
  const checked = form.watch(name as any);
  return (
    <div className="flex items-start justify-between rounded border border-slate-100 px-3 py-2 bg-white">
      <div className="space-y-1">
        <FormField control={form.control} name={name as any} render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox checked={!!field.value} onCheckedChange={(c) => {
              field.onChange(!!c);
              if (!form.getValues(dateName as any) && !!c) form.setValue(dateName as any, todayIso());
            }} />
            <span className="text-sm font-semibold text-slate-800">{label}</span>
          </div>
        )} />
        {checked && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <FormField control={form.control} name={dateName as any} render={({ field }) => (
              <FormItem className="flex items-center gap-1">
                <FormLabel className="text-[11px]">Data</FormLabel>
                <FormControl><Input type="date" className="h-8" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name={byName as any} render={({ field }) => (
              <FormItem className="flex items-center gap-1">
                <FormLabel className="text-[11px]">Usuário</FormLabel>
                <FormControl><Input className="h-8" {...field} /></FormControl>
              </FormItem>
            )} />
            {form.getValues(dateName as any) && (
              <span className="text-emerald-700 font-semibold">Validado em {form.getValues(dateName as any)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DocLink({ name, docs, label, form }: DocLinkProps) {
  return (
    <FormField control={form.control} name={name as any} render={({ field }) => (
      <FormItem className="flex flex-col gap-1">
        <FormLabel className="text-[11px]">{label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar documento" /></SelectTrigger></FormControl>
          <SelectContent>
            {docs.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.title || d.name || d.file_name || d.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>
    )} />
  );
}

export function TabAdministrative({ patient }: { patient: FullPatientDetails }) {
  const admin = (patient.admin_info?.[0] as any) || {};
  const clinical: any = patient.clinical?.[0] || {};
  const relatedPersons = patient.related_persons || [];
  const addresses = (patient.address as any) || [];
  const documents = (patient.documents as any) || [];
  const [payerMode, setPayerMode] = useState<"pf" | "pj">((admin.primary_payer_related_person_id && "pf") || "pj");

  const { data: professionalsData } = useSWR("/api/professionals", fetcher);
  const professionals = professionalsData?.data || [];

  const form = useForm<PatientAdminInfoForm>({
    resolver: zodResolver(PatientAdminInfoZ) as any,
    defaultValues: {
      patient_id: patient.id,
      tenant_id: (patient as any).tenant_id || "",
      status: admin.status || "",
      status_reason: admin.status_reason || "",
      status_changed_at: dateStr(admin.status_changed_at),
      contractStatusEnum: admin.contract_status_enum || "",
      admissionType: admin.admission_type || undefined,
      demandOrigin: admin.demand_origin || undefined,
      demandOriginDescription: admin.demand_origin_description || "",
      primaryPayerType: admin.primary_payer_type || "",
      startDate: dateStr(admin.start_date),
      endDate: dateStr(admin.end_date),
      effectiveDischargeDate: dateStr(admin.effective_discharge_date),
      contractStartDate: dateStr(admin.contract_start_date),
      contractEndDate: dateStr(admin.contract_end_date),
      renewalType: admin.renewal_type || undefined,
      contractId: admin.contract_id || "",
      externalContractId: admin.external_contract_id || "",
      authorizationNumber: admin.authorization_number || "",
      judicialCaseNumber: admin.judicial_case_number || "",
      officialLetterNumber: admin.official_letter_number || "",
      contractStatusReason: admin.contract_status_reason || "",
      adminNotes: admin.admin_notes || "",
      costCenterId: admin.cost_center_id || "",
      erpCaseCode: admin.erp_case_code || "",
      contractCategory: admin.contract_category || undefined,
      acquisitionChannel: admin.acquisition_channel || "",
      servicePackageName: admin.service_package_name || "",
      servicePackageDescription: admin.service_package_description || "",
      supervisorId: admin.supervisor_id || "",
      escalistaId: admin.escalista_id || "",
      commercialResponsibleId: admin.commercial_responsible_id || "",
      contractManagerId: admin.contract_manager_id || "",
      payerAdminContactId: admin.payer_admin_contact_id || "",
      payerAdminContactDescription: admin.payer_admin_contact_description || "",
      primaryPayerRelatedPersonId: admin.primary_payer_related_person_id || "",
      primaryPayerLegalEntityId: admin.primary_payer_legal_entity_id || "",
      primaryPayerDescription: admin.primary_payer_description || "",
      primaryPayerType: admin.primary_payer_type || "PessoaFisica",
      frequency: admin.frequency || "",
      scaleModel: admin.scale_model || undefined,
      scaleMode: admin.scale_mode || "",
      shiftModality: admin.shift_modality || undefined,
      baseProfessionalCategory: admin.base_professional_category || undefined,
      quantityPerShift: admin.quantity_per_shift ?? undefined,
      weeklyHoursExpected: admin.weekly_hours_expected ?? undefined,
      dayShiftStart: admin.day_shift_start || "",
      nightShiftStart: admin.night_shift_start || "",
      dayShiftEnd: admin.day_shift_end || "",
      nightShiftEnd: admin.night_shift_end || "",
      referenceLocationId: admin.reference_location_id || "",
      includesWeekends: admin.includes_weekends ?? false,
      holidayRule: admin.holiday_rule || "",
      autoGenerateScale: admin.auto_generate_scale ?? false,
      scaleRuleStartDate: dateStr(admin.scale_rule_start_date),
      scaleRuleEndDate: dateStr(admin.scale_rule_end_date),
      scaleNotes: admin.scale_notes || "",
      chkContractOk: admin.chk_contract_ok || false,
      chkContractAt: dateStr(admin.chk_contract_at),
      chkContractBy: admin.chk_contract_by || "",
      chkConsentOk: admin.chk_consent_ok || false,
      chkConsentAt: dateStr(admin.chk_consent_at),
      chkConsentBy: admin.chk_consent_by || "",
      chkMedicalReportOk: admin.chk_medical_report_ok || false,
      chkMedicalReportAt: dateStr(admin.chk_medical_report_at),
      chkMedicalReportBy: admin.chk_medical_report_by || "",
      chkAddressProofOk: admin.chk_address_proof_ok || false,
      chkLegalGuardianDocsOk: admin.chk_legal_guardian_docs_ok || false,
      chkFinancialResponsibleDocsOk: admin.chk_financial_responsible_docs_ok || false,
      chkOtherDocsOk: admin.chk_other_docs_ok || false,
      chkOtherDocsDesc: admin.chk_other_docs_desc || "",
      chkAddressProofAt: dateStr(admin.chk_address_proof_at),
      chkAddressProofBy: admin.chk_address_proof_by || "",
      chkLegalGuardianDocsAt: dateStr(admin.chk_legal_guardian_docs_at),
      chkLegalGuardianDocsBy: admin.chk_legal_guardian_docs_by || "",
      chkFinancialResponsibleDocsAt: dateStr(admin.chk_financial_responsible_docs_at),
      chkFinancialResponsibleDocsBy: admin.chk_financial_responsible_docs_by || "",
      chkOtherDocsAt: dateStr(admin.chk_other_docs_at),
      chkOtherDocsBy: admin.chk_other_docs_by || "",
      chkContractDocId: admin.chk_contract_doc_id || "",
      chkConsentDocId: admin.chk_consent_doc_id || "",
      chkMedicalReportDocId: admin.chk_medical_report_doc_id || "",
      chkAddressProofDocId: admin.chk_address_proof_doc_id || "",
      chkLegalDocsDocId: admin.chk_legal_docs_doc_id || "",
      chkFinancialDocsDocId: admin.chk_financial_docs_doc_id || "",
      chkJudicialDocId: admin.chk_judicial_doc_id || "",
      chkJudicialAt: dateStr(admin.chk_judicial_at),
      chkJudicialBy: admin.chk_judicial_by || "",
      checklistComplete: admin.checklist_complete || false,
      checklistNotes: admin.checklist_notes || "",
      checklistNotesDetailed: admin.checklist_notes_detailed || "",
    }
  });

  async function onSubmit(data: PatientAdminInfoForm) {
    const res = await upsertAdministrativeAction(data);
    if (res.success) toast.success("Dados administrativos atualizados!");
    else toast.error(res.error);
  }

  const professionalOptions = useMemo(() => (professionals || []).map((p: any) => ({ id: p.id, name: p.full_name || p.name })), [professionals]);
  const payerRelatedId = form.watch("primaryPayerRelatedPersonId");
  const payerNameDisplay = useMemo(() => {
    if (form.watch("primaryPayerType") === "PessoaFisica") {
      const person = relatedPersons.find((r: any) => r.id === payerRelatedId);
      return person ? `${person.full_name || person.name} (PF)` : "Selecione uma pessoa...";
    }
    const desc = form.watch("primaryPayerDescription");
    const type = form.watch("primaryPayerType");
    return desc ? `${desc} (${type})` : "Digite a Razão Social/Operadora...";
  }, [payerRelatedId, relatedPersons, form]);
  const cidCode = clinical.cid_main || clinical.diagnosis_main;
  const cidDesc = clinical.primary_diagnosis_description || "";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-16">

        <div className="xl:col-span-2 space-y-6">

          {/* Card Origem & Pagador */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Calendar /> Origem & Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="demandOrigin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem Demanda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Particular">Particular</SelectItem>
                        <SelectItem value="OperadoraSaude">Operadora</SelectItem>
                        <SelectItem value="SUS">SUS</SelectItem>
                        <SelectItem value="Empresa">Empresa</SelectItem>
                        <SelectItem value="Judicial">Judicial</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="demandOriginDescription" render={({ field }) => (
                  <FormItem><FormLabel>Descrição Origem</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="acquisitionChannel" render={({ field }) => (
                  <FormItem><FormLabel>Canal Entrada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="primaryPayerType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagador *</FormLabel>
                    <Select onValueChange={(v)=>{field.onChange(v); setPayerMode(v === "PessoaFisica" ? "pf" : "pj");}} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PessoaFisica">Pessoa Física</SelectItem>
                        <SelectItem value="Operadora">Operadora</SelectItem>
                        <SelectItem value="Empresa">Empresa</SelectItem>
                        <SelectItem value="OrgaoPublico">Órgão Público</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <Label>Modo de Pagador</Label>
                  <div className="flex gap-6 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={payerMode === "pf"} onChange={()=>setPayerMode("pf")} />
                      Pessoa Física
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={payerMode === "pj"} onChange={()=>setPayerMode("pj")} />
                      Jurídica / Operadora
                    </label>
                  </div>
                </div>
                {payerMode === "pf" ? (
                  <FormField control={form.control} name="primaryPayerRelatedPersonId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagador Principal (PF)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione contato" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {relatedPersons.map((rp: any) => (
                          <SelectItem key={rp.id} value={rp.id}>{rp.full_name || rp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {payerName && <p className="text-xs text-slate-500 mt-1">Nome: {payerName}</p>}
                  </FormItem>
                )} />
              ) : (
              <>
                <FormField control={form.control} name="primaryPayerLegalEntityId" render={({ field }) => (
                  <FormItem><FormLabel>Pagador Principal (PJ)</FormLabel><FormControl><Input {...field} placeholder="Operadora/Empresa" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="primaryPayerDescription" render={({ field }) => (
                    <FormItem><FormLabel>Descrição Pagador</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </>
                )}
                <div className="md:col-span-2 text-sm text-muted-foreground border rounded-md px-3 py-2 bg-slate-50">
                  Pagador Atual: <span className="font-semibold text-slate-700">{payerNameDisplay}</span>
                </div>
                <FormField control={form.control} name="payerAdminContactId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato Administrativo (Pagador)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione contato" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {relatedPersons.map((rp: any) => (
                          <SelectItem key={rp.id} value={rp.id}>{rp.full_name || rp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="payerAdminContactDescription" render={({ field }) => (
                  <FormItem><FormLabel>Descrição do Contato Admin</FormLabel><FormControl><Input {...field} placeholder="RH, setor de autorização..." /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="costCenterId" render={({ field }) => (
                  <FormItem><FormLabel>Centro de Custo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="erpCaseCode" render={({ field }) => (
                  <FormItem><FormLabel>Código ERP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {["supervisorId","escalistaId","commercialResponsibleId","contractManagerId"].map((field, idx) => (
                  <FormField key={field} control={form.control} name={field as any} render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{["Supervisor Técnico","Escalista","Resp. Comercial","Gestor Contrato"][idx]}</FormLabel>
                      <Select onValueChange={f.onChange} defaultValue={f.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione profissional" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {professionalOptions.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card Contrato & Vigência */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Calendar /> Contrato & Vigência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Data de Admissão *</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>Prev. Alta</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="effectiveDischargeDate" render={({ field }) => (
                  <FormItem><FormLabel>Alta Efetiva</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="admissionType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Admissão *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Internacao_Domiciliar">Internação domiciliar</SelectItem>
                        <SelectItem value="Cuidados_Paliativos">Cuidados paliativos</SelectItem>
                        <SelectItem value="Assistencia_Ventilatoria">Assistência ventilatória</SelectItem>
                        <SelectItem value="Reabilitacao">Reabilitação</SelectItem>
                        <SelectItem value="Procedimento_Pontual">Procedimento pontual</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="contractCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Particular_Premium">Particular Premium</SelectItem>
                        <SelectItem value="Convenio_Padrao">Convênio</SelectItem>
                        <SelectItem value="Judicial">Judicial</SelectItem>
                        <SelectItem value="SUS">SUS</SelectItem>
                        <SelectItem value="Cortesia">Cortesia</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="contractStatusEnum" render={({ field }) => (
                  <FormItem><FormLabel>Status do Contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Proposta">Proposta</SelectItem>
                        <SelectItem value="Em_Implantacao">Em implantação</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                        <SelectItem value="Encerrado">Encerrado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                        <SelectItem value="Recusado">Recusado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="servicePackageName" render={({ field }) => (
                  <FormItem><FormLabel>Pacote Contratado</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="servicePackageDescription" render={({ field }) => (
                  <FormItem><FormLabel>Descrição do Pacote</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="contractStartDate" render={({ field }) => (
                  <FormItem><FormLabel>Início Vigência</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="contractEndDate" render={({ field }) => (
                  <FormItem><FormLabel>Fim Vigência</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="renewalType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Renovação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Automatica">Automática</SelectItem>
                        <SelectItem value="Periodo_Fixo">Período fixo</SelectItem>
                        <SelectItem value="Por_Laudo">Por laudo</SelectItem>
                        <SelectItem value="Judicial">Judicial</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="contractId" render={({ field }) => (
                  <FormItem><FormLabel>ID Interno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="externalContractId" render={({ field }) => (
                  <FormItem><FormLabel>ID Externo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="authorizationNumber" render={({ field }) => (
                  <FormItem><FormLabel>Senha TISS</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="judicialCaseNumber" render={({ field }) => (
                  <FormItem><FormLabel>Nº Processo Judicial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="officialLetterNumber" render={({ field }) => (
                  <FormItem><FormLabel>Nº Ofício/Solicitação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="status_changed_at" render={({ field }) => (
                  <FormItem><FormLabel>Data Mudança Status</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="contractStatusReason" render={({ field }) => (
                <FormItem><FormLabel>Motivo do Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="adminNotes" render={({ field }) => (
                <FormItem><FormLabel>Observações Administrativas</FormLabel><FormControl><Textarea {...field} placeholder="Ouvidoria, casos sensíveis..." /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">

          {/* Card Regras Operacionais */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ClipboardText /> Regras Operacionais</CardTitle>
              <CardDescription>Configurações base da escala.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="scaleModel" render={({ field }) => (
                  <FormItem><FormLabel>Modelo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="12x36">12x36</SelectItem>
                        <SelectItem value="24x48">24x48</SelectItem>
                        <SelectItem value="Visita">Visita</SelectItem>
                        <SelectItem value="Plantao_Avulso">Plantão avulso</SelectItem>
                        <SelectItem value="Semanal_5x2">5x2</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="shiftModality" render={({ field }) => (
                  <FormItem><FormLabel>Modalidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Continuo">Contínuo</SelectItem>
                        <SelectItem value="Alternado">Alternado</SelectItem>
                        <SelectItem value="Sob_Aviso">Sob aviso</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={form.control} name="baseProfessionalCategory" render={({ field }) => (
                  <FormItem><FormLabel>Categoria Base</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Medico">Médico</SelectItem>
                        <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                        <SelectItem value="TecEnf">Técnico Enfermagem</SelectItem>
                        <SelectItem value="Fisio">Fisioterapeuta</SelectItem>
                        <SelectItem value="Fono">Fono</SelectItem>
                        <SelectItem value="Nutri">Nutricionista</SelectItem>
                        <SelectItem value="Psicologo">Psicólogo</SelectItem>
                        <SelectItem value="Terapeuta">Terapeuta</SelectItem>
                        <SelectItem value="Cuidador">Cuidador</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantityPerShift" render={({ field }) => (
                  <FormItem><FormLabel>Qtd/Turno</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="weeklyHoursExpected" render={({ field }) => (
                  <FormItem><FormLabel>Carga Horária Semanal</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="dayShiftStart" render={({ field }) => (
                  <FormItem><FormLabel>Início Turno Dia</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="dayShiftEnd" render={({ field }) => (
                  <FormItem><FormLabel>Fim Turno Dia</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="nightShiftStart" render={({ field }) => (
                  <FormItem><FormLabel>Início Turno Noite</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="nightShiftEnd" render={({ field }) => (
                  <FormItem><FormLabel>Fim Turno Noite</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="scaleRuleStartDate" render={({ field }) => (
                  <FormItem><FormLabel>Regra - Início</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="scaleRuleEndDate" render={({ field }) => (
                  <FormItem><FormLabel>Regra - Fim</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="holidayRule" render={({ field }) => (
                  <FormItem><FormLabel>Regra Feriados</FormLabel><FormControl><Input {...field} placeholder="Plantão reduzido, sob demanda..." /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="referenceLocationId" render={({ field }) => (
                  <FormItem><FormLabel>Local de Referência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione endereço" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {addresses.map((addr: any) => (
                          <SelectItem key={addr.id} value={addr.id}>{addr.street || addr.address_line || 'Endereço'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="flex flex-wrap gap-4">
                <FormField control={form.control} name="includesWeekends" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="text-sm">Inclui fins de semana?</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="autoGenerateScale" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="text-sm">Gerar escala automática</FormLabel>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="scaleNotes" render={({ field }) => (
                <FormItem><FormLabel>Obs da Escala</FormLabel><FormControl><Textarea {...field} placeholder="Não trocar plantão à noite..." /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Card Documentos & GED */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ListChecks /> Documentos & GED</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <ChecklistItem name="chkContractOk" dateName="chkContractAt" byName="chkContractBy" label="Contrato Assinado" form={form} />
                  <DocLink name="chkContractDocId" docs={documents} label="Documento (Contrato)" form={form} />
                  <ChecklistItem name="chkConsentOk" dateName="chkConsentAt" byName="chkConsentBy" label="Termo Consentimento" form={form} />
                  <DocLink name="chkConsentDocId" docs={documents} label="Documento (Consentimento)" form={form} />
                  <ChecklistItem name="chkMedicalReportOk" dateName="chkMedicalReportAt" byName="chkMedicalReportBy" label="Laudo Médico" form={form} />
                  <DocLink name="chkMedicalReportDocId" docs={documents} label="Documento (Laudo)" form={form} />
                  <ChecklistItem name="chkAddressProofOk" dateName="chkAddressProofAt" byName="chkAddressProofBy" label="Comprovante Endereço" form={form} />
                  <DocLink name="chkAddressProofDocId" docs={documents} label="Documento (Endereço)" form={form} />
                </div>
                <div className="space-y-3">
                  <ChecklistItem name="chkLegalGuardianDocsOk" dateName="chkLegalGuardianDocsAt" byName="chkLegalGuardianDocsBy" label="Docs Resp. Legal" form={form} />
                  <DocLink name="chkLegalDocsDocId" docs={documents} label="Documento (Resp. Legal)" form={form} />
                  <ChecklistItem name="chkFinancialResponsibleDocsOk" dateName="chkFinancialResponsibleDocsAt" byName="chkFinancialResponsibleDocsBy" label="Docs Resp. Financeiro" form={form} />
                  <DocLink name="chkFinancialDocsDocId" docs={documents} label="Documento (Resp. Financeiro)" form={form} />
                  <ChecklistItem name="chkJudicialOk" dateName="chkJudicialAt" byName="chkJudicialBy" label="Liminar Judicial" form={form} />
                  <DocLink name="chkJudicialDocId" docs={documents} label="Documento (Judicial)" form={form} />
                  <ChecklistItem name="chkOtherDocsOk" dateName="chkOtherDocsAt" byName="chkOtherDocsBy" label="Outros Docs" form={form} />
                  <FormField control={form.control} name="chkOtherDocsDesc" render={({ field }) => (
                    <FormItem><FormLabel>Descrição Outros Docs</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                  )} />
                  <DocLink name="chkOtherDocsDocId" docs={documents} label="Documento (Outros)" form={form} />
                </div>
              </div>
              <FormField control={form.control} name="checklistNotes" render={({ field }) => (
                <FormItem><FormLabel>Obs do Checklist</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="checklistNotesDetailed" render={({ field }) => (
                <FormItem><FormLabel>Obs Detalhadas</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="checklistComplete" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-sm">Checklist completo</FormLabel>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Card Sincronização Clínica */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ShieldCheck /> Sincronização Clínica</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Complexidade:</span> {clinical.complexity_level || "N/D"}</p>
              <p><span className="font-semibold">CID Principal:</span> {cidCode || "N/D"} {cidDesc ? `— ${cidDesc}` : ""}</p>
              <p><span className="font-semibold">Última atualização:</span> {clinical.last_clinical_update_at ? dateStr(clinical.last_clinical_update_at) : "N/D"}</p>
              <p><span className="font-semibold">Profissional Ref.:</span> {clinical.reference_professional_name || "N/D"}</p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-[#0F2B45] text-white">Salvar alterações</Button>
        </div>

      </form>
    </Form>
  );
}
