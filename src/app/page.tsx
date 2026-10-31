import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getUpcomingTrips } from "@/lib/queries";
import { getStatsForUsers } from "@/lib/stats";
import { TripCard } from "@/components/TripCard";
import { EnlaceBoton, Vacio } from "@/components/ui";

export default async function InicioPage() {
  const [user, viajes] = await Promise.all([getCurrentUser(), getUpcomingTrips(12)]);
  const stats = await getStatsForUsers([...new Set(viajes.map((v) => v.driver.id))]);

  return (
    <>
      <section className="hero">
        <div className="hero-contenido">
          <p className="hero-etiqueta">Villarino, Médanos y Bahía Blanca</p>
          <h1>De un pueblo a otro, con lugar para vos.</h1>
          <p className="hero-texto">
            Encontrá quién viaja para el mismo lado, reservá tu asiento y coordiná por WhatsApp.
            Sin comisiones ni vueltas.
          </p>
          <div className="hero-acciones">
            <Link className="btn btn-claro" href="/buscar">
              Buscar asiento
            </Link>
            <Link className="btn btn-contorno-claro" href="/publicar">
              Ofrecer viaje
            </Link>
          </div>
          <ul className="hero-confianza">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Perfiles verificados
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cupos en tiempo real
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Coordinás por WhatsApp
            </li>
          </ul>
        </div>

        <div className="hero-pasaje" aria-hidden="true">
          <p className="pasaje-etiqueta">El camino de todos los días</p>
          <div className="pasaje-ciudades">
            <span>Villarino</span>
            <span>Bahía Blanca</span>
          </div>
          <div className="pasaje-ruta">
            <span className="pasaje-punto" />
            <span className="pasaje-linea" />
            <svg className="pasaje-pin" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-8.5A3.5 3.5 0 1 1 12 6.5a3.5 3.5 0 0 1 0 7Z" />
            </svg>
          </div>
          <p className="pasaje-pie">
            <span>
              Asientos <strong>en vivo</strong>
            </span>
            <span>Coordinás por WhatsApp</span>
          </p>
        </div>
      </section>

      <section>
        <div className="seccion-cabecera">
          <div>
            <h2>Viajes disponibles</h2>
            <p>Los próximos viajes publicados</p>
          </div>
          <Link href="/buscar" className="enlace-sutil">
            Ver todos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {viajes.length === 0 ? (
          <Vacio
            titulo="Todavía no hay viajes publicados"
            texto="Sé el primero en ofrecer un viaje."
          >
            <EnlaceBoton href="/publicar" variante="verde">
              Ofrecer viaje
            </EnlaceBoton>
          </Vacio>
        ) : (
          <div className="lista-viajes">
            {viajes.map((viaje) => (
              <TripCard key={viaje.id} trip={viaje} stats={stats.get(viaje.driver.id)} />
            ))}
          </div>
        )}
      </section>

      {!user ? (
        <p className="ayuda" style={{ marginTop: 22 }}>
          ¿Ya tenés cuenta? <Link href="/ingresar">Ingresá en un toque</Link> y reservá tu lugar.
        </p>
      ) : null}
    </>
  );
}
