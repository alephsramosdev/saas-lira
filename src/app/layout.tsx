import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import EmotionRegistry from "./emotion-registry";
import Shell from "@/components/Shell";
import { getAppData } from "@/lib/data";

const instrument = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-money",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lira — Controle Financeiro",
  description: "Controle financeiro simples: entradas, saídas, metas e métricas.",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { summary, sources } = await getAppData();

  return (
    <html lang="pt-BR" className={`${instrument.variable} ${spaceGrotesk.variable}`}>
      <body>
        <EmotionRegistry>
          <Shell summary={summary} sources={sources}>
            {children}
          </Shell>
        </EmotionRegistry>
      </body>
    </html>
  );
}
