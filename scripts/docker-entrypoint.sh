#!/bin/sh
# Arranque dentro del contenedor: deja la app lista sin que el usuario haga nada.
set -e

SECRET_DIR=/run/carpoo
SECRET_FILE="$SECRET_DIR/auth_secret"
mkdir -p "$SECRET_DIR"

# Si no hay AUTH_SECRET, la generamos una vez y la guardamos en un volumen
# con nombre: así sobrevive a reinicios y no se escribe en el repo del host.
if [ ! -s "$SECRET_FILE" ]; then
  echo "[Carpoo] Generando AUTH_SECRET..."
  openssl rand -hex 48 > "$SECRET_FILE"
fi
export AUTH_SECRET="$(cat "$SECRET_FILE")"

echo "[Carpoo] Sincronizando la estructura de la base..."
npx prisma db push

# Sembrar solo si la base está vacía: nunca borramos datos en un reinicio.
CANTIDAD=$(node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.user.count().then(n=>{console.log(n);return p.$disconnect()}).catch(e=>{console.error(e);process.exit(1)})')
if [ "$CANTIDAD" = "0" ]; then
  echo "[Carpoo] Cargando datos de ejemplo..."
  npx prisma db seed
else
  echo "[Carpoo] La base ya tiene datos; no se siembra de nuevo."
fi

echo "[Carpoo] Levantando la app..."
exec "$@"
