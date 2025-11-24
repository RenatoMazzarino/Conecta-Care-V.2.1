import { z } from "zod";

// Estrutura baseada no componente antigo (ShiftMonitorSheet.tsx)
// Criamos um DTO (Data Transfer Object)
export const ShiftTimelineEventZ = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  description: z.string(),
  // O icon no frontend será um React Component, mas no backend é apenas o nome
  iconName: z.string().optional(), 
  meta: z.array(z.string()).optional(),
  tone: z.enum(["default", "success", "warning"]).default("default"),
});

export const ShiftNoteZ = z.object({
  id: z.string(),
  author: z.string(),
  timestamp: z.string(),
  message: z.string(),
  variant: z.enum(["default", "muted"]).optional(),
});

export const ShiftMonitorDataZ = z.object({
  shiftId: z.string(),
  patientName: z.string(),
  professional: z.object({
    name: z.string(),
    role: z.string(),
    avatarUrl: z.string().url().optional(),
    initials: z.string(),
    phone: z.string(),
    bleStatus: z.enum(['connected', 'disconnected']).optional(),
    battery: z.number().optional(),
  }),
  shiftWindow: z.object({
    start: z.string(),
    end: z.string(),
    startedAt: z.string().optional(),
  }),
  status: z.string().optional(),
  progress: z.number(),
  // O restante dos dados
  timeline: z.array(ShiftTimelineEventZ),
  notes: z.array(ShiftNoteZ),
});

export type ShiftMonitorDataDTO = z.infer<typeof ShiftMonitorDataZ>;

// --- Agendamento de plantão ---
export const CreateShiftSchema = z.object({
  patient_id: z.string().uuid({ message: "Selecione um paciente" }),
  professional_id: z.string().uuid().optional(), // Opcional (vaga aberta)
  service_id: z.string().uuid({ message: "Selecione o serviço (ex: Plantão 12h)" }),
  date: z.date(),
  shift_type: z.enum(['day', 'night']),
});

export type CreateShiftDTO = z.infer<typeof CreateShiftSchema>;
