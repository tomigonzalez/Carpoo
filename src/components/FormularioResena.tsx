"use client";

import { useActionState } from "react";
import { submitReview } from "@/lib/actions/reservations";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

const ESCALA: Record<number, string> = {
  1: "Muy mal",
  2: "Mal",
  3: "Normal",
  4: "Muy bien",
  5: "Excelente",
};

/** Calificación de 1 a 5 estrellas con un comentario corto. */
export function FormularioResena({
  tripId,
  targetId,
  nombre,
}: {
  tripId: string;
  targetId: string;
  nombre: string;
}) {
  const [estado, accion] = useActionState(submitReview, emptyActionState);

  if (estado.ok) {
    return <Alerta tipo="ok">{estado.ok}</Alerta>;
  }

  return (
    <form action={accion} style={{ marginTop: 10 }}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="targetId" value={targetId} />
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}

      <p className="etiqueta" style={{ marginBottom: 8 }}>
        ¿Cómo te fue con {nombre}?
      </p>
      <div className="estrellas-grupo" role="radiogroup" aria-label="Puntaje de 1 a 5 estrellas">
        {[1, 2, 3, 4, 5].map((valor) => (
          <label key={valor}>
            <input
              type="radio"
              name="rating"
              value={valor}
              required
              aria-label={`${valor} de 5: ${ESCALA[valor]}`}
            />
            <span>
              {"★".repeat(valor)}
              <br />
              {valor}
            </span>
          </label>
        ))}
      </div>
      <p className="ayuda">1 = Muy mal · 5 = Excelente</p>

      <label className="campo" style={{ marginTop: 12 }}>
        <span className="etiqueta">Comentario corto (opcional)</span>
        <input
          className="entrada"
          type="text"
          name="comment"
          maxLength={280}
          placeholder="Ej: Muy puntual y buena onda"
        />
      </label>

      <BotonEnviar variante="secundario" enviando="Enviando…" className="btn-bloque">
        Enviar calificación
      </BotonEnviar>
    </form>
  );
}
