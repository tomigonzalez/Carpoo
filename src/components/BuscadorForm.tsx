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
    <form method="get" action={accion} className="tarjeta" style={{ marginBottom: 18 }}>
      <h2 className="tarjeta-titulo">¿A dónde vas?</h2>

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
        <span className="ayuda">Podés dejarlo vacío para ver todos los viajes.</span>
      </label>

      <datalist id="lista-pueblos">
        {pueblos.map((pueblo) => (
          <option key={pueblo} value={pueblo} />
        ))}
      </datalist>

      <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input
          type="checkbox"
          name="completos"
          value="1"
          defaultChecked={incluirCompletos}
          style={{ width: 24, height: 24 }}
        />
        <span style={{ fontSize: "0.95rem" }}>Mostrar también los viajes completos</span>
      </label>

      <button type="submit" className="btn btn-primario" style={{ minHeight: 64, fontSize: "1.15rem" }}>
        🔍 Buscar viajes
      </button>
    </form>
  );
}
