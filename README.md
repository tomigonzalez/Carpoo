# Carpoo 🚗

**Viajes compartidos entre pueblos, sin grupos de WhatsApp .**

Carpoo conecta a personas que viajan entre pueblos y ciudades cercanas). Un conductor publica su viaje (origen, destino, día, hora y
asientos libres) y un pasajero reserva su asiento en un par de toques. El cupo se descuenta
**en tiempo real** y, al confirmar, la app conecta a ambas partes con un **botón directo de
WhatsApp** para arreglar el pago y el punto de encuentro.

No hay perfiles anónimos: cada viaje y cada reserva cuelga de una cuenta real con **teléfono
verificado** y **foto**. Antes de reservar se ve la **reputación** (estrellas), el **presentismo**
(si la persona suele aparecer o no) y el historial de viajes. En este MVP **no se cobra nada
dentro de la app**: Carpoo solo conecta a las personas.

---

## ¿Qué incluye esta versión (MVP)?

**Para el conductor**
- Publicar un viaje con un formulario simple: origen, destino, fecha, hora y asientos (1 a 8).
- Panel "Mis viajes" con los viajes publicados, los asientos que quedan **en vivo** y quién reservó.
- Marcar el viaje como **Completo**, **Cancelado** (libera los asientos) o **Realizado**.
- Al finalizar, marcar a cada pasajero como **Viajó** o **No vino** (alimenta el presentismo).

**Para el pasajero**
- Buscador directo *"¿A dónde vas?"* con filtros por origen, destino y fecha.
- Tarjetas de viaje claras: foto del conductor, auto, hora, asientos libres, reputación y presentismo.
- Botón **"Reservar asiento"**: descuenta 1 asiento al instante y evita la sobreventa.
- "Mis reservas", con opción de cancelar y de confirmar *"Sí, viajé"*.
- Al confirmar la reserva, se habilita el **botón de WhatsApp** del conductor.

**Identidad y confianza**
- Inicio de sesión en 1 clic con **Google** o **Facebook** (pensado para personas adultas/mayores).
- Verificación del teléfono con un **código de 6 números** (en modo prueba se muestra en pantalla).
- Foto de perfil y nombre. Sin perfil completo (foto + teléfono verificado) **no se puede publicar ni reservar**.
- Reputación de 1 a 5 estrellas con comentario corto, después de cada viaje.
- Presentismo = viajes asistidos ÷ (asistidos + ausencias), visible en el perfil.

**Experiencia**
- Mobile-first, botones grandes, texto claro y alto contraste. En español cotidiano
  ("Ofrecer viaje", "Buscar asiento", "Mis reservas") y entendible sin tutorial.
- El teléfono del conductor **no se muestra** hasta que hay una reserva confirmada o asistida.

---

## Tecnologías

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Framework | **Next.js 16.4.2** (App Router, Server Actions) | Un solo proyecto para pantallas y lógica; acciones de formulario sin API extra. |
| UI | **React 19.3** + **TypeScript** | Tipado de punta a punta y componentes modernos. |
| Estilos | **Tailwind CSS v4** + tokens propios en `globals.css` | Diseño consistente y botones grandes. |
| Base de datos | **Prisma 6.19.3** + **SQLite** | SQLite es un solo archivo: no hay que instalar nada para probar. |
| Sesión | **jose** (JWT HS256 en cookie `httpOnly`) | Login liviano y sin dependencias pesadas. |
| OAuth | Implementación propia en `src/lib/oauth.ts` | Flujo authorization-code de Google y Facebook, sin librerías extra. |

> **Nota sobre el render:** las páginas leen datos en vivo (viajes, cupos, reservas), por eso en
> `next.config.ts` está `cacheComponents: false` y se usa el render dinámico clásico.

---

## Requisitos

- **Node.js 20.9 o superior** (recomendado 22 LTS).
- **npm** (viene con Node).
- Windows, macOS o Linux. No hace falta instalar ninguna base de datos.
- *(Opcional)* Claves de Google y/o Facebook para el login real.
- *(Opcional)* Cuenta de Twilio para enviar SMS reales.

---

## Puesta en marcha local (paso a paso)

### 1. Instalar dependencias

```bash
npm install
```

Esto también ejecuta `prisma generate` automáticamente (`postinstall`).

### 2. Crear el archivo de variables de entorno

Copiá el ejemplo y editalo:

```bash
# Linux / macOS
cp .env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

Generá una clave secreta para la cookie de sesión y pegala en `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El `.env` mínimo para probar en local:

```env
DATABASE_URL="file:./dev.db"
APP_URL="http://localhost:3000"
AUTH_SECRET="<la clave larga que generaste>"
DEMO_LOGIN="true"
```

### 3. Crear la base de datos y cargar los datos de ejemplo

```bash
npm run db:push     # crea el archivo prisma/dev.db con las tablas
npm run db:seed     # carga 5 personas, viajes y reseñas de ejemplo
```

### 4. Levantar la app

```bash
npm run dev
```

Abrí **http://localhost:3000** en el navegador.

> **Zona horaria:** las horas se muestran en la zona horaria del servidor. Para ver las horas
> exactas de Argentina, arrancá con `TZ=America/Argentina/Buenos_Aires` (Linux/macOS) o configurá
> la zona horaria del sistema en Windows.

### 5. Entrar a probar

En **http://localhost:3000/ingresar** tenés dos caminos:

- **Acceso de prueba** (sin Google ni Facebook): escribí uno de los emails de ejemplo y entrás.
- **Google / Facebook**: solo si cargaste las claves (ver más abajo).

**Emails de ejemplo** (creados por el seed, sin contraseña):

| Email | Persona | Para qué sirve |
| --- | --- | --- |
| `maria@ejemplo.com` | María Fernández (con auto) | Tiene viajes publicados, reputación 5.0 y presentismo. |
| `jorge@ejemplo.com` | Jorge Almada (con auto) | Tiene un viaje completo y otro con asientos libres. |
| `lucia@ejemplo.com` | Lucía Rossi | Pasajera con reservas e historial. |
| `diego@ejemplo.com` | Diego Sosa | Tiene una ausencia registrada (presentismo bajo). |
| `ana@ejemplo.com` | Ana Gutiérrez | **Teléfono sin verificar**: sirve para ver el flujo "Completá tu perfil". |

> Escribir cualquier otro email **crea** una persona nueva de prueba.

---

## Guía de prueba (recorrido recomendado)

**A. Publicar un viaje (conductor)**
1. Entrá con `maria@ejemplo.com`.
2. Tocá **"Ofrecer viaje"** → cargá origen, destino, fecha, hora y asientos → Publicar.
3. Vas a **"Mis viajes"** y ves el viaje con los asientos libres en vivo.

**B. Buscar y reservar (pasajero)**
1. En una ventana de incógnito, entrá con `lucia@ejemplo.com`.
2. **"Buscar asiento"** → filtrá por origen/destino/fecha.
3. Abrí un viaje y tocá **"Reservar asiento"**. El cupo baja 1 al instante y aparece el
   **botón de WhatsApp** del conductor.

**C. Sin sobreventa**
1. Con el viaje lleno, intentá reservar desde otra cuenta: la app avisa
   *"Se acaba de llenar. Probá con otro viaje."* y el viaje queda **Completo**.

**D. Cancelar y liberar el asiento**
1. Como pasajero, cancelá la reserva en **"Mis reservas"**: el asiento vuelve a quedar libre.
2. Como conductor, cancelá el viaje: se cancelan las reservas y se liberan los cupos.

**E. Perfil incompleto**
1. Entrá con `ana@ejemplo.com` (sin teléfono).
2. Intentá publicar o reservar: la app pide **foto + teléfono verificado**.
3. En **"Mi perfil"**, verificá el teléfono: en modo prueba el **código aparece en pantalla**
   (y en la consola del servidor). Cargalo y listo.

**F. Reputación y presentismo**
1. Mirá el perfil de `maria@ejemplo.com` (calificaciones y presentismo).
2. En un viaje **ya realizado**, calificá de 1 a 5 estrellas con un comentario.
3. El promedio y el historial se recalculan al instante.

---

## Inicio de sesión con Google y Facebook

Sin claves, los botones aparecen **deshabilitados** (la app nunca se rompe). Para activarlos:

**Google** — en [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
1. Creá un **ID de cliente OAuth 2.0** de tipo *Aplicación web*.
2. En **URIs de redireccionamiento autorizados**, agregá:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://TU-DOMINIO/api/auth/callback/google` (cuando publiques)
3. Copiá el *Client ID* y *Client Secret* a `.env`:
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

**Facebook** — en [Meta for Developers](https://developers.facebook.com/) → tu app → *Facebook Login → Configuración*:
1. En **URI de redireccionamiento de OAuth válidos**, agregá:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://TU-DOMINIO/api/auth/callback/facebook`
2. Copiá el *App ID* y *App Secret* a `.env`:
   ```env
   FACEBOOK_CLIENT_ID="..."
   FACEBOOK_CLIENT_SECRET="..."
   ```

> Los callbacks se arman con `APP_URL` (si está cargada) o con la URL de la request.
> Si usás otro dominio, cambiá `APP_URL` para que coincida con la URL registrada.

---

## Verificación por SMS / WhatsApp

En modo prueba el código de 6 dígitos se muestra en pantalla y queda en la consola del servidor
(`[Carpoo] Código de verificación para +54...: 123456`). No hace falta configurar nada.

Para enviar SMS reales, cargá estas variables y el envío por Twilio se activa solo
(ver `src/lib/notify.ts`):

```env
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM="+1XXXXXXXXXX"
```

Para WhatsApp Business, reemplazá en `sendVerificationCode` el `fetch` de Twilio por la llamada
a la API de WhatsApp (misma función, mismo contrato).

---

## Despliegue

**Recomendado para producción: un VPS con Node + Postgres.**

SQLite es ideal para probar, pero en plataformas serverless (como Vercel) el sistema de archivos
es efímero y la base se pierde en cada despliegue. Pasos:

1. En `prisma/schema.prisma`, cambiá `provider = "sqlite"` por `provider = "postgresql"`.
2. Definí `DATABASE_URL` apuntando a tu Postgres (por ejemplo [Neon](https://neon.tech) o uno propio).
3. En el servidor:
   ```bash
   npm install
   npx prisma migrate deploy    # o: npx prisma db push
   npm run build
   npm run start
   ```
4. Variables de entorno en producción:
   ```env
   DATABASE_URL="postgresql://..."
   APP_URL="https://tu-dominio.com"
   AUTH_SECRET="<clave larga y aleatoria>"
   DEMO_LOGIN="false"
   GOOGLE_CLIENT_ID="..."        # y/o Facebook
   FACEBOOK_CLIENT_ID="..."
   ```
5. Acordate de **agregar los callbacks** de producción en Google y Facebook con tu dominio real.

> **Importante:** en producción poné `DEMO_LOGIN="false"` para apagar el acceso de prueba.

### Scripts útiles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta la app en modo desarrollo. |
| `npm run build` | Compila para producción. |
| `npm run start` | Arranca el build de producción. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run db:push` | Crea/actualiza las tablas según el schema. |
| `npm run db:seed` | Carga los datos de ejemplo. |
| `npm run db:studio` | Abre Prisma Studio para ver/editar la base. |
| `npm run db:reset` | Borra todo y vuelve a cargar los datos de ejemplo. |

---

## Notas de seguridad

- La sesión es un **JWT firmado (HS256)** en una cookie **httpOnly** `SameSite=Lax` (y `Secure` en
  producción). No se puede falsificar sin el `AUTH_SECRET`.
- `AUTH_SECRET` debe ser **largo y aleatorio**. Sin él (o si es muy corto) la app no arranca las sesiones.
- Todas las acciones de servidor **verifican la sesión y la propiedad** del recurso (por ejemplo,
  solo el conductor puede cancelar su propio viaje).
- Reservar y cancelar usan **transacciones** y una condición de cupo, para que dos personas no
  tomen el último asiento a la vez.
- El teléfono del conductor se oculta hasta que exista una reserva confirmada o asistida.
- No hay pagos ni comisiones dentro de la app: el dinero se arregla entre las partes.

---

## Estructura del proyecto

```
Carpoo/
├─ prisma/
│  ├─ schema.prisma        # Modelo de datos (User, Trip, Reservation, Review)
│  ├─ seed.mts             # Datos de ejemplo (npm run db:seed)
│  └─ dev.db               # Base SQLite local (generada)
├─ public/avatares/        # Fotos de ejemplo (SVG, funcionan sin internet)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                 # Inicio: buscadores grandes + últimos viajes
│  │  ├─ buscar/                  # Buscador de asientos
│  │  ├─ viajes/[id]/             # Detalle del viaje: cupos en vivo + reservar + reseñas
│  │  ├─ publicar/                # Formulario para ofrecer un viaje
│  │  ├─ mis-viajes/              # Panel del conductor
│  │  ├─ mis-reservas/            # Reservas del pasajero
│  │  ├─ perfil/                  # Foto, teléfono, auto y reputación
│  │  ├─ usuarios/[id]/           # Perfil público de una persona
│  │  ├─ ingresar/                # Login con Google/Facebook + acceso de prueba
│  │  └─ api/
│  │     ├─ auth/signin/[provider]/    # Redirige a Google/Facebook
│  │     ├─ auth/callback/[provider]/  # Vuelve de Google/Facebook y crea la sesión
│  │     └─ viajes/[id]/cupos/         # Asientos libres en vivo (JSON)
│  ├─ components/          # Encabezado, barra inferior, tarjetas y formularios
│  └─ lib/
│     ├─ actions/          # Server Actions: auth, trips, reservations
│     ├─ session.ts        # Cookie de sesión + regla de perfil completo
│     ├─ oauth.ts          # Google y Facebook (authorization code)
│     ├─ queries.ts        # Consultas de lectura (buscar, detalle, paneles)
│     ├─ stats.ts          # Reputación, presentismo e historial
│     ├─ validate.ts       # Normalización de teléfonos, WhatsApp y textos
│     └─ notify.ts         # Envío de códigos (consola / Twilio)
├─ .env.example            # Plantilla de variables de entorno
└─ next.config.ts
```

---

## Alcance del MVP y próximos pasos

**Incluido:** publicar/buscar/reservar con cupos en vivo, login en 1 clic, verificación de teléfono,
perfil con foto, reputación, presentismo, WhatsApp, estados del viaje (activo/completo/cancelado/realizado).

**Fuera de esta versión (roadmap):**
- Pagos o señas dentro de la app (hoy el pago se arregla entre las partes).
- Notificaciones push o recordatorios automáticos antes de la salida.
- Chat interno (hoy se usa WhatsApp directo).
- Denuncias y moderación (el campo `isAdmin` ya está previsto en el modelo).
- Búsqueda por cercanía/geolocalización y viajes recurrentes.
- Verificación de identidad más fuerte (documento) para viajes largos.
