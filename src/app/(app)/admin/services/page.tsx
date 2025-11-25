import { getServicesAction, deleteServiceAction } from "@/modules/admin/actions.services";
import { ServiceDialog } from "@/modules/admin/components/ServiceDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FirstAidKit, PencilSimple, Trash, Clock } from "@phosphor-icons/react/dist/ssr";
import { ServiceDTO } from "@/data/definitions/service";

export const dynamic = 'force-dynamic';

const categoryColors: Record<string, string> = {
  shift: "bg-blue-50 text-blue-700 border-blue-200",
  visit: "bg-emerald-50 text-emerald-700 border-emerald-200",
  procedure: "bg-violet-50 text-violet-700 border-violet-200",
  equipment: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

export default async function ServicesPage() {
  const services = (await getServicesAction()) as ServiceDTO[];

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <FirstAidKit weight="duotone" className="opacity-80"/>
                    Catálogo de Serviços
                </h1>
                <p className="text-slate-500 mt-1">Gerencie os tipos de atendimento e seus códigos TUSS.</p>
            </div>
            <ServiceDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => (
                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded flex items-center justify-center text-xl ${categoryColors[item.category] || categoryColors.other}`}>
                                <FirstAidKit weight="fill" className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 line-clamp-1" title={item.name}>{item.name}</CardTitle>
                                <p className="text-xs text-slate-500 font-mono">{item.code || 'S/ Código'}</p>
                            </div>
                        </div>
                        <Badge variant={item.is_active ? 'default' : 'secondary'} className={item.is_active ? "bg-slate-800" : "bg-slate-300"}>
                            {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex gap-2 mb-4">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200 text-slate-500">
                                {item.category}
                            </Badge>
                            {item.default_duration_minutes > 0 && (
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 flex items-center gap-1">
                                    <Clock size={12} /> {item.default_duration_minutes} min
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <ServiceDialog service={item} trigger={
                                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><PencilSimple className="mr-2"/> Editar</Button>
                            }/>
                            <form action={async () => {
                                "use server";
                                await deleteServiceAction(item.id);
                            }}>
                              <Button type="submit" variant="ghost" size="sm" className="h-8 w-8 text-rose-500 hover:bg-rose-50">
                                  <Trash />
                              </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            ))}
            
            {services.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p>Nenhum serviço cadastrado.</p>
                    <p className="text-xs">Clique em &apos;Novo Serviço&apos; para começar.</p>
                </div>
            )}
        </div>
        
      </div>
    </div>
  );
}
