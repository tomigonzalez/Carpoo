import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete, missingProfileItems } from "@/lib/session";
import { PUEBLOS } from "@/lib/towns";
import { todayInputValue } from "@/lib/format";
import { Alerta, EnlaceBoton, TituloPagina } from "@/components/ui";
import { FormularioViaje } from "@/components/FormularioViaje";

export const metadata = { title: "Ofrecer viaje · Carpoo" };

export default async function PublicarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/publicar");

  return (
    <>
      <TituloPagina
        titulo="Ofrecer viaje"
        subtitulo="Completá estos datos y ya queda publicado para que otros reserven."
      />

      {!isProfileComplete(user) ? (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">
            Antes de publicar necesitás {missingProfileItems(user).join(" y ")}. Es lo que hace que
            la plataforma sea segura para todos.
          </Alerta>
          <EnlaceBoton href="/perfil">Completar mi perfil</EnlaceBoton>
        </div>
      ) : null}

      <FormularioViaje pueblos={PUEBLOS} fechaHoy={todayInputValue()} />

      <p style={{ color: "var(--texto-suave)", fontSize: "0.9rem", marginTop: 12 }}>
        Un viaje publicado es visible para todas las personas registradas. Vas a poder cerrarlo o
        cancelarlo cuando quieras desde “Mis viajes”.
      </p>
    </>
  );
}
