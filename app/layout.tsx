import MobileStudyBar from "@/components/MobileStudyBar";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concursos: Vou Passar! — Preparação para concursos",
  description: "Plataforma de preparação para concursos públicos: plano de estudos, questões, revisões e simulados.",
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
