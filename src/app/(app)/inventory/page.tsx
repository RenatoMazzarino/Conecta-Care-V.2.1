import { getInventoryMasterAction } from "@/modules/inventory/actions";
import { InventoryMasterDialog } from "@/modules/inventory/components/InventoryMasterDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, QrCode, Tag, PencilSimple, Archive } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const items = await getInventoryMasterAction();

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <Archive weight="duotone" className="opacity-80"/>
                    Gestão de Estoque
                </h1>
                <p className="text-slate-500 mt-1">Catálogo mestre de equipamentos e insumos.</p>
            </div>
            <InventoryMasterDialog />
        </div>

        <div className="grid gap-4">
            {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                    <Package size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>Nenhum item cadastrado no catálogo.</p>
                </div>
            ) : (
                items.map((item: any) => (
                    <Card key={item.id} className="shadow-sm hover:shadow-md transition-all border-slate-200">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-xl ${item.category === 'equipment' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {item.category === 'equipment' ? <QrCode weight="fill"/> : <Tag weight="fill"/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                        {item.name}
                                        <Badge variant="outline" className="text-[10px] font-normal text-slate-500 border-slate-200">
                                            {item.sku || 'S/ SKU'}
                                        </Badge>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {item.brand} {item.model ? `• ${item.model}` : ''} • 
                                        <span className="uppercase ml-1 font-semibold">{item.category === 'equipment' ? 'Patrimônio' : 'Consumo'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Alocados</p>
                                    <p className="text-lg font-bold text-[#0F2B45]">{item.total_allocated} <span className="text-xs font-normal text-slate-500">{item.unit_of_measure}</span></p>
                                </div>
                                
                                <div className="flex gap-1">
                                    <InventoryMasterDialog item={item} trigger={
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#0F2B45]">
                                            <PencilSimple size={18} />
                                        </Button>
                                    }/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
        
      </div>
    </div>
  );
}
