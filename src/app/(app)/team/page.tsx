import { getProfessionalsAction } from "@/modules/professionals/actions";
import { ProfessionalList } from "@/modules/professionals/components/ProfessionalList";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  // Busca dados reais do banco (Server Side)
  const professionals = await getProfessionalsAction();

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <UsersThree weight="duotone" className="opacity-80"/>
                    Gestão de Equipe
                </h1>
                <p className="text-slate-500 mt-1">
                    Gerencie o cadastro de técnicos, enfermeiros e equipe multidisciplinar.
                </p>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-2xl font-bold text-[#0F2B45]">{professionals.length}</p>
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Profissionais Ativos</p>
            </div>
        </div>

        {/* LISTA INTERATIVA */}
        <ProfessionalList data={professionals} />
        
      </div>
    </div>
  );
}
