import Link from "next/link";
import { getCurrentUser, isProfileComplete } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "./ui";

/** Barra superior: siempre dice quién sos y permite salir en un toque. */
export async function Encabezado() {
  const user = await getCurrentUser();

  return (
    <header className="encabezado">
      <div className="contenedor encabezado-fila">
        <Link href="/" className="marca-app">
          <span className="marca-logo" aria-hidden="true">
            🚗
          </span>
          Carpoo
        </Link>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              <span style={{ fontWeight: 700, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
