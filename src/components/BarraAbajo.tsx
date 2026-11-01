"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const iconos = {
  casa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  buscar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  ),
  viajes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 16V8l2-4h12l2 4v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16h18" strokeLinecap="round" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
    </svg>
  ),
  publicar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  ),
  perfil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  ),
};

export function BarraAbajo({ logueado }: { logueado: boolean }) {
  const ruta = usePathname();

  const items = [
    { href: "/", etiqueta: "Inicio", icono: iconos.casa },
    { href: "/buscar", etiqueta: "Buscar", icono: iconos.buscar },
    { href: logueado ? "/publicar" : "/ingresar?volver=/publicar", etiqueta: "Publicar", icono: iconos.publicar },
    { href: logueado ? "/mis-viajes" : "/ingresar?volver=/mis-viajes", etiqueta: "Mis viajes", icono: iconos.viajes },
    { href: logueado ? "/perfil" : "/ingresar?volver=/perfil", etiqueta: "Mi perfil", icono: iconos.perfil },
  ];

  return (
    <nav className="barra-abajo" aria-label="Secciones principales">
      {items.map((item) => {
        const tieneConsulta = item.href.includes("?");
        const activo = !tieneConsulta && (item.href === "/" ? ruta === "/" : ruta.startsWith(item.href));
        return (
          <Link key={item.etiqueta} href={item.href} data-activo={activo}>
            {item.icono}
            {item.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
