import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Encabezado } from "@/components/Encabezado";

export const metadata: Metadata = {
  title: "Carpoo · Viajes compartidos entre pueblos",
  description:
    "Encontrá o publicá viajes entre pueblos: mirá quién maneja, cuántos asientos quedan y coordiná por WhatsApp.",
  applicationName: "Carpoo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1026",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <Encabezado />
        <main className="contenedor pagina">{children}</main>
      </body>
    </html>
  );
}
