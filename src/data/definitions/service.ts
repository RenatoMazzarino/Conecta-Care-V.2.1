import { z } from "zod";

export const ServiceCategoryEnum = z.enum(['shift', 'visit', 'procedure', 'equipment', 'other']);

export const ServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nome obrigatório"),
  code: z.string().optional(),
  category: ServiceCategoryEnum,
  default_duration_minutes: z.coerce.number().min(0).optional(),
  unit_measure: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ServiceDTO = z.infer<typeof ServiceSchema>;
