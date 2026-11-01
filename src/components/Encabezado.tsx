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
        <div className="encabezado-izquierda">
          <Link href="/" className="marca-app">
            {/* eslint-disable-next-line @next/next/no-img-element -- El logo es un SVG público. */}
            <img
              src="/avatares/carpoo-icon.svg"
              alt=""
              width={40}
              height={40}
              className="marca-icono"
            />
            <span>Carpoo</span>
          </Link>
          <nav className="nav-principal" aria-label="Navegación principal">
            <Link href="/buscar">Buscar asiento</Link>
            <Link href="/publicar">Ofrecer viaje</Link>
            <Link href={user ? "/mis-viajes" : "/ingresar?volver=/mis-viajes"}>Mis viajes</Link>
            <Link href={user ? "/perfil" : "/ingresar?volver=/perfil"}>Mi perfil</Link>
          </nav>
        </div>

        {user ? (
          <div className="acciones-usuario">
            {!isProfileComplete(user) ? (
              <Link href="/perfil" className="etiqueta-estado estado-aviso etiqueta-perfil">
                Completá tu perfil
              </Link>
            ) : null}
            <Link href="/perfil" className="enlace-perfil">
              <Avatar src={user.image} nombre={user.name} chico />
              <span className="nombre-usuario">{user.name.split(" ")[0]}</span>
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn-secundario btn-chico boton-salir">
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link href="/ingresar" className="btn btn-primario btn-chico">
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
