import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Solo Noticias Positivas",
    default: "Solo Noticias Positivas",
  },
  description:
    "Colombia Positiva es el periódico digital nacional que celebra los logros, avances y buenas noticias del país. Economía, Medio Ambiente, Cultura, Deporte, Ciencia y Regiones.",
  keywords: ["Colombia", "noticias positivas", "periódico", "buenas noticias"],
  openGraph: {
    title: "Solo Noticias Positivas",
    description: "El periódico de las buenas noticias de Colombia",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen flex flex-col bg-papel font-sans text-tinta antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
