'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type InventoryItemInput = {
  id?: string;
  name: string;
  sku?: string;
  category: 'equipment' | 'consumable';
  brand?: string;
  model?: string;
  unit_of_measure?: string;
  is_trackable: boolean;
  min_stock_level: number;
};

export async function getInventoryMasterAction() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      allocations:patient_inventory(current_quantity)
    `)
    .order('name');

  if (error) {
    console.error("Erro Inventory Master:", error);
    return [];
  }

  return data.map((item: any) => ({
    ...item,
    total_allocated: (item.allocations || []).reduce((acc: number, curr: any) => acc + (curr.current_quantity || 0), 0)
  }));
}

export async function upsertInventoryItemAction(data: InventoryItemInput) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('inventory_items')
    .upsert({
      id: data.id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      brand: data.brand,
      model: data.model,
      unit_of_measure: data.unit_of_measure,
      is_trackable: data.is_trackable,
      min_stock_level: data.min_stock_level
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/inventory');
  return { success: true };
}

export async function deleteInventoryItemAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    
    if (error) return { success: false, error: "Não é possível excluir item em uso." };
    
    revalidatePath('/inventory');
    return { success: true };
}
