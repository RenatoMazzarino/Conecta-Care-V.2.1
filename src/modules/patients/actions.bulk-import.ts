"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BulkImportPatient = {
  full_name: string;
  cpf: string;
  date_of_birth?: string; // ISO ou DD/MM/YYYY
  gender?: "M" | "F" | "Other";
  contractor_name?: string;
};

export async function bulkImportPatientsAction(patients: BulkImportPatient[]) {
  const supabase = await createClient();

  const { data: contractors } = await supabase.from("contractors").select("id, name");

  const findContractorId = (name?: string | null) => {
    if (!name) return null;
    const normalized = name.toLowerCase().trim();
    const match = contractors?.find((c) => c.name.toLowerCase().includes(normalized));
    return match?.id ?? null;
  };

  const cleanPatients = patients.map((p) => {
    let dob = p.date_of_birth;
    if (dob && dob.includes("/")) {
      const [d, m, y] = dob.split("/");
      dob = `${y}-${m}-${d}`;
    }

    return {
      full_name: p.full_name,
      cpf: p.cpf.replace(/\D/g, ""),
      date_of_birth: dob,
      gender: p.gender ?? "Other",
      status: "active",
      primary_contractor_id: findContractorId(p.contractor_name),
    };
  });

  const { data, error } = await supabase
    .from("patients")
    .upsert(cleanPatients, { onConflict: "cpf", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("Erro Bulk Import:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/patients");
  return { success: true, count: data?.length || 0 };
}
