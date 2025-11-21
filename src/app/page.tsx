import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona a raiz para a tela pública de login
  redirect("/login");
}
