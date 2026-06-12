import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "CatIA – Generador de Motivadas Catastrales",
  description: "Sistema IA para generación de motivadas de trámites catastrales colombianos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0F172A] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
