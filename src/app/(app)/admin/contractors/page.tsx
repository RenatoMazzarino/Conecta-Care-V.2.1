import { getContractorsAction } from "@/modules/admin/actions.contractors";
import { ContractorDialog } from "@/modules/admin/components/ContractorDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Buildings, PencilSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import { ContractorDTO } from "@/data/definitions/contractor";

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  const normalizeType = (type?: string | null): ContractorDTO["type"] => {
    if (type === "health_plan" || type === "private_individual" || type === "public_entity") return type;
    return "health_plan";
  };

  const contractors = (await getContractorsAction()).map((c) => ({
    ...c,
    type: normalizeType((c as any).type),
  })) as Array<ContractorDTO & { id: string; billing_due_days?: number | null; is_active?: boolean | null }>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <Buildings weight="duotone" className="opacity-80"/>
                    Gestão de Operadoras
                </h1>
                <p className="text-slate-500 mt-1">Fontes pagadoras e contratos de prestação.</p>
            </div>
            <ContractorDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contractors.map((item) => (
                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-[#0F2B45]/5 flex items-center justify-center text-[#0F2B45]">
                                <Buildings size={20} weight="fill" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800">{item.name}</CardTitle>
                                <p className="text-xs text-slate-500 font-mono">{item.document_number}</p>
                            </div>
                        </div>
                        <Badge variant={item.is_active ? 'default' : 'secondary'} className={item.is_active ? "bg-emerald-600" : "bg-slate-400"}>
                            {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-xs text-slate-600 space-y-1 mb-4">
                            <p>Tipo: <strong className="uppercase">{item.type}</strong></p>
                            <p>Prazo: <strong>{item.billing_due_days} dias</strong></p>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <ContractorDialog contractor={item} trigger={
                                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><PencilSimple className="mr-2"/> Editar</Button>
                            }/>
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-rose-500 hover:bg-rose-50">
                                <Trash />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
      </div>
    </div>
  );
}
