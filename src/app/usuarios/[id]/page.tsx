import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPublicStats, attendanceLabel, ratingLabel } from "@/lib/stats";
import { getDriverUpcomingTrips, getReviewsReceived } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { Alerta, Avatar, Estado, Estrellas, TituloPagina, Verificado } from "@/components/ui";
import { TripCard } from "@/components/TripCard";

export const metadata = { title: "Perfil de usuario · Carpoo" };

export default async function UsuarioPage({ params }: PageProps<"/usuarios/[id]">) {
  const { id } = await params;
  const usuario = await prisma.user.findUnique({ where: { id } });
  if (!usuario) notFound();

  const [stats, resenas, susViajes] = await Promise.all([
    getPublicStats(usuario),
    getReviewsReceived(usuario.id),
    getDriverUpcomingTrips(usuario.id),
  ]);

  return (
    <>
      <p className="volver">
        <a href="/buscar">← Volver</a>
      </p>

      <section className="tarjeta">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar src={usuario.image} nombre={usuario.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{usuario.name}</h1>
              <Verificado verificado={stats.verified} />
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--texto-suave)" }}>
              En Carpoo desde {formatDate(usuario.createdAt)}
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
            <span className="dato-clave">Identidad</span>
            <span className="dato-valor">
              {stats.verified ? <Estado tipo="ok">Verificada</Estado> : <Estado tipo="aviso">Pendiente</Estado>}
            </span>
          </div>
        </div>

        {usuario.carModel || usuario.carColor ? (
          <p style={{ marginBottom: 0 }}>
            Auto: {[usuario.carColor, usuario.carModel].filter(Boolean).join(" ")}
            {usuario.carPlate ? ` · ${usuario.carPlate}` : ""}
          </p>
        ) : null}

        <p style={{ marginBottom: 0, color: "var(--texto-suave)", fontSize: "0.9rem" }}>
          Por seguridad, el teléfono solo se comparte cuando hay una reserva confirmada.
        </p>
      </section>

      {susViajes.length > 0 ? (
        <>
          <TituloPagina titulo="Próximos viajes publicados" />
          {susViajes.map((viaje) => (
            <TripCard key={viaje.id} trip={viaje} stats={stats} />
          ))}
        </>
      ) : null}

      <section className="tarjeta">
        <h2 className="tarjeta-titulo">Opiniones recibidas</h2>
        {resenas.length === 0 ? (
          <p style={{ margin: 0, color: "var(--texto-suave)" }}>Todavía no tiene opiniones.</p>
        ) : (
          <ul className="lista-limpia" style={{ display: "grid", gap: 12 }}>
            {resenas.map((resena) => (
              <li key={resena.id} style={{ borderTop: "1px dashed var(--borde)", paddingTop: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Estrellas valor={resena.rating} />
                  <strong>{resena.author.name}</strong>
                  <span className="ayuda" style={{ margin: 0 }}>
                    {formatDate(resena.createdAt)}
                  </span>
                </div>
                {resena.comment ? <p style={{ margin: "4px 0 0" }}>{resena.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Alerta tipo="info">
        Si algo no te cierra, no reserves. Carpoo conecta personas: siempre avisá a alguien de
        confianza antes de viajar con alguien que no conocés.
      </Alerta>
    </>
  );
}
