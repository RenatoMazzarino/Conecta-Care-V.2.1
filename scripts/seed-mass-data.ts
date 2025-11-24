import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// ATENÇÃO: Use a chave SERVICE_ROLE aqui para ignorar RLS e criar dados livremente
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Chaves não encontradas. Configure .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- DADOS MOCK ---
const FIRST_NAMES = ['Ana', 'Carlos', 'Beatriz', 'João', 'Maria', 'Pedro', 'Lucia', 'Roberto', 'Fernanda', 'Paulo'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes'];
const STREETS = ['Rua das Flores', 'Av. Paulista', 'Rua Augusta', 'Alameda Santos', 'Rua Oscar Freire'];
const NEIGHBORHOODS = ['Centro', 'Jardins', 'Bela Vista', 'Pinheiros', 'Vila Madalena'];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seedMaster() {
  console.log('🚀 INICIANDO POPULAÇÃO DE CENÁRIOS REAIS...');

  // 1. SERVIÇOS (CATÁLOGO)
  console.log('📦 Verificando Serviços...');
  const servicesData = [
    { name: 'Plantão 12h Diurno', code: 'PL-12D', category: 'shift', default_duration_minutes: 720, unit_measure: 'plantão' },
    { name: 'Plantão 12h Noturno', code: 'PL-12N', category: 'shift', default_duration_minutes: 720, unit_measure: 'plantão' },
    { name: 'Visita Médica', code: 'VIS-MED', category: 'visit', default_duration_minutes: 60, unit_measure: 'visita' },
  ];
  
  const services: any[] = [];
  for (const s of servicesData) {
    const { data, error } = await supabase.from('services').insert(s).select().single();
    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('services').select('*').eq('code', s.code).maybeSingle();
        if (existing) services.push(existing);
      } else {
        console.error("Erro ao criar serviço:", error);
      }
      continue;
    }
    if (data) services.push(data);
  }

  // 2. OPERADORAS
  console.log('🏢 Verificando Operadoras...');
  const contractorsData = [
    { name: 'Unimed Campinas', type: 'health_plan', document_number: '00.000.000/0001-91' },
    { name: 'Particular (Família)', type: 'private_individual', document_number: '000.000.000-00' }
  ];
  
  const contractors: any[] = [];
  for (const c of contractorsData) {
    const { data, error } = await supabase.from('contractors').insert({ ...c, is_active: true }).select().single();
    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('contractors').select('*').eq('document_number', c.document_number).maybeSingle();
        if (existing) contractors.push(existing);
      } else {
        console.error("Erro ao criar operadora:", error);
      }
      continue;
    }
    if (data) contractors.push(data);
  }

  // 3. PROFISSIONAIS
  console.log('👩‍⚕️ Criando/Atualizando Equipe...');
  const professionals: any[] = [];
  const roles = ['nurse', 'technician', 'caregiver'];
  
  for (let i = 0; i < 8; i++) {
    const name = `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`;
    const payload = {
      full_name: name,
      role: getRandom(roles),
      cpf: `111.222.333-0${i}`,
      is_active: true,
      contact_phone: '(11) 99999-9999',
      email: `prof${i}@conectacare.com`
    };
    const { data, error } = await supabase.from('professional_profiles').insert(payload).select().single();
    
    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('professional_profiles').select('*').eq('cpf', payload.cpf).maybeSingle();
        if (existing) professionals.push(existing);
      } else {
        console.error("Erro ao criar profissional:", error);
      }
      continue;
    }
    if (data) professionals.push(data);
  }

  // 4. PACIENTES E PLANTÕES (A Grande Massa)
  console.log('👴 Gerando Histórico e Escala Futura...');
  
  // Cria 12 pacientes
  for (let i = 0; i < 12; i++) {
    const firstName = getRandom(FIRST_NAMES);
    const lastName = getRandom(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const contractor = getRandom(contractors);
    if (!contractor) {
      console.error("Nenhuma operadora disponível para criar pacientes.");
      break;
    }

    // 4.1 Paciente Base
    const { data: patient, error: patientError } = await supabase.from('patients').insert({
      full_name: fullName,
      social_name: `Sr(a). ${firstName}`,
      cpf: `000.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}-${i}`,
      date_of_birth: getRandomDate(new Date(1940, 0, 1), new Date(1960, 0, 1)).toISOString(),
      status: 'active',
      primary_contractor_id: contractor.id
    }).select().single();

    if (patientError || !patient) {
      console.error("Erro ao criar/atualizar paciente:", patientError);
      continue;
    }

    // 4.2 Garante Vínculo de Serviço (Orçamento)
    // Necessário para criar plantões
    const service = getRandom(services.filter((s:any) => s.category === 'shift'));
    let { data: patientService } = await supabase.from('patient_services')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('service_name', service.name)
        .maybeSingle();

    if (!patientService) {
         const { data: newSvc } = await supabase.from('patient_services').insert({
            patient_id: patient.id,
            contractor_id: contractor.id,
            service_name: service.name,
            unit_price: 150.00, // Valor fixo para teste financeiro
            status: 'active'
         }).select().single();
         patientService = newSvc;
    }

    // 4.3 GERAR PLANTÕES (SHIFTS) - Passado e Futuro
    const shifts = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // Gera de 30 dias atrás até 30 dias no futuro
    for (let d = -30; d <= 30; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        
        // Define horário (07:00 - 19:00)
        const start = new Date(date); start.setHours(7,0,0);
        const end = new Date(date); end.setHours(19,0,0);
        
        // Lógica de Estado (CENÁRIOS)
        let status = 'scheduled';
        let professionalId = getRandom(professionals).user_id; // Padrão: tem profissional
        let checkIn = null;
        let checkOut = null;

        if (d < 0) {
            // PASSADO (Histórico)
            // 90% Completado, 5% Falta, 5% Cancelado
            const rand = Math.random();
            if (rand > 0.1) {
                status = 'completed';
                checkIn = start.toISOString();
                checkOut = end.toISOString();
            } else if (rand > 0.05) {
                status = 'missed'; // Falta
            } else {
                status = 'canceled';
            }
        } else if (d === 0) {
            // HOJE (Operação Realtime)
            status = 'in_progress';
            checkIn = start.toISOString(); // Já fez check-in
        } else {
            // FUTURO (Escala) - mantém agendado com profissional para evitar constraints
            status = 'scheduled';
        }

        shifts.push({
            patient_id: patient.id,
            professional_id: professionalId,
            service_id: patientService!.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            shift_type: 'day',
            status: status,
            check_in_time: checkIn,
            check_out_time: checkOut,
            candidate_count: 0
        });
    }

    if (shifts.length > 0) {
      const { error: shiftsError } = await supabase.from('shifts').insert(shifts);
      if (shiftsError) {
        console.error("Erro ao inserir plantões:", shiftsError);
      }
    }
  }

  console.log('✅ CENÁRIOS CRIADOS COM SUCESSO!');
  console.log('   - Plantões Passados (Para Faturar)');
  console.log('   - Plantões Hoje (Para Monitorar)');
  console.log('   - Plantões Futuros (Vagas Abertas e Agendados)');
}

seedMaster();
