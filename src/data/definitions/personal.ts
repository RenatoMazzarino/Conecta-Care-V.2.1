import { z } from "zod";

export const PatientPersonalSchema = z.object({
  patient_id: z.string().uuid(),
  
  // Identidade
  full_name: z.string().min(2, "Nome obrigatório"),
  social_name: z.string().optional(),
  salutation: z.string().optional(),
  pronouns: z.string().optional(),
  date_of_birth: z.coerce.date().optional(),
  gender: z.string().optional(),
  gender_identity: z.string().optional(),
  civil_status: z.string().optional(),
  nationality: z.string().optional(),
  place_of_birth: z.string().optional(),
  preferred_language: z.string().optional(),
  mother_name: z.string().optional(),
  photo_consent: z.boolean().default(false),

  // Documentos
  cpf: z.string().optional(),
  cpf_status: z.string().optional(),
  rg: z.string().optional(),
  rg_issuer: z.string().optional(),
  cns: z.string().optional(),
  national_id: z.string().optional(),
  document_validation_method: z.string().optional(),

  // Contatos
  mobile_phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  pref_contact_method: z.enum(["whatsapp", "phone", "email"]).optional(),
  
  // Preferências
  accept_sms: z.boolean().default(true),
  accept_email: z.boolean().default(true),
  block_marketing: z.boolean().default(false),
});

export type PatientPersonalDTO = z.infer<typeof PatientPersonalSchema>;
