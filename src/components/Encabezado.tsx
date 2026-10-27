import Link from "next/link";
import { getCurrentUser, isProfileComplete } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "./ui";

/** Header web: navegación superior clara. */
export async function Encabezado() {
  const user = await getCurrentUser();

  return (
    <header className="encabezado">
      <div className="contenedor encabezado-fila">
        <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
          <Link href="/" className="marca-app">
            <span className="marca-logo" aria-hidden="true">
              🚗
            </span>
            Carpoo
          </Link>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              fontWeight: 700,
            }}
            aria-label="Navegación principal"
          >
            <Link href="/buscar" style={{ color: "var(--texto)", textDecoration: "none" }}>
              Buscar
            </Link>
            <Link href="/publicar" style={{ color: "var(--texto)", textDecoration: "none" }}>
              Ofrecer viaje
            </Link>
            <Link href={user ? "/mis-viajes" : "/ingresar?volver=/mis-viajes"} style={{ color: "var(--texto)", textDecoration: "none" }}>
              Mis viajes
            </Link>
            <Link href={user ? "/perfil" : "/ingresar?volver=/perfil"} style={{ color: "var(--texto)", textDecoration: "none" }}>
              Perfil
            </Link>
          </nav>
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!isProfileComplete(user) ? (
              <Link
                href="/perfil"
                className="etiqueta-estado estado-aviso"
                style={{ textDecoration: "none" }}
              >
                Completá tu perfil
              </Link>
            ) : null}
            <Link
              href="/perfil"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}
            >
              <Avatar src={user.image} nombre={user.name} chico />
              <span style={{ fontWeight: 700, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name.split(" ")[0]}
              </span>
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn-secundario btn-chico" style={{ width: "auto" }}>
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link href="/ingresar" className="btn btn-primario btn-chico" style={{ width: "auto" }}>
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
