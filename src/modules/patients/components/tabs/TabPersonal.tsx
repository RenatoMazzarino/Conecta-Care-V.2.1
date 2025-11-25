'use client';
/* eslint-disable react-hooks/incompatible-library */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientPersonalSchema, PatientPersonalDTO } from "@/data/definitions/personal";
import { upsertPersonalAction } from "../../actions.upsertPersonal";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  IdentificationBadge,
  Phone,
  Gavel,
  CheckCircle,
  WhatsappLogo,
  FloppyDisk,
  WarningCircle,
  IdentificationCard,
} from "@phosphor-icons/react";
import { format } from "date-fns";

export function TabPersonal({ patient }: { patient: FullPatientDetails }) {
  const legalGuardian = patient.contacts?.find((c) => c?.is_legal_representative);

  const form = useForm<PatientPersonalDTO>({
    resolver: zodResolver(PatientPersonalSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      full_name: patient.full_name ?? "",
      social_name: patient.social_name ?? "",
      salutation: patient.salutation ?? "",
      pronouns: patient.pronouns ?? "",
      cpf: patient.cpf ?? "",
      cpf_status: patient.cpf_status ?? "valid",
      rg: patient.rg ?? "",
      rg_issuer: patient.rg_issuer ?? "",
      cns: patient.cns ?? "",
      national_id: patient.national_id ?? "",
      document_validation_method: patient.document_validation_method ?? "manual",
      date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth) : undefined,
      gender: patient.gender ?? "Other",
      gender_identity: patient.gender_identity ?? "",
      civil_status: patient.civil_status ?? "",
      nationality: patient.nationality ?? "Brasileira",
      place_of_birth: patient.place_of_birth ?? "",
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
    },
  });

  async function onSubmit(data: PatientPersonalDTO) {
    const res = await upsertPersonalAction(data);
    if (res.success) toast.success("Dados pessoais atualizados!");
    else toast.error(res.error);
  }

  const labelCls = "text-xs font-bold uppercase text-slate-500";
  const inputCls = "h-9 text-sm";
  const validationMethod = (form.watch("document_validation_method") || "").toUpperCase();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6 pb-20">
        {/* COLUNA ESQUERDA */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Identidade */}
          <div className="bg-white border border-slate-200 rounded-md shadow-fluent p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 text-[#0F2B45] font-bold text-base">
              <IdentificationCard size={22} weight="duotone" /> Identidade Civil & Social
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Tratamento</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} placeholder="Sr(a)." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-9 md:col-span-5">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} className={`${inputCls} bg-slate-50 font-semibold`} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="social_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Nome Social</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Data de Nasc.</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className={inputCls}
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Sexo Biológico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputCls}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="Other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="pronouns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Pronomes</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} placeholder="Ela/Dela" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="civil_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputCls}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="Casado">Casado(a)</SelectItem>
                          <SelectItem value="Viúvo">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormField
                  control={form.control}
                  name="mother_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Nacionalidade</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Naturalidade</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="gender_identity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Identidade de Gênero</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="preferred_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Idioma Preferido</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12">
                <FormField
                  control={form.control}
                  name="photo_consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                      </FormControl>
                      <FormLabel className="text-xs font-semibold text-slate-600">
                        Consentimento para uso de foto no prontuário e crachá.
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Documentação */}
          <div className="bg-white border border-slate-200 rounded-md shadow-fluent p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-[#0F2B45] font-bold text-base">
              <div className="flex items-center gap-2">
                <IdentificationBadge size={22} weight="duotone" /> Documentação Civil
              </div>
              <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                Validação: {validationMethod}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>CPF</FormLabel>
                      <FormControl>
                        <Input {...field} className={`${inputCls} font-mono`} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>RG</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <FormField
                  control={form.control}
                  name="rg_issuer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Órgão</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} placeholder="SSP" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormField
                  control={form.control}
                  name="cpf_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Status CPF</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputCls}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="valid">Válido</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="invalid">Inválido</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="cns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Cartão SUS (CNS)</FormLabel>
                      <FormControl>
                        <Input {...field} className={`${inputCls} font-mono bg-blue-50/30 text-blue-900`} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-4">
                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Documento Nacional</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputCls} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 md:col-span-4">
                <FormField
                  control={form.control}
                  name="document_validation_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Validação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputCls}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="ocr">OCR</SelectItem>
                          <SelectItem value="api">API Gov</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-500 rounded-md shadow-fluent p-6">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold text-base">
              <Phone size={22} weight="duotone" /> Canais de Contato
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Celular Principal</FormLabel>
                    <FormControl>
                      <Input {...field} className={`${inputCls} font-semibold`} placeholder="(00) 00000-0000" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Telefone Secundário</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputCls} placeholder="(00) 0000-0000" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputCls} type="email" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pref_contact_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Preferência de Contato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={inputCls}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <WhatsappLogo className="mr-2 inline text-emerald-500" /> WhatsApp
                        </SelectItem>
                        <SelectItem value="phone">Ligação</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <FormField
                  control={form.control}
                  name="accept_sms"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                      </FormControl>
                      <FormLabel className="text-xs text-slate-600">Aceita SMS</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accept_email"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                      </FormControl>
                      <FormLabel className="text-xs text-slate-600">Aceita E-mail</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="block_marketing"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(val) => field.onChange(!!val)}
                          className="data-[state=checked]:border-rose-500 data-[state=checked]:bg-rose-500"
                        />
                      </FormControl>
                      <FormLabel className="text-xs text-rose-700 font-semibold">Bloquear Marketing</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-fluent p-6">
            <div className="flex items-center gap-2 mb-4 text-[#0F2B45] font-bold text-base">
              <Gavel size={22} weight="duotone" /> Responsável Legal
            </div>
            {legalGuardian ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold text-[#0F2B45]">{legalGuardian.full_name}</p>
                  <p className="text-sm font-semibold uppercase text-slate-500">{legalGuardian.relation}</p>
                </div>
                <div className="space-y-2 rounded border border-slate-100 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="text-slate-400" /> {legalGuardian.phone}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle /> Representante Legal
                  </div>
                  {legalGuardian.can_authorize_procedures && (
                    <div className="flex items-center gap-2 font-semibold text-blue-700">
                      <CheckCircle /> Pode Autorizar
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full text-xs">
                  Ver Documento da Procuração
                </Button>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <WarningCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum responsável legal cadastrado.</p>
                <Button variant="link" className="text-[#D46F5D]">
                  Adicionar na aba Rede de Apoio
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO FLUTUANTE */}
        <div className="fixed bottom-6 right-8 shadow-2xl z-50">
          <Button type="submit" className="bg-[#D46F5D] hover:bg-[#c05846] text-white px-6 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg">
            <FloppyDisk size={20} weight="bold" /> Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
