import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "CatIA – Generador de Motivadas Catastrales",
  description: "Sistema IA para generación de motivadas de trámites catastrales colombianos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Apply saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('catia-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e){}
          })();
        ` }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
