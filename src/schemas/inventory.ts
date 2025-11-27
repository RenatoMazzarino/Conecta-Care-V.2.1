import { z } from "zod";

export const AssignAssetZ = z.object({
  patientId: z.string().uuid(),
  itemId: z.string().uuid(),
  serial: z.string().optional(),
  location: z.string().optional(),
});

export const ReturnAssetZ = z.object({
  assetId: z.string().uuid(),
  reason: z.string().optional(),
  returnedAt: z.string().optional(),
});

export const UpdateConsumableZ = z.object({
  patientId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.coerce.number(),
  type: z.enum(["in", "out"]),
  note: z.string().optional(),
});

export type AssignAssetForm = z.infer<typeof AssignAssetZ>;
export type ReturnAssetForm = z.infer<typeof ReturnAssetZ>;
export type UpdateConsumableForm = z.infer<typeof UpdateConsumableZ>;
