import { z } from "zod";

export const MedicationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nome do medicamento obrigatório"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  route: z.string().optional(),
  is_critical: z.boolean().default(false),
  status: z.enum(["active", "suspended", "discontinued"]).default("active"),
});

export const PatientClinicalSchema = z.object({
  patient_id: z.string().uuid(),
  cid_main: z.string().optional(),
  complexity_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  blood_type: z.string().optional(),
  clinical_summary: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  devices: z.array(z.string()).optional(),
  risk_braden: z.coerce.number().min(0).max(23).optional(),
  risk_morse: z.coerce.number().min(0).max(125).optional(),
  oxygen_usage: z.boolean().default(false),
  oxygen_mode: z.string().optional(),
  oxygen_interface: z.string().optional(),
  oxygen_flow: z.string().optional(),
  oxygen_regime: z.string().optional(),
  medications: z.array(MedicationSchema).optional(),
});

export type PatientClinicalDTO = z.infer<typeof PatientClinicalSchema>;
