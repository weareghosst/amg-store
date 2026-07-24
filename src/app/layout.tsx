import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-context";
import { Header } from "@/components/header";
import { InfoBar } from "@/components/info-bar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AMG — Centro de Distribuição | Produtos de Limpeza e EPIs",
    template: "%s | AMG",
  },
  description:
    "Produtos de limpeza profissional e EPIs com entrega própria em São Paulo e envio para todo o Brasil.",
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
        <CartProvider>
          <Header />
          <InfoBar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
