import { z } from "zod";

// Schema para ALOCAR um item ao paciente
export const PatientInventorySchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  
  // O usuário seleciona o Item Mestre
  item_id: z.string().uuid({ message: "Selecione um item do catálogo" }),
  
  // Dados da Alocação
  current_quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
  serial_number: z.string().optional(), // Obrigatório se for equipamento (validado no front)
  location_note: z.string().optional(), // Ex: "No quarto, ao lado da cama"
  installed_at: z.coerce.date().optional(),
  status: z.enum(["active", "returned", "maintenance", "consumed"]).default("active"),
});

export type PatientInventoryDTO = z.infer<typeof PatientInventorySchema>;

// Tipo para a lista de seleção (Mestre)
export type MasterItemSelect = {
  id: string;
  name: string;
  category: string;
  is_trackable: boolean;
  brand: string | null;
};
