'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientAdminInfoZ, PatientAdminInfoForm } from "@/schemas/patient.adminInfo";
import { upsertAdministrativeAction } from "../../actions.upsertAdministrative";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, FileText, ShieldCheck, ClipboardText, ListChecks } from "@phosphor-icons/react";

const dateStr = (v?: string | null) => (v ? v.split("T")[0] : "");
const today = () => new Date().toISOString().split("T")[0];

type ChecklistItemProps = {
  name: keyof PatientAdminInfoForm;
  dateName: keyof PatientAdminInfoForm;
  byName: keyof PatientAdminInfoForm;
  label: string;
  form: any;
};

function ChecklistItem({ name, dateName, byName, label, form }: ChecklistItemProps) {
  const checked = form.watch(name as any);
  return (
    <div className="flex items-start justify-between rounded border border-slate-100 px-3 py-2 bg-white">
      <div className="space-y-1">
        <FormField control={form.control} name={name as any} render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox checked={!!field.value} onCheckedChange={(c) => {
              field.onChange(!!c);
              if (!form.getValues(dateName as any) && !!c) form.setValue(dateName as any, today());
            }} />
            <span className="text-sm font-semibold text-slate-800">{label}</span>
          </div>
        )} />
        {checked && (
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
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
          </div>
        )}
      </div>
    </div>
  );
}

export function TabAdministrative({ patient }: { patient: FullPatientDetails }) {
  const admin = (patient.admin_info?.[0] as any) || {};
  const clinical: any = patient.clinical?.[0] || {};

  const form = useForm<PatientAdminInfoForm>({
    resolver: zodResolver(PatientAdminInfoZ) as any,
    defaultValues: {
      patient_id: patient.id,
      tenant_id: (patient as any).tenant_id || "",
      status: admin.status || "active",
      status_reason: admin.status_reason || "",
      status_changed_at: admin.status_changed_at || "",
      admissionType: admin.admission_type || "",
      demandOrigin: admin.demand_origin || undefined,
      primaryPayerType: admin.primary_payer_type || "",
      startDate: admin.start_date || "",
      endDate: admin.end_date || "",
      contractStartDate: admin.contract_start_date || "",
      contractEndDate: admin.contract_end_date || "",
      renewalType: admin.renewal_type || "",
      contractId: admin.contract_id || "",
      externalContractId: admin.external_contract_id || "",
      authorizationNumber: admin.authorization_number || "",
      judicialCaseNumber: admin.judicial_case_number || "",
      supervisorId: admin.supervisor_id || "",
      escalistaId: admin.escalista_id || "",
      commercialResponsibleId: admin.commercial_responsible_id || "",
      contractManagerId: admin.contract_manager_id || "",
      frequency: admin.frequency || "",
      scaleMode: admin.scale_mode || "",
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
      chkLegalDocsOk: admin.chk_legal_docs_ok || false,
      chkFinancialDocsOk: admin.chk_financial_docs_ok || false,
      chkJudicialOk: admin.chk_judicial_ok || false,
      checklistNotes: admin.checklist_notes || "",
    }
  });

  async function onSubmit(data: PatientAdminInfoForm) {
    const res = await upsertAdministrativeAction(data);
    if (res.success) toast.success("Dados administrativos atualizados!");
    else toast.error(res.error);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-16">
        
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Calendar /> Contrato e Formalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-3 gap-3">
                {["startDate","endDate","status_changed_at"].map((field, idx) => (
                  <FormField key={field} control={form.control} name={field as any} render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{idx===0?"Data Admissão": idx===1?"Prev. Alta":"Alta/Status em"}</FormLabel>
                      <FormControl><Input type="date" {...f} value={f.value || ""} onChange={(e)=>f.onChange(e.target.value)} /></FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="admissionType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Admissão</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="demandOrigin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem Demanda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Particular">Particular</SelectItem>
                        <SelectItem value="Operadora">Operadora</SelectItem>
                        <SelectItem value="SUS">SUS</SelectItem>
                        <SelectItem value="Empresa">Empresa</SelectItem>
                        <SelectItem value="Judicial">Judicial</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="primaryPayerType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador Principal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["contractStartDate","contractEndDate","renewalType"].map((field) => (
                  <FormField key={field} control={form.control} name={field as any} render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{field==="renewalType"?"Tipo Renovação": field==="contractStartDate"?"Início Vigência":"Fim Vigência"}</FormLabel>
                      <FormControl><Input type={field==="renewalType"?"text":"date"} {...f} value={f.value || ""} onChange={(e)=>f.onChange(e.target.value)} /></FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="contractId" render={({ field }) => (
                  <FormItem><FormLabel>ID Interno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="externalContractId" render={({ field }) => (
                  <FormItem><FormLabel>ID Externo (Operadora)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="authorizationNumber" render={({ field }) => (
                  <FormItem><FormLabel>Senha TISS</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="judicialCaseNumber" render={({ field }) => (
                <FormItem><FormLabel>Nº Processo Judicial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />

              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="status_reason" render={({ field }) => (
                  <FormItem><FormLabel>Motivo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="status_changed_at" render={({ field }) => (
                  <FormItem><FormLabel>Data Mudança</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="supervisorId" render={({ field }) => (
                  <FormItem><FormLabel>Supervisor Técnico</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="escalistaId" render={({ field }) => (
                  <FormItem><FormLabel>Escalista</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="commercialResponsibleId" render={({ field }) => (
                  <FormItem><FormLabel>Responsável Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="contractManagerId" render={({ field }) => (
                  <FormItem><FormLabel>Gestor de Contrato</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ListChecks /> Documentos & Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <ChecklistItem name="chkContractOk" dateName="chkContractAt" byName="chkContractBy" label="Contrato Assinado" form={form} />
                  <ChecklistItem name="chkConsentOk" dateName="chkConsentAt" byName="chkConsentBy" label="Termo Consentimento" form={form} />
                  <ChecklistItem name="chkMedicalReportOk" dateName="chkMedicalReportAt" byName="chkMedicalReportBy" label="Laudo Médico" form={form} />
                  <ChecklistItem name="chkLegalDocsOk" dateName="chkContractAt" byName="chkContractBy" label="Docs Responsáveis Legais" form={form} />
                  <ChecklistItem name="chkFinancialDocsOk" dateName="chkContractAt" byName="chkContractBy" label="Docs Responsáveis Financeiros" form={form} />
                  <ChecklistItem name="chkJudicialOk" dateName="chkContractAt" byName="chkContractBy" label="Liminar Judicial" form={form} />
                  <FormField control={form.control} name="checklistNotes" render={({ field }) => (
                    <FormItem><FormLabel>Obs do Checklist</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs uppercase text-slate-500 font-semibold flex items-center gap-2"><ShieldCheck /> Espelho Clínico</p>
                  <div className="text-sm text-slate-700">
                    <p><span className="font-semibold">Complexidade:</span> {clinical.complexity_level || "N/D"}</p>
                    <p><span className="font-semibold">CID Principal:</span> {clinical.diagnosis_main || "N/D"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">Ver detalhes na aba Clínica</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ClipboardText /> Regras Operacionais</CardTitle>
              <CardDescription>Configurações rápidas da escala e operação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem><FormLabel>Modelo de Escala</FormLabel><FormControl><Input {...field} placeholder="12x36, 24x48..." /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="scaleMode" render={({ field }) => (
                <FormItem><FormLabel>Modalidade</FormLabel><FormControl><Input {...field} placeholder="Plantão contínuo, visita..." /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="scaleRuleStartDate" render={({ field }) => (
                <FormItem><FormLabel>Vigência Regra - Início</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="scaleRuleEndDate" render={({ field }) => (
                <FormItem><FormLabel>Vigência Regra - Fim</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} onChange={(e)=>field.onChange(e.target.value)} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="scaleNotes" render={({ field }) => (
                <FormItem><FormLabel>Obs da Escala</FormLabel><FormControl><Textarea {...field} placeholder="Não trocar plantão à noite..." /></FormControl></FormItem>
              )} />
              <div className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm text-slate-700">Gerar escala automática</span>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-[#0F2B45] text-white">Salvar alterações</Button>
        </div>

      </form>
    </Form>
  );
}
