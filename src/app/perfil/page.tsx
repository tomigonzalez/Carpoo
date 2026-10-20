import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete, missingProfileItems } from "@/lib/session";
import { getPublicStats, attendanceLabel, ratingLabel } from "@/lib/stats";
import { getReviewsReceived } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { prettyPhone } from "@/lib/validate";
import { logout } from "@/lib/actions/auth";
import {
  Alerta,
  Avatar,
  Estado,
  Estrellas,
  TituloPagina,
  Verificado,
} from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";
import { FormularioPerfil } from "@/components/FormularioPerfil";
import { FormularioTelefono } from "@/components/FormularioTelefono";

export const metadata = { title: "Mi perfil · Carpoo" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/perfil");

  const [stats, resenas] = await Promise.all([getPublicStats(user), getReviewsReceived(user.id)]);
  const completo = isProfileComplete(user);

  return (
    <>
      <TituloPagina titulo="Mi perfil" subtitulo="Tus datos, tu verificación y tu reputación." />

      <section className="tarjeta">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar src={user.image} nombre={user.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem" }}>{user.name}</h2>
              <Verificado verificado={stats.verified} />
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--texto-suave)" }}>
              {prettyPhone(user.phone)} · En Carpoo desde {formatDate(user.createdAt)}
            </p>
            <p style={{ margin: "4px 0 0" }}>
              <Link href={`/usuarios/${user.id}`}>Ver cómo me ven los demás</Link>
            </p>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="dato">
            <span className="dato-clave">Reputación</span>
            <span className="dato-valor">
              {stats.rating ? (
                <>
                  <Estrellas valor={stats.rating} /> {ratingLabel(stats.rating, stats.reviewCount)}
                </>
              ) : (
                "Sin calificaciones todavía"
              )}
            </span>
          </div>
          <div className="dato">
            <span className="dato-clave">Presentismo</span>
            <span className="dato-valor">{attendanceLabel(stats.attendanceRate)}</span>
          </div>
          <div className="dato">
            <span className="dato-clave">Viajes completados</span>
            <span className="dato-valor">{stats.completedTrips}</span>
          </div>
          <div className="dato">
            <span className="dato-clave">Teléfono</span>
            <span className="dato-valor">
              {user.phoneVerified ? <Estado tipo="ok">Verificado</Estado> : <Estado tipo="aviso">Sin verificar</Estado>}
            </span>
          </div>
        </div>
      </section>

      {!completo ? (
        <Alerta tipo="info">
          Te falta {missingProfileItems(user).join(" y ")} para poder reservar u ofrecer viajes.
        </Alerta>
      ) : (
        <Alerta tipo="ok">Tu perfil está completo. ¡Ya podés viajar!</Alerta>
      )}

      <FormularioTelefono telefono={prettyPhone(user.phone)} verificado={user.phoneVerified} />

      <FormularioPerfil
        nombre={user.name}
        imagen={user.image}
        carModel={user.carModel}
        carColor={user.carColor}
        carPlate={user.carPlate}
        tieneVerificado={Boolean(user.image)}
      />

      <section className="tarjeta">
        <h2 className="tarjeta-titulo">Lo que dicen de mí</h2>
        {resenas.length === 0 ? (
          <p style={{ margin: 0, color: "var(--texto-suave)" }}>
            Todavía no recibiste calificaciones. Después de cada viaje, la otra persona puede
            puntuarte.
          </p>
        ) : (
          <ul className="lista-limpia" style={{ display: "grid", gap: 12 }}>
            {resenas.map((resena) => (
              <li key={resena.id} style={{ borderTop: "1px dashed var(--borde)", paddingTop: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Estrellas valor={resena.rating} />
                  <strong>{resena.author.name}</strong>
                  <span className="ayuda" style={{ margin: 0 }}>
                    {formatDate(resena.trip.dateTime)} · {resena.trip.origin} → {resena.trip.destination}
                  </span>
                </div>
                {resena.comment ? <p style={{ margin: "4px 0 0" }}>{resena.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={logout} style={{ marginTop: 18 }}>
        <BotonEnviar variante="secundario">Cerrar sesión</BotonEnviar>
      </form>
    </>
  );
}
