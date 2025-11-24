import { getIntegrationsAction } from "@/modules/admin/actions.integrations";
import { IntegrationDialog } from "@/modules/admin/components/IntegrationDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlugsConnected, PencilSimple, LockKey } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

const providerColors: Record<string, string> = {
  conta_azul: "bg-blue-50 text-blue-700",
  pagar_me: "bg-emerald-50 text-emerald-700",
  celcoin: "bg-violet-50 text-violet-700",
  asaas: "bg-slate-100 text-slate-700",
};

export default async function IntegrationsPage() {
  const integrations = await getIntegrationsAction();

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
                    <PlugsConnected weight="duotone" className="opacity-80"/>
                    Hub de Integrações
                </h1>
                <p className="text-slate-500 mt-1">Configure os gateways de pagamento e sistemas fiscais.</p>
            </div>
            <IntegrationDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item: any) => (
                <Card key={item.id} className="shadow-sm border-slate-200 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${item.environment === 'production' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    
                    <CardHeader className="pb-2 pt-5 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded flex items-center justify-center text-xl ${providerColors[item.provider]}`}>
                                <LockKey weight="fill" className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 capitalize">{item.provider.replace('_', ' ')}</CardTitle>
                                <p className="text-xs text-slate-500 uppercase font-bold">{item.environment}</p>
                            </div>
                        </div>
                        <Badge variant={item.is_active ? 'default' : 'secondary'} className={item.is_active ? "bg-emerald-600" : "bg-slate-300"}>
                            {item.is_active ? 'ON' : 'OFF'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border mb-4 truncate">
                            Key: •••••••••••{item.api_key?.slice(-4) || ''}
                        </div>
                        <div className="flex gap-2">
                            <IntegrationDialog config={item} trigger={
                                <Button variant="outline" size="sm" className="w-full"><PencilSimple className="mr-2"/> Configurar</Button>
                            }/>
                        </div>
                    </CardContent>
                </Card>
            ))}
            
            {integrations.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    <p>Nenhuma integração configurada.</p>
                    <p className="text-xs">Conecte seu Conta Azul ou Pagar.me para começar.</p>
                </div>
            )}
        </div>
        
      </div>
    </div>
  );
}
