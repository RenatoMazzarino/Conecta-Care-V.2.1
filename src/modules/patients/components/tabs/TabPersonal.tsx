'use client';

import { Resolver, useForm } from "react-hook-form";
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
import {
  UserCircle,
  IdentificationBadge,
  Phone,
  Gavel,
  CheckCircle,
  WhatsappLogo,
  FloppyDisk,
  WarningCircle,
} from "@phosphor-icons/react";
import { format } from "date-fns";

const Section = ({ title, icon, badge, children }: any) => (
  <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#0F2B45]">
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {badge}
    </div>
    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-12">{children}</div>
  </div>
);

export function TabPersonal({ patient }: { patient: FullPatientDetails }) {
  const legalGuardian = patient.contacts?.find((c: any) => c.is_legal_representative);

  const form = useForm<PatientPersonalDTO>({
    resolver: zodResolver(PatientPersonalSchema) as Resolver<PatientPersonalDTO>,
    defaultValues: {
      patient_id: patient.id,
      full_name: patient.full_name ?? "",
      social_name: patient.social_name ?? "",
      salutation: (patient as any).salutation ?? "",
      pronouns: (patient as any).pronouns ?? "",
      cpf: patient.cpf ?? "",
      cpf_status: (patient as any).cpf_status ?? "valid",
      rg: patient.rg ?? "",
      rg_issuer: patient.rg_issuer ?? "",
      cns: patient.cns ?? "",
      national_id: (patient as any).national_id ?? "",
      document_validation_method: (patient as any).document_validation_method ?? "manual",
      date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth) : undefined,
      gender: (patient as any).gender ?? "",
      gender_identity: patient.gender_identity ?? "",
      civil_status: patient.civil_status ?? "",
      nationality: patient.nationality ?? "Brasileira",
      place_of_birth: patient.place_of_birth ?? "",
      preferred_language: (patient as any).preferred_language ?? "Português",
      mother_name: patient.mother_name ?? "",
      photo_consent: (patient as any).photo_consent ?? false,
      mobile_phone: (patient as any).mobile_phone ?? "",
      secondary_phone: (patient as any).secondary_phone ?? "",
      email: (patient as any).email ?? "",
      pref_contact_method: (patient as any).pref_contact_method ?? "whatsapp",
      accept_sms: (patient as any).accept_sms ?? true,
      accept_email: (patient as any).accept_email ?? true,
      block_marketing: (patient as any).block_marketing ?? false,
    },
  });

  async function onSubmit(data: PatientPersonalDTO) {
    const res = await upsertPersonalAction(data);
    if (res.success) toast.success("Dados pessoais atualizados!");
    else toast.error(res.error);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20">
        <Section
          title="Identidade e Perfil Social"
          icon={<UserCircle size={20} weight="bold" />}
          badge={
            form.watch("photo_consent") && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                <CheckCircle weight="fill" /> Foto Concedida
              </span>
            )
          }
        >
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="salutation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tratamento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sr(a)." />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-5">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Civil Completo</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-slate-50 font-semibold" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-5">
            <FormField
              control={form.control}
              name="social_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Social / Display</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo Biológico</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronomes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ela/Dela" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="civil_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

          <div className="md:col-span-6">
            <FormField
              control={form.control}
              name="mother_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Mãe</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="place_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naturalidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-12 pt-2">
            <FormField
              control={form.control}
              name="photo_consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormLabel className="text-xs font-normal text-slate-600">
                    Consentimento para uso de foto no prontuário e crachá.
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Section
          title="Documentação Civil"
          icon={<IdentificationBadge size={20} weight="bold" />}
          badge={
            <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
              Validação: {form.watch("document_validation_method")?.toUpperCase()}
            </span>
          }
        >
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="rg_issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SSP" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-4">
            <FormField
              control={form.control}
              name="cns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cartão SUS (CNS)</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono bg-blue-50/30 text-blue-900" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <Section title="Canais de Contato" icon={<Phone size={20} weight="bold" />}>
              <div className="md:col-span-6">
                <FormField
                  control={form.control}
                  name="mobile_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular Principal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" className="h-11 text-lg font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-6">
                <FormField
                  control={form.control}
                  name="secondary_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Secundário</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 0000-0000" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-4">
                <FormField
                  control={form.control}
                  name="pref_contact_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
              </div>

              <div className="border-t border-slate-100 pt-2 md:col-span-12 md:flex md:gap-4">
                <FormField
                  control={form.control}
                  name="accept_sms"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      </FormControl>
                      <FormLabel>Aceita SMS</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accept_email"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      </FormControl>
                      <FormLabel>Aceita Email</FormLabel>
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
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                        />
                      </FormControl>
                      <FormLabel className="font-bold text-red-600">Bloquear Mkt</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </Section>
          </div>

          <div className="md:col-span-5">
            <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-l-4 border-l-[#0F2B45] border-b-slate-200 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#0F2B45]">
                <div className="flex items-center gap-2">
                  <Gavel size={20} weight="bold" /> <span>Responsável Legal</span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                {legalGuardian ? (
                  <>
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
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <WarningCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum responsável legal cadastrado.</p>
                    <Button variant="link" className="text-[#D46F5D]">
                      Adicionar na aba Rede de Apoio
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="submit" className="gap-2 bg-[#D46F5D] text-white shadow-lg hover:bg-[#D46F5D]/90">
            <FloppyDisk size={18} /> Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
