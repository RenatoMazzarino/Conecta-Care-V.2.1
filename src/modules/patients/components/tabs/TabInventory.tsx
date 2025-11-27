'use client';

import { useState } from "react";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { assignAsset, returnAsset, updateConsumableStock } from "@/app/(app)/patients/actions.inventory";
import { Calendar, Warehouse, Package, ArrowSquareDownLeft } from "@phosphor-icons/react";

type Asset = {
  id: string;
  item_name?: string;
  serial_number?: string;
  location?: string;
  installed_at?: string;
  status?: string;
};

type Consumable = {
  id: string;
  item_id?: string;
  item_name?: string;
  quantity?: number;
  min_quantity?: number;
  last_replenished_at?: string;
};

function AssetSheet({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await assignAsset({ patientId, itemId, serial, location });
    setSaving(false);
    if (!res.success) return toast.error(res.error || "Erro ao alocar");
    toast.success("Equipamento alocado");
    setOpen(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><Warehouse className="w-4 h-4 mr-1" /> Alocar Equipamento</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md space-y-4">
        <SheetHeader><SheetTitle>Alocar Equipamento</SheetTitle></SheetHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>ID do item</Label><Input value={itemId} onChange={(e)=>setItemId(e.target.value)} placeholder="Item master" /></div>
          <div className="space-y-1"><Label>Nº Série / Patrimônio</Label><Input value={serial} onChange={(e)=>setSerial(e.target.value)} /></div>
          <div className="space-y-1"><Label>Local de uso</Label><Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Quarto, sala..." /></div>
        </div>
        <SheetFooter className="flex gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving || !itemId}>Salvar</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ReturnButton({ assetId, onDone }: { assetId: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    const res = await returnAsset({ assetId });
    setLoading(false);
    if (!res.success) return toast.error(res.error || "Erro");
    toast.success("Equipamento devolvido");
    onDone();
  };
  return <Button size="sm" variant="ghost" onClick={handle} disabled={loading} className="text-rose-600">Devolver</Button>;
}

function ConsumableSheet({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(0);
  const [type, setType] = useState<"in"|"out">("in");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateConsumableStock({ patientId, itemId, quantity: qty, type });
    setSaving(false);
    if (!res.success) return toast.error(res.error || "Erro");
    toast.success("Saldo atualizado");
    setOpen(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><ArrowSquareDownLeft className="w-4 h-4 mr-1" /> Solicitar/ Ajuste</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md space-y-4">
        <SheetHeader><SheetTitle>Reposição / Ajuste</SheetTitle></SheetHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>ID do item</Label><Input value={itemId} onChange={(e)=>setItemId(e.target.value)} /></div>
          <div className="space-y-1"><Label>Quantidade</Label><Input type="number" value={qty} onChange={(e)=>setQty(Number(e.target.value))} /></div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant={type==='in'?'default':'outline'} onClick={()=>setType('in')}>Entrada</Button>
              <Button type="button" variant={type==='out'?'default':'outline'} onClick={()=>setType('out')}>Saída</Button>
            </div>
          </div>
        </div>
        <SheetFooter className="flex gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving || !itemId}>Salvar</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TabInventory({ patient }: { patient: FullPatientDetails }) {
  const assets: Asset[] = (patient as any).assigned_assets || [];
  const consumables: Consumable[] = (patient as any).consumables || [];
  const movements: any[] = (patient as any).movements || [];

  const refresh = () => window.location.reload();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ativos */}
        <Card className="shadow-fluent border-slate-200">
          <CardHeader className="border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-base text-[#0F2B45] flex items-center gap-2"><Warehouse className="w-5 h-5" /> Ativos Alocados</CardTitle>
            <AssetSheet patientId={patient.id} onSaved={refresh} />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {assets.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum equipamento alocado.</div>
            ) : (
              assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{a.serial_number || 'Sem série'}</Badge>
                      <Badge className={a.status === 'em_uso' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{a.status || 'Em uso'}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{a.item_name || 'Equipamento'}</p>
                    <p className="text-xs text-slate-500">Local: {a.location || 'N/D'}</p>
                    {a.installed_at && <p className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(a.installed_at).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <ReturnButton assetId={a.id} onDone={refresh} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Consumíveis */}
        <Card className="shadow-fluent border-slate-200">
          <CardHeader className="border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-base text-[#0F2B45] flex items-center gap-2"><Package className="w-5 h-5" /> Estoque de Consumo</CardTitle>
            <ConsumableSheet patientId={patient.id} onSaved={refresh} />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {consumables.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum insumo cadastrado.</div>
            ) : (
              consumables.map((c) => {
                const qty = c.quantity || 0;
                const min = c.min_quantity || 0;
                const percent = min > 0 ? Math.min(100, Math.round((qty / min) * 100)) : 100;
                const critical = min > 0 && qty < min;
                return (
                  <div key={c.id} className="rounded border border-slate-100 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.item_name || 'Item'}</p>
                        <p className="text-xs text-slate-500">Qtd: {qty} / Mín: {min}</p>
                      </div>
                      <Badge className={critical ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}>{critical ? 'Crítico' : 'OK'}</Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${critical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {c.last_replenished_at && <p className="text-[11px] text-slate-400">Última reposição: {new Date(c.last_replenished_at).toLocaleDateString('pt-BR')}</p>}
                    <Button size="sm" variant="outline" onClick={() => updateConsumableStock({ patientId: patient.id, itemId: c.item_id || '', quantity: 1, type: 'out' }).then(refresh)}>
                      Ajuste rápido (-1)
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base text-[#0F2B45]">Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm">
          {movements.length === 0 ? (
            <div className="text-slate-500">Sem movimentações.</div>
          ) : (
            movements.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                <span>{new Date(m.created_at).toLocaleDateString('pt-BR')}</span>
                <Badge variant="outline" className="text-[10px]">{m.movement_type}</Badge>
                <span>{m.item_id || m.asset_id}</span>
                <span>Qtd: {m.quantity || 1}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
