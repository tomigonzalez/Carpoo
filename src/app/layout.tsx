import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Encabezado } from "@/components/Encabezado";
import { BarraAbajo } from "@/components/BarraAbajo";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Carpoo · Viajes compartidos entre pueblos",
  description:
    "Encontrá o publicá viajes entre pueblos: mirá quién maneja, cuántos asientos quedan y coordiná por WhatsApp.",
  applicationName: "Carpoo",
  icons: { icon: "/avatares/carpoo-icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f5132",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <Encabezado />
        <main className="contenedor pagina">{children}</main>
        <footer className="pie">
          <div className="contenedor pie-fila">
            <span className="pie-marca">Carpoo</span>
            <span>Viajes compartidos entre pueblos. El aporte y el punto de encuentro se arreglan por WhatsApp.</span>
          </div>
        </footer>
        <BarraAbajo logueado={Boolean(user)} />
      </body>
    </html>
  );
}
