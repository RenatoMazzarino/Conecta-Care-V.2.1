import { z } from "zod";

// Schema para Adicionar/Editar Membro da Equipe
export const CareTeamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid({ message: "Selecione um profissional" }),
  role: z.string().min(2, "Cargo obrigatório"),
  is_primary: z.boolean().default(false),
  active: z.boolean().default(true),
});

// Schema para Contato de Emergência (Reutilizando ou refinando)
export const EmergencyContactSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  full_name: z.string().min(2, "Nome obrigatório"),
  relation: z.string().min(2, "Parentesco obrigatório"),
  phone: z.string().min(8, "Telefone obrigatório"),
  email: z.string().email().optional().or(z.literal('')),
  is_legal_representative: z.boolean().default(false),
  can_authorize_procedures: z.boolean().default(false),
  can_view_record: z.boolean().default(true),
});

export type CareTeamMemberDTO = z.infer<typeof CareTeamMemberSchema>;
export type EmergencyContactDTO = z.infer<typeof EmergencyContactSchema>;
