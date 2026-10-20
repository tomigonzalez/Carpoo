/**
 * Datos de ejemplo para ver la plataforma funcionando desde el primer minuto.
 *
 * Ejecutar con:  npm run db:seed   (borra y vuelve a crear estos datos)
 *
 * Nota: los emails son @ejemplo.com para no chocar con cuentas reales.
 * Para entrar como cualquiera de estas personas, usá el "Acceso de prueba" en
 * /ingresar escribiendo su email (no hacen falta claves).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function horas(dias: number, hora: number, minuto = 0): Date {
  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

async function main() {
  console.info("Borrando datos anteriores…");
  await prisma.review.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  console.info("Creando personas…");
  const maria = await prisma.user.create({
    data: {
      id: "demo-maria",
      name: "María Fernández",
      email: "maria@ejemplo.com",
      image: "/avatares/maria.svg",
      provider: "demo",
      providerId: "maria@ejemplo.com",
      phone: "+5492926551234",
      phoneVerified: true,
      carModel: "Fiat Cronos",
      carColor: "Blanco",
      carPlate: "AB123CD",
    },
  });

  const jorge = await prisma.user.create({
    data: {
      id: "demo-jorge",
      name: "Jorge Almada",
      email: "jorge@ejemplo.com",
      image: "/avatares/jorge.svg",
      provider: "demo",
      providerId: "jorge@ejemplo.com",
      phone: "+5492926554321",
      phoneVerified: true,
      carModel: "Chevrolet Onix",
      carColor: "Gris",
      carPlate: "AC456EF",
    },
  });

  const lucia = await prisma.user.create({
    data: {
      id: "demo-lucia",
      name: "Lucía Rossi",
      email: "lucia@ejemplo.com",
      image: "/avatares/lucia.svg",
      provider: "demo",
      providerId: "lucia@ejemplo.com",
      phone: "+5492926559876",
      phoneVerified: true,
    },
  });

  const diego = await prisma.user.create({
    data: {
      id: "demo-diego",
      name: "Diego Sosa",
      email: "diego@ejemplo.com",
      image: "/avatares/diego.svg",
      provider: "demo",
      providerId: "diego@ejemplo.com",
      phone: "+5492926552233",
      phoneVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      id: "demo-ana",
      name: "Ana Gutiérrez",
      email: "ana@ejemplo.com",
      image: "/avatares/ana.svg",
      provider: "demo",
      providerId: "ana@ejemplo.com",
      phoneVerified: false, // Sirve para ver el flujo de "completá tu perfil".
    },
  });

  console.info("Creando viajes…");

  const viajeM = await prisma.trip.create({
    data: {
      id: "demo-viaje-maria-bahia",
      driverId: maria.id,
      origin: "Villarino",
      destination: "Bahía Blanca",
      dateTime: horas(1, 7, 30),
      seatsTotal: 4,
      seatsTaken: 2,
      contribution: "$5000 por persona",
      notes: "Salgo desde la plaza. Puedo llevar 2 valijas chicas.",
    },
  });

  await prisma.reservation.create({
    data: { tripId: viajeM.id, passengerId: lucia.id, status: "CONFIRMED" },
  });
  await prisma.reservation.create({
    data: { tripId: viajeM.id, passengerId: diego.id, status: "CONFIRMED" },
  });

  const viajeJ = await prisma.trip.create({
    data: {
      id: "demo-viaje-jorge-medanos",
      driverId: jorge.id,
      origin: "Villarino",
      destination: "Médanos",
      dateTime: horas(2, 8, 0),
      seatsTotal: 3,
      seatsTaken: 1,
      contribution: "A convenir",
      notes: "Viajo todos los martes. Vuelvo a la tarde.",
    },
  });

  await prisma.reservation.create({
    data: { tripId: viajeJ.id, passengerId: maria.id, status: "CONFIRMED" },
  });

  await prisma.trip.create({
    data: {
      id: "demo-viaje-jorge-completo",
      driverId: jorge.id,
      origin: "Médanos",
      destination: "Bahía Blanca",
      dateTime: horas(3, 6, 45),
      seatsTotal: 2,
      seatsTaken: 2,
      status: "FULL",
      contribution: "$4000 por persona",
    },
  });

  await prisma.trip.create({
    data: {
      id: "demo-viaje-cancelado",
      driverId: maria.id,
      origin: "Villarino",
      destination: "Pedro Luro",
      dateTime: horas(4, 18, 0),
      seatsTotal: 3,
      seatsTaken: 0,
      status: "CANCELLED",
      contribution: "A convenir",
      notes: "Se canceló por el clima.",
    },
  });

  // --- Viaje del pasado, ya realizado: sirve para ver reputación y presentismo ---
  console.info("Creando un viaje pasado con calificaciones…");

  const viajeViejo = await prisma.trip.create({
    data: {
      id: "demo-viaje-realizado",
      driverId: maria.id,
      origin: "Villarino",
      destination: "Bahía Blanca",
      dateTime: horas(-6, 7, 0),
      seatsTotal: 3,
      seatsTaken: 3,
      status: "DONE",
      contribution: "$4500 por persona",
    },
  });

  await prisma.reservation.create({
    data: { tripId: viajeViejo.id, passengerId: lucia.id, status: "ATTENDED" },
  });
  await prisma.reservation.create({
    data: { tripId: viajeViejo.id, passengerId: jorge.id, status: "ATTENDED" },
  });
  await prisma.reservation.create({
    data: { tripId: viajeViejo.id, passengerId: diego.id, status: "NO_SHOW" },
  });

  await prisma.review.createMany({
    data: [
      {
        tripId: viajeViejo.id,
        authorId: lucia.id,
        targetId: maria.id,
        rating: 5,
        comment: "Muy puntual y maneja tranquila. Viajo de nuevo con ella.",
      },
      {
        tripId: viajeViejo.id,
        authorId: jorge.id,
        targetId: maria.id,
        rating: 5,
        comment: "Todo perfecto, nos esperó en la terminal.",
      },
      {
        tripId: viajeViejo.id,
        authorId: maria.id,
        targetId: lucia.id,
        rating: 5,
        comment: "Llegó a horario y avisó todo por WhatsApp.",
      },
      {
        tripId: viajeViejo.id,
        authorId: maria.id,
        targetId: jorge.id,
        rating: 4,
        comment: "Muy correcto, llegó justo.",
      },
      {
        tripId: viajeViejo.id,
        authorId: maria.id,
        targetId: diego.id,
        rating: 1,
        comment: "Reservó y no apareció. No avisó.",
      },
    ],
  });

  console.info("¡Listo! Datos de ejemplo creados.");
  console.info("Emails de prueba: maria@ejemplo.com · jorge@ejemplo.com · lucia@ejemplo.com · diego@ejemplo.com · ana@ejemplo.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
