import MobileStudyBar from "@/components/MobileStudyBar";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAFIPA Study OS — Contador Curitiba 2026",
  description: "Fila de estudo priorizada para o concurso de Contador (FAFIPA / Curitiba).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2a4a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}<MobileStudyBar /></body>
    </html>
  );
}
