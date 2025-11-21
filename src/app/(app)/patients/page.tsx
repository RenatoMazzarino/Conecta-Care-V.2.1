import { getPatients } from "@/modules/patients/patient.data";
import { PatientList } from "@/modules/patients/components/PatientList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";

// Força a página a recarregar dados sempre que entrar (Dynamic Rendering)
export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  // 1. Busca os dados
  const patients = await getPatients();

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight">Pacientes</h1>
                <p className="text-slate-500">Gerencie os prontuários e admissões.</p>
            </div>
            <Link href="/patients/new">
                <Button className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-fluent gap-2">
                    <Plus className="h-4 w-4" weight="bold" />
                    Novo Paciente
                </Button>
            </Link>
        </div>

        {/* Tabela */}
        <PatientList data={patients} />
        
      </div>
    </div>
  );
}
