import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Ou a fonte que estiver usando
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- IMPORTANTE: Importe do Sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conecta Care V2",
  description: "Gestão de Home Care Enterprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster /> {/* <--- ADICIONE ESTA LINHA AQUI */}
      </body>
    </html>
  );
}
