'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BillingBatchSchema, BillingBatchDTO } from "@/data/definitions/billing";
import { generateBillingBatchAction } from "../actions";
import { getContractorsAction } from "../../admin/actions.contractors";
import { ContractorDTO } from "@/data/definitions/contractor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { HandCoins, Spinner } from "@phosphor-icons/react";

export function BillingGenerator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState<ContractorDTO[]>([]);

  const form = useForm<BillingBatchDTO>({
    resolver: zodResolver(BillingBatchSchema) as any,
  });

  useEffect(() => {
    if (open && contractors.length === 0) {
      getContractorsAction().then((data) => {
        const normalized = (data || []).map((c: ContractorDTO & { id?: string }) => ({
          ...c,
          id: c.id || "",
        }));
        setContractors(normalized);
      });
    }
  }, [open, contractors.length]);

  async function onSubmit(data: BillingBatchDTO) {
    setLoading(true);
    try {
      const res = await generateBillingBatchAction(data);
      if (res.success) {
        toast.success(`Lote gerado! ${res.count} plantões vinculados. Total: R$ ${res.value}`);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0F2B45] text-white gap-2 shadow-fluent hover:bg-[#0F2B45]/90">
          <HandCoins size={18} weight="bold" />
          Fechar Faturamento
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Gerar Lote de Faturamento</DialogTitle>
          <DialogDescription>Agrupa plantões finalizados em uma fatura.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <FormField control={form.control} name="contractor_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Operadora / Fonte Pagadora</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {contractors.map(c => <SelectItem key={c.id} value={c.id || ""}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="competence_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Competência (Mês/Ano)</FormLabel>
                <FormControl>
                  <input 
                    type="month" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    onChange={(e) => field.onChange(new Date(e.target.value + "-01T00:00:00"))}
                  />
                </FormControl>
              </FormItem>
            )} />

            <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={loading} className="w-full bg-[#D46F5D] hover:bg-[#D46F5D]/90">
                    {loading ? <Spinner className="animate-spin mr-2"/> : "Processar Fechamento"}
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
