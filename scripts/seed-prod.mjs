/**
 * Carga los datos de ejemplo (prisma/seed.mts) en la base de producción.
 *
 * Uso:
 *   1. Copiá la cadena de conexión de Postgres (Neon / Vercel Storage).
 *   2. En la terminal:
 *        PowerShell:  $env:DATABASE_URL="postgresql://..."
 *        Bash:        export DATABASE_URL="postgresql://..."
 *   3. npm run db:seed:prod
 *
 * El script genera el cliente de Prisma para Postgres, crea las tablas si
 * faltan, corre el seed y al final restaura el cliente de SQLite local para
 * que `npm run dev` siga funcionando igual.
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";

if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
  console.error(
    "\n[seed:prod] DATABASE_URL no apunta a Postgres.\n" +
      "  PowerShell:  $env:DATABASE_URL=\"postgresql://...\"\n" +
      "  Bash:        export DATABASE_URL=\"postgresql://...\"\n",
  );
  process.exit(1);
}

const correr = (comando) => {
  console.log(`\n[seed:prod] > ${comando}`);
  execSync(comando, { stdio: "inherit", env: process.env });
};

try {
  correr("node scripts/preparar-postgres.mjs");
  correr("npx prisma generate --schema prisma/schema.postgres.prisma");
  correr("npx prisma db push --schema prisma/schema.postgres.prisma --skip-generate");
  correr("node prisma/seed.mts");
  console.log("\n[seed:prod] Datos de ejemplo cargados en producción.");
} finally {
  // Siempre volvemos al cliente de SQLite: el desarrollo local no cambia.
  correr("npx prisma generate");
  console.log("[seed:prod] Cliente local restaurado (SQLite).");
}
