'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { upsertInventoryItemAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package, Plus } from "@phosphor-icons/react";

type InventoryFormData = {
  id?: string;
  name: string;
  sku?: string;
  category: "equipment" | "consumable";
  brand?: string;
  model?: string;
  unit_of_measure?: string;
  is_trackable: boolean;
  min_stock_level: number;
};

interface Props {
  item?: InventoryFormData;
  trigger?: React.ReactNode;
}

export function InventoryMasterDialog({ item, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditing = !!item;

  const { register, handleSubmit, setValue, watch, reset } = useForm<InventoryFormData>({
    defaultValues: {
      id: item?.id,
      name: item?.name ?? "",
      sku: item?.sku ?? "",
      category: item?.category ?? "equipment",
      brand: item?.brand ?? "",
      model: item?.model ?? "",
      unit_of_measure: item?.unit_of_measure ?? "unidade",
      is_trackable: item?.is_trackable ?? true,
      min_stock_level: item?.min_stock_level ?? 5,
    }
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const category = watch('category');

  async function onSubmit(data: InventoryFormData) {
    setLoading(true);
    const res = await upsertInventoryItemAction(data);
    setLoading(false);

    if (res.success) {
      toast.success("Item salvo com sucesso!");
      setOpen(false);
      if (!isEditing) reset();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="bg-[#0F2B45] hover:bg-[#0F2B45]/90 text-white gap-2 shadow-fluent">
            <Plus className="h-4 w-4" /> Novo Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2B45]">
            <Package className="h-5 w-5" />
            {isEditing ? "Editar Item" : "Novo Item de Estoque"}
          </DialogTitle>
          <DialogDescription>Gerencie o catálogo mestre de equipamentos e insumos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1">
                    <Label>Nome do Item</Label>
                    <Input {...register('name')} placeholder="Ex: Concentrador de O2" required />
                </div>
                <div className="col-span-4 space-y-1">
                    <Label>SKU / Código</Label>
                    <Input {...register('sku')} placeholder="COD-001" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select onValueChange={(v) => setValue('category', v as InventoryFormData['category'])} defaultValue={category}>
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="equipment">Equipamento (Ativo)</SelectItem>
                            <SelectItem value="consumable">Consumível (Gasto)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Unidade</Label>
                    <Input {...register('unit_of_measure')} placeholder="un, cx, pct" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Marca</Label>
                    <Input {...register('brand')} placeholder="Ex: Philips" />
                </div>
                <div className="space-y-1">
                    <Label>Modelo</Label>
                    <Input {...register('model')} placeholder="Ex: Everflo 5L" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <Checkbox 
                        id="track" 
                        checked={watch('is_trackable')} 
                        onCheckedChange={(c) => setValue('is_trackable', !!c)}
                    />
                    <Label htmlFor="track" className="cursor-pointer">Exige Rastreio (Serial Number)?</Label>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">
                {loading ? "Salvando..." : "Salvar Item"}
              </Button>
            </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
