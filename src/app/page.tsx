import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getUpcomingTrips } from "@/lib/queries";
import { getStatsForUsers } from "@/lib/stats";
import { TripCard } from "@/components/TripCard";
import { EnlaceBoton, TituloPagina, Vacio } from "@/components/ui";

export default async function InicioPage() {
  const [user, viajes] = await Promise.all([getCurrentUser(), getUpcomingTrips(4)]);
  const stats = await getStatsForUsers([...new Set(viajes.map((v) => v.driver.id))]);

  return (
    <>
      <section style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800 }}>
          Viajes compartidos entre pueblos
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--texto-suave)", marginTop: 8 }}>
          Encontrá quién viaja para el mismo lado, reservá tu asiento y coordiná por WhatsApp.
          Sin grupos de WhatsApp desordenados y sin perfiles falsos.
        </p>
      </section>

      <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
        <Link className="btn btn-primario" style={{ minHeight: 72, fontSize: "1.2rem" }} href="/buscar">
          🔍 Buscar asiento
        </Link>
        <Link className="btn btn-verde" style={{ minHeight: 72, fontSize: "1.2rem" }} href="/publicar">
          🚗 Ofrecer viaje
        </Link>
      </div>

      {!user ? (
        <p style={{ textAlign: "center", margin: "14px 0 22px" }}>
          ¿Primera vez? <Link href="/ingresar">Ingresá en 1 clic con Google o Facebook</Link>
        </p>
      ) : (
        <div style={{ marginBottom: 22 }} />
      )}

      <section className="tarjeta" aria-labelledby="como-funciona" style={{ marginBottom: 22 }}>
        <h2 id="como-funciona" className="tarjeta-titulo" style={{ fontSize: "1.2rem" }}>
          Cómo funciona (3 pasos)
        </h2>
        <ol className="lista-limpia" style={{ display: "grid", gap: 14, marginTop: 10 }}>
          <li style={{ display: "flex", gap: 12 }}>
            <span className="marca-logo" aria-hidden="true">
              1
            </span>
            <p style={{ margin: 0 }}>
              <strong>Buscás el viaje.</strong> Poné desde dónde salís, a dónde vas y qué día.
            </p>
          </li>
          <li style={{ display: "flex", gap: 12 }}>
            <span className="marca-logo" aria-hidden="true">
              2
            </span>
            <p style={{ margin: 0 }}>
              <strong>Reservás tu asiento.</strong> El lugar se descuenta al instante para que no se
              venda dos veces.
            </p>
          </li>
          <li style={{ display: "flex", gap: 12 }}>
            <span className="marca-logo" aria-hidden="true">
              3
            </span>
            <p style={{ margin: 0 }}>
              <strong>Coordinás por WhatsApp.</strong> Te damos el botón para hablar con el
              conductor: ahí arreglan el pago y el punto de encuentro.
            </p>
          </li>
        </ol>
      </section>

      <TituloPagina titulo="Próximos viajes" subtitulo="Los últimos publicados en la zona" />

      {viajes.length === 0 ? (
        <Vacio
          titulo="Todavía no hay viajes publicados"
          texto="Sé la primera persona en ofrecer un viaje: se publica en 1 minuto."
        >
          <EnlaceBoton href="/publicar" variante="verde">
            Ofrecer viaje
          </EnlaceBoton>
        </Vacio>
      ) : (
        <>
          {viajes.map((viaje) => (
            <TripCard key={viaje.id} trip={viaje} stats={stats.get(viaje.driver.id)} />
          ))}
          <div style={{ marginTop: 14 }}>
            <EnlaceBoton href="/buscar" variante="secundario">
              Ver todos los viajes
            </EnlaceBoton>
          </div>
        </>
      )}

      <section className="tarjeta" style={{ marginTop: 22 }}>
        <h2 className="tarjeta-titulo">Por qué es más seguro que un grupo de WhatsApp</h2>
        <ul style={{ margin: "8px 0 0", paddingLeft: 22, display: "grid", gap: 8 }}>
          <li>Todos los perfiles tienen <strong>teléfono verificado</strong> y foto real.</li>
          <li>Nadie publica de forma anónima: cada viaje queda atado a una persona.</li>
          <li>Ves la <strong>reputación</strong> y el <strong>presentismo</strong> antes de reservar.</li>
          <li>El cupo de asientos se actualiza solo: no hay sobreventa.</li>
        </ul>
        <p style={{ marginTop: 12, color: "var(--texto-suave)", fontSize: "0.9rem" }}>
          Carpoo solo conecta conductor y pasajero. El pago del viaje se arregla entre ustedes.
        </p>
      </section>
    </>
  );
}
