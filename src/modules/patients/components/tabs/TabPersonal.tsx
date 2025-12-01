'use client';

import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientPersonalSchema, PatientPersonalDTO, RACE_COLOR_OPTIONS, type RaceColor } from "@/data/definitions/personal";
import { upsertPersonalAction } from "../../actions.upsertPersonal";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const DOC_STATUS_OPTIONS = [
  "Pendente",
  "Nao Validado",
  "Validado",
  "Inconsistente",
  "Em Analise",
] as const;

type DocValidationStatus = (typeof DOC_STATUS_OPTIONS)[number];

const normalizeDocValidationStatus = (value?: string | null): DocValidationStatus => {
  if (!value) return "Pendente";
  const normalized = value.replace(/[_-]/g, " ").toLowerCase();
  const map: Record<string, DocValidationStatus> = {
    pendente: "Pendente",
    pending: "Pendente",
    'nao validado': "Nao Validado",
    'não validado': "Nao Validado",
    nao_validado: "Nao Validado",
    not_validated: "Nao Validado",
    validado: "Validado",
    validated: "Validado",
    inconsistente: "Inconsistente",
    inconsistent: "Inconsistente",
    rejeitado: "Inconsistente",
    rejected: "Inconsistente",
    reprovado: "Inconsistente",
    'em analise': "Em Analise",
    'em análise': "Em Analise",
    analysing: "Em Analise",
  };
  if (map[normalized]) return map[normalized];
  if (DOC_STATUS_OPTIONS.includes(value as DocValidationStatus)) return value as DocValidationStatus;
  return "Pendente";
};

type PreferredContactMethod = "whatsapp" | "phone" | "email";

const normalizePrefContactMethod = (value?: string | null): PreferredContactMethod => {
  if (value === "email") return "email";
  if (value === "phone" || value === "sms") return "phone";
  return "whatsapp";
};

const DEFAULT_RACE_COLOR: RaceColor = "Nao declarado";

const RACE_COLOR_LABELS: Record<RaceColor, string> = {
  Branca: "Branca",
  Preta: "Preta",
  Parda: "Parda",
  Amarela: "Amarela",
  Indigena: "Indígena",
  "Nao declarado": "Não declarado",
};

const normalizeRaceColor = (value?: string | null): RaceColor => {
  if (!value) return DEFAULT_RACE_COLOR;
  const sanitized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const map: Record<string, RaceColor> = {
    branca: "Branca",
    preta: "Preta",
    parda: "Parda",
    amarela: "Amarela",
    indigena: "Indigena",
    "nao declarado": "Nao declarado",
  };

  if (map[sanitized]) return map[sanitized];

  if (RACE_COLOR_OPTIONS.includes(value as RaceColor)) {
    return value as RaceColor;
  }

  const normalizedByOption = RACE_COLOR_OPTIONS.find((option) => option.toLowerCase() === sanitized);
  if (normalizedByOption) return normalizedByOption;

  return DEFAULT_RACE_COLOR;
};

const extractErrorMessages = (errors: FieldErrors<PatientPersonalDTO>): string[] => {
  const messages: string[] = [];
  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      const maybeError = value as { message?: unknown };
      if (typeof maybeError.message === "string") {
        messages.push(maybeError.message);
      }
      Object.values(value).forEach((child) => {
        if (child && typeof child === "object" && child !== value) visit(child);
      });
    }
  };
  visit(errors);
  return Array.from(new Set(messages));
};

export function TabPersonal({ patient }: { patient: FullPatientDetails }) {
  const calculateAge = (date?: Date) => {
    if (!date) return "--";
    const diff = Date.now() - date.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const form = useForm<PatientPersonalDTO>({
    resolver: zodResolver(PatientPersonalSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      full_name: patient.full_name ?? "",
      nickname: patient.nickname ?? "",
      social_name: patient.social_name ?? "",
      salutation: patient.salutation ?? "",
      gender_identity: (patient.gender_identity as any) ?? "Prefiro nao informar",
      pronouns: (patient.pronouns as any) ?? "Outro",
      civil_status: (patient.civil_status as any) ?? "Solteiro(a)",
      cpf: patient.cpf ?? "",
      cpf_status: patient.cpf_status ?? "valid",
      rg: patient.rg ?? "",
      rg_issuer: patient.rg_issuer ?? "",
      rg_issuer_state: patient.rg_issuer_state ?? "",
      rg_issued_at: patient.rg_issued_at ? new Date(patient.rg_issued_at) : undefined,
      cns: patient.cns ?? "",
      national_id: patient.national_id ?? "",
      doc_validation_source: (patient as any).doc_validation_source ?? "",
      document_validation_method: patient.document_validation_method ?? "manual",
      doc_validation_status: normalizeDocValidationStatus(patient.doc_validation_status),
      doc_validated_at: patient.doc_validated_at ?? undefined,
      doc_validated_by: patient.doc_validated_by ?? undefined,
      date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth) : undefined,
      gender: (() => {
        if (patient.gender === "M") return "Masculino";
        if (patient.gender === "F") return "Feminino";
        if (patient.gender === "Other") return "Outro";
        return (patient.gender as any) ?? "Não informado";
      })(),
      father_name: (patient as any).father_name ?? "",
      nationality: patient.nationality ?? "Brasileira",
      place_of_birth_city: patient.place_of_birth_city ?? "",
      place_of_birth_state: patient.place_of_birth_state ?? "",
      place_of_birth_country: patient.place_of_birth_country ?? "Brasil",
      preferred_language: patient.preferred_language ?? "Português",
      mother_name: patient.mother_name ?? "",
      photo_consent: patient.photo_consent ?? false,
      photo_consent_date: (patient as any).photo_consent_date ?? undefined,
      mobile_phone: patient.mobile_phone ?? "",
      secondary_phone: patient.secondary_phone ?? "",
      email: patient.email ?? "",
      pref_contact_method: normalizePrefContactMethod(patient.pref_contact_method),
      accept_sms: patient.accept_sms ?? true,
      accept_email: patient.accept_email ?? true,
      block_marketing: patient.block_marketing ?? false,
      education_level: (patient.education_level as any) ?? "Nao Informado",
      profession: patient.profession ?? "",
      race_color: normalizeRaceColor(patient.race_color),
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

  const watchConsentStatus = form.watch("marketing_consent_status") || "pending";
  const hasConsentDefined = watchConsentStatus === "accepted" || watchConsentStatus === "rejected";
  const [forceConsentEdit, setForceConsentEdit] = useState(false);
  const consentHistoryText = (patient as any).marketing_consent_history || "";
  const docStatusLabel = normalizeDocValidationStatus(patient.doc_validation_status);

  const [isForeignDoc, setIsForeignDoc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorMessages = useMemo(() => extractErrorMessages(form.formState.errors), [form.formState.errors]);

  const onSubmit = async (data: PatientPersonalDTO) => {
    setSubmitError(null);
    setIsSaving(true);
    try {
      const payload: PatientPersonalDTO = {
        ...data,
        doc_validation_status: normalizeDocValidationStatus(data.doc_validation_status),
        pref_contact_method: normalizePrefContactMethod(data.pref_contact_method),
        race_color: normalizeRaceColor(data.race_color)
      };
      const res = await upsertPersonalAction(payload);
      if (res.success) {
        toast.success("Dados pessoais atualizados!");
        form.reset({ ...data, race_color: payload.race_color });
      } else {
        setSubmitError(res.error || "Erro ao salvar os dados pessoais.");
        toast.error(res.error || "Erro ao salvar os dados pessoais.");
      }
    } catch (error) {
      console.error("upsertPersonalAction", error);
      setSubmitError("Erro inesperado ao salvar os dados pessoais.");
      toast.error("Erro inesperado ao salvar os dados pessoais.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmit, (errors) => {
    const messages = extractErrorMessages(errors);
    const message = messages[0] || "Revise os campos destacados e tente novamente.";
    setSubmitError(message);
    toast.error("Não foi possível salvar", { description: message });
    console.warn("TabPersonal validation errors", errors);
  });

  const labelCls = "text-[11px] font-semibold text-slate-600 uppercase";
  const inputCls = "h-9 text-sm bg-white";

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-10">
        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Identidade Civil & Social</CardTitle>
            <CardDescription>Campos essenciais do prontuário.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <FormField control={form.control} name="salutation" render={({ field }) => (
              <FormItem className="md:col-span-2 col-span-6">
                <FormLabel className={labelCls}>Tratamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue placeholder="Sr./Sra." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Sr.">Sr.</SelectItem>
                    <SelectItem value="Sra.">Sra.</SelectItem>
                    <SelectItem value="Sr(a).">Sr(a).</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Dra.">Dra.</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
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
            <FormField control={form.control} name="pronouns" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Pronomes</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Ela/Dela">Ela/Dela</SelectItem>
                    <SelectItem value="Ele/Dele">Ele/Dele</SelectItem>
                    <SelectItem value="Elu/Delu">Elu/Delu</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="gender_identity" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Identidade de Gênero</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Cisgenero">Cisgênero</SelectItem>
                    <SelectItem value="Transgenero">Transgênero</SelectItem>
                    <SelectItem value="Nao Binario">Não Binário</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro nao informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Data de Nascimento *</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={(e)=>field.onChange(e.target.value ? new Date(e.target.value):undefined)} className={inputCls}/>
                </FormControl>
                <p className="text-[11px] text-slate-500 mt-1">( {calculateAge(field.value)} anos )</p>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem className="md:col-span-3 col-span-6">
                <FormLabel className={labelCls}>Sexo Biológico *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Intersexo">Intersexo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Não informado">Não informado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="civil_status" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Estado Civil</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={(field.value as PatientPersonalDTO["civil_status"]) ?? "Solteiro(a)"}
                >
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="União estável">União estável</SelectItem>
                    <SelectItem value="Separado(a)">Separado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="nationality" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Nacionalidade</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="preferred_language" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Idioma Preferido</FormLabel>
                <FormControl><Input {...field} className={inputCls} placeholder="Português, Inglês..." /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="mother_name" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Nome da Mãe</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="father_name" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Nome do Pai</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="race_color" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Raça/Cor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? DEFAULT_RACE_COLOR}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {RACE_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {RACE_COLOR_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="education_level" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Escolaridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Nao Alfabetizado">Não Alfabetizado</SelectItem>
                    <SelectItem value="Fundamental Incompleto">Fundamental Incompleto</SelectItem>
                    <SelectItem value="Fundamental Completo">Fundamental Completo</SelectItem>
                    <SelectItem value="Medio Incompleto">Médio Incompleto</SelectItem>
                    <SelectItem value="Medio Completo">Médio Completo</SelectItem>
                    <SelectItem value="Superior Incompleto">Superior Incompleto</SelectItem>
                    <SelectItem value="Superior Completo">Superior Completo</SelectItem>
                    <SelectItem value="Pos Graduacao">Pós Graduação</SelectItem>
                    <SelectItem value="Mestrado/Doutorado">Mestrado/Doutorado</SelectItem>
                    <SelectItem value="Nao Informado">Não Informado</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="md:col-span-12 flex items-center space-x-2">
              <Checkbox checked={isForeignDoc} onCheckedChange={(v) => setIsForeignDoc(!!v)} />
              <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Documento Estrangeiro / Outro?</FormLabel>
            </div>
            {!isForeignDoc && (
              <>
            <FormField control={form.control} name="cpf" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>CPF</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
                <FormMessage />
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
            <FormField control={form.control} name="cns" render={({ field }) => (
              <FormItem className="md:col-span-4 col-span-12">
                <FormLabel className={labelCls}>Cartão SUS (CNS)</FormLabel>
                <FormControl><Input {...field} className={inputCls} /></FormControl>
              </FormItem>
            )}/>
            <div className="md:col-span-4 col-span-12 text-sm text-slate-600">
              <p>Status: <span className="font-semibold">{docStatusLabel}</span></p>
              {(patient as any).doc_validation_source && <p className="text-xs text-slate-500">Origem: {(patient as any).doc_validation_source}</p>}
              {patient.doc_validated_by && patient.doc_validated_at && (
                <p className="text-xs text-slate-500">Validado por {patient.doc_validated_by} em {patient.doc_validated_at}</p>
              )}
            </div>
              </>
            )}
            {isForeignDoc && (
              <>
                <FormField control={form.control} name="civil_documents.0.doc_type" render={({ field }) => (
                  <FormItem className="md:col-span-4 col-span-12">
                    <FormLabel className={labelCls}>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className={inputCls}><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Passaporte">Passaporte</SelectItem>
                        <SelectItem value="RNE">RNE</SelectItem>
                        <SelectItem value="CNH">CNH</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="civil_documents.0.doc_number" render={({ field }) => (
                  <FormItem className="md:col-span-4 col-span-12">
                    <FormLabel className={labelCls}>Número</FormLabel>
                    <FormControl><Input {...field} className={inputCls} /></FormControl>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="civil_documents.0.issuer_country" render={({ field }) => (
                  <FormItem className="md:col-span-4 col-span-12">
                    <FormLabel className={labelCls}>País Emissor</FormLabel>
                    <FormControl><Input {...field} className={inputCls} placeholder="Brasil" /></FormControl>
                  </FormItem>
                )}/>
              </>
            )}
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
                  <TableHead>Emissor</TableHead>
                  <TableHead>País Emissor</TableHead>
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
                      <Input {...form.register(`civil_documents.${idx}.issuer` as const)} className={inputCls} placeholder="Órgão/País Emissor" />
                    </TableCell>
                    <TableCell>
                      <Input {...form.register(`civil_documents.${idx}.issuer_country` as const)} className={inputCls} placeholder="Brasil" />
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
                <Select onValueChange={field.onChange} value={field.value ?? "whatsapp"}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Telefone / SMS</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="contact_time_preference" render={({ field }) => (
              <FormItem className="md:col-span-6 col-span-12">
                <FormLabel className={labelCls}>Melhor Horário</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Manha">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noite">Noite</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Qualquer Horario">Qualquer Horário</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="photo_consent" render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-xs font-semibold text-slate-600 uppercase">Uso de Imagem</FormLabel>
                </FormItem>
              )}/>
              <FormField control={form.control} name="photo_consent_date" render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FormLabel className={labelCls}>Data Consent. Imagem</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        className={inputCls}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            {/* Widget de Consentimento */}
            {!hasConsentDefined || forceConsentEdit ? (
              <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded p-3 space-y-3">
                <div className="font-semibold">Atenção: Consentimento de comunicação pendente.</div>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => form.setValue("marketing_consent_status", "accepted")} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">✅ Aceitar Comunicações</Button>
                  <Button type="button" onClick={() => form.setValue("marketing_consent_status", "rejected")} variant="destructive" className="flex-1">🚫 Recusar</Button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Status Atual: {watchConsentStatus === "accepted" ? "ACEITO" : "RECUSADO"}</p>
                  {consentHistoryText && <p className="text-xs text-slate-600">Histórico: {consentHistoryText}</p>}
                </div>
                <Button type="button" variant="outline" onClick={() => setForceConsentEdit(true)}>Alterar/Revogar</Button>
              </div>
            )}
            <div className="text-xs text-slate-600">
              Consentimento de Marketing: {patient.block_marketing ? "Recusado" : "Aceito"} {patient.marketing_consent_source ? `- Origem: ${patient.marketing_consent_source}` : ""} {patient.marketing_consented_at ? `em ${patient.marketing_consented_at}` : ""}
            </div>
          </CardContent>
        </Card>

        {(submitError || (form.formState.isSubmitted && errorMessages.length > 0)) && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <WarningCircle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">Não foi possível salvar.</p>
              <p>{submitError || "Revise os campos destacados abaixo."}</p>
              {errorMessages.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs">
                  {errorMessages.slice(0, 4).map((message, idx) => (
                    <li key={idx}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <Card className="shadow-fluent border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-[#0F2B45]">Responsável Legal (Resumo)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {(() => {
              const guardianView = (patient as any).legal_guardian_summary;
              const hasGuardian = guardianView?.has_legal_guardian ?? (patient as any).has_legal_guardian;
              const guardianStatus = guardianView?.legal_guardian_status ?? (patient as any).legal_guardian_status;

              if (hasGuardian) {
                return (
                  <div className="flex items-center gap-2">
                    {guardianStatus === "Cadastro OK" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Responsável Ativo</Badge>
                    )}
                    {guardianStatus === "Cadastro Pendente" && (
                      <Badge className="bg-amber-100 text-amber-700 border border-amber-200">Dados Incompletos</Badge>
                    )}
                    {guardianView?.guardian_name && (
                      <span className="font-semibold">
                        {guardianView.guardian_name}
                        {guardianView.guardian_relation ? ` (${guardianView.guardian_relation})` : ""}
                      </span>
                    )}
                    {guardianView?.guardian_phone && (
                      <span className="text-xs text-slate-600">Tel: {guardianView.guardian_phone}</span>
                    )}
                    <a className="text-sm text-blue-700 underline" href={`/patients/${patient.id}?tab=team`}>Gerenciar na aba Rede de Apoio</a>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                  Nenhum responsável legal cadastrado. <a className="underline" href={`/patients/${patient.id}?tab=team`}>Adicionar na Rede de Apoio</a>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="bg-[#0F2B45] text-white px-6">
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
