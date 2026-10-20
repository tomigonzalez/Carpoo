import Link from "next/link";
import { EnlaceBoton } from "@/components/ui";

export default function NoEncontrado() {
  return (
    <div className="tarjeta" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem" }}>No encontramos esta página</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Puede que el viaje ya no exista o que el enlace esté mal escrito.
      </p>
      <EnlaceBoton href="/buscar">Buscar asiento</EnlaceBoton>
      <p style={{ marginTop: 12, marginBottom: 0 }}>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
