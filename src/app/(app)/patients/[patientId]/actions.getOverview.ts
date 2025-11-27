"use server";

import { createClient } from "@/lib/supabase/server";

export type PatientOverview = {
  clinical: {
    summary: any | null;
    devices: any[];
    risks: any[];
  };
  logistics: any | null;
  support: any[];
  schedule: any[];
};

export async function getPatientOverview(patientId: string): Promise<PatientOverview> {
  const supabase = await createClient();
  const nowISO = new Date().toISOString();

  const clinicalPromise = (async () => {
    const [summaryRes, devicesRes, risksRes] = await Promise.all([
      supabase.from("patient_clinical_summaries").select("* ").eq("patient_id", patientId).maybeSingle(),
      supabase.from("patient_devices").select("*").eq("patient_id", patientId).eq("in_use", true),
      supabase.from("patient_risk_scores").select("*").eq("patient_id", patientId),
    ]);

    const risks = (risksRes.data || [])
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
      .reduce((acc: any[], curr: any) => {
        if (!acc.find((r) => r.risk_type === curr.risk_type)) acc.push(curr);
        return acc;
      }, []);

    return {
      summary: summaryRes.data || null,
      devices: devicesRes.data || [],
      risks,
    };
  })();

  const logisticsPromise = supabase
    .from("patient_addresses")
    .select("neighborhood, city, ambulance_access, night_access_risk, entry_procedure")
    .eq("patient_id", patientId)
    .maybeSingle();

  const supportPromise = supabase
    .from("patient_related_persons")
    .select("*")
    .or("is_legal_guardian.eq.true,is_emergency_contact.eq.true")
    .eq("patient_id", patientId)
    .order("is_legal_guardian", { ascending: false })
    .order("priority_order", { ascending: true });

  const schedulePromise = supabase
    .from("shifts")
    .select("id, start_time, end_time, status, professional:professional_profiles(full_name)")
    .eq("patient_id", patientId)
    .gte("start_time", nowISO)
    .order("start_time", { ascending: true })
    .limit(5);

  const [clinical, logistics, support, schedule] = await Promise.all([clinicalPromise, logisticsPromise, supportPromise, schedulePromise]);

  return {
    clinical,
    logistics: logistics.data || null,
    support: support.data || [],
    schedule: schedule.data || [],
  } as PatientOverview;
}
