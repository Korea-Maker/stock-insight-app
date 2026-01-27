import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Fraunces,
  Newsreader,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";
import "./themes/bloomberg.css";
import "./themes/editorial.css";
import "./themes/calm.css";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { DesignThemeProvider } from "@/components/Theme/DesignThemeProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

// Satoshi is a premium font - using Instrument Sans as alternative body font

export const metadata: Metadata = {
  title: "Stock Insight - AI 주식 분석",
  description: "AI 기반 주식 딥리서치 분석 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${newsreader.variable} ${instrumentSans.variable} font-sans antialiased`}
      >
        <ThemeProvider defaultTheme="light">
          <DesignThemeProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </DesignThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
