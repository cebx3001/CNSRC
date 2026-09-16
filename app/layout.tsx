import type { Metadata } from "next";
import "./globals.css";
import "./content-font.css";

export const metadata: Metadata = {
  title: "CNSRC — Capacidad integrada",
  description: "Estrategia, producción, experiencias, tecnología e infraestructura desde la idea hasta la implementación.",
  icons: { icon: "favicon.svg", shortcut: "favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
