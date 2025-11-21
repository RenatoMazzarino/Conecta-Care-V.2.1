import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46F5D]">Acesso</p>
          <h1 className="text-3xl font-bold text-[#0F2B45]">Entrar</h1>
          <p className="text-slate-500">Use suas credenciais para acessar o painel protegido.</p>
        </div>

        <form className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="text-[#0F2B45] hover:underline">
              Esqueci minha senha
            </Link>
            <Link href="/login" className="text-slate-400 hover:text-[#0F2B45] hover:underline">
              Suporte
            </Link>
          </div>
          <Button type="submit" className="w-full bg-[#0F2B45] hover:bg-[#0F2B45]/90 text-white">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
