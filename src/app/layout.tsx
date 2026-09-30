import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { InfoBar } from "@/components/info-bar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CookieConsent } from "@/components/cookie-consent";
import { getPublicSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: {
    default: "AMG — Centro de Distribuição | Produtos de Limpeza e EPIs",
    template: "%s | AMG",
  },
  description:
    "Produtos de limpeza profissional e EPIs com entrega própria em São Paulo e retirada na loja.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "AMG — Centro de Distribuição",
    title: "AMG — Centro de Distribuição",
    description:
      "Produtos de limpeza profissional e EPIs com entrega própria em São Paulo e retirada na loja.",
    images: [{ url: "/logo-header.png", alt: "AMG — Centro de Distribuição" }],
  },
  twitter: {
    card: "summary",
    title: "AMG — Centro de Distribuição",
    description:
      "Produtos de limpeza profissional e EPIs com entrega própria em São Paulo e retirada na loja.",
    images: ["/logo-header.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <Header />
        <InfoBar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <CookieConsent />
      </body>
    </html>
  );
}
