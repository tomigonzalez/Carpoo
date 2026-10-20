import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete, missingProfileItems } from "@/lib/session";
import { getTripsAsDriver } from "@/lib/queries";
import { Alerta, EnlaceBoton, TituloPagina, Vacio } from "@/components/ui";
import { PanelViajeConductor } from "@/components/PanelViajeConductor";

export const metadata = { title: "Mis viajes · Carpoo" };

export default async function MisViajesPage({ searchParams }: PageProps<"/mis-viajes">) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/mis-viajes");

  const params = await searchParams;
  const viajes = await getTripsAsDriver(user.id);

  const proximos = viajes.filter((v) => v.dateTime >= new Date() && v.status !== "CANCELLED");
  const anteriores = viajes.filter((v) => v.dateTime < new Date() || v.status === "CANCELLED");

  return (
    <>
      <TituloPagina
        titulo="Mis viajes"
        subtitulo="Acá ves cuántos asientos te quedan y quiénes reservaron."
      />

      {params.publicado === "1" ? (
        <Alerta tipo="ok">¡Listo! Tu viaje ya está publicado y visible para todos.</Alerta>
      ) : null}

      {!isProfileComplete(user) ? (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">
            Te falta {missingProfileItems(user).join(" y ")} para poder publicar viajes.
          </Alerta>
          <EnlaceBoton href="/perfil" variante="secundario">
            Completar mi perfil
          </EnlaceBoton>
        </div>
      ) : null}

      <div style={{ marginBottom: 18 }}>
        <EnlaceBoton href="/publicar" variante="verde">
          🚗 Ofrecer otro viaje
        </EnlaceBoton>
      </div>

      {viajes.length === 0 ? (
        <Vacio
          titulo="Todavía no publicaste ningún viaje"
          texto="Cuando publiques un viaje lo vas a ver acá, con la lista de pasajeros."
        >
          <EnlaceBoton href="/publicar" variante="verde">
            Ofrecer mi primer viaje
          </EnlaceBoton>
        </Vacio>
      ) : (
        <>
          {proximos.length > 0 ? (
            <>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Viajes que vienen</h2>
              {proximos.map((viaje) => (
                <PanelViajeConductor key={viaje.id} trip={viaje} nombreConductor={user.name} />
              ))}
            </>
          ) : null}

          {anteriores.length > 0 ? (
            <>
              <h2 style={{ fontSize: "1.2rem", margin: "26px 0 10px" }}>
                Viajes pasados y cancelados
              </h2>
              {anteriores.map((viaje) => (
                <PanelViajeConductor key={viaje.id} trip={viaje} nombreConductor={user.name} />
              ))}
            </>
          ) : null}
        </>
      )}

      <p style={{ marginTop: 18 }}>
        <EnlaceBoton href="/mis-reservas" variante="secundario">
          Ver mis reservas como pasajero
        </EnlaceBoton>
      </p>
    </>
  );
}
