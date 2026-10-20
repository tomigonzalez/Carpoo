"use client";

import { useActionState } from "react";
import { loginWithDemo } from "@/lib/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

type ProviderInput = { id: "google" | "facebook"; label: string; configured: boolean };

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
  const [estado, accion] = useActionState(loginWithDemo, emptyActionState);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {errorExterno ? <Alerta tipo="error">{errorExterno}</Alerta> : null}
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}

      {providers.map((provider) => {
        if (!provider.configured) {
          return (
            <div key={provider.id}>
              <span className="btn btn-secundario" aria-disabled="true">
                {provider.label}
              </span>
              <span className="ayuda">
                Falta cargar las claves de {provider.id === "google" ? "Google" : "Facebook"} en el
                archivo <code>.env</code>.
              </span>
            </div>
          );
        }

        return (
          <a
            key={provider.id}
            href={`/api/auth/signin/${provider.id}?next=${encodeURIComponent(next)}`}
            className="btn"
            style={
              provider.id === "facebook"
                ? { background: "#1877f2", color: "#fff" }
                : { background: "#fff", color: "#10151c", borderColor: "var(--borde)" }
            }
          >
            {provider.id === "google" ? (
              <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.6c0-1.6-.2-3.2-.5-4.6H24v9.1h12.4c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 11.9-2.2 15.9-5.9l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"
                />
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

      {demo ? (
        <form action={accion} style={{ display: "grid", gap: 12, marginTop: 8 }}>
          <input type="hidden" name="next" value={next} />
          <p className="ayuda" style={{ margin: 0 }}>
            <strong>Acceso de prueba</strong> (sin Google ni Facebook): escribí tu email y entrás.
          </p>
          <label className="campo" style={{ marginBottom: 0 }}>
            <span className="etiqueta">Tu email</span>
            <input
              className="entrada"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="maria@gmail.com"
              required
            />
          </label>
          <label className="campo" style={{ marginBottom: 0 }}>
            <span className="etiqueta">Tu nombre y apellido</span>
            <input
              className="entrada"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="María Pérez"
              required
            />
          </label>
          <BotonEnviar variante="secundario" enviando="Entrando…">
            Entrar con email de prueba
          </BotonEnviar>
        </form>
      ) : null}
    </div>
  );
}
