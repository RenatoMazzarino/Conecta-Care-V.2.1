'use server'

import { createClient } from "@/lib/supabase/server";
import { addDays, format, endOfMonth, eachDayOfInterval } from "date-fns";

// Tipagem da Regra
type ScheduleRule = {
  patient_id?: string;
  scheme_type: '12x36' | '24x48' | 'daily_12h' | 'daily_24h' | 'custom';
  day_start_time: string;   // "07:00:00"
  night_start_time: string; // "19:00:00"
  professionals_per_shift: number;
};

/**
 * MOTOR DE GERAÇÃO DE ESCALA
 * Gera os slots vazios (vagas) para um mês inteiro baseado na regra do paciente.
 */
export async function generateMonthlyScheduleAction(patientId: string, year: number, month: number) {
  const supabase = await createClient();

  // 1. Buscar Regra E Contrato do Paciente
  const { data: patientData, error: pError } = await supabase
    .from('patients')
    .select(`
      primary_contractor_id,
      schedule_settings:patient_schedule_settings(*)
    `)
    .eq('id', patientId)
    .single();

  if (pError || !patientData?.primary_contractor_id) {
      return { success: false, error: "Paciente sem contrato/operadora definida." };
  }

  const contractorId = patientData.primary_contractor_id;
  let rule: ScheduleRule | undefined = patientData.schedule_settings?.[0];

  // Fallback de regra (Padrão 12x36 se não tiver nada configurado)
  if (!rule) {
    rule = {
      scheme_type: '12x36', 
      day_start_time: '07:00:00',
      night_start_time: '19:00:00',
      professionals_per_shift: 1
    };
  }

  // 2. Garantir Vínculo de Serviço (Patient Service)
  const serviceName = "Plantão Automático (Gerado)";
  
  let { data: patientService } = await supabase
    .from('patient_services')
    .select('id')
    .eq('patient_id', patientId)
    .eq('service_name', serviceName)
    .maybeSingle();

  if (!patientService) {
    const { data: newSvc, error: svcError } = await supabase
      .from('patient_services')
      .insert({
        patient_id: patientId,
        contractor_id: contractorId,
        service_name: serviceName,
        unit_price: 0,
        status: 'active'
      })
      .select('id')
      .single();
      
    if (svcError) return { success: false, error: "Erro ao criar serviço base: " + svcError.message };
    patientService = newSvc;
  }

  // 3. Definir o Intervalo de Tempo (Do dia 1 ao dia 30/31)
  const startDate = new Date(year, month - 1, 1); // Mês começa em 0 no JS
  const endDate = endOfMonth(startDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const shiftsToCreate: any[] = [];

  // Exemplo simplificado (Expanda para 12x36 real depois)
  days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      // Dia
      shiftsToCreate.push({
        patient_id: patientId,
        service_id: patientService.id,
        start_time: `${dateStr}T${rule!.day_start_time}`,
        end_time: `${dateStr}T${rule!.night_start_time}`,
        shift_type: 'day',
        status: 'published', // Vaga sem profissional
      });
      // Noite
      const nextDay = addDays(day, 1);
      shiftsToCreate.push({
        patient_id: patientId,
        service_id: patientService.id,
        start_time: `${dateStr}T${rule!.night_start_time}`,
        end_time: `${format(nextDay, 'yyyy-MM-dd')}T${rule!.day_start_time}`,
        shift_type: 'night',
        status: 'published',
      });
  });

  // 4. Inserir
  if (shiftsToCreate.length > 0) {
    const { error } = await supabase.from('shifts').insert(shiftsToCreate);
    if (error) return { success: false, error: error.message };
  }

  return { success: true, count: shiftsToCreate.length };
}
