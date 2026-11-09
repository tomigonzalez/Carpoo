/**
 * Genera `prisma/schema.postgres.prisma` para el deploy en Vercel.
 *
 * `prisma/schema.prisma` es la fuente de verdad (PostgreSQL). Este script crea
 * una copia para el build y, si hay una conexión directa disponible, agrega
 * `directUrl` para que `prisma db push` no corra a través del pooler.
 *
 * Variables de conexión directa aceptadas:
 *   - DIRECT_URL              (Supabase: puerto 5432)
 *   - DATABASE_URL_UNPOOLED   (Neon: la inyecta la integración de Vercel)
 *
 * Lo corre Vercel automáticamente desde el script "vercel-build".
 * El archivo generado está en .gitignore: nunca se commitea.
 */
import fs from "node:fs";
import path from "node:path";

const origen = path.join("prisma", "schema.prisma");
const destino = path.join("prisma", "schema.postgres.prisma");

const schema = fs.readFileSync(origen, "utf8");

const esSqlite = schema.includes('provider = "sqlite"');
const esPostgres = schema.includes('provider = "postgresql"');
if (!esSqlite && !esPostgres) {
  console.error("[deploy] No se reconoció el provider en prisma/schema.prisma.");
  process.exit(1);
}

// Compatibilidad: si el schema fuente fuera SQLite, lo pasamos a Postgres.
let schemaPostgres = esSqlite
  ? schema.replace('provider = "sqlite"', 'provider = "postgresql"')
  : schema;

// Evitar duplicar directUrl si ya estuviera presente.
schemaPostgres = schemaPostgres.replace(/\n\s*directUrl\s*=\s*env\("[^"]+"\)/g, "");

const variableDirecta = ["DIRECT_URL", "DATABASE_URL_UNPOOLED"].find(
  (nombre) => process.env[nombre]?.trim(),
);

if (variableDirecta) {
  const urlActual = '  url      = env("DATABASE_URL")';
  if (!schemaPostgres.includes(urlActual)) {
    console.error(
      '[deploy] No se encontró la línea `url = env("DATABASE_URL")` en el schema.',
    );
    process.exit(1);
  }
  schemaPostgres = schemaPostgres.replace(
    urlActual,
    `${urlActual}\n  directUrl = env("${variableDirecta}")`,
  );
  console.log(
    `[deploy] ${variableDirecta} detectada: se agrega directUrl al schema.`,
  );
}

fs.writeFileSync(
  destino,
  `// ARCHIVO GENERADO para el deploy (no editar ni commitear).\n` + schemaPostgres,
);

console.log(
  `[deploy] Generado prisma/schema.postgres.prisma (provider: postgresql${variableDirecta ? ", directUrl" : ""}).`,
);
