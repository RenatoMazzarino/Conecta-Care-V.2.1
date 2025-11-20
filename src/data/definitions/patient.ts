import { z } from "zod";

// Enums baseados no negócio (consultados do repo antigo, mas limpos)
export const GenderEnum = z.enum(["M", "F", "Other"]);
export const BondEnum = z.enum(['Plano de Saúde', 'Particular', 'Convênio', 'Público']);

// Schema de Criação (Dados mínimos para abrir prontuário)
export const CreatePatientSchema = z.object({
  full_name: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  date_of_birth: z.coerce.date().refine(Boolean, "Data obrigatória"),
  gender: GenderEnum,
  
  // Financeiro (Opcional no início)
  bond_type: BondEnum.optional(),
  monthly_fee: z.coerce.number().default(0),
  billing_due_day: z.coerce.number().optional(),

  // Endereço
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida"),
});

export type CreatePatientDTO = z.infer<typeof CreatePatientSchema>;