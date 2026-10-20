import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isDemoMode } from "@/lib/notify";
import { listProviders } from "@/lib/oauth";
import { safeNext } from "@/lib/action-state";
import { FormularioIngreso } from "@/components/FormularioIngreso";
import { TituloPagina } from "@/components/ui";

export const metadata = { title: "Ingresar · Carpoo" };

const ERRORES: Record<string, string> = {
  google: "No pudimos completar el ingreso con Google. Probá de nuevo.",
  facebook: "No pudimos completar el ingreso con Facebook. Probá de nuevo.",
  estado: "La sesión de ingreso venció. Probá de nuevo.",
  config: "Ese ingreso no está configurado todavía.",
};

export default async function IngresarPage({ searchParams }: PageProps<"/ingresar">) {
  const params = await searchParams;
  const volver = safeNext(typeof params.volver === "string" ? params.volver : "/");

  const user = await getCurrentUser();
  if (user) redirect(volver);

  const error = typeof params.error === "string" ? ERRORES[params.error] : undefined;

  return (
    <>
      <TituloPagina
        titulo="Ingresá a Carpoo"
        subtitulo="Entrás en 1 clic con tu cuenta de siempre. Solo te pedimos un teléfono verificado para tu seguridad."
      />
      <FormularioIngreso
        providers={listProviders()}
        next={volver}
        demo={isDemoMode()}
        errorExterno={error}
      />
      <p className="ayuda" style={{ marginTop: 18 }}>
        Al ingresar aceptás que los viajes se coordinan entre las personas. Carpoo no cobra ni
        gestiona pagos.
      </p>
    </>
  );
}
