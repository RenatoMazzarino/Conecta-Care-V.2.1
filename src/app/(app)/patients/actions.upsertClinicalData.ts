"use server";

import { createClient } from "@/lib/supabase/server";
import { PatientClinicalSchema, PatientClinicalDTO } from "@/data/definitions/clinical";
import { revalidatePath } from "next/cache";

export async function upsertClinicalDataAction(data: PatientClinicalDTO) {
  const supabase = await createClient();
  const parsed = PatientClinicalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados clínicos inválidos" };
  }
  const form = parsed.data;
  const patientId = form.patient_id;

  // 1. Summary
  const { error: summaryError } = await supabase
    .from("patient_clinical_summaries")
    .upsert({
      patient_id: patientId,
      cid_main: form.cid_main,
      complexity_level: form.complexity_level,
      blood_type: form.blood_type,
      clinical_summary: form.clinical_summary,
    }, { onConflict: "patient_id" });

  if (summaryError) {
    console.error("Erro summary:", summaryError);
    return { success: false, error: summaryError.message };
  }

  // 2. Allergies
  if (form.allergies) {
    await supabase.from("patient_allergies").delete().eq("patient_id", patientId);
    if (form.allergies.length > 0) {
      const rows = form.allergies.map((a) => ({ patient_id: patientId, name: a }));
      await supabase.from("patient_allergies").insert(rows);
    }
  }

  // 3. Devices
  if (form.devices) {
    await supabase.from("patient_devices").delete().eq("patient_id", patientId);
    if (form.devices.length > 0) {
      const rows = form.devices.map((d) => ({ patient_id: patientId, device_type: d, in_use: true }));
      await supabase.from("patient_devices").insert(rows);
    }
  }

  // 4. Risks
  await supabase.from("patient_risk_scores").delete().eq("patient_id", patientId);
  const riskRows = [];
  if (form.risk_braden !== undefined) riskRows.push({ patient_id: patientId, risk_type: "braden", score: form.risk_braden });
  if (form.risk_morse !== undefined) riskRows.push({ patient_id: patientId, risk_type: "morse", score: form.risk_morse });
  if (riskRows.length > 0) await supabase.from("patient_risk_scores").insert(riskRows);

  // 5. Oxygen
  const { error: oxyError } = await supabase
    .from("patient_oxygen_support")
    .upsert({
      patient_id: patientId,
      in_use: form.oxygen_usage,
      mode: form.oxygen_mode,
      interface: form.oxygen_interface,
      flow: form.oxygen_flow,
      regime: form.oxygen_regime,
    }, { onConflict: "patient_id" });
  if (oxyError) console.error("Erro oxigenio:", oxyError);

  // 6. Medications (mantém tabela existente)
  if (form.medications) {
    await supabase.from("patient_medications").delete().eq("patient_id", patientId);
    if (form.medications.length > 0) {
      const meds = form.medications.map((m) => ({
        patient_id: patientId,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        is_critical: m.is_critical,
        status: m.status,
      }));
      await supabase.from("patient_medications").insert(meds);
    }
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
