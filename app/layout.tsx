import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Solo Noticias Positivas",
    default: "Solo Noticias Positivas",
  },
  description:
    "Colombia Positiva es el periódico digital nacional que celebra los logros, avances y buenas noticias del país. Personajes, Educación, Regiones, Emprendimiento, Cultura, Turismo, Deporte y Ciencia.",
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
    <html lang="es" className={fredoka.variable}>
      <body className="min-h-screen flex flex-col bg-papel font-sans text-tinta antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
