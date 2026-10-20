<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Carpoo — guía para agentes

App web de **viajes compartidos entre pueblos** (Villarino, Médanos, Bahía Blanca y alrededores).
Un conductor publica un viaje (origen, destino, fecha/hora, asientos) y un pasajero reserva un
asiento. El cupo se descuenta en tiempo real; no hay pagos dentro de la app (solo se conecta a las
partes por WhatsApp). Toda la interfaz y los comentarios del código están **en español rioplatense**.

## Comandos

```bash
npm run dev        # desarrollo (Turbopack) en http://localhost:3000
npm run build      # build de producción + chequeo de tipos
npm run start      # sirve el build de producción
npm run lint       # ESLint (debe quedar sin warnings)
npm run db:push    # crea/actualiza tablas según prisma/schema.prisma
npm run db:seed    # carga datos de ejemplo (prisma/seed.mts)
npm run db:studio  # Prisma Studio
npm run db:reset   # borra todo y vuelve a seedear
```

Antes de dar por terminado un cambio: **`npm run build` y `npm run lint` en verde**.
No hay suite de tests; la verificación es manual contra el servidor.

## Puesta en marcha

1. `npm install` (corre `prisma generate` por `postinstall`).
2. Copiar `.env.example` → `.env` y completar `AUTH_SECRET` (largo y aleatorio).
3. `npm run db:push && npm run db:seed`.
4. `npm run dev`.

Emails de prueba (login "Acceso de prueba", sin contraseña): `maria@ejemplo.com`,
`jorge@ejemplo.com`, `lucia@ejemplo.com`, `diego@ejemplo.com` y `ana@ejemplo.com` (esta última
**sin teléfono verificado**, para probar el flujo de perfil incompleto).

## Arquitectura

- **Next.js 16.4 (App Router) + Server Actions + React 19 + TypeScript**.
- **Prisma 6 + SQLite** (`prisma/dev.db`). En producción, migrar a Postgres (ver README).
- **Sin librerías de auth**: OAuth propio de Google/Facebook + sesión JWT (`jose`) en cookie
  `httpOnly` `carpoo_sesion`. Todo en `src/lib/`.
- `cacheComponents: false` en `next.config.ts`: las páginas leen datos vivos de la DB.

```
src/app/            páginas (App Router) + API routes en app/api/
src/components/     UI. Mayoría son componentes de servidor; "use client" solo si hay estado
src/lib/
  actions/          Server Actions ("use server"): auth.ts, trips.ts, reservations.ts
  session.ts        cookie de sesión, requireUser, isProfileComplete, missingProfileItems
  oauth.ts          Google/Facebook (authorization code), listProviders, callbackUrl
  queries.ts        consultas de lectura (buscar, detalle, paneles, perfil)
  stats.ts          reputación, presentismo e historial
  validate.ts       normalización de teléfonos, links de WhatsApp, limpieza de texto
  format.ts         fechas/horas en castellano (SOLO servidor)
  messages.ts       textos prearmados de WhatsApp
  db.ts             cliente Prisma singleton
prisma/
  schema.prisma     modelo de datos
  seed.mts          datos de ejemplo
```

## Convenciones

- **Todo en español**: nombres de dominios en inglés en el schema Prisma (`Trip`, `Reservation`,
  `Review`), pero variables, funciones y textos en español.
- **Nombres de archivo en ASCII** (sin acentos/ñ). Ej.: `FormularioResena.tsx`, no `Reseña`.
  En Windows, las tildes en nombres de archivo rompen imports.
- **Componentes de servidor por defecto**. Usar `"use client"` solo cuando haga falta estado
  (`useActionState`, `usePathname`). Los formularios usan Server Actions + `useActionState`.
- **Estilos**: Tailwind v4 + clases propias en `src/app/globals.css` (`.btn`, `.tarjeta`, `.campo`,
  `.entrada`, `.etiqueta-estado`…) y tokens CSS (`var(--marca)`, `var(--texto-suave)`…). Diseño
  **mobile-first, botones grandes, alto contraste**. `html { font-size: 18px }`.
- **Fotos**: se permiten URLs externas (Google/Facebook), por eso se usa `<img>` con
  `// eslint-disable-next-line @next/next/no-img-element` (ver `Avatar` en `components/ui.tsx`).
- **Validación en el servidor** siempre (no confiar en el cliente). Usar los helpers de
  `src/lib/validate.ts` (`cleanText`, `cleanInt`, `normalizePhone`, `cleanImageUrl`).
- **Fechas**: formatear/parsear solo en el servidor con `src/lib/format.ts` (`parseTripDateTime`,
  `formatTripDate`, `formatRelativeDay`) para no desfasar zonas horarias en el navegador.

## Next.js 16 (tiene cambios)

- `params` y `searchParams` son **Promises**: `const { id } = await params;` /
  `const p = await searchParams;`. Tipos globales: `PageProps<"/viajes/[id]">`,
  `LayoutProps<"/">`.
- Antes de escribir código de framework, leer `node_modules/next/dist/docs/` (ver bloque de arriba).
- No reintroducir `cacheComponents: true`: las páginas son dinámicas a propósito.

## Modelo de datos y reglas de negocio

- `User` (rol conductor y/o pasajero): `phoneVerified`, `phoneCode`/`phoneCodeExp` (código de 6
  dígitos, vence a los 10 min), datos del auto (`carModel/carColor/carPlate`), `isAdmin`.
- `Trip`: `seatsTotal` / `seatsTaken` (se incrementa al reservar), `status`
  (`ACTIVE | FULL | CANCELLED | DONE`), `contribution` (texto libre), `notes`.
- `Reservation`: `status` (`CONFIRMED | CANCELLED | ATTENDED | NO_SHOW`),
  `@@unique([tripId, passengerId])` (una reserva por persona y viaje).
- `Review`: 1–5 estrellas + comentario, `@@unique([tripId, authorId, targetId])`.

Reglas críticas:
- **Perfil completo = nombre + foto + teléfono verificado** (`isProfileComplete`). Sin esto no se
  puede **publicar ni reservar** (validado en la UI *y* en la server action).
- **Reserva atómica**: `prisma.$transaction` + `updateMany` condicionado a
  `seatsTaken < seatsTotal`; el viaje pasa a `FULL` al llenarse. No romper esta lógica.
- **El teléfono del conductor se oculta** hasta que exista reserva confirmada o asistida.
- **Presentismo** = ATTENDED ÷ (ATTENDED + NO_SHOW). Lo marca el conductor al finalizar; el
  pasajero también puede autoconfirmar "Sí, viajé".
- Cada acción de servidor debe **verificar sesión y propiedad** (p. ej. solo el conductor dueño del
  viaje puede cancelarlo) y llamar `revalidatePath` de las vistas afectadas.
- **No hay pagos ni comisiones**: la app solo conecta y actualiza asientos.

## Variables de entorno

`DATABASE_URL`, `APP_URL`, `AUTH_SECRET` (obligatorias). Opcionales: `GOOGLE_CLIENT_ID/SECRET`,
`FACEBOOK_CLIENT_ID/SECRET`, `DEMO_LOGIN` (default `true` para pruebas; poner `"false"` en
producción), `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM` (SMS real; si no están, el código de verificación
se muestra en pantalla y en consola). Callbacks OAuth:
`/api/auth/callback/google` y `/api/auth/callback/facebook`.
