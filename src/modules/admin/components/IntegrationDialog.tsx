'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IntegrationConfigSchema, IntegrationConfigDTO, ProviderEnum } from "@/data/definitions/integration";
import { upsertIntegrationAction } from "../actions.integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PlugsConnected, Key } from "@phosphor-icons/react";

interface Props {
  config?: IntegrationConfigDTO;
  trigger?: React.ReactNode;
}

const providerLabels: Record<string, string> = {
  conta_azul: 'Conta Azul (ERP)',
  pagar_me: 'Pagar.me (Split)',
  celcoin: 'Celcoin (Baas/Pix)',
  asaas: 'Asaas (Cobrança)'
};

export function IntegrationDialog({ config, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!config;

  const form = useForm<IntegrationConfigDTO>({
    resolver: zodResolver(IntegrationConfigSchema),
    defaultValues: {
      id: config?.id,
      provider: config?.provider ?? 'conta_azul',
      environment: config?.environment ?? 'sandbox',
      api_key: config?.api_key ?? '',
      api_secret: config?.api_secret ?? '',
      webhook_url: config?.webhook_url ?? '',
      is_active: config?.is_active ?? false,
    }
  });

  async function onSubmit(data: IntegrationConfigDTO) {
    setSubmitting(true);
    try {
        const res = await upsertIntegrationAction(data);
        if (res.success) {
            toast.success("Integração salva com sucesso!");
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
            <PlugsConnected className="h-4 w-4" /> Nova Integração
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2B45]">
            <Key className="h-5 w-5" />
            {isEditing ? "Editar Credenciais" : "Nova Conexão"}
          </DialogTitle>
          <DialogDescription>
            Configure as chaves de API para comunicação bancária e fiscal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="provider" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Provedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                           {ProviderEnum.options.map(opt => (
                             <SelectItem key={opt} value={opt}>{providerLabels[opt] || opt}</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="environment" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                            <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                            <SelectItem value="production">Produção (Real)</SelectItem>
                        </SelectContent>
                    </Select>
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="api_key" render={({ field }) => (
                <FormItem>
                    <FormLabel>API Key (Chave Pública)</FormLabel>
                    <FormControl><Input {...field} type="password" /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            
            <FormField control={form.control} name="api_secret" render={({ field }) => (
                <FormItem>
                    <FormLabel>API Secret (Chave Privada)</FormLabel>
                    <FormControl><Input {...field} type="password" /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="webhook_url" render={({ field }) => (
                <FormItem>
                    <FormLabel>Webhook URL (Opcional)</FormLabel>
                    <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="flex items-center gap-2 pt-2">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={value => field.onChange(value === true)} /></FormControl>
                        <FormLabel className="cursor-pointer">Integração Ativa</FormLabel>
                    </FormItem>
                )} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={submitting} className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">
                {submitting ? "Salvando..." : "Salvar Conexão"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
