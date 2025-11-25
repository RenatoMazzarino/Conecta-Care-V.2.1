'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfessionalSchema, ProfessionalDTO } from "@/data/definitions/professional";
import { upsertProfessionalAction } from "../actions"; // Seu arquivo de actions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, UserPlus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface Props {
  professional?: Partial<ProfessionalDTO> & { id?: string; contact_phone?: string | null };
  trigger?: React.ReactNode;
}

export function ProfessionalFormDialog({ professional, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const isEditing = !!professional;

  const form = useForm<ProfessionalDTO>({
    resolver: zodResolver(ProfessionalSchema) as any,
    defaultValues: {
      // Se for edição, preenche. Se não, vazio.
      user_id: professional?.user_id, 
      full_name: professional?.full_name ?? "",
      social_name: professional?.social_name ?? "",
      cpf: professional?.cpf ?? "",
      email: professional?.email ?? "",
      phone: professional?.contact_phone ?? professional?.phone ?? "", // Compatibilidade de campos
      role: professional?.role ?? "caregiver",
      professional_license: professional?.professional_license ?? "",
      bond_type: professional?.bond_type ?? "freelancer",
      is_active: professional?.is_active ?? true,
    }
  });

  async function onSubmit(data: ProfessionalDTO) {
    setSubmitting(true);
    try {
      const res = await upsertProfessionalAction(data);
      if (res.success) {
        toast.success(isEditing ? "Profissional atualizado!" : "Profissional cadastrado!");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error("Erro: " + (res.error || "Falha ao salvar"));
      }
    } catch (err) {
      console.error("Erro ao salvar profissional:", err);
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white gap-2 shadow-fluent">
            <Plus className="h-4 w-4" /> Novo Profissional
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2B45]">
            <UserPlus className="h-5 w-5" />
            {isEditing ? "Editar Profissional" : "Novo Profissional"}
          </DialogTitle>
          <DialogDescription>Preencha os dados do profissional para cadastro ou edição.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* DADOS PESSOAIS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} placeholder="000.000.000-00" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Celular / WhatsApp</FormLabel><FormControl><Input {...field} placeholder="(00) 90000-0000" /></FormControl></FormItem>
              )} />

              {/* Campo de e-mail opcional */}
              <div className="col-span-2">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail (Opcional)</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="email@exemplo.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* DADOS PROFISSIONAIS */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo / Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="caregiver">Cuidador(a)</SelectItem>
                      <SelectItem value="technician">Téc. Enfermagem</SelectItem>
                      <SelectItem value="nurse">Enfermeiro(a)</SelectItem>
                      <SelectItem value="physio">Fisioterapeuta</SelectItem>
                      <SelectItem value="medic">Médico(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="professional_license" render={({ field }) => (
                <FormItem>
                  <FormLabel>Registro (COREN/CRM)</FormLabel>
                  <FormControl><Input {...field} placeholder="Opcional para Cuidadores" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="bond_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vínculo Contratual</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="freelancer">Freelancer / Plantonista</SelectItem>
                      <SelectItem value="cooperative">Cooperado</SelectItem>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="clt">CLT</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="flex items-end pb-2">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(val) => field.onChange(!!val)}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Cadastro Ativo</FormLabel>
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={submitting} className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90 w-full sm:w-auto">
                {submitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Profissional"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
