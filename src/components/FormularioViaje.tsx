"use client";

import { useActionState } from "react";
import { createTrip } from "@/lib/actions/trips";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/** Formulario para publicar un viaje: 6 datos y listo. */
export function FormularioViaje({ pueblos, fechaHoy }: { pueblos: string[]; fechaHoy: string }) {
  const [estado, accion] = useActionState(createTrip, emptyActionState);

  return (
    <form action={accion} className="tarjeta">
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}

      <label className="campo">
        <span className="etiqueta">¿Desde dónde salís? *</span>
        <input
          className="entrada"
          type="text"
          name="origin"
          list="pueblos-viaje"
          placeholder="Ej: Villarino"
          autoComplete="off"
          required
        />
      </label>

      <label className="campo">
        <span className="etiqueta">¿A dónde vas? *</span>
        <input
          className="entrada"
          type="text"
          name="destination"
          list="pueblos-viaje"
          placeholder="Ej: Bahía Blanca"
          autoComplete="off"
          required
        />
      </label>

      <datalist id="pueblos-viaje">
        {pueblos.map((pueblo) => (
          <option key={pueblo} value={pueblo} />
        ))}
      </datalist>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="campo">
          <span className="etiqueta">Fecha *</span>
          <input className="entrada" type="date" name="date" defaultValue={fechaHoy} required />
        </label>
        <label className="campo">
          <span className="etiqueta">Hora de salida *</span>
          <input className="entrada" type="time" name="time" defaultValue="08:00" required />
        </label>
      </div>

      <label className="campo">
        <span className="etiqueta">¿Cuántos asientos ofrecés? *</span>
        <select className="entrada" name="seats" defaultValue="3" required>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "asiento" : "asientos"}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span className="etiqueta">Aporte por persona (opcional)</span>
        <input
          className="entrada"
          type="text"
          name="contribution"
          maxLength={60}
          placeholder="Ej: $5000, $3000 o A convenir"
        />
        <span className="ayuda">
          Lo arreglan entre ustedes por WhatsApp. Carpoo no cobra nada.
        </span>
      </label>

      <label className="campo">
        <span className="etiqueta">Aclaraciones (opcional)</span>
        <textarea
          className="entrada"
          name="notes"
          maxLength={300}
          placeholder="Ej: Salgo desde la plaza, llevo 2 valijas chicas, no fumo"
        />
      </label>

      <BotonEnviar variante="verde" enviando="Publicando…">
        🚗 Publicar el viaje
      </BotonEnviar>
    </form>
  );
}
