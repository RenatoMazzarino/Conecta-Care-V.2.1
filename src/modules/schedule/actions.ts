'use server'

import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";
import { ShiftMonitorDataDTO } from "@/data/definitions/schedule";
import { CreateShiftSchema, CreateShiftDTO } from "@/data/definitions/schedule";
import { 
  ScheduleRow, 
  ScheduleSlot, 
  ScheduleSlotStatus
} from "./utils";
import { revalidatePath } from "next/cache";

/**
 * Busca a grade de escala completa para um intervalo de datas.
 * @param startDate Data de início da visualização
 * @param daysToRender Quantidade de dias para renderizar (7, 15, 30)
 */
export async function getScheduleGrid(startDate: Date, daysToRender: number = 7) {
  const supabase = await createClient();
  
  // Calcula a janela de tempo
  const start = startDate;
  const end = addDays(startDate, daysToRender);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // 1. Busca Pacientes ATIVOS (Eles formam as linhas da grade)
  // Fazemos JOIN com o perfil clínico para pegar tags e complexidade
  const { data: patients, error: patError } = await supabase
    .from('patients')
    .select(`
      id, 
      full_name, 
      primary_contractor_id,
      clinical:patient_clinical_profiles(complexity_level, clinical_tags),
      contractor:contractors(name)
    `)
    .eq('status', 'active')
    .order('full_name');

  if (patError) {
    console.error("Erro ao buscar pacientes:", patError);
    return [];
  }

  // 2. Busca Plantões (Shifts) no intervalo
  const { data: shifts, error: shiftError } = await supabase
    .from('shifts')
    .select(`
      *,
      professional:professional_profiles(full_name, role, user_id)
    `)
    .gte('start_time', startISO)
    .lt('start_time', endISO);

  if (shiftError) {
    console.error("Erro ao buscar escala:", shiftError);
    return [];
  }

  // 3. Gera os dias da semana para iteração
  // Nota: buildWeekDays gera apenas 7 dias por padrão, aqui expandimos a lógica
  const days: WeekDay[] = Array.from({ length: daysToRender }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE'),
      dateLabel: format(date, 'dd'),
      isToday: false, // Será calculado no front se necessário
      isWeekend: [0, 6].includes(date.getDay()),
      fullDate: date,
    };
  });

  // 4. Monta a Grade (Algoritmo de Agrupamento)
  const rows: ScheduleRow[] = patients.map(patient => {
    // Inicializa os slots vazios para todos os dias do período
    const slots: Record<string, { day: ScheduleSlot; night: ScheduleSlot }> = {};

    days.forEach(day => {
      // Configuração padrão de slot vazio (Livre)
      const emptySlot: ScheduleSlot = {
        id: `empty-${patient.id}-${day.key}`,
        shiftType: 'day', // placeholder
        status: 'free',
      };

      slots[day.key] = {
        day: { ...emptySlot, id: `${patient.id}-${day.key}-day`, shiftType: 'day' },
        night: { ...emptySlot, id: `${patient.id}-${day.key}-night`, shiftType: 'night' }
      };
    });

    // Preenche com os plantões reais encontrados
    const patientShifts = shifts?.filter(s => s.patient_id === patient.id) || [];

    patientShifts.forEach(shift => {
      const shiftDateKey = format(new Date(shift.start_time), 'yyyy-MM-dd');
      
      // Ignora se estiver fora do range (segurança)
      if (!slots[shiftDateKey]) return;

      const type = shift.shift_type === 'night' ? 'night' : 'day'; // '24h' tratamos como day por enquanto
      
      // Mapeia o status do banco para o status visual
      let visualStatus: ScheduleSlotStatus = 'planned';
      if (shift.status === 'in_progress') visualStatus = 'live';
      if (shift.status === 'completed') visualStatus = 'completed';
      if (shift.status === 'missed') visualStatus = 'critical';
      if (!shift.professional_id) visualStatus = 'open'; // Sem profissional = Vaga Aberta
      if (shift.candidate_count > 0 && !shift.professional_id) visualStatus = 'open-candidates';
      if (shift.is_critical) visualStatus = 'critical';
      if (shift.caution_note) visualStatus = 'warning';

      // Preenche o slot
      slots[shiftDateKey][type] = {
        id: shift.id,
        shiftType: type,
        status: visualStatus,
        checkIn: shift.check_in_time ? format(new Date(shift.check_in_time), 'HH:mm') : undefined,
        candidateCount: shift.candidate_count,
        caution: shift.caution_note,
        professional: shift.professional ? {
          name: shift.professional.full_name,
          role: shift.professional.role,
        } : undefined
      };
    });

    // Retorna a linha montada
    return {
      id: patient.id,
      patientId: patient.id,
      patientName: patient.full_name,
      contract: patient.contractor?.[0]?.name || 'Particular',
      tags: patient.clinical?.[0]?.clinical_tags || [],
      badge: mapComplexityToColor(patient.clinical?.[0]?.complexity_level),
      slots: slots,
    };
  });

  return rows;
}

// Helper simples para cor da complexidade
function mapComplexityToColor(level?: string) {
  switch (level) {
    case 'high': return 'bg-rose-100 text-rose-700';
    case 'medium': return 'bg-amber-100 text-amber-700';
    case 'low': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

// Server Action: busca detalhes completos de um plantão para o Monitor
export async function getShiftDetails(shiftId: string): Promise<ShiftMonitorDataDTO | null> {
  const supabase = await createClient();

  const { data: shift, error } = await supabase
    .from('shifts')
    .select(`
      *,
      patient:patients(full_name),
      professional:professional_profiles(full_name, role, user_id),
      timeline:shift_timeline_events(*),
      notes:shift_internal_notes(*)
    `)
    .eq('id', shiftId)
    .single();

  // Debug detalhado para ver erros de Supabase/RLS
  if (error) {
    console.error("❌ ERRO AO BUSCAR DETALHES DO PLANTÃO:", error);
    return null;
  }
  if (!shift) {
    console.error("❌ Plantão não encontrado no banco para o ID:", shiftId);
    return null;
  }

  return {
    shiftId: shift.id,
    patientName: shift.patient?.full_name || 'Paciente',
    professional: {
      name: shift.professional?.full_name || 'A Definir',
      role: shift.professional?.role || '',
      initials: (shift.professional?.full_name || 'ND').slice(0, 2).toUpperCase(),
      phone: '',
      battery: 80,
      bleStatus: 'connected',
    },
    shiftWindow: {
      start: format(new Date(shift.start_time), 'HH:mm'),
      end: format(new Date(shift.end_time), 'HH:mm'),
      startedAt: shift.check_in_time ? format(new Date(shift.check_in_time), 'HH:mm') : undefined,
    },
    status: shift.status === 'in_progress' ? 'Ao Vivo' : 'Agendado',
    progress: 0,
    // Tipos mínimos para os registros retornados pelo Supabase
    timeline: ((shift.timeline || []) as Array<{
      id: string;
      event_time: string;
      title?: string;
      description?: string;
      icon_name?: string;
      tone?: string;
    }>).map((evt) => ({
      id: String(evt.id),
      time: format(new Date(evt.event_time), 'HH:mm'),
      title: evt.title || '',
      description: evt.description || '',
      iconName: evt.icon_name,
      tone: evt.tone,
    })),
    notes: ((shift.notes || []) as Array<{
      id: string;
      author_name?: string;
      created_at: string;
      message?: string;
    }>).map((note) => ({
      id: String(note.id),
      author: note.author_name || 'Sistema',
      timestamp: format(new Date(note.created_at), 'HH:mm'),
      message: note.message || '',
    })),
  } as ShiftMonitorDataDTO;
}

// Cria um plantão manualmente (ou vaga aberta)
export async function createShiftAction(data: CreateShiftDTO) {
  const supabase = await createClient();
  const parsed = CreateShiftSchema.safeParse(data);

  if (!parsed.success) return { success: false, error: "Dados inválidos." };
  
  const { patient_id, professional_id, service_id, date, shift_type } = parsed.data;

  // 1. Buscar dados do Paciente (Para pegar a Operadora/Contractor)
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('primary_contractor_id')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient?.primary_contractor_id) {
    return { success: false, error: "Paciente sem operadora/contrato principal definido." };
  }

  // 2. Buscar dados do Serviço Mestre (Para pegar o nome)
  const { data: catalogService } = await supabase
    .from('services')
    .select('name, default_duration_minutes')
    .eq('id', service_id)
    .single();

  if (!catalogService) return { success: false, error: "Serviço do catálogo não encontrado." };

  // 3. Garantir que existe um 'patient_services' (Vínculo de Orçamento)
  let { data: patientService } = await supabase
    .from('patient_services')
    .select('id')
    .eq('patient_id', patient_id)
    .eq('service_name', catalogService.name)
    .maybeSingle();

  if (!patientService) {
    const { data: newService, error: createServiceError } = await supabase
      .from('patient_services')
      .insert({
        patient_id,
        contractor_id: patient.primary_contractor_id,
        service_name: catalogService.name,
        unit_price: 0,
        status: 'active'
      })
      .select()
      .single();

    if (createServiceError) {
       console.error("Erro ao vincular serviço:", createServiceError);
       return { success: false, error: "Erro ao criar vínculo de serviço: " + createServiceError.message };
    }
    patientService = newService;
  }
  if (!patientService) {
    return { success: false, error: "Falha ao obter serviço vinculado ao paciente." };
  }

  const start = new Date(date);
  const end = new Date(date);

  if (shift_type === 'day') {
    start.setHours(7, 0, 0, 0);
    end.setHours(19, 0, 0, 0);
  } else {
    start.setHours(19, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(7, 0, 0, 0);
  }

  // service_id em shifts referencia patient_services.id (FK). Alguns schemas não possuem coluna service_id em patient_services,
  // então criamos/recuperamos um vínculo mínimo por paciente.
  const { data: existingPs } = await supabase
    .from('patient_services')
    .select('id')
    .eq('patient_id', patient_id)
    .maybeSingle();

  if (existingPs?.id) {
    patientServiceId = existingPs.id;
  } else {
    const { data: createdPs, error: psError } = await supabase
      .from('patient_services')
      .insert({
        patient_id,
        unit_price: 0,
      })
      .select('id')
      .single();
    if (psError || !createdPs) {
      console.error("Erro ao vincular serviço ao paciente:", psError);
      return { success: false, error: "Erro ao vincular serviço ao paciente." };
    }
  }

  const { error } = await supabase.from('shifts').insert({
    patient_id,
    professional_id: professional_id || null,
    service_id: patientService.id,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    shift_type,
    status: professional_id ? 'scheduled' : 'published',
    candidate_count: 0
  });

  if (error) {
    console.error("Erro ao criar plantão:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/schedule');
  return { success: true };
}

// Busca listas simples para selects (pacientes/profissionais ativos)
export async function getSchedulingOptions() {
  const supabase = await createClient();
  
  const [patients, professionals, services] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('status', 'active').order('full_name'),
    supabase.from('professional_profiles').select('user_id, full_name, role').eq('is_active', true).order('full_name'),
    supabase.from('services').select('id, name').eq('category', 'shift').eq('is_active', true).order('name')
  ]);

  return {
    patients: patients.data || [],
    professionals: professionals.data || [],
    services: services.data || []
  };
}
