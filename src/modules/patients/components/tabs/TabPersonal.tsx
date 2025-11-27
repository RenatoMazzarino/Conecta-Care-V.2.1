'use client';
/* eslint-disable react-hooks/incompatible-library */

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientPersonalSchema, PatientPersonalDTO } from "@/data/definitions/personal";
import { upsertPersonalAction } from "../../actions.upsertPersonal";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function TabPersonal({ patient }: { patient: FullPatientDetails }) {
  const form = useForm<PatientPersonalDTO>({
    resolver: zodResolver(PatientPersonalSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      full_name: patient.full_name ?? "",
      nickname: patient.nickname ?? "",
      display_name: patient.display_name ?? "",
      social_name: patient.social_name ?? "",
      salutation: patient.salutation ?? "",
      pronouns: patient.pronouns ?? "",
      cpf: patient.cpf ?? "",
      cpf_status: patient.cpf_status ?? "valid",
      rg: patient.rg ?? "",
      rg_issuer: patient.rg_issuer ?? "",
      rg_issuer_state: patient.rg_issuer_state ?? "",
      rg_issued_at: patient.rg_issued_at ? new Date(patient.rg_issued_at) : undefined,
      cns: patient.cns ?? "",
      national_id: patient.national_id ?? "",
      document_validation_method: patient.document_validation_method ?? "manual",
      doc_validation_status: (patient.doc_validation_status as any) ?? "Pendente",
      date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth) : undefined,
      gender: patient.gender ?? "Other",
      gender_identity: patient.gender_identity ?? "",
      civil_status: patient.civil_status ?? "",
      nationality: patient.nationality ?? "Brasileira",
      place_of_birth: patient.place_of_birth ?? "",
      place_of_birth_city: patient.place_of_birth_city ?? "",
      place_of_birth_state: patient.place_of_birth_state ?? "",
      place_of_birth_country: patient.place_of_birth_country ?? "Brasil",
      preferred_language: patient.preferred_language ?? "Português",
      mother_name: patient.mother_name ?? "",
      photo_consent: patient.photo_consent ?? false,
      mobile_phone: patient.mobile_phone ?? "",
      secondary_phone: patient.secondary_phone ?? "",
      email: patient.email ?? "",
      pref_contact_method: (patient.pref_contact_method as PatientPersonalDTO['pref_contact_method']) ?? "whatsapp",
      accept_sms: patient.accept_sms ?? true,
      accept_email: patient.accept_email ?? true,
      block_marketing: patient.block_marketing ?? false,
      education_level: patient.education_level ?? "",
      profession: patient.profession ?? "",
      race_color: (patient.race_color as any) ?? "Não declarado",
      is_pcd: patient.is_pcd ?? false,
      contact_time_preference: (patient.contact_time_preference as any) ?? "Comercial",
      contact_notes: patient.contact_notes ?? "",
      civil_documents: patient.civil_documents?.map((doc: any) => ({
        id: doc.id,
        doc_type: doc.doc_type || doc.docType || "",
        doc_number: doc.doc_number || doc.docNumber || "",
        issuer: doc.issuer,
        issued_at: doc.issued_at || doc.issuedAt,
        valid_until: doc.valid_until || doc.validUntil,
      })) ?? [],
    },
  });

  const documents = useFieldArray({
    control: form.control,
    name: "civil_documents",
  });

  async function onSubmit(data: PatientPersonalDTO) {
    const res = await upsertPersonalAction(data);
    if (res.success) toast.success("Dados pessoais atualizados!");
    else toast.error(res.error);
  }

  const labelCls = "text-[11px] font-semibold text-slate-600 uppercase";
  const inputCls = "h-9 text-sm bg-white";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Identidade Civil & Social</CardTitle>
            <CardDescription>Campos essenciais do prontuário.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem className="md:col-span-8 col-span-12">
                <FormLabel className={labelCls}>Nome Completo *</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="nickname" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Apelido</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="social_name" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Nome Social</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Data de Nascimento *</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={(e)=>field.onChange(e.target.value ? new Date(e.target.value):undefined)} className={inputCls}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Sexo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="race_color" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Raça/Cor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Branca">Branca</SelectItem>
                    <SelectItem value="Preta">Preta</SelectItem>
                    <SelectItem value="Parda">Parda</SelectItem>
                    <SelectItem value="Amarela">Amarela</SelectItem>
                    <SelectItem value="Indígena">Indígena</SelectItem>
                    <SelectItem value="Não declarado">Não declarado</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="education_level" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Escolaridade</FormLabel>
                <FormControl><Input {...field} className={inputCls} placeholder="Fundamental, Médio, Superior..." /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="profession" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Profissão</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="is_pcd" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12 flex items-center space-x-2">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Pessoa com Deficiência?</FormLabel>
              </FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card className="shadow-fluent border-slate-200">
          <CardHeader><CardTitle className="text-base text-[#0F2B45]">Naturalidade</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField control={form.control} name="place_of_birth_country" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>País</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="place_of_birth_state" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Estado</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="place_of_birth_city" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Cidade</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Documentação Civil</CardTitle>
            <CardDescription>RG, CPF e validação.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField control={form.control} name="cpf" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>CPF</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="rg" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>RG</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="rg_issuer" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Órgão Emissor</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="rg_issuer_state" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>UF Emissor</FormLabel>
                <FormControl><Input maxLength={2} {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="rg_issued_at" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Data Emissão</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={(e)=>field.onChange(e.target.value ? new Date(e.target.value):undefined)} className={inputCls}/>
                </FormControl>
              </FormItem>
            )}/>
            <div className="md:col-span-4 col-span-12 text-sm text-slate-600">
              <p>Status: <span className="font-semibold">{patient.doc_validation_status || "Pendente"}</span></p>
              {patient.doc_validated_by && patient.doc_validated_at && (
                <p className="text-xs text-slate-500">Validado por {patient.doc_validated_by} em {patient.doc_validated_at}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Documentos Extras</CardTitle>
            <CardDescription>Passaporte, RNE, CNH.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.fields.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input {...form.register(`civil_documents.${idx}.doc_type` as const)} className={inputCls} placeholder="Passaporte/RNE" />
                    </TableCell>
                    <TableCell>
                      <Input {...form.register(`civil_documents.${idx}.doc_number` as const)} className={inputCls} />
                    </TableCell>
                    <TableCell>
                      <Input type="date" {...form.register(`civil_documents.${idx}.valid_until` as const)} className={inputCls} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => documents.remove(idx)}>Remover</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" onClick={() => documents.append({ doc_type: "", doc_number: "" })}>
              + Adicionar Documento
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Contato e Preferências</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField control={form.control} name="mobile_phone" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Celular</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="secondary_phone" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Telefone</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Email</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="pref_contact_method" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Preferência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="contact_time_preference" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Melhor Horário</FormLabel>
                <FormControl><Input {...field} className={inputCls} placeholder="Manhã/Tarde/Noite/Comercial" /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="contact_notes" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Observações</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField control={form.control} name="accept_sms" render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Aceita SMS</FormLabel>
                </FormItem>
              )}/>
              <FormField control={form.control} name="accept_email" render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Aceita Email</FormLabel>
                </FormItem>
              )}/>
              <FormField control={form.control} name="block_marketing" render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Bloquear Marketing</FormLabel>
                </FormItem>
              )}/>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">LGPD</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600">
            Consentimento de Marketing: {patient.block_marketing ? "Recusado" : "Aceito"} {patient.marketing_consent_source ? `- Origem: ${patient.marketing_consent_source}` : ""} {patient.marketing_consented_at ? `em ${patient.marketing_consented_at}` : ""}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#0F2B45] text-white px-6">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
}
