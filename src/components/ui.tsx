import Link from "next/link";
import type { ReactNode } from "react";
import { whatsappLink } from "@/lib/validate";

/* --------------------------------------------------------------------------
   Piezas de interfaz reutilizables (todas de servidor: no llevan JavaScript).
   -------------------------------------------------------------------------- */

export function Alerta({
  tipo = "info",
  children,
}: {
  tipo?: "error" | "ok" | "info";
  children: ReactNode;
}) {
  const clase = tipo === "error" ? "alerta-error" : tipo === "ok" ? "alerta-ok" : "alerta-info";
  const role = tipo === "error" ? "alert" : "status";
  return (
    <p className={`alerta ${clase}`} role={role}>
      {children}
    </p>
  );
}

export function Avatar({
  src,
  nombre,
  chico = false,
}: {
  src?: string | null;
  nombre: string;
  chico?: boolean;
}) {
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  if (!src) {
    return (
      <span
        className={`avatar ${chico ? "avatar-chico" : ""}`}
        aria-hidden="true"
        style={{ display: "grid", placeItems: "center", fontWeight: 800, color: "#4a5560" }}
      >
        {iniciales || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Las fotos vienen de Google/Facebook o de una URL libre.
    <img className={`avatar ${chico ? "avatar-chico" : ""}`} src={src} alt={`Foto de ${nombre}`} />
  );
}

export function Estrellas({ valor, grande = false }: { valor: number; grande?: boolean }) {
  const redondeado = Math.round(valor);
  return (
    <span
      style={{ fontSize: grande ? "1.6rem" : "1.05rem", letterSpacing: 2, color: "#d98c00" }}
      aria-label={`${valor.toFixed(1)} de 5 estrellas`}
    >
      {"★".repeat(redondeado)}
      <span style={{ color: "#c9d2dc" }}>{"★".repeat(5 - redondeado)}</span>
    </span>
  );
}

export function Estado({
  tipo = "gris",
  children,
}: {
  tipo?: "ok" | "aviso" | "gris" | "rojo";
  children: ReactNode;
}) {
  return <span className={`etiqueta-estado estado-${tipo}`}>{children}</span>;
}

export function Verificado({ verificado = true }: { verificado?: boolean }) {
  if (!verificado) return null;
  return (
    <span className="etiqueta-estado estado-ok" title="Teléfono verificado y foto de perfil">
      ✓ Verificado
    </span>
  );
}

export function BotonWhatsApp({
  telefono,
  mensaje,
  texto = "Abrir chat de WhatsApp",
}: {
  telefono: string;
  mensaje: string;
  texto?: string;
}) {
  return (
    <a
      className="btn btn-verde"
      href={whatsappLink(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.13.24-3.67-.77-3.1-1.22-5.04-4.4-5.19-4.6-.15-.2-1.24-1.65-1.24-3.15 0-1.5.79-2.24 1.07-2.55.28-.31.6-.38.8-.38.2 0 .4 0 .58.01.19.01.44-.07.68.52.25.6.85 2.07.92 2.22.08.15.13.33.03.53-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.15.5.22.57.35.07.12.07.72-.17 1.4Z" />
      </svg>
      {texto}
    </a>
  );
}

export function TituloPagina({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: 18 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{titulo}</h1>
      {subtitulo ? (
        <p style={{ margin: "6px 0 0", color: "var(--texto-suave)" }}>{subtitulo}</p>
      ) : null}
      {children}
    </header>
  );
}

export function Vacio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto?: string;
  children?: ReactNode;
}) {
  return (
    <div className="tarjeta" style={{ textAlign: "center" }}>
      <p style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>{titulo}</p>
      {texto ? <p style={{ color: "var(--texto-suave)", marginTop: 6 }}>{texto}</p> : null}
      {children ? <div style={{ marginTop: 14 }}>{children}</div> : null}
    </div>
  );
}

export function EnlaceBoton({
  href,
  children,
  variante = "primario",
}: {
  href: string;
  children: ReactNode;
  variante?: "primario" | "secundario" | "verde";
}) {
  return (
    <Link className={`btn btn-${variante}`} href={href}>
      {children}
    </Link>
  );
}
