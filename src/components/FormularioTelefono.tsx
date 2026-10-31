"use client";

import { useActionState } from "react";
import { confirmPhoneCode, startPhoneVerification } from "@/lib/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/**
 * Verificación del teléfono en 2 pasos: pedir el código y confirmarlo.
 * El teléfono verificado es lo que evita los perfiles falsos.
 */
export function FormularioTelefono({
  telefono,
  verificado,
}: {
  telefono: string | null;
  verificado: boolean;
}) {
  const [inicio, accionInicio] = useActionState(startPhoneVerification, emptyActionState);
  const [confirmacion, accionConfirmacion] = useActionState(confirmPhoneCode, emptyActionState);

  if (verificado) {
    return (
      <div className="tarjeta tarjeta-verde">
        <h2 className="tarjeta-titulo">Teléfono verificado</h2>
        <p style={{ margin: 0 }}>
          Ya verificamos tu número <strong>{telefono}</strong>. Los pasajeros pueden escribirte por
          WhatsApp.
        </p>
        <p className="ayuda">¿Cambiaste de número? Cerrá sesión y volvé a entrar, o pedinos ayuda.</p>
      </div>
    );
  }

  const codigoEnviado = Boolean(inicio.ok || inicio.info);

  return (
    <div className="tarjeta">
      <h2 className="tarjeta-titulo">Verificá tu teléfono</h2>
      <p style={{ marginTop: 0, color: "var(--texto-suave)" }}>
        Te mandamos un código de 6 números para comprobar que el número es tuyo.
      </p>

      {inicio.error ? <Alerta tipo="error">{inicio.error}</Alerta> : null}
      {inicio.ok ? <Alerta tipo="ok">{inicio.ok}</Alerta> : null}
      {inicio.info ? <Alerta tipo="info">{inicio.info}</Alerta> : null}

      <form action={accionInicio}>
        <label className="campo">
          <span className="etiqueta">Tu número de WhatsApp</span>
          <input
            className="entrada"
            type="tel"
            name="phone"
            inputMode="tel"
            defaultValue={telefono ?? ""}
            placeholder="Ej: 2926 55 1234"
            required
          />
          <span className="ayuda">Con código de área, como lo usás todos los días.</span>
        </label>
        <BotonEnviar
          variante={codigoEnviado ? "secundario" : "primario"}
          enviando="Enviando…"
          className="btn-bloque"
        >
          {codigoEnviado ? "Enviar el código de nuevo" : "Enviar código"}
        </BotonEnviar>
      </form>

      {codigoEnviado ? (
        <form action={accionConfirmacion} style={{ marginTop: 16 }}>
          {confirmacion.error ? <Alerta tipo="error">{confirmacion.error}</Alerta> : null}
          {confirmacion.ok ? <Alerta tipo="ok">{confirmacion.ok}</Alerta> : null}
          <label className="campo">
            <span className="etiqueta">Código de 6 números</span>
            <input
              className="entrada"
              type="text"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              style={{ letterSpacing: 6, fontSize: "1.4rem", textAlign: "center" }}
              required
            />
          </label>
          <BotonEnviar variante="verde" enviando="Confirmando…" className="btn-bloque">
            Confirmar mi teléfono
          </BotonEnviar>
        </form>
      ) : null}
    </div>
  );
}
