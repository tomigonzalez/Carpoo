"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/** Datos de la persona: nombre, foto y auto. */
export function FormularioPerfil({
  nombre,
  imagen,
  carModel,
  carColor,
  carPlate,
  tieneVerificado,
}: {
  nombre: string;
  imagen: string | null;
  carModel: string | null;
  carColor: string | null;
  carPlate: string | null;
  tieneVerificado: boolean;
}) {
  const [estado, accion] = useActionState(updateProfile, emptyActionState);

  return (
    <form action={accion} className="tarjeta">
      <h2 className="tarjeta-titulo">Mis datos</h2>
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}
      {estado.ok ? <Alerta tipo="ok">{estado.ok}</Alerta> : null}

      <label className="campo">
        <span className="etiqueta">Nombre y apellido</span>
        <input className="entrada" type="text" name="name" defaultValue={nombre} required />
        <span className="ayuda">Así te van a ver los demás. Conviene que sea tu nombre real.</span>
      </label>

      <label className="campo">
        <span className="etiqueta">Link de tu foto de perfil</span>
        <input
          className="entrada"
          type="url"
          name="image"
          defaultValue={imagen ?? ""}
          placeholder="https://..."
        />
        <span className="ayuda">
          {tieneVerificado
            ? "Tu sesión ya tiene una foto. Si pegás otro link, la reemplazamos."
            : "Pegá el link de una foto tuya de frente y clara. Es obligatorio para reservar o publicar."}
        </span>
      </label>

      <h3 style={{ fontSize: "1.05rem", marginTop: 8 }}>Mi auto (para ofrecer viajes)</h3>
      <label className="campo">
        <span className="etiqueta">Marca y modelo</span>
        <input
          className="entrada"
          type="text"
          name="carModel"
          defaultValue={carModel ?? ""}
          placeholder="Ej: Fiat Cronos"
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="campo">
          <span className="etiqueta">Color</span>
          <input
            className="entrada"
            type="text"
            name="carColor"
            defaultValue={carColor ?? ""}
            placeholder="Ej: Blanco"
          />
        </label>
        <label className="campo">
          <span className="etiqueta">Patente</span>
          <input
            className="entrada"
            type="text"
            name="carPlate"
            defaultValue={carPlate ?? ""}
            placeholder="Ej: AB123CD"
          />
        </label>
      </div>

      <BotonEnviar enviando="Guardando…">Guardar mis datos</BotonEnviar>
    </form>
  );
}
