# Carpoo

**Viajes compartidos entre pueblos.**

Carpoo conecta a gente que viaja entre Villarino, Bahía Blanca y alrededores. Un
conductor publica su viaje (origen, destino, día, hora y asientos) y un pasajero pide un lugar en
dos toques. El conductor acepta, el cupo se descuenta en vivo y la app los conecta por WhatsApp
para arreglar el punto de encuentro y el aporte.

No hay perfiles anónimos: cada viaje cuelga de una cuenta real con **foto** y **teléfono
verificado**. Antes de subir a un auto se ve la **reputación** y el **presentismo** de la otra
persona. **No se cobra nada dentro de la app**: Carpoo solo conecta a las personas.

---

## Para qué sirve este repo

Además de ser un producto, Carpoo es un **entorno de práctica de trabajo en equipo**. Se usa para
simular, de verdad, el flujo de un equipo de desarrollo:

- una persona administra la base, las migraciones y el deploy;
- otra trabaja el front **sin permisos** sobre la BD;
- los cambios llegan por **Pull Request**, pasan por **revisión** y recién después se mergean;
- cada PR tiene que dejar `lint` y `build` en verde;
- los problemas se arreglan con un `reset` reproducible, no con magia.

La idea es que quien arranca sin experiencia pueda ganarla **haciendo cambios pequeños a un sistema
real**, con consecuencias reales pero con un colchón: su propia base descartable y un revisor al
lado. Cuando algo se rompe, se analiza qué pasó y se vuelve al estado conocido. Eso es trabajar.

> El proyecto nació como MVP y está en camino de ser un producto terminado. La hoja de ruta está
> dividida en sprints (ver [Roadmap](#roadmap-por-sprints)). Todo el código, los textos y este
> README se escribieron **en colaboración con IA**, con una persona tomando las decisiones de
> producto, diseño y negocio.

---

## Roles

| Rol | Hace | No hace |
| --- | --- | --- |
| **Admin / Tech Lead** (quien administra) | Dueño de `prisma/`, migraciones, compose, deploy y revisiones. Genera los cambios de BD y los aplica. | Aceptar PRs sin leerlos. |
| **Dev de front** (quien aprende) | Componentes, pantallas, estilos, formularios y fixes chicos. Abre PRs, responde comentarios, corrige. | Tocar `prisma/`, ejecutar migraciones ni usar credenciales de producción. |
| **Revisor** | El Admin, en cada PR. Pide cambios, aprueba, mergea. | Aprobar por apuro. |

Cada persona corre la app **en su propia máquina**, con **su propio volumen** de Docker y **su
propio `AUTH_SECRET`**. Aunque los dos usen el mismo compose, **no comparten base**: es la misma
receta en dos cocinas distintas. Si el Dev rompe la suya, la del Admin no se entera.

La separación no depende de la confianza: depende de permisos (ver
[Base de datos: quién la maneja](#base-de-datos-quién-la-maneja)).

---

## Reglas de trabajo (Definition of Done)

Un cambio **no está terminado** hasta que cumpla todo esto:

1. Está en una rama propia (`front/nombre-del-cambio`, `fix/...`), nunca directo en la principal.
2. El PR dice **qué cambió, por qué y cómo probarlo**. Si es visual, lleva captura.
3. `npm run lint` y `npm run build` pasan en la máquina de quien hace el PR.
4. Hay **una revisión aprobada** por el Admin antes de mergear.
5. No toca archivos de BD salvo que el PR sea explícitamente de BD y lo abra el Admin.
6. Si cambia una regla de negocio (cupos, reservas, perfiles), se escribe cómo se verificó en la
   [guía de prueba](#guía-de-prueba-recorrido-de-3-minutos).
7. Después del merge, quien sigue trabajando hace `git pull`. Los cambios de BD se aplican solos al
   reiniciar la app.

Convención de commits: `tipo: qué hice` (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
Ejemplo: `fix: mostrar el cupo actualizado al cancelar`.

---

## Flujo de un cambio (para el que empieza)

```bash
# 1. Traer lo último y crear tu rama
git checkout main
git pull
git checkout -b front/mi-cambio

# 2. Hacer el cambio, verificar, y commitear
npm run lint
npm run build
git add -A
git commit -m "fix: describir el cambio"

# 3. Publicar la rama
git push -u origin front/mi-cambio

# 4. Abrir el Pull Request en GitHub y completar la plantilla.
#    El Admin revisa. Si pide cambios, se hacen nuevos commits sobre la misma rama.

# 5. Aprobado y mergeado: volver a la principal
git checkout main
git pull
```

Si el PR tocó migraciones, después del `git pull` hay que reiniciar la app para que el entrypoint
aplique los cambios: `docker compose restart app`.

La plantilla de PR vive en `.github/PULL_REQUEST_TEMPLATE.md` y se precarga sola al abrir uno.

---

## Onboarding: día 1

Requisitos: **Node 20.9+** (probado con 22 y 24), npm, **Docker Desktop** y Git.

```bash
git clone https://github.com/tomigonzalez/Carpoo.git
cd Carpoo
docker compose up --build -d
```

Eso es todo. A los segundos la app está en [http://localhost:3000](http://localhost:3000) con base
y datos de ejemplo. No hay que crear `.env`, ni instalar Postgres, ni correr migraciones: el
entrypoint lo hace.

Para ver los logs o apagar:

| Comando | Para qué |
| --- | --- |
| `docker compose logs -f app` | Logs en vivo. |
| `docker compose restart app` | Reiniciar sin borrar nada. |
| `docker compose down` | Apagar, conservando la base. |
| `npm run docker:reset` | **Botón de deshacer:** borrar la base y volver al seed. |

Entrá con **Acceso de prueba** y `maria@ejemplo.com`. Para verificar el teléfono, el código aparece
en pantalla porque no hay Twilio configurado. Después seguí la
[guía de prueba](#guía-de-prueba-recorrido-de-3-minutos).

**No hagas esto el día 1:** `npm run db:seed` sobre datos existentes (borra todo), `prisma migrate
reset` y `docker compose down -v` salvo que quieras empezar de cero.

---

## Base de datos: quién la maneja

La BD la administra **una sola persona**. El que trabaja el front solo corre comandos: nunca
"acomodo" la BD a mano. Los datos que quiere que vea el equipo están en `prisma/seed.mts`, así que
se reproducen desde el repo.

Hay tres protecciones para que un push accidental no modifique la BD de alguien:

1. **`.github/CODEOWNERS`** marca `prisma/`, los compose, el Dockerfile y `.env.example` como
   archivos de un único dueño. Configuración que se hace una vez en GitHub: *Settings → Branches →
   Branch protection rule* de la rama principal, con **"Require a pull request before merging"** y
   **"Require review from Code Owners"**. Si un PR toca esos archivos, GitHub pide la aprobación del
   Admin.
2. **`.gitignore`** ignora dumps (`**/*.sql`, `**/*.dump`) en cualquier carpeta. Las migraciones de
   Prisma están exceptuadas (`!/prisma/migrations/**/*.sql`) para que sí se versionen.
3. **El entrypoint usa `migrate deploy`, nunca `db push`**. Editar `schema.prisma` no cambia la BD:
   solo se aplican los archivos de `prisma/migrations/`. Un schema que llegue por git sin su
   migration correspondiente no hace nada.

### Cambio de estructura (lo hace el Admin)

```bash
npm run db:backup                                  # dump en backups/ antes de tocar nada
# editar prisma/schema.prisma
npm run db:migrate -- --name nombre_del_cambio      # genera prisma/migrations/<fecha>_nombre/migration.sql
git add -A
git commit -m "db: nombre del cambio"
git push
```

El Dev hace `git pull` + `docker compose restart app` y el entrypoint aplica la migration.

### Cambio de datos (no de estructura)

Se edita `prisma/seed.mts` y se pushea. Con `npm run docker:reset` cualquiera lo reproduce.
Un dump (`npm run db:backup` genera uno en `backups/`) solo hace falta para pasar datos reales que
no están en el repo; nunca se commitea.

---

## Capturas

| Inicio (escritorio) | Detalle del viaje |
| --- | --- |
| ![Inicio](docs/capturas/home-desktop.png) | ![Detalle del viaje](docs/capturas/viaje-desktop.png) |

| Buscador | Inicio (celular) | Ingreso |
| --- | --- | --- |
| ![Buscador](docs/capturas/buscar-desktop.png) | ![Inicio móvil](docs/capturas/home-mobile.png) | ![Ingreso](docs/capturas/ingresar-mobile.png) |

---

## El problema

Entre pueblos no hay transporte público frecuente y coordinarlo termina siempre igual: un grupo de
WhatsApp enorme, mensajes que se pierden, gente que escribe "¿alguien va mañana?" y nadie sabe si
queda lugar. Carpoo resuelve tres cosas concretas:

1. **Ver los viajes disponibles** en un lugar, con fecha, hora y asientos reales.
2. **No sobrevender**: el cupo se descuenta con transacciones, no "a ojo".
3. **Saber con quién viajás**: foto, teléfono verificado, estrellas y presentismo.

---

## Cómo funciona

**Conductor**
1. Inicia sesión con Google o Facebook y verifica su teléfono.
2. Publica el viaje: origen, destino, fecha, hora, asientos (1 a 8), aporte y notas.
3. Recibe las **solicitudes de asiento** en *Mis viajes* y las **acepta o rechaza**.
4. Al aceptarlas, el asiento se descuenta y se habilita el WhatsApp con cada pasajero.
5. Al terminar, marca a cada pasajero como **Viajó** o **No vino** (alimenta el presentismo).

**Pasajero**
1. Busca por origen, destino y fecha.
2. Pide un asiento. La solicitud queda **pendiente** y **no descuenta cupo** todavía.
3. Cuando el conductor acepta, el lugar queda confirmado y aparece el **botón de WhatsApp**.
4. Puede cancelar cuando quiera: el asiento vuelve a quedar libre.
5. Después del viaje, califica con 1 a 5 estrellas.

**Reglas de confianza**
- Sin **foto + teléfono verificado** no se puede publicar ni pedir un asiento.
- El teléfono del conductor **no se muestra** hasta que hay una reserva confirmada o asistida.
- Presentismo = viajes asistidos ÷ (asistidos + ausencias), visible en el perfil público.

---

## Funcionalidades

**Conductor**
- Publicar un viaje con formulario simple y validación en el servidor.
- Panel *Mis viajes* con solicitudes pendientes, pasajeros anotados y ocupación en vivo.
- Editar, cancelar (libera los cupos) y finalizar el viaje.
- Botón de WhatsApp con el mensaje ya redactado para cada pasajero.

**Pasajero**
- Buscador *"¿A dónde vas?"* con filtros por origen, destino y fecha.
- Tarjetas con foto del conductor, auto, hora, asientos libres, reputación y presentismo.
- *Mis reservas*: cancelar, confirmar *"Sí, viajé"* y escribir por WhatsApp.

**Cuenta y confianza**
- Login en un clic con **Google** o **Facebook** (OAuth propio, sin librerías de auth).
- **Acceso de prueba** por email para demos, sin contraseña (opt-in con `DEMO_LOGIN="true"`).
- Verificación del teléfono con **código de 6 dígitos** (en modo demo se muestra en pantalla;
  con Twilio configurado, llega por SMS/WhatsApp).
- Reputación de 1 a 5 estrellas con comentario y perfil público.

**Experiencia**
- Mobile-first, botones grandes, alto contraste y textos en español rioplatense.
- Barra inferior flotante en el celular, navegación clásica en escritorio.
- La mayoría de la UI son **componentes de servidor**: poco JavaScript en el cliente.

---

## Tecnologías

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Framework | **Next.js 16.4** (App Router, Server Actions) | Un solo proyecto para pantallas y lógica; los formularios no necesitan una API aparte. |
| UI | **React 19.3** + **TypeScript** | Tipado de punta a punta y componentes modernos. |
| Estilos | **Tailwind CSS v4** + tokens propios en `globals.css` | Diseño consistente con variables CSS y clases reutilizables. |
| Base de datos | **Prisma 6** + **PostgreSQL** (Docker en local, Neon en producción) | Un solo motor en todos los ambientes, con migraciones versionadas. |
| Sesión | **jose** (JWT HS256 en cookie `httpOnly`) | Liviano, sin dependencias pesadas. |
| OAuth | Implementación propia en `src/lib/oauth.ts` | *Authorization code*, state firmado y PKCE S256 para Google. |
| Verificación | `src/lib/phone-code.ts` + `src/lib/notify.ts` | Código hasheado con HMAC, 5 intentos y envío opcional por Twilio. |
| Freno de intentos | `src/lib/rate-limit.ts` | En memoria por ahora; en producción se cambia por Redis/Upstash. |
| Tipografías | **Bricolage Grotesque** + **Instrument Sans** (autohospedadas, OFL) | Sin depender de Google Fonts en tiempo de ejecución. |

> Las páginas leen datos vivos (viajes, cupos, reservas), por eso `cacheComponents: false` y render
> dinámico clásico. No hay caché que pueda mostrar un cupo viejo.

---

## Arquitectura

```
Carpoo/
├─ .github/
│  ├─ CODEOWNERS                 # Dueño de prisma/ y de la infra
│  └─ PULL_REQUEST_TEMPLATE.md   # Checklist de cada PR
├─ prisma/
│  ├─ schema.prisma              # Modelo de datos (fuente de verdad)
│  ├─ migrations/                # Migraciones versionadas (se commitean)
│  └─ seed.mts                   # Datos de ejemplo (npm run db:seed)
├─ scripts/
│  ├─ preparar-postgres.mjs      # Genera el schema Postgres para el deploy
│  ├─ docker-entrypoint.sh       # Migra, siembra si hace falta y levanta la app
│  └─ backup-bd.ps1              # Dump en backups/ antes de migrar
├─ public/
│  ├─ avatares/                  # Logo y fotos de ejemplo en SVG
│  └─ fuentes/                   # Tipografías .woff2 + su licencia
├─ src/
│  ├─ app/                       # Rutas (App Router)
│  │  ├─ page.tsx                # Inicio: hero + últimos viajes
│  │  ├─ buscar/                 # Buscador de asientos
│  │  ├─ viajes/[id]/            # Detalle: cupos en vivo, reservar, reseñas
│  │  ├─ publicar/               # Publicar un viaje
│  │  ├─ mis-viajes/             # Panel del conductor
│  │  ├─ mis-reservas/           # Reservas del pasajero
│  │  ├─ perfil/                 # Foto, teléfono, auto y reputación
│  │  ├─ usuarios/[id]/          # Perfil público
│  │  ├─ ingresar/               # Login Google/Facebook + acceso de prueba
│  │  └─ api/                    # OAuth (signin/callback) y cupos en vivo (JSON)
│  ├─ components/                # Header, barra inferior, tarjetas y formularios
│  └─ lib/
│     ├─ actions/                # Server Actions: auth, trips, reservations
│     ├─ session.ts              # Cookie de sesión + regla de perfil completo
│     ├─ oauth.ts / oauth-state.ts# Google/Facebook, state firmado y PKCE
│     ├─ phone-code.ts           # Códigos HMAC + comparación en tiempo constante
│     ├─ rate-limit.ts           # Freno de intentos por IP
│     ├─ queries.ts              # Consultas de lectura
│     ├─ stats.ts                # Reputación, presentismo e historial
│     ├─ validate.ts             # Teléfonos, links de WhatsApp, limpieza de texto
│     ├─ format.ts               # Fechas/horas en castellano (solo servidor)
│     ├─ messages.ts             # Textos prearmados de WhatsApp
│     ├─ notify.ts               # Envío por Twilio (opcional)
│     ├─ action-state.ts         # safeNext + estado de los formularios
│     └─ db.ts                   # Cliente Prisma singleton
└─ next.config.ts
```

### Modelo de datos

| Modelo | Para qué |
| --- | --- |
| `User` | Cuenta real: nombre, foto, proveedor OAuth, teléfono verificado, datos del auto, `isAdmin`. |
| `Trip` | Viaje publicado: origen, destino, fecha/hora, `seatsTotal`/`seatsTaken`, estado y aporte. |
| `Reservation` | Solicitud o reserva: `PENDING → CONFIRMED → ATTENDED / NO_SHOW`, única por persona y viaje. |
| `Review` | 1 a 5 estrellas + comentario, única por autor/viaje/destinatario. |

### Decisiones técnicas que vale la pena mirar

- **Reserva sin sobreventa**: la aceptación corre en `prisma.$transaction` con un `updateMany`
  condicionado a `seatsTaken < seatsTotal`. Si dos personas aceptan a la vez el último asiento, una
  falla y la otra entra. El viaje pasa a `FULL` solo.
- **Sin librería de autenticación**: OAuth a mano (state firmado, PKCE, `email_verified`) y sesión
  JWT firmada. Menos dependencias, más control.
- **Validación siempre en el servidor**: cada Server Action verifica sesión, propiedad del recurso y
  limpia los datos (`cleanText`, `cleanInt`, `normalizePhone`). El cliente no es confiable.
- **Privacidad del teléfono**: se oculta en las consultas hasta que exista reserva confirmada.
- **Cupos en vivo**: un endpoint liviano devuelve los asientos cada 7 segundos, sin recargar la
  página.
- **Un solo motor de BD**: PostgreSQL en local (Docker) y en producción (Vercel/Neon). El schema es
  la fuente de verdad y las migraciones viajan en git.

---

## Correr el proyecto en local

### Todo en Docker (recomendado)

Un solo comando levanta Postgres y la app, **sin crear `.env` ni correr migraciones a mano**:

```bash
docker compose up --build -d
```

El entrypoint genera un `AUTH_SECRET` (persiste en un volumen), aplica las migraciones con
`prisma migrate deploy` y carga los datos de ejemplo **solo si la base está vacía**. Si querés pasar
variables propias (Twilio, Google, etc.), copiá `.env.example` a `.env` y descomentá la línea
`env_file` en `docker-compose.dev.yml`.

La app queda en [http://localhost:3000](http://localhost:3000) y la DB accesible desde TablePlus en
`localhost:5433` (usuario/base/clave `carpoo`). Si esos puertos están ocupados:

```bash
APP_PORT=3001 DB_PORT=5434 docker compose up --build -d
# Windows PowerShell:
$env:APP_PORT="3001"; $env:DB_PORT="5434"; docker compose up --build -d
```

### App en la máquina, base en Docker

Para debuggear con hot reload sin el contenedor de la app:

```bash
npm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
# Generá AUTH_SECRET y pegalo en .env:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose -f docker-compose.dev.yml up -d db
npm run db:migrate:deploy
npm run dev
```

`.env` mínimo:

```env
DATABASE_URL="postgresql://carpoo:carpoo@localhost:5433/carpoo"
APP_URL="http://localhost:3000"
AUTH_SECRET="<la clave larga que generaste>"
DEMO_LOGIN="true"
```

> **Zona horaria:** las fechas se formatean en el servidor. Para ver las horas de Argentina,
> arrancá con `TZ=America/Argentina/Buenos_Aires` (Linux/macOS) o configurá la zona en Windows.

---

## Guía de prueba (recorrido de 3 minutos)

1. **Publicar**: entrá con `maria@ejemplo.com` → *Ofrecer viaje* → completá y publicá.
2. **Pedir asiento**: en una ventana incógnito, entrá con `lucia@ejemplo.com` → *Buscar asiento* →
   abrí el viaje → *Pedir asiento*. El cupo **todavía no baja**: queda pendiente.
3. **Aceptar**: volvé a la ventana de María → *Mis viajes* → **Aceptar**. Ahí sí baja 1 asiento y se
   habilita el WhatsApp.
4. **Sin sobreventa**: con el viaje lleno, intentá pedir desde otra cuenta. La app avisa que se
   llenó y el viaje queda `FULL`.
5. **Cancelar**: como pasajero en *Mis reservas*; el asiento vuelve a quedar libre.
6. **Perfil incompleto**: entrá con `ana@ejemplo.com` e intentá publicar: pide foto y teléfono. El
   código de verificación aparece **en pantalla** en modo demo.
7. **Reputación**: en un viaje ya realizado, calificá de 1 a 5 estrellas.

Emails del seed:

| Email | Persona | Para qué sirve |
| --- | --- | --- |
| `maria@ejemplo.com` | María Fernández | Conductora con viajes, reputación 5.0 y presentismo. |
| `jorge@ejemplo.com` | Jorge Almada | Un viaje completo y otro con lugares libres. |
| `lucia@ejemplo.com` | Lucía Rossi | Pasajera con reservas e historial. |
| `diego@ejemplo.com` | Diego Sosa | Tiene una ausencia registrada (presentismo bajo). |
| `ana@ejemplo.com` | Ana Gutiérrez | **Teléfono sin verificar**: muestra el flujo "Completá tu perfil". |

Cualquier otro email crea una persona nueva de prueba.

---

## Variables de entorno

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Postgres: `postgresql://carpoo:carpoo@localhost:5433/carpoo` en local; Vercel inyecta la de producción. |
| `DIRECT_URL` / `DATABASE_URL_UNPOOLED` | No | Conexión directa para `prisma db push` en el deploy. Supabase usa `DIRECT_URL`; Neon inyecta `DATABASE_URL_UNPOOLED`. |
| `APP_URL` | Sí | URL pública; se usa para armar los callbacks de OAuth. |
| `AUTH_SECRET` | Sí | Firma la cookie de sesión y los códigos del teléfono. Larga y aleatoria. |
| `DEMO_LOGIN` | No | Hay que ponerlo en `"true"` para el demo/local; si falta, el acceso de prueba queda apagado. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Login con Google. Sin claves, el botón aparece deshabilitado. |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | No | Login con Facebook. |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | No | Envío real del código por SMS o WhatsApp. Si `TWILIO_FROM` empieza con `whatsapp:`, va por WhatsApp. |
| `TWILIO_WHATSAPP_FROM` | No | Alternativa a `TWILIO_FROM`, ej. `whatsapp:+14155238886`. |

### Callbacks de OAuth

- Google: `https://TU-DOMINIO/api/auth/callback/google`
- Facebook: `https://TU-DOMINIO/api/auth/callback/facebook`

Se cargan en la consola de cada proveedor y tienen que coincidir con `APP_URL`.

### Verificación real por WhatsApp

La app ya soporta enviar el código por WhatsApp usando Twilio. Para activarlo:

1. Creá una cuenta en [Twilio](https://www.twilio.com/try-twilio) y obtené `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`.
2. **Para probar rápido (sandbox, gratis):** activá el *WhatsApp Sandbox*, enviá desde tu WhatsApp
   el mensaje de unión que te indique y cargá:
   ```env
   TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"   # número del sandbox de Twilio
   ```
   > El sandbox solo entrega mensajes a números que hicieron el "join". Sirve para probar, no para
   > usuarios reales.
3. **Para usuarios reales:** necesitás un *sender* aprobado y, según el caso, una plantilla de
   autenticación aprobada por Meta. La opción más simple para OTP es
   [Twilio Verify](https://www.twilio.com/docs/verify) con el canal WhatsApp.
4. Cargá las variables en Vercel y hacé **Redeploy**. Con proveedor configurado, el código **ya no
   se muestra en pantalla**.

---

## Despliegue en Vercel

El deploy usa **Postgres** (Neon/Supabase) porque el sistema de archivos es efímero.

1. **Importá el repo** en [vercel.com/new](https://vercel.com/new) (framework: Next.js).
2. **Creá la base**:
   - **Neon desde Vercel** (la más simple): *Storage → Create Database → Postgres (Neon)*, plan
     gratis. Vercel inyecta `DATABASE_URL` sola.
   - **Supabase**: creá el proyecto y copiá dos cadenas desde *Project Settings → Database →
     Connection string*:
     - **Transaction pooler** (puerto `6543`), con `?pgbouncer=true&connection_limit=1` →
       `DATABASE_URL`.
     - **Direct connection** o **Session pooler** (puerto `5432`) → `DIRECT_URL`.

     ```env
     DATABASE_URL="postgresql://postgres.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
     DIRECT_URL="postgresql://postgres.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:5432/postgres"
     ```
3. **Variables de entorno**:

   ```env
   APP_URL="https://tu-proyecto.vercel.app"
   AUTH_SECRET="<clave larga y aleatoria>"
   DEMO_LOGIN="false"       # "true" solo en el demo público
   ```

4. **Deploy**: `vercel-build` genera el schema Postgres (agregando `directUrl` si corresponde),
   corre `prisma db push` contra la base de producción, compila y publica.
5. **Datos de ejemplo (opcional)**, una sola vez:

   ```bash
   $env:DATABASE_URL="postgresql://..."           # cadena de producción (pooler)
   $env:DIRECT_URL="postgresql://..."             # Supabase: puerto 5432
   $env:DATABASE_URL_UNPOOLED="postgresql://..."  # Neon: la inyecta Vercel
   npm run db:seed:prod
   ```

6. Si querés login con Google/Facebook en producción, cargá los callbacks del dominio de Vercel.

> En local y en Docker se usan **migraciones versionadas** (`prisma/migrations/`); el deploy de
> Vercel todavía usa `prisma db push` contra Neon con un schema de deploy generado. Ninguno copia
> filas: solo sincronizan estructura. **Nunca apuntes tu `.env` local a producción.** Unificar ese
> último paso con migrations está en el roadmap.

> Con `DEMO_LOGIN="true"` cualquiera entra con un email a una cuenta **que no sea real** (las
> cuentas con contraseña, Google o Facebook nunca se pisan). Está bien para el demo; en un producto
> real va en `"false"` o se omite la variable.

---

## Seguridad

- Sesión con **JWT HS256** firmado en cookie **`httpOnly`**, `SameSite=Lax` y `Secure` en
  producción. Sin `AUTH_SECRET` no se pueden falsificar sesiones.
- Cada Server Action verifica **sesión y propiedad** del recurso (por ejemplo, solo el conductor
  dueño del viaje puede cancelarlo).
- Aceptar un asiento usa **transacción + condición de cupo**: no se puede sobrevender.
- Códigos de verificación generados con PRNG criptográfico y guardados como **HMAC**, con 5
  intentos y espaciado entre reenvíos. Nunca se escriben en logs.
- OAuth con **state firmado**, **PKCE S256** para Google y `email_verified`: un email ajeno nunca se
  pisa. Redirecciones validadas contra el `origin` (sin open redirects).
- Rate limit en login, registro, demo y verificación. Es en memoria: en producción se cambia por
  un store compartido.
- El teléfono del conductor se oculta hasta que exista reserva confirmada o asistida.
- Los textos se limpian y se limitan en longitud antes de guardarse.
- No hay pagos, comisiones ni datos de tarjetas: el dinero se arregla entre las partes.

---

## Roadmap por sprints

Cada ítem se convierte en un **issue** con criterio de aceptación, se trabajó en una rama y se cerró
con un PR revisado. Así se ve el progreso real, no una lista de deseos.

### Sprint 0 — Cimientos (hecho)

- [x] MVP funcional: publicar, buscar, pedir, aceptar, cupos en vivo, reseñas y WhatsApp.
- [x] Seguridad: demo opt-in, OTP seguro, OAuth firmado con PKCE, rate limit y sin fuga de teléfono.
- [x] Docker: base + app con un solo comando y BD descartable.
- [x] Migraciones versionadas, CODEOWNERS y backup antes de migrar.

### Sprint 1 — Integridad del dominio

- [ ] Un mismo viaje no puede quedar en estados contradictorios (`FULL` con cupos libres, `DONE`
  con reservas `PENDING`).
- [ ] Cancelaciones y reembolsos de cupo centralizados en una sola regla, con tests.
- [ ] Reseñas solo entre personas que realmente compartieron un viaje asistido.
- [ ] Tests de las reglas críticas (sobreventa, perfil incompleto, privacidad del teléfono).

### Sprint 2 — Calidad y confianza

- [ ] CI en GitHub Actions: `lint`, `build` y tests en **cada PR** (el checkbox deja de ser manual).
- [ ] Observabilidad: errores y métricas sin loguear secretos ni códigos.
- [ ] Rate limit compartido (Redis/Upstash) para deploys con varias instancias.
- [ ] Unificar el deploy con `prisma migrate deploy` en vez de `db push`.

### Sprint 3 — Notificaciones y retención

- [ ] Web Push (PWA) para avisar al conductor de una solicitud, con bandeja in-app de respaldo.
- [ ] Recordatorios 24 h y 2 h antes de la salida.
- [ ] Retención del asiento: la solicitud reserva el lugar 30 minutos y se libera sola.

### Sprint 4 — Crecimiento y moderación

- [ ] Denuncias y moderación (el campo `isAdmin` ya está previsto).
- [ ] Chat interno para no salir a WhatsApp.
- [ ] Viajes recurrentes y búsqueda por cercanía.
- [ ] Verificación más fuerte (documento) para viajes largos.

**Descartado por ahora:** pagos y comisiones. La idea es que sea gratis para quien viaja.

---

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Desarrollo (Turbopack) en http://localhost:3000 |
| `npm run build` | Build de producción + chequeo de tipos |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Genera y aplica una migration nueva (Admin) |
| `npm run db:migrate:deploy` | Aplica migraciones sin generar nuevas (setup / contenedor) |
| `npm run db:backup` | Guarda un dump en `backups/` antes de migrar |
| `npm run db:seed` | Carga los datos de ejemplo (¡borra los datos existentes!) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Borra la base, reaplica migraciones y vuelve a seedear |
| `npm run docker:reset` | Borra el volumen Docker y levanta todo desde cero |

---

## Origen del proyecto

Lo hice para resolver algo concreto de mi zona: moverme entre pueblos sin depender de un grupo de
WhatsApp. Me interesaba especialmente la parte de confianza (identidad verificada, reputación,
presentismo) porque es lo que hace que compartir un auto funcione entre desconocidos.

Y lo usé como **prueba de desarrollo junto a IA**: el objetivo era ver si un agente podía sostener
un proyecto completo —modelo de datos, reglas de negocio, diseño, autenticación y deploy— siempre
conmigo tomando las decisiones. El resultado está a la vista y sigue en construcción.

Si querés probarlo o darme una mano con ideas, escribime.

---

## Licencia

Código publicado para mostrar el trabajo. Si querés reutilizarlo, escribime primero.
