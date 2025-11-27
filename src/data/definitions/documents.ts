import { z } from "zod";

export const DocumentCategoryEnum = z.enum(['identity', 'legal', 'financial', 'clinical', 'consent', 'other']);

// Schema para salvar os METADADOS após o upload do arquivo
export const PatientDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  
  title: z.string().min(2, "Título obrigatório"),
  category: DocumentCategoryEnum,
  subcategory: z.string().optional(),
  origin: z.string().optional(), // Ficha, Prontuário...
  description: z.string().optional(),
  status: z.enum(['Ativo', 'Arquivado']).optional(),
  confidential: z.boolean().default(false),
  clinical_visible: z.boolean().default(true),
  
  // Dados técnicos do arquivo (retornados pelo Storage)
  file_name: z.string(),
  file_path: z.string(),
  file_size_bytes: z.number(),
  mime_type: z.string(),
  
  expires_at: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  created_at: z.coerce.date().optional(),
});

export type PatientDocumentDTO = z.infer<typeof PatientDocumentSchema>;
