# Imagen de producción de Carpoo: Next.js + SQLite en un solo contenedor.
#
# La base vive en /data/carpoo.db, que docker-compose monta como volumen.
# Así sobrevive a reinicios y redeploys, sin necesidad de un segundo hosting.

# ---------- 1. Dependencias ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Prisma necesita openssl y las librerías de compatibilidad en Alpine.
RUN apk add --no-cache libc6-compat openssl

# Copiamos el schema antes de instalar: el postinstall corre "prisma generate".
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------- 2. Build ----------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# Solo para que el build no se queje: no se conecta a ninguna base.
ENV DATABASE_URL="file:/data/carpoo.db"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------- 3. Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Argentina/Buenos_Aires \
    DATABASE_URL="file:/data/carpoo.db"

RUN apk add --no-cache libc6-compat openssl tzdata

# La carpeta de la base queda con permisos del usuario sin privilegios.
RUN mkdir -p /data && chown -R node:node /data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

USER node
EXPOSE 3000

# Crea/actualiza las tablas (idempotente) y levanta la app.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx next start"]
