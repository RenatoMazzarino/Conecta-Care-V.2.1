import { z } from "zod";

// Adaptado do repo antigo para a nova tabela
export const PatientPersonalSchema = z.object({
  patient_id: z.string().uuid(),
  full_name: z.string().min(2, "Nome obrigatório"),
  social_name: z.string().optional(),
  cpf: z.string().optional(), // Readonly geralmente
  rg: z.string().optional(),
  rg_issuer: z.string().optional(),
  cns: z.string().optional(),
  
  date_of_birth: z.coerce.date().optional(),
  gender: z.enum(["M", "F", "Other"]).optional(),
  gender_identity: z.string().optional(),
  
  mother_name: z.string().optional(),
  civil_status: z.string().optional(),
  nationality: z.string().optional(),
  place_of_birth: z.string().optional(),
  
  // Preferências (simplificado para V2)
  preferred_contact_method: z.enum(["whatsapp", "phone", "email"]).optional(),
});

export type PatientPersonalDTO = z.infer<typeof PatientPersonalSchema>;
