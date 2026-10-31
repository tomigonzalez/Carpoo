/**
 * Formulario del buscador. Es un formulario común (method="get"), así que
 * funciona incluso si el celular tiene problemas con JavaScript.
 */
export function BuscadorForm({
  origen = "",
  destino = "",
  fecha = "",
  incluirCompletos = false,
  pueblos,
  accion = "/buscar",
}: {
  origen?: string;
  destino?: string;
  fecha?: string;
  incluirCompletos?: boolean;
  pueblos: string[];
  accion?: string;
}) {
  return (
    <form method="get" action={accion} className="tarjeta buscador">
      <h2 className="tarjeta-titulo">¿A dónde vas?</h2>

      <div className="buscador-grid">
        <label className="campo">
          <span className="etiqueta">Desde dónde salís</span>
          <input
            className="entrada"
            type="text"
            name="origen"
            list="lista-pueblos"
            defaultValue={origen}
            placeholder="Ej: Villarino"
            autoComplete="off"
          />
        </label>

        <label className="campo">
          <span className="etiqueta">A dónde vas</span>
          <input
            className="entrada"
            type="text"
            name="destino"
            list="lista-pueblos"
            defaultValue={destino}
            placeholder="Ej: Bahía Blanca"
            autoComplete="off"
          />
        </label>

        <label className="campo">
          <span className="etiqueta">¿Qué día viajás?</span>
          <input className="entrada" type="date" name="fecha" defaultValue={fecha} />
          <span className="ayuda">Podés dejar la fecha vacía para ver todos los viajes.</span>
        </label>
      </div>

      <datalist id="lista-pueblos">
        {pueblos.map((pueblo) => (
          <option key={pueblo} value={pueblo} />
        ))}
      </datalist>

      <label className="buscador-check">
        <input type="checkbox" name="completos" value="1" defaultChecked={incluirCompletos} />
        <span>Mostrar también los viajes completos</span>
      </label>

      <button type="submit" className="btn btn-primario btn-bloque buscador-boton">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 4.5 4.5" strokeLinecap="round" />
        </svg>
        Buscar viajes
      </button>
    </form>
  );
}
