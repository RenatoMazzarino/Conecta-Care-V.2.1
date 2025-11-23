import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =================================================================
// TIPAGENS E HELPERS PUROS (Sem Mocks)
// =================================================================

export type WeekDay = {
  key: string;
  label: string;
  dateLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  fullDate: Date;
};

export type ScheduleSlotStatus = 'free' | 'completed' | 'live' | 'planned' | 'warning' | 'open' | 'open-candidates' | 'critical' | 'backup';

export type ScheduleSlot = {
  id: string;
  shiftType: 'day' | 'night';
  status: ScheduleSlotStatus;
  professional?: { name: string; role?: string };
  checkIn?: string;
  candidateCount?: number;
  caution?: string;
};

export type ScheduleRow = {
  id: string;
  patientId: string;
  patientName: string;
  contract: string;
  tags?: string[];
  badge: string;
  slots: Record<string, { day: ScheduleSlot; night: ScheduleSlot }>;
};

// Mapeamento de estilos visuais
export const STATUS_CLASSES: Record<ScheduleSlotStatus, string> = {
  free: 'border-dashed border-slate-200 bg-slate-50/50 text-slate-300',
  completed: 'border-l-slate-400 text-slate-600 bg-white/80',
  live: 'border-l-emerald-500 ring-1 ring-emerald-100 text-slate-900',
  planned: 'border-l-blue-500 text-slate-800',
  warning: 'border-l-amber-500 bg-amber-50/70 text-amber-800',
  open: 'border-l-slate-300 bg-slate-50/70 text-slate-600',
  'open-candidates': 'border-l-orange-500 bg-orange-50/70 text-orange-700',
  critical: 'border-l-rose-500 bg-rose-50/70 text-rose-800',
  backup: 'border-l-slate-300 bg-white/40 text-slate-500',
};

// Gera dias da semana
export function buildWeekDays(anchor: Date): WeekDay[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 }); 
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3),
      dateLabel: format(date, 'dd'),
      isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      isWeekend: [0, 6].includes(date.getDay()),
      fullDate: date,
    };
  });
}

// Gera iniciais para avatar
export function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((value) => value[0]?.toUpperCase()).join('');
}
