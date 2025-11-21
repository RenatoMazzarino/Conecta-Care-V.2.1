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
  
  // Perfil Geral
  complexity_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  diagnosis_main: z.string().optional(),
  diagnosis_secondary: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  clinical_tags: z.array(z.string()).optional(),
  clinical_summary_note: z.string().optional(),

  // Riscos e Escalas
  risk_braden: z.coerce.number().min(0).max(23).optional(),
  risk_morse: z.coerce.number().min(0).max(125).optional(),
  
  // Oxigenoterapia
  oxygen_usage: z.boolean().default(false),
  oxygen_flow: z.string().optional(),
  oxygen_equipment: z.string().optional(),

  // Medicamentos (Sub-tabela)
  medications: z.array(MedicationSchema).optional(),
});

export type PatientClinicalDTO = z.infer<typeof PatientClinicalSchema>;
