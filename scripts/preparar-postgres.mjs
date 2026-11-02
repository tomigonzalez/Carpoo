/**
 * Vercel no puede usar SQLite (el sistema de archivos es efímero y de solo
 * lectura en las funciones). Para el deploy generamos una copia del schema
 * con el proveedor en Postgres, sin tocar el original (que sigue siendo SQLite
 * para desarrollo local).
 *
 * Lo corre Vercel automáticamente desde el script "vercel-build".
 * El archivo generado está en .gitignore: nunca se commitea.
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

fs.writeFileSync(
  destino,
  `// ARCHIVO GENERADO para el deploy (no editar ni commitear).\n` +
    schema.replace('provider = "sqlite"', 'provider = "postgresql"'),
);

console.log("[deploy] Generado prisma/schema.postgres.prisma (provider: postgresql).");
