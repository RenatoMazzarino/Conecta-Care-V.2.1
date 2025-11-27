"use server";

import { createClient } from "@/lib/supabase/server";
import { AssignAssetZ, ReturnAssetZ, UpdateConsumableZ } from "@/schemas/inventory";

export async function assignAsset(data: unknown) {
  const parsed = AssignAssetZ.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos" };
  const supabase = await createClient();
  const payload = parsed.data;
  const { error } = await supabase.from("patient_assigned_assets").insert({
    patient_id: payload.patientId,
    item_id: payload.itemId,
    serial_number: payload.serial,
    location: payload.location,
    status: "em_uso",
  });
  if (error) return { success: false, error: error.message };
  await supabase.from("inventory_movements").insert({
    patient_id: payload.patientId,
    item_id: payload.itemId,
    movement_type: "assign",
    quantity: 1,
    note: payload.location,
  });
  return { success: true };
}

export async function returnAsset(data: unknown) {
  const parsed = ReturnAssetZ.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos" };
  const supabase = await createClient();
  const payload = parsed.data;
  const { error } = await supabase.from("patient_assigned_assets").update({ status: "devolvido", returned_at: payload.returnedAt }).eq("id", payload.assetId);
  if (error) return { success: false, error: error.message };
  await supabase.from("inventory_movements").insert({
    movement_type: "return",
    asset_id: payload.assetId,
    note: payload.reason,
  });
  return { success: true };
}

export async function updateConsumableStock(data: unknown) {
  const parsed = UpdateConsumableZ.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos" };
  const supabase = await createClient();
  const payload = parsed.data;
  const delta = payload.type === "in" ? payload.quantity : -payload.quantity;

  const { data: existing } = await supabase
    .from("patient_consumables_stock")
    .select("quantity, id")
    .eq("patient_id", payload.patientId)
    .eq("item_id", payload.itemId)
    .single();

  const newQty = (existing?.quantity || 0) + delta;

  if (existing?.id) {
    const { error } = await supabase
      .from("patient_consumables_stock")
      .update({ quantity: newQty })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("patient_consumables_stock")
      .insert({ patient_id: payload.patientId, item_id: payload.itemId, quantity: newQty, min_quantity: 0 });
    if (error) return { success: false, error: error.message };
  }

  await supabase.from("inventory_movements").insert({
    patient_id: payload.patientId,
    item_id: payload.itemId,
    movement_type: payload.type === "in" ? "entrada" : "saida",
    quantity: payload.quantity,
    note: payload.note,
  });
  return { success: true };
}
