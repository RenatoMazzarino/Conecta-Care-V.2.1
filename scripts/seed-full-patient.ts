import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Em scripts admin, idealmente use SERVICE_ROLE_KEY se tiver RLS bloqueando

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFullPatient() {
  console.log('🌱 Iniciando Seed de Paciente Completo...');

  // 1. Criar Contractor (Operadora)
  const { data: contractor, error: contractError } = await supabase
    .from('contractors')
    .insert({
      name: 'Unimed Campinas',
      type: 'health_plan',
      document_number: '00.000.000/0001-91',
      is_active: true
    })
    .select()
    .single();

  if (contractError) {
    console.error('Erro ao criar contractor:', contractError);
    return;
  }
  console.log('✅ Contractor criado:', contractor.name);

  // 2. Criar Paciente (Mestre)
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert({
      full_name: 'Alberto Roberto da Silva',
      social_name: 'Sr. Alberto',
      cpf: '123.456.789-00',
      date_of_birth: '1950-05-20', // 75 anos
      gender: 'M',
      status: 'active',
      mother_name: 'Maria da Silva',
      nationality: 'Brasileira',
      primary_contractor_id: contractor.id
    })
    .select()
    .single();

  if (patientError) {
    console.error('Erro ao criar paciente:', patientError);
    return;
  }
  console.log('✅ Paciente criado:', patient.full_name);

  // 3. Endereço e Domicílio
  await supabase.from('patient_addresses').insert({
    patient_id: patient.id,
    street: 'Rua das Palmeiras',
    number: '450',
    neighborhood: 'Jardim das Flores',
    city: 'Pedreira',
    state: 'SP',
    zip_code: '13920-000',
    zone_type: 'Urbana',
    travel_notes: 'Casa de esquina, portão verde.'
  });

  await supabase.from('patient_domiciles').insert({
    patient_id: patient.id,
    ambulance_access: 'Sim',
    bed_type: 'Hospitalar Elétrica',
    has_wifi: true,
    has_smokers: false,
    pets_description: '1 Gato (Mingau)',
    voltage: '220v'
  });
  console.log('✅ Endereço e Domicílio criados.');

  // 4. Dados Clínicos
  await supabase.from('patient_clinical_profiles').insert({
    patient_id: patient.id,
    complexity_level: 'high',
    clinical_tags: ['GTT', 'Oxigenoterapia', 'Acamado'],
    diagnosis_main: 'Sequela de AVC Isquêmico (I69.3)',
    allergies: ['Dipirona', 'Látex']
  });
  console.log('✅ Perfil Clínico criado.');

  // 5. Financeiro
  await supabase.from('patient_financial_profiles').insert({
    patient_id: patient.id,
    bond_type: 'Plano de Saúde',
    insurer_name: 'Unimed',
    plan_name: 'Especial Apartamento',
    insurance_card_number: '00012345678900',
    billing_status: 'active'
  });
  console.log('✅ Perfil Financeiro criado.');

  // 6. Contatos / Rede de Apoio
  await supabase.from('patient_emergency_contacts').insert([
    {
      patient_id: patient.id,
      full_name: 'Ana Clara da Silva',
      relation: 'Filha',
      phone: '(19) 99999-8888',
      is_legal_representative: true,
      can_authorize_procedures: true
    },
    {
      patient_id: patient.id,
      full_name: 'Dr. Marcos (Médico Particular)',
      relation: 'Médico',
      phone: '(19) 98888-7777',
      is_legal_representative: false
    }
  ]);
  console.log('✅ Contatos criados.');

  console.log(`\n🎉 PACIENTE COMPLETO CRIADO COM SUCESSO!\nID: ${patient.id}`);
}

seedFullPatient();