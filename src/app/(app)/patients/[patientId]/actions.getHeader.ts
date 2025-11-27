"use server";

import { createClient } from "@/lib/supabase/server";

export type PatientHeaderData = {
  identity: { name: string; age: number | string; status: string; type: string };
  contract: { origin: string; payer: string; planId: string; validity: string };
  kpis: {
    scheduleCoverage: number; // %
    financialStatus: "ok" | "overdue";
    overdueAmount: number;
  };
  alerts: {
    allergies: string[];
    risks: string[];
  };
};

function calcAge(date?: string | null): number | string {
  if (!date) return "--";
  const dob = new Date(date);
  if (Number.isNaN(dob.getTime())) return "--";
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export async function getPatientHeaderData(patientId: string): Promise<PatientHeaderData | null> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [patientRes, adminRes, ledgerRes, shiftsRes, allergiesRes, risksRes] = await Promise.all([
    supabase.from("patients").select("full_name,date_of_birth,gender,cpf,status,record_status").eq("id", patientId).maybeSingle(),
    supabase
      .from("patient_admin_info")
      .select("demand_origin, primary_payer_type, external_contract_id, contract_end_date, admission_type")
      .eq("patient_id", patientId)
      .maybeSingle(),
    supabase
      .from("financial_ledger_entries")
      .select("amount_due, amount_paid, status")
      .eq("patient_id", patientId)
      .eq("status", "overdue"),
    supabase
      .from("shifts")
      .select("id, professional_id")
      .eq("patient_id", patientId)
      .gte("start_time", startOfMonth)
      .lt("start_time", startOfNextMonth),
    supabase.from("patient_allergies").select("name,is_active").eq("patient_id", patientId),
    supabase.from("patient_risk_scores").select("risk_type,score,created_at").eq("patient_id", patientId),
  ]);

  if (!patientRes.data) return null;

  // Financeiro
  const overdueAmount = (ledgerRes.data || []).reduce((sum, row) => {
    const paid = Number(row.amount_paid || 0);
    const due = Number(row.amount_due || 0);
    return sum + Math.max(due - paid, 0);
  }, 0);
  const financialStatus: "ok" | "overdue" = overdueAmount > 0 ? "overdue" : "ok";

  // Escala
  const totalShifts = shiftsRes.data?.length || 0;
  const missingProfessional = (shiftsRes.data || []).filter((s) => !s.professional_id).length;
  const scheduleCoverage = totalShifts === 0 ? 0 : Math.max(0, Math.round(((totalShifts - missingProfessional) / totalShifts) * 100));

  // Alertas
  const allergies = (allergiesRes.data || []).filter((a) => a.is_active !== false).map((a) => a.name).filter(Boolean);
  const risksUnique: Record<string, { score: number | null }> = {};
  (risksRes.data || [])
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .forEach((r) => {
      if (!risksUnique[r.risk_type]) risksUnique[r.risk_type] = { score: r.score ?? null };
    });
  const risks = Object.entries(risksUnique).map(([type, val]) => `${type}: ${val.score ?? "--"}`);

  const admin = (adminRes.data || {}) as any;
  const patient = patientRes.data;

  return {
    identity: {
      name: patient.full_name,
      age: calcAge(patient.date_of_birth),
      status: patient.record_status || patient.status || "--",
      type: admin.admission_type || "Caso",
    },
    contract: {
      origin: admin.demand_origin || "—",
      payer: admin.primary_payer_type || "—",
      planId: admin.external_contract_id || "—",
      validity: admin.contract_end_date || "—",
    },
    kpis: {
      scheduleCoverage,
      financialStatus,
      overdueAmount,
    },
    alerts: {
      allergies,
      risks,
    },
  } satisfies PatientHeaderData;
}
