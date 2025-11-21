import { z } from "zod";
import { BondEnum } from "./patient";

export const PatientFinancialSchema = z.object({
  patient_id: z.string().uuid(),
  bond_type: BondEnum,
  monthly_fee: z.coerce.number().nonnegative(),
  billing_due_day: z.coerce.number().min(1).max(31).optional(),
  notes: z.string().optional(),
});

export type PatientFinancialDTO = z.infer<typeof PatientFinancialSchema>;
