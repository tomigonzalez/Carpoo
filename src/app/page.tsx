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
      <section style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          Viajes compartidos entre pueblos
        </h1>
        <p style={{ color: "var(--texto-suave)", marginTop: 6, maxWidth: 680 }}>
          Encontrá quién viaja para el mismo lado, reservá tu asiento y coordiná por WhatsApp.
        </p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <Link className="btn btn-secundario" href="/buscar">
          Buscar viaje
        </Link>
        <Link className="btn btn-verde" href="/publicar">
          Ofrecer viaje
        </Link>
        {!user ? (
          <Link className="btn btn-secundario" href="/ingresar">
            Ingresar
          </Link>
        ) : null}
      </div>

      <section style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Viajes disponibles</h2>
            <p style={{ margin: "2px 0 0", color: "var(--texto-suave)", fontSize: "0.95rem" }}>Los próximos viajes publicados</p>
          </div>
          <Link href="/buscar" style={{ color: "var(--marca)", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>
            Ver todos
          </Link>
        </div>
      </section>

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
        <div style={{ display: "grid", gap: 10 }}>
          {viajes.map((viaje) => (
            <TripCard key={viaje.id} trip={viaje} stats={stats.get(viaje.driver.id)} />
          ))}
        </div>
      )}
    </>
  );
}
