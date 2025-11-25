'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContractorSchema, ContractorDTO } from "@/data/definitions/contractor";
import { upsertContractorAction } from "../actions.contractors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Buildings } from "@phosphor-icons/react";

interface Props {
  contractor?: ContractorDTO;
  trigger?: React.ReactNode;
}

export function ContractorDialog({ contractor, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!contractor;

  const form = useForm<ContractorDTO>({
    resolver: zodResolver(ContractorSchema) as any,
    defaultValues: {
      id: contractor?.id,
      name: contractor?.name ?? "",
      commercial_name: contractor?.commercial_name ?? "",
      document_number: contractor?.document_number ?? "",
      type: contractor?.type ?? "health_plan",
      billing_due_days: contractor?.billing_due_days !== undefined ? Number(contractor.billing_due_days) : 30,
      integration_code: contractor?.integration_code ?? "",
      is_active: contractor?.is_active ?? true,
    }
  });

  async function onSubmit(data: ContractorDTO) {
    setSubmitting(true);
    try {
        const res = await upsertContractorAction(data);
        if (res.success) {
            toast.success(isEditing ? "Operadora atualizada!" : "Operadora cadastrada!");
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
            <Plus className="h-4 w-4" /> Nova Operadora
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2B45]">
            <Buildings className="h-5 w-5" />
            {isEditing ? "Editar Operadora" : "Nova Operadora"}
          </DialogTitle>
          <DialogDescription>Gestão de fontes pagadoras e contratos.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="commercial_name" render={({ field }) => (
                    <FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                
                <FormField control={form.control} name="document_number" render={({ field }) => (
                    <FormItem><FormLabel>CNPJ / CPF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                        <SelectItem value="health_plan">Convênio / Plano</SelectItem>
                        <SelectItem value="public_entity">Órgão Público (SUS)</SelectItem>
                        <SelectItem value="private_individual">Particular (PF)</SelectItem>
                        </SelectContent>
                    </Select>
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="billing_due_days" render={({ field }) => (
                    <FormItem><FormLabel>Prazo Pagto. (Dias)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
            </div>

            <div className="flex items-center justify-between pt-2">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer">Ativo</FormLabel>
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
