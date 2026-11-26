import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cookie del flujo OAuth firmada con AUTH_SECRET.
 *
 * Antes se guardaba JSON plano: alguien podía cambiar el `state` y el `next`
 * de su propia cookie. Acá el contenido va en base64url con una firma HMAC y
 * expira a los 10 minutos. También viaja el `verifier` de PKCE de Google.
 */

export const OAUTH_COOKIE = "carpoo_oauth";

type EstadoOAuth = {
  state: string;
  provider: string;
  next: string;
  verifier?: string;
  exp: number;
};

export type DatosOAuth = Omit<EstadoOAuth, "exp">;

function clave(): string {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16) {
    throw new Error("Falta AUTH_SECRET en el archivo .env (usá una cadena larga y aleatoria).");
  }
  return secreto;
}

function firmar(cuerpo: string): string {
  return createHmac("sha256", clave()).update(cuerpo).digest("base64url");
}

export function crearEstadoOAuth(datos: DatosOAuth): string {
  const estado: EstadoOAuth = { ...datos, exp: Date.now() + 10 * 60 * 1000 };
  const cuerpo = Buffer.from(JSON.stringify(estado)).toString("base64url");
  return `${cuerpo}.${firmar(cuerpo)}`;
}

export function leerEstadoOAuth(valor: string | undefined): DatosOAuth | null {
  if (!valor) return null;
  const [cuerpo, firma] = valor.split(".");
  if (!cuerpo || !firma) return null;

  const recibida = Buffer.from(firma);
  const esperada = Buffer.from(firmar(cuerpo));
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;

  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as EstadoOAuth;
    if (
      typeof datos.state !== "string" ||
      !datos.state ||
      typeof datos.provider !== "string" ||
      typeof datos.next !== "string" ||
      typeof datos.exp !== "number" ||
      datos.exp <= Date.now()
    ) {
      return null;
    }
    return {
      state: datos.state,
      provider: datos.provider,
      next: datos.next,
      verifier: typeof datos.verifier === "string" ? datos.verifier : undefined,
    };
  } catch {
    return null;
  }
}
