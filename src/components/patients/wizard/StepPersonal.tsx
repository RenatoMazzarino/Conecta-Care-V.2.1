'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { upsertPersonalWizardAction } from "@/app/(app)/patients/new/actions";
import { createClient } from "@/lib/supabase/client";
import { UploadSimple } from "@phosphor-icons/react";

const PersonalSchema = z.object({
  patient_id: z.string().uuid().optional(),
  full_name: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional(),
  date_of_birth: z.string().min(4, "Data obrigatória"),
  gender: z.string().min(1, "Selecione o sexo"),
});

type PersonalFormValues = z.infer<typeof PersonalSchema>;

type StepPersonalProps = {
  patientId?: string | null;
  onComplete: (patientId: string) => void;
};

export function StepPersonal({ patientId, onComplete }: StepPersonalProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<PersonalFormValues>({
    resolver: zodResolver(PersonalSchema),
    defaultValues: {
      patient_id: patientId || undefined,
      full_name: "",
      cpf: "",
      date_of_birth: "",
      gender: "Other",
    },
  });

  useEffect(() => {
    form.setValue("patient_id", patientId || undefined);
  }, [patientId, form]);

  // Carrega dados existentes se estiver retomando um rascunho
  useEffect(() => {
    const loadExisting = async () => {
      if (!patientId) return;
      const { data } = await supabase
        .from("patients")
        .select("full_name, cpf, gender, date_of_birth")
        .eq("id", patientId)
        .maybeSingle();
      if (data) {
        form.reset({
          patient_id: patientId,
          full_name: data.full_name || "",
          cpf: data.cpf || "",
          gender: data.gender || "Other",
          date_of_birth: data.date_of_birth
            ? new Date(data.date_of_birth).toISOString().split("T")[0]
            : "",
        });
      }
    };
    loadExisting();
  }, [patientId, supabase, form]);

  const handleUpload = async (file: File) => {
    if (!patientId) {
      toast.error("Salve o passo 1 antes de enviar documentos.");
      return;
    }
    setUploading(true);
    try {
      const path = `${patientId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("patient_documents").insert({
        patient_id: patientId,
        title: file.name,
        category: "identity",
        file_name: file.name,
        file_path: path,
        file_size_bytes: file.size,
        mime_type: file.type,
      });
      if (insertError) throw insertError;
      toast.success("Documento enviado!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: PersonalFormValues) => {
    const res = await upsertPersonalWizardAction({
      ...values,
      date_of_birth: new Date(values.date_of_birth),
    });
    if (!res.success || !res.patient_id) {
      toast.error(res.error || "Erro ao salvar dados pessoais");
      return;
    }
    toast.success("Dados pessoais salvos");
    onComplete(res.patient_id);
  };

  return (
    <Card className="shadow-fluent border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#0F2B45]">Passo 1: Identificação & Docs</CardTitle>
        <CardDescription className="text-slate-500">Dados essenciais para criar o prontuário.</CardDescription>
      </CardHeader>
      <CardContent className="bg-white border border-slate-100 rounded-md p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-8">
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-4">
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-4">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-4">
                  <FormLabel>Sexo</FormLabel>
                  <FormControl>
                    <Input placeholder="M / F / Other" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-12 flex items-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <UploadSimple className="h-4 w-4" />
                <span>Enviar RG/CPF (opcional)</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  disabled={uploading}
                />
              </label>
              {uploading && <span className="text-xs text-slate-500">Enviando...</span>}
            </div>

            <div className="col-span-12 flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" className="bg-[#0F2B45] text-white px-6">
                Salvar e Avançar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
