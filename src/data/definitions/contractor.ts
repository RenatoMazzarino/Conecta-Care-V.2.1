import { z } from "zod";

export const ContractorTypeEnum = z.enum(['health_plan', 'public_entity', 'private_individual']);

export const ContractorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Razão Social obrigatória"),
  commercial_name: z.string().optional(), // Nome Fantasia
  document_number: z.string().min(11, "CNPJ/CPF inválido"),
  type: ContractorTypeEnum,
  
  billing_due_days: z.coerce.number().min(0).default(30),
  integration_code: z.string().optional(), // Código TISS/TUSS
  is_active: z.boolean().default(true),
});

export type ContractorDTO = z.infer<typeof ContractorSchema>;