import { getPatientsPaginated } from "@/modules/patients/patient.data";
import { PatientDataGrid } from "@/modules/patients/components/PatientDataGrid";
import { PatientStatsFilters } from "@/modules/patients/components/PatientStatsFilters";
import { Button } from "@/components/ui/button";
import { UserPlus, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
  complexity?: string;
  billingStatus?: string;
  contractorId?: string;
  city?: string;
  neighborhood?: string;
  zoneType?: string;
  diagnosis?: string;
  admissionType?: string;
  supervisor?: string;
  clinicalTag?: string;
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  bondType?: string;
  paymentMethod?: string;
  contractStatus?: string;
  riskBradenMin?: string;
  riskBradenMax?: string;
  riskMorseMin?: string;
  riskMorseMax?: string;
  oxygenUsage?: string;
};

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) || {};
  const query = params.q || '';
  const status = params.status || 'all';
  const complexity = params.complexity || 'all';
  const billingStatus = params.billingStatus || 'all';
  const contractorId = params.contractorId || 'all';
   // localização e clínico
  const city = params.city || '';
  const neighborhood = params.neighborhood || '';
  const zoneType = params.zoneType || 'all';
  const diagnosis = params.diagnosis || '';
  const admissionType = params.admissionType || 'all';
  const supervisor = params.supervisor || '';
  const clinicalTag = params.clinicalTag || '';
  const gender = params.gender || 'all';
  const ageMin = params.ageMin ? Number(params.ageMin) : undefined;
  const ageMax = params.ageMax ? Number(params.ageMax) : undefined;
  const bondType = params.bondType || 'all';
  const paymentMethod = params.paymentMethod || '';
  const contractStatus = params.contractStatus || 'all';
  const riskBradenMin = params.riskBradenMin ? Number(params.riskBradenMin) : undefined;
  const riskBradenMax = params.riskBradenMax ? Number(params.riskBradenMax) : undefined;
  const riskMorseMin = params.riskMorseMin ? Number(params.riskMorseMin) : undefined;
  const riskMorseMax = params.riskMorseMax ? Number(params.riskMorseMax) : undefined;
  const oxygenUsage = params.oxygenUsage || 'all';
  const page = params.page ? Number(params.page) || 1 : 1;

  const { data: patients, stats, totalPages } = await getPatientsPaginated({
    page,
    pageSize: 20,
    search: query,
    status,
    complexity,
    billingStatus,
    contractorId,
    city,
    neighborhood,
    zoneType,
    diagnosis,
    admissionType,
    supervisor,
    clinicalTag,
    gender,
    ageMin,
    ageMax,
    bondType,
    paymentMethod,
    contractStatus,
    riskBradenMin,
    riskBradenMax,
    riskMorseMin,
    riskMorseMax,
    oxygenUsage
  });

  const supabase = await createClient();
  const { data: contractors } = await supabase.from('contractors').select('id, name').order('name');

  return (
    <div className="min-h-screen bg-[#faf9f8] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pacientes Ativos</h1>
            <p className="text-sm text-gray-500 mt-1">Visualização de todos os contratos vigentes.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              <form>
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Filtrar lista..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:border-brand focus:outline-none bg-white"
                />
                {Object.entries(params).map(([key, value]) =>
                  key !== 'q' && value ? <input key={key} type="hidden" name={key} value={String(value)} /> : null
                )}
              </form>
            </div>
            <Link href="/patients/new">
              <Button className="bg-[#0F2B45] text-white h-10 shadow-sm hover:bg-[#163A5C] gap-2">
                <UserPlus weight="bold" size={16} /> Novo Paciente
              </Button>
            </Link>
          </div>
        </div>

        <PatientStatsFilters stats={stats} contractors={contractors || []} />

        <PatientDataGrid
          data={patients}
          currentPage={page}
          totalPages={totalPages || 1}
          totalCount={stats.total}
          pageSize={20}
          params={{
            q: query,
            status,
            complexity,
            billingStatus,
            contractorId,
            city,
            neighborhood,
            zoneType,
            diagnosis,
            admissionType,
            supervisor,
            clinicalTag,
            gender,
            ageMin: params.ageMin,
            ageMax: params.ageMax,
            bondType,
            paymentMethod,
            contractStatus,
            riskBradenMin: params.riskBradenMin,
            riskBradenMax: params.riskBradenMax,
            riskMorseMin: params.riskMorseMin,
            riskMorseMax: params.riskMorseMax,
            oxygenUsage
          }}
        />
      </div>
    </div>
  );
}
