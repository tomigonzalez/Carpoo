import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las páginas leen datos en vivo de la base de datos (viajes, cupos, reservas),
  // por eso usamos el modelo de render clásico y no Cache Components.
  cacheComponents: false,
  // Prisma no debe ser empaquetado por Turbopack: se ejecuta en el servidor Node.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
