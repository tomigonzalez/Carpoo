/**
 * Vercel no puede usar SQLite (el sistema de archivos es efímero y de solo
 * lectura en las funciones). Para el deploy generamos una copia del schema
 * con el proveedor en Postgres, sin tocar el original (que sigue siendo SQLite
 * para desarrollo local).
 *
 * Lo corre Vercel automáticamente desde el script "vercel-build".
 * El archivo generado está en .gitignore: nunca se commitea.
 *
 * Si existe DIRECT_URL (Supabase: conexión directa al puerto 5432), la
 * agregamos como `directUrl`. Prisma la usa para `db push` y las migraciones,
 * que no funcionan a través del pooler en modo transacción.
 */
import fs from "node:fs";
import path from "node:path";

const origen = path.join("prisma", "schema.prisma");
const destino = path.join("prisma", "schema.postgres.prisma");

const schema = fs.readFileSync(origen, "utf8");

if (!schema.includes('provider = "sqlite"')) {
  console.error("[deploy] El schema no usa SQLite; revisá prisma/schema.prisma.");
  process.exit(1);
}

const directUrl = process.env.DIRECT_URL?.trim();
const urlActual = '  url      = env("DATABASE_URL")';
const urlConDirecta = `${urlActual}\n  directUrl = env("DIRECT_URL")`;

let schemaPostgres = schema.replace('provider = "sqlite"', 'provider = "postgresql"');

if (directUrl) {
  if (!schemaPostgres.includes(urlActual)) {
    console.error(
      '[deploy] No se encontró la línea `url = env("DATABASE_URL")` en el schema.',
    );
    process.exit(1);
  }
  schemaPostgres = schemaPostgres.replace(urlActual, urlConDirecta);
  console.log("[deploy] DIRECT_URL detectada: se agrega directUrl al schema.");
}

fs.writeFileSync(
  destino,
  `// ARCHIVO GENERADO para el deploy (no editar ni commitear).\n` + schemaPostgres,
);

console.log("[deploy] Generado prisma/schema.postgres.prisma (provider: postgresql).");
