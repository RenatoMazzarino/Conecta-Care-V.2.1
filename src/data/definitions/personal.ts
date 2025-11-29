import { z } from "zod";

const CivilDocSchema = z.object({
  id: z.string().uuid().optional(),
  doc_type: z.string().min(1, "Tipo obrigatório"),
  doc_number: z.string().min(1, "Número obrigatório"),
  issuer: z.string().optional(),
  issuer_country: z.string().optional(),
  issued_at: z.coerce.date().optional(),
  valid_until: z.coerce.date().optional(),
});

export const PatientPersonalSchema = z.object({
  patient_id: z.string().uuid(),
  civil_documents: z.array(CivilDocSchema).optional(),
  
  // Identidade
  full_name: z.string().min(2, "Nome obrigatório"),
  date_of_birth: z.coerce.date(),
  gender: z.enum(["Masculino", "Feminino", "Intersexo", "Outro", "Não informado"]),

  salutation: z.string().optional(),
  nickname: z.string().optional(),
  social_name: z.string().optional(),
  pronouns: z.enum(["Ele/Dele", "Ela/Dela", "Elu/Delu", "Outro"]).optional(),
  gender_identity: z.enum(["Cisgenero", "Transgenero", "Nao Binario", "Outro", "Prefiro nao informar"]).optional(),
  civil_status: z.enum(["Solteiro(a)", "Casado(a)", "União estável", "Separado(a)", "Divorciado(a)", "Viúvo(a)"]).optional(),
  marital_status: z.enum(["Solteiro(a)", "Casado(a)", "União estável", "Separado(a)", "Divorciado(a)", "Viúvo(a)"]).optional(),
  mother_name: z.string().optional(),
  father_name: z.string().optional(),
  nationality: z.string().default("Brasileira"),
  preferred_language: z.string().optional(),
  place_of_birth_country: z.string().optional(),
  place_of_birth_state: z.string().optional(),
  place_of_birth_city: z.string().optional(),

  education_level: z.enum([
    "Nao Alfabetizado",
    "Fundamental Incompleto",
    "Fundamental Completo",
    "Medio Incompleto",
    "Medio Completo",
    "Superior Incompleto",
    "Superior Completo",
    "Pos Graduacao",
    "Mestrado/Doutorado",
    "Nao Informado"
  ]).optional(),
  profession: z.string().optional(),
  race_color: z.enum(["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não declarado"]).optional(),
  is_pcd: z.boolean().default(false),
  photo_consent: z.boolean().default(false),
  photo_consent_date: z.coerce.date().optional(),

  // Documentos
  cpf: z.string().min(11, "CPF obrigatório"),
  cpf_status: z.string().optional(),
  cpf_status_label: z.enum([
    "Regular",
    "Pendente de Regularizacao",
    "Suspenso",
    "Cancelado",
    "Titular Falecido",
    "Nulo"
  ]).optional(),
  rg: z.string().optional(),
  rg_issuer: z.string().optional(),
  rg_issuer_state: z.string().length(2).optional(),
  rg_issued_at: z.coerce.date().optional(),
  cns: z.string().optional(),
  national_id: z.string().optional(),
  document_validation_method: z.string().optional(),
  doc_validation_status: z.enum(["Pendente", "Validado", "Rejeitado", "Nao_Validado", "Inconsistente"]).optional(),
  doc_validated_at: z.string().datetime().optional(),
  doc_validated_by: z.string().uuid().optional(),
  doc_validation_source: z.string().optional(),

  // Contatos
  mobile_phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  pref_contact_method: z.enum(["whatsapp", "phone", "sms", "email", "other"]).optional(),
  contact_time_preference: z.enum(["Manha", "Tarde", "Noite", "Comercial", "Qualquer Horario"]).optional(),
  contact_notes: z.string().max(255).optional(),
  
  // Preferências
  accept_sms: z.boolean().default(true),
  accept_email: z.boolean().default(true),
  block_marketing: z.boolean().default(false),
  marketing_consented_at: z.string().datetime().optional(),
  marketing_consent_source: z.string().optional(),
  marketing_consent_ip: z.string().optional(),
  marketing_consent_status: z.enum(["pending", "accepted", "rejected"]).optional(),
  marketing_consent_history: z.string().optional(),
});

export type PatientPersonalDTO = z.infer<typeof PatientPersonalSchema>;
