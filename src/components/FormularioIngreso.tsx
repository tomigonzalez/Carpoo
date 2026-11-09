"use client";

import { useActionState, useState } from "react";
import { loginWithDemo, loginWithEmail, registerWithEmail } from "@/lib/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

type ProviderInput = { id: "google" | "facebook"; label: string; configured: boolean };
type Modo = "login" | "register";

export function FormularioIngreso({
  providers,
  next,
  demo,
  errorExterno,
}: {
  providers: ProviderInput[];
  next: string;
  demo: boolean;
  errorExterno?: string;
}) {
  const [modo, setModo] = useState<Modo>("login");
  const [estadoLogin, accionLogin] = useActionState(loginWithEmail, emptyActionState);
  const [estadoRegistro, accionRegistro] = useActionState(registerWithEmail, emptyActionState);
  const [estadoDemo, accionDemo] = useActionState(loginWithDemo, emptyActionState);

  const disponibles = providers.filter((provider) => provider.configured);
  const estadoEmail = modo === "login" ? estadoLogin : estadoRegistro;

  return (
    <div className="tarjeta tarjeta-login">
      {errorExterno ? <Alerta tipo="error">{errorExterno}</Alerta> : null}

      {disponibles.length > 0 ? (
        <div className="ingreso-proveedores">
          {disponibles.map((provider) => {
            const clase = provider.id === "facebook" ? "btn-facebook" : "btn-google";
            return (
              <a
                key={provider.id}
                href={`/api/auth/signin/${provider.id}?next=${encodeURIComponent(next)}`}
                className={`btn btn-proveedor ${clase}`}
              >
                {provider.id === "google" ? (
                  <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.2-3.2-.5-4.6H24v9.1h12.4c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6Z" />
                    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1Z" />
                    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.2 15.9-5.9l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7A10.03 10.03 0 0 0 22 12.06Z" />
                  </svg>
                )}
                {provider.label}
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="ingreso-separador">
        <span>o con tu email</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          className={modo === "login" ? "btn btn-primario" : "btn btn-secundario"}
          style={{ flex: 1 }}
          onClick={() => setModo("login")}
          aria-pressed={modo === "login"}
        >
          Entrar
        </button>
        <button
          type="button"
          className={modo === "register" ? "btn btn-primario" : "btn btn-secundario"}
          style={{ flex: 1 }}
          onClick={() => setModo("register")}
          aria-pressed={modo === "register"}
        >
          Crear cuenta
        </button>
      </div>

      {estadoEmail.error ? <Alerta tipo="error">{estadoEmail.error}</Alerta> : null}

      {modo === "login" ? (
        <form action={accionLogin} className="ingreso-demo">
          <input type="hidden" name="next" value={next} />
          <label className="campo" style={{ marginBottom: 12 }}>
            <span className="etiqueta">Email</span>
            <input className="entrada" type="email" name="email" inputMode="email" autoComplete="email" placeholder="maria@gmail.com" required />
          </label>
          <label className="campo" style={{ marginBottom: 16 }}>
            <span className="etiqueta">Contraseña</span>
            <input className="entrada" type="password" name="password" autoComplete="current-password" placeholder="Tu contraseña" required />
          </label>
          <BotonEnviar variante="primario" enviando="Entrando…" className="btn-bloque">
            Entrar
          </BotonEnviar>
        </form>
      ) : (
        <form action={accionRegistro} className="ingreso-demo">
          <input type="hidden" name="next" value={next} />
          <label className="campo" style={{ marginBottom: 12 }}>
            <span className="etiqueta">Nombre y apellido</span>
            <input className="entrada" type="text" name="name" autoComplete="name" placeholder="María Pérez" required />
          </label>
          <label className="campo" style={{ marginBottom: 12 }}>
            <span className="etiqueta">Email</span>
            <input className="entrada" type="email" name="email" inputMode="email" autoComplete="email" placeholder="maria@gmail.com" required />
          </label>
          <label className="campo" style={{ marginBottom: 12 }}>
            <span className="etiqueta">Contraseña</span>
            <input className="entrada" type="password" name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} required />
          </label>
          <label className="campo" style={{ marginBottom: 16 }}>
            <span className="etiqueta">Repetí la contraseña</span>
            <input className="entrada" type="password" name="confirm" autoComplete="new-password" placeholder="Repetí la contraseña" minLength={8} required />
          </label>
          <BotonEnviar variante="primario" enviando="Creando cuenta…" className="btn-bloque">
            Crear cuenta
          </BotonEnviar>
        </form>
      )}

      {demo ? (
        <details style={{ marginTop: 18 }}>
          <summary className="ayuda" style={{ cursor: "pointer" }}>Acceso de prueba (sin contraseña)</summary>
          {estadoDemo.error ? <Alerta tipo="error">{estadoDemo.error}</Alerta> : null}
          <form action={accionDemo} className="ingreso-demo" style={{ marginTop: 10 }}>
            <input type="hidden" name="next" value={next} />
            <label className="campo" style={{ marginBottom: 12 }}>
              <span className="etiqueta">Email de prueba</span>
              <input className="entrada" type="email" name="email" inputMode="email" autoComplete="email" placeholder="maria@gmail.com" required />
            </label>
            <label className="campo" style={{ marginBottom: 16 }}>
              <span className="etiqueta">Nombre</span>
              <input className="entrada" type="text" name="name" autoComplete="name" placeholder="María Pérez" required />
            </label>
            <BotonEnviar variante="secundario" enviando="Entrando…" className="btn-bloque">
              Entrar con acceso de prueba
            </BotonEnviar>
          </form>
        </details>
      ) : null}
    </div>
  );
}
