import { createClient } from "@/lib/supabase/server";

export type ClinicalDashboard = {
  summary: {
    complexityLevel?: string | null;
    bloodType?: string | null;
    lastUpdateAt?: string | null;
    referenceProfessional?: { id?: string | null; name?: string | null } | null;
    clinicalSummary?: string | null;
  } | null;
  diagnoses: {
    primaryCid?: string | null;
    primaryDescription?: string | null;
    secondary: string[];
  };
  riskScores: Array<{
    name: string;
    score?: number | null;
    riskLevel?: string | null;
    assessedAt?: string | null;
    maxScore?: number | null;
  }>;
  allergies: Array<{ id?: string; allergen?: string | null; reaction?: string | null; severity?: string | null; since?: string | null }>;
  medications: Array<{
    id: string;
    name?: string | null;
    dosage?: string | null;
    frequency?: string | null;
    route?: string | null;
    isCritical?: boolean | null;
    updatedAt?: string | null;
  }>;
  oxygenTherapy?: {
    flow?: string | number | null;
    interface?: string | null;
    mode?: string | null;
    source?: string | null;
    since?: string | null;
    notes?: string | null;
  } | null;
  devices: Array<{ id?: string; type?: string | null; description?: string | null; installedAt?: string | null; isActive?: boolean | null }>;
  tags: string[];
  observations?: string | null;
};

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string") {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return [];
};

const normalizeSecondaryDiagnoses = (summary: any, profile: any) => {
  if (summary?.secondary_diagnoses?.length) return asStringArray(summary.secondary_diagnoses);
  if (summary?.secondary_diagnoses_text) return asStringArray(summary.secondary_diagnoses_text);
  if (profile?.secondary_diagnoses) return asStringArray(profile.secondary_diagnoses);
  return [];
};

const bradenRiskLevel = (score?: number | null) => {
  if (typeof score !== "number") return null;
  if (score <= 9) return "Risco Muito Alto";
  if (score <= 12) return "Risco Alto";
  if (score <= 14) return "Risco Moderado";
  if (score <= 18) return "Risco Baixo";
  return "Sem risco";
};

const morseRiskLevel = (score?: number | null) => {
  if (typeof score !== "number") return null;
  if (score >= 45) return "Risco Alto";
  if (score >= 25) return "Risco Moderado";
  return "Risco Baixo";
};

export async function getPatientClinicalDashboard(patientId: string): Promise<ClinicalDashboard> {
  const supabase = await createClient();

  const [summaryRes, profileRes, allergiesRes, medicationsRes, oxygenRes, devicesRes, riskScoresRes] = await Promise.all([
    supabase
      .from("patient_clinical_summaries")
      .select("*")
      .eq("patient_id", patientId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("patient_clinical_profiles")
      .select("*")
      .eq("patient_id", patientId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("patient_allergies")
      .select("id,name as allergen,reaction,severity,start_date,is_active")
      .eq("patient_id", patientId),
    supabase
      .from("patient_medications")
      .select("id,name,dosage,frequency,route,is_critical,status,updated_at")
      .eq("patient_id", patientId),
    supabase
      .from("patient_oxygen_therapy")
      .select("id,is_active,flow,interface,mode,source,started_at,notes")
      .eq("patient_id", patientId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("patient_devices")
      .select("id,device_type,description,installed_at,is_active")
      .eq("patient_id", patientId),
    supabase
      .from("patient_risk_scores")
      .select("id,scale_name,risk_type,score_value,score,risk_level,assessed_at,created_at,max_score")
      .eq("patient_id", patientId),
  ]);

  const summary = summaryRes.data || null;
  const profile = profileRes.data || null;

  let referenceProfessionalName = summary?.reference_professional_name || summary?.reference_professional_full_name || null;
  if (!referenceProfessionalName && summary?.reference_professional_id) {
    const professionalRes = await supabase
      .from("professionals")
      .select("full_name")
      .eq("id", summary.reference_professional_id)
      .maybeSingle();
    referenceProfessionalName = professionalRes.data?.full_name || null;
  }

  const summaryBlock = summary
    ? {
        complexityLevel: summary.complexity_level || profile?.complexity_level || null,
        bloodType: summary.blood_type || profile?.blood_type || null,
        lastUpdateAt: summary.last_clinical_update_at || summary.updated_at || profile?.updated_at || null,
        referenceProfessional: summary.reference_professional_id
          ? { id: summary.reference_professional_id, name: referenceProfessionalName }
          : referenceProfessionalName
            ? { id: null, name: referenceProfessionalName }
            : null,
        clinicalSummary: summary.clinical_summary_text || summary.clinical_summary || profile?.clinical_summary || null,
      }
    : profile
      ? {
          complexityLevel: profile?.complexity_level || null,
          bloodType: profile?.blood_type || null,
          lastUpdateAt: profile?.updated_at || null,
          referenceProfessional: null,
          clinicalSummary: profile?.clinical_summary || profile?.clinical_notes || null,
        }
      : null;

  const diagnosesBlock = {
    primaryCid: summary?.primary_diagnosis_cid || profile?.cid_main || null,
    primaryDescription: summary?.primary_diagnosis_description || profile?.primary_diagnosis_description || null,
    secondary: normalizeSecondaryDiagnoses(summary, profile),
  };

  const riskFromProfile = [] as ClinicalDashboard["riskScores"];
  if (typeof profile?.risk_braden === "number") {
    riskFromProfile.push({
      name: "Braden",
      score: profile.risk_braden,
      riskLevel: bradenRiskLevel(profile.risk_braden),
      assessedAt: profile.updated_at || summary?.last_clinical_update_at || null,
      maxScore: 23,
    });
  }
  if (typeof profile?.risk_morse === "number") {
    riskFromProfile.push({
      name: "Morse",
      score: profile.risk_morse,
      riskLevel: morseRiskLevel(profile.risk_morse),
      assessedAt: profile.updated_at || summary?.last_clinical_update_at || null,
      maxScore: 125,
    });
  }

  const riskFromTable = (riskScoresRes.data || []).map((risk) => ({
    name: risk.scale_name || risk.risk_type || "Risco",
    score: typeof risk.score_value === "number" ? risk.score_value : typeof risk.score === "number" ? risk.score : null,
    riskLevel: risk.risk_level || null,
    assessedAt: risk.assessed_at || risk.created_at || null,
    maxScore: typeof risk.max_score === "number" ? risk.max_score : null,
  }));

  const riskMap = new Map<string, ClinicalDashboard["riskScores"][number]>();
  [...riskFromTable, ...riskFromProfile].forEach((entry) => {
    const existing = riskMap.get(entry.name);
    if (!existing || (entry.assessedAt && (!existing.assessedAt || entry.assessedAt > existing.assessedAt))) {
      riskMap.set(entry.name, entry);
    }
  });

  const allergies = (allergiesRes.data || [])
    .filter((a) => a.is_active !== false)
    .map((a) => ({
      id: a.id,
      allergen: a.allergen || a.name,
      reaction: a.reaction || null,
      severity: a.severity || null,
      since: a.start_date || null,
    }));

  const medications = (medicationsRes.data || [])
    .filter((m) => (m.status || "").toLowerCase() === "active")
    .sort((a, b) => {
      const criticalScore = (item: any) => (item.is_critical ? 1 : 0);
      if (criticalScore(a) !== criticalScore(b)) return criticalScore(b) - criticalScore(a);
      return (b.updated_at ? new Date(b.updated_at).getTime() : 0) - (a.updated_at ? new Date(a.updated_at).getTime() : 0);
    })
    .map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage || null,
      frequency: m.frequency || null,
      route: m.route || null,
      isCritical: !!m.is_critical,
      updatedAt: m.updated_at || null,
    }));

  const oxygenTherapy = oxygenRes.data && oxygenRes.data.is_active !== false
    ? {
        flow: oxygenRes.data.flow ?? null,
        interface: oxygenRes.data.interface || null,
        mode: oxygenRes.data.mode || null,
        source: oxygenRes.data.source || null,
        since: oxygenRes.data.started_at || null,
        notes: oxygenRes.data.notes || null,
      }
    : null;

  const devices = (devicesRes.data || [])
    .filter((d) => d.is_active !== false)
    .map((d) => ({
      id: d.id,
      type: d.device_type || null,
      description: d.description || null,
      installedAt: d.installed_at || null,
      isActive: d.is_active !== false,
    }));

  const tags = asStringArray(summary?.clinical_tags || profile?.clinical_tags);
  const observations = summary?.additional_notes || profile?.clinical_notes || null;

  return {
    summary: summaryBlock,
    diagnoses: diagnosesBlock,
    riskScores: Array.from(riskMap.values()),
    allergies,
    medications,
    oxygenTherapy,
    devices,
    tags,
    observations,
  };
}
