import { PUEBLOS } from "@/lib/towns";
import { searchTrips } from "@/lib/queries";
import { getStatsForUsers } from "@/lib/stats";
import { cleanText } from "@/lib/validate";
import { BuscadorForm } from "@/components/BuscadorForm";
import { TripCard } from "@/components/TripCard";
import { EnlaceBoton, TituloPagina, Vacio } from "@/components/ui";

export const metadata = { title: "Buscar asiento · Carpoo" };

export default async function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  const params = await searchParams;
  const origen = cleanText(params.origen, 60) ?? "";
  const destino = cleanText(params.destino, 60) ?? "";
  const fechaRaw = cleanText(params.fecha, 10) ?? "";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : "";
  const incluirCompletos = params.completos === "1";

  const hayBusqueda = Boolean(origen || destino || fecha);
  const viajes = await searchTrips({
    origin: origen || undefined,
    destination: destino || undefined,
    date: fecha || undefined,
    includeFull: incluirCompletos,
  });
  const stats = await getStatsForUsers([...new Set(viajes.map((v) => v.driver.id))]);

  return (
    <>
      <TituloPagina
        titulo="Buscar asiento"
        subtitulo="Elegí el viaje que te sirva y reservá tu lugar en un toque."
      />

      <BuscadorForm
        origen={origen}
        destino={destino}
        fecha={fecha}
        incluirCompletos={incluirCompletos}
        pueblos={PUEBLOS}
      />

      {viajes.length === 0 ? (
        <Vacio
          titulo={hayBusqueda ? "No hay viajes con esos datos" : "Todavía no hay viajes publicados"}
          texto={
            hayBusqueda
              ? "Probá con otro día o sin completar el destino. También podés publicar tu propio viaje."
              : "Cuando alguien publique un viaje, va a aparecer acá."
          }
        >
          <EnlaceBoton href="/publicar" variante="verde">
            Ofrecer viaje
          </EnlaceBoton>
        </Vacio>
      ) : (
        <>
          <p className="resultado-conteo">
            {viajes.length} {viajes.length === 1 ? "viaje encontrado" : "viajes encontrados"}
          </p>
          <div className="lista-viajes">
            {viajes.map((viaje) => (
              <TripCard key={viaje.id} trip={viaje} stats={stats.get(viaje.driver.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
