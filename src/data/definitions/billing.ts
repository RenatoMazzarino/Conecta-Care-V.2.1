import { z } from "zod";

export const BillingStatusEnum = z.enum(['open', 'closed', 'invoiced', 'paid', 'canceled']);

export const BillingBatchSchema = z.object({
  id: z.string().uuid().optional(),
  contractor_id: z.string().uuid({ message: "Selecione uma operadora" }),
  competence_date: z.date(),
  status: BillingStatusEnum.default('open'),
  total_amount: z.number().default(0),
  total_shifts: z.number().default(0),
  notes: z.string().optional(),
});

export type BillingBatchDTO = z.infer<typeof BillingBatchSchema>;

export type FinancialStats = {
  pending_revenue: number;
  open_invoices: number;
  collected_month: number;
};
