import { z } from "zod";

export const DocumentCategoryEnum = z.enum([
  "Identificacao",
  "Juridico",
  "Financeiro",
  "Clinico",
  "Consentimento",
  "Outros",
]);

export const DocumentDomainEnum = z.enum(["Administrativo", "Clinico", "Misto"]);

export const DocumentOriginEnum = z.enum([
  "Ficha_Documentos",
  "Ficha_Administrativo",
  "Ficha_Financeiro",
  "Prontuario",
  "PortalPaciente",
  "Importacao",
  "Outro",
]);

export const DocumentStatusEnum = z.enum([
  "Ativo",
  "Substituido",
  "Arquivado",
  "Rascunho",
  "ExcluidoLogicamente",
]);

export const StorageProviderEnum = z.enum(["Local", "S3", "GCS", "Supabase", "Outro"]);
export const SignatureTypeEnum = z.enum(["Nenhuma", "EletronicaSimples", "EletronicaAvancada", "ICPBrasil", "CarimboTempo"]);

// Schema para salvar os METADADOS após o upload do arquivo (GED)
export const PatientDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),

  // Identificação básica
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  external_ref: z.string().optional(),

  // Classificação
  domain: DocumentDomainEnum.default("Administrativo"),
  category: DocumentCategoryEnum,
  subcategory: z.string().optional(),
  origin_module: DocumentOriginEnum.default("Ficha_Documentos"),

  // Status
  document_status: DocumentStatusEnum.default("Ativo"),

  // Segurança
  confidential: z.boolean().default(false),
  clinical_visible: z.boolean().default(true),
  admin_fin_visible: z.boolean().default(true),
  min_access_role: z.string().optional(),

  // Arquivo / storage
  storage_provider: StorageProviderEnum.default("Supabase"),
  storage_path: z.string(),
  original_file_name: z.string(),
  file_path: z.string(), // mantido por compatibilidade
  file_size_bytes: z.number(),
  mime_type: z.string(),
  extension: z.string().min(1),
  file_hash: z.string().optional(),

  // Versionamento
  version: z.number().default(1),
  previous_document_id: z.string().uuid().optional().nullable(),

  // Ciclo de vida
  expires_at: z.coerce.date().optional().nullable(),
  is_verified: z.boolean().default(false),
  verified_at: z.coerce.date().optional().nullable(),
  verified_by: z.string().uuid().optional().nullable(),

  // Vínculos cruzados (opcionais)
  admin_contract_id: z.string().optional().nullable(),
  finance_entry_id: z.string().uuid().optional().nullable(),
  clinical_visit_id: z.string().uuid().optional().nullable(),
  clinical_evolution_id: z.string().uuid().optional().nullable(),
  prescription_id: z.string().uuid().optional().nullable(),
  related_object_id: z.string().uuid().optional().nullable(),

  // Assinatura
  signature_type: SignatureTypeEnum.default("Nenhuma"),
  signature_date: z.coerce.date().optional(),
  signature_summary: z.string().optional(),
  external_signature_id: z.string().optional(),

  // Metadados livres
  tags: z.array(z.string()).optional(),
  public_notes: z.string().optional(),
  internal_notes: z.string().optional(),

  // Auditoria
  uploaded_at: z.coerce.date().optional(),
  uploaded_by: z.string().uuid().optional().nullable(),
  updated_at: z.coerce.date().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
  deleted_at: z.coerce.date().optional().nullable(),
  deleted_by: z.string().uuid().optional().nullable(),
  created_at: z.coerce.date().optional(),
});

export type PatientDocumentDTO = z.infer<typeof PatientDocumentSchema>;
