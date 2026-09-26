import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAFIPA Study OS — Contador Curitiba 2026",
  description: "Fila de estudo priorizada para o concurso de Contador (FAFIPA / Curitiba).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
