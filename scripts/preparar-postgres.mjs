/**
 * Vercel no puede usar SQLite (el sistema de archivos es efímero y de solo
 * lectura en las funciones). Para el deploy generamos una copia del schema
 * con el proveedor en Postgres, sin tocar el original (que sigue siendo SQLite
 * para desarrollo local).
 *
 * Lo corre Vercel automáticamente desde el script "vercel-build".
 * El archivo generado está en .gitignore: nunca se commitea.
 *
 * Si hay una conexión directa disponible, la agregamos como `directUrl`:
 * Prisma la usa para `db push` y las migraciones, que no conviene correr a
 * través del pooler. Se acepta cualquiera de estas dos variables:
 *   - DIRECT_URL              (Supabase: puerto 5432)
 *   - DATABASE_URL_UNPOOLED   (Neon: la inyecta la integración de Vercel)
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

// Primera variable de conexión directa que esté definida.
const variableDirecta = ["DIRECT_URL", "DATABASE_URL_UNPOOLED"].find(
  (nombre) => process.env[nombre]?.trim(),
);

const urlActual = '  url      = env("DATABASE_URL")';
const urlConDirecta = (nombre) =>
  `${urlActual}\n  directUrl = env("${nombre}")`;

let schemaPostgres = schema.replace('provider = "sqlite"', 'provider = "postgresql"');

if (variableDirecta) {
  if (!schemaPostgres.includes(urlActual)) {
    console.error(
      '[deploy] No se encontró la línea `url = env("DATABASE_URL")` en el schema.',
    );
    process.exit(1);
  }
  schemaPostgres = schemaPostgres.replace(urlActual, urlConDirecta(variableDirecta));
  console.log(
    `[deploy] ${variableDirecta} detectada: se agrega directUrl al schema.`,
  );
}

fs.writeFileSync(
  destino,
  `// ARCHIVO GENERADO para el deploy (no editar ni commitear).\n` + schemaPostgres,
);

console.log("[deploy] Generado prisma/schema.postgres.prisma (provider: postgresql).");
