import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntegrationDialog } from "@/modules/admin/components/IntegrationDialog";
import { ServiceDialog } from "@/modules/admin/components/ServiceDialog";
import { PlugsConnected, FirstAidKit, Buildings, GearSix, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
              <GearSix weight="duotone" className="opacity-80" />
              Central Administrativa
            </h1>
            <p className="text-slate-500 mt-1">Gerencie a conta da empresa, integrações e catálogos de serviço.</p>
          </div>
          <Badge variant="secondary" className="bg-[#0F2B45]/10 text-[#0F2B45]">Admin</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <PlugsConnected weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Hub de Integrações</CardTitle>
                  <p className="text-xs text-slate-500">Gateways, ERP e fiscal.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Conecte Conta Azul, Pagar.me, Celcoin e Asaas para automatizar cobranças e conciliação.</p>
              <div className="flex gap-2">
                <IntegrationDialog trigger={
                  <Button size="sm" className="flex-1 bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">Nova Integração</Button>
                } />
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href="/admin/integrations">Gerenciar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FirstAidKit weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Catálogo de Serviços</CardTitle>
                  <p className="text-xs text-slate-500">Plantões, visitas e locações.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Defina códigos TUSS, duração padrão e unidades de medida para cada serviço faturável.</p>
              <div className="flex gap-2">
                <ServiceDialog trigger={
                  <Button size="sm" className="flex-1 bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">Novo Serviço</Button>
                } />
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href="/admin/services">Gerenciar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Buildings weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Operadoras & Contratos</CardTitle>
                  <p className="text-xs text-slate-500">Fontes pagadoras.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Cadastre convênios, prazos de faturamento e códigos de integração.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href="/admin/contractors">Abrir Gestão</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Conta e Segurança</CardTitle>
                  <p className="text-xs text-slate-500">Perfis, domínios e acesso.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Configure dados da empresa, branding e políticas de acesso. (Em breve)</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled className="flex-1">Configurar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
