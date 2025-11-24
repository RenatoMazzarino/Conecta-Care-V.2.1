'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServiceSchema, ServiceDTO, ServiceCategoryEnum } from "@/data/definitions/service";
import { upsertServiceAction } from "../actions.services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, FirstAidKit } from "@phosphor-icons/react";

interface Props {
  service?: any;
  trigger?: React.ReactNode;
}

const categoryLabels: Record<string, string> = {
  shift: 'Plantão (Escala)',
  visit: 'Visita Pontual',
  procedure: 'Procedimento',
  equipment: 'Locação Equipamento',
  other: 'Outros'
};

export function ServiceDialog({ service, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!service;

  const form = useForm<ServiceDTO>({
    resolver: zodResolver(ServiceSchema) as any,
    defaultValues: {
      id: service?.id,
      name: service?.name ?? "",
      code: service?.code ?? "",
      category: service?.category ?? "shift",
      default_duration_minutes: service?.default_duration_minutes ? Number(service.default_duration_minutes) : 0,
      unit_measure: service?.unit_measure ?? "unidade",
      is_active: service?.is_active ?? true,
    }
  });

  async function onSubmit(data: ServiceDTO) {
    setSubmitting(true);
    try {
      const res = await upsertServiceAction(data);
      if (res.success) {
        toast.success(isEditing ? "Serviço atualizado!" : "Serviço cadastrado!");
        setOpen(false);
        form.reset();
        window.location.reload();
      } else {
        toast.error("Erro: " + res.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="bg-[#0F2B45] hover:bg-[#0F2B45]/90 text-white gap-2 shadow-fluent">
            <Plus className="h-4 w-4" /> Novo Serviço
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2B45]">
            <FirstAidKit className="h-5 w-5" />
            {isEditing ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
          <DialogDescription>Catálogo de procedimentos e itens faturáveis.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Serviço</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Plantão Técnico 12h Diurno" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código (TUSS/Interno)</FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: 10101012" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-white">
                      {ServiceCategoryEnum.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{categoryLabels[opt] || opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="default_duration_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração Padrão (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="unit_measure" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Medida</FormLabel>
                  <FormControl><Input {...field} placeholder="plantão, visita, km" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={value => field.onChange(value === true)} /></FormControl>
                  <FormLabel className="cursor-pointer">Ativo no Catálogo</FormLabel>
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={submitting} className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
