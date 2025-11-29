'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { quickCreatePatientAction } from "@/app/(app)/patients/actions.quick-create";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { UploadSimple, XCircle } from "@phosphor-icons/react";

const QuickSchema = z.object({
  full_name: z.string().min(2, "Obrigatório"),
  cpf: z.string().min(11, "Obrigatório"),
  date_of_birth: z.string().min(4, "Obrigatório"),
  gender: z.string().min(1, "Obrigatório"),
  bond_type: z.string().optional(),
  mobile_phone: z.string().optional(),
  email: z.string().optional(),
});

type QuickFormValues = z.infer<typeof QuickSchema>;

export function QuickCreateDrawer() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const form = useForm<QuickFormValues>({
    resolver: zodResolver(QuickSchema),
    defaultValues: {
      full_name: "",
      cpf: "",
      date_of_birth: "",
      gender: "Other",
      bond_type: "Particular",
      mobile_phone: "",
      email: "",
    },
  });

  const resetAll = () => {
    setCreatedId(null);
    form.reset();
  };

  const handleSave = async (mode: "draft" | "onboarding") => {
    const valid = await form.trigger();
    if (!valid && mode === "onboarding") return;
    const values = form.getValues();
    const res = await quickCreatePatientAction(
      { ...values, date_of_birth: new Date(values.date_of_birth) },
      mode
    );
    if (!res.success) {
      if (res.duplicate && res.patientId) {
        toast.error("CPF já cadastrado. Abrindo paciente existente...");
        setOpen(false);
        router.push(`/patients/${res.patientId}`);
        return;
      }
      toast.error(res.error || "Erro ao salvar");
      return;
    }
    setCreatedId(res.patientId!);
    if (mode === "draft") {
      toast.success("Rascunho salvo");
      setOpen(false);
      resetAll();
    } else {
      toast.success("Paciente criado. Abrindo admissão...");
      setOpen(false);
      resetAll();
      router.push(`/patients/${res.patientId}`);
    }
  };

  const handleUpload = async (file: File) => {
    if (!createdId) {
      toast.error("Salve primeiro para anexar documentos.");
      return;
    }
    setUploading(true);
    try {
      const path = `${createdId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(path, file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("patient_documents").insert({
        patient_id: createdId,
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
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button className="bg-[#0F2B45] text-white h-10 shadow-sm hover:bg-[#163A5C] gap-2" onClick={() => setOpen(true)}>
        Novo Paciente
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0">
          <SheetHeader className="px-6 py-4 border-b border-slate-200">
            <SheetTitle className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pacientes &gt; Quick Create</p>
                <p className="text-xl font-semibold text-[#0F2B45] mt-1">Novo Paciente</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <XCircle className="h-5 w-5 text-slate-400" weight="duotone" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto h-[calc(100vh-150px)] px-6 py-4 space-y-6 bg-slate-50">
            <Form {...form}>
              <form className="space-y-6">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-[#0F2B45] rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Identificação</p>
                      <p className="text-xs text-slate-500">Campos mínimos para criar o prontuário.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input autoFocus placeholder="Ex: João da Silva" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
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
                        <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
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
                        <FormItem>
                          <FormLabel>Sexo *</FormLabel>
                          <FormControl>
                            <Input placeholder="M / F / Other" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bond_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de contrato</FormLabel>
                          <FormControl>
                            <Input placeholder="Particular / Convênio" {...field} className="bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-slate-400 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Contato Básico</p>
                      <p className="text-xs text-slate-500">Canais rápidos para confirmação.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mobile_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Celular</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 90000-0000" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-slate-400 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Documentos (Opcional)</p>
                      <p className="text-xs text-slate-500">Envie RG/CPF se já tiver o registro criado.</p>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-md p-4 bg-slate-50 text-sm text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <UploadSimple className="h-4 w-4" />
                      <span>Anexar documento</span>
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
                    <p className="text-[11px] text-slate-500 mt-1">
                      {createdId ? "Será anexado ao prontuário." : "Salve primeiro para habilitar o upload."}
                    </p>
                  </div>
                </section>
              </form>
            </Form>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave("draft")}>
                Salvar rascunho
              </Button>
              <Button onClick={() => handleSave("onboarding")} className="bg-[#0F2B45] text-white">
                Salvar e abrir admissão
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
