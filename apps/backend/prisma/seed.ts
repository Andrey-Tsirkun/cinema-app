/**
 * Dev seed: movies, two halls with seat grids, sessions across the next week (UTC days).
 * Idempotent: skips if halls already exist unless SEED_FORCE=true.
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function utcAt(day: Date, hour: number, minute: number): Date {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute, 0, 0),
  );
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

async function main(): Promise<void> {
  const force = process.env.SEED_FORCE === 'true';
  if (!force) {
    const hallCount = await prisma.hall.count();
    if (hallCount > 0) {
      console.log(
        '[seed] Skipped: database already has halls. Set SEED_FORCE=true to wipe dev data and re-seed.',
      );
      return;
    }
  }

  if (force) {
    console.log('[seed] SEED_FORCE=true: clearing booking-related data…');
    await prisma.reservation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.hall.deleteMany();
    await prisma.movie.deleteMany();
  }

  const movies = await prisma.$transaction([
    prisma.movie.create({
      data: {
        title: 'Interstellar',
        duration: 169,
        description: 'A team of explorers travel through a wormhole in space.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Dune: Part Two',
        duration: 166,
        description: 'Paul Atreides unites with Chani and the Fremen.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Grand Budapest Hotel',
        duration: 99,
        description: 'A writer encounters the owner of an aging grand hotel.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Blade Runner 2049',
        duration: 164,
        description: 'Young blade runner K discovers a secret that could plunge society into chaos.',
      },
    }),
  ]);

  const [grandHall, miniHall] = await prisma.$transaction([
    prisma.hall.create({
      data: {
        name: 'Grand Hall',
        rowsCount: 8,
        seatsPerRow: 12,
      },
    }),
    prisma.hall.create({
      data: {
        name: 'Mini Hall',
        rowsCount: 5,
        seatsPerRow: 8,
      },
    }),
  ]);

  const seatRows: Prisma.SeatCreateManyInput[] = [];

  for (let row = 1; row <= grandHall.rowsCount; row++) {
    for (let number = 1; number <= grandHall.seatsPerRow; number++) {
      seatRows.push({ hallId: grandHall.id, row, number });
    }
  }
  for (let row = 1; row <= miniHall.rowsCount; row++) {
    for (let number = 1; number <= miniHall.seatsPerRow; number++) {
      seatRows.push({ hallId: miniHall.id, row, number });
    }
  }

  await prisma.seat.createMany({ data: seatRows });

  const slots = [
    { hour: 14, minute: 0 },
    { hour: 17, minute: 30 },
    { hour: 21, minute: 0 },
  ];

  const baseDay = startOfUtcDay(new Date());
  const sessionCreates: Prisma.SessionCreateManyInput[] = [];
  const halls = [grandHall, miniHall];
  const prices = [new Prisma.Decimal('11.99'), new Prisma.Decimal('9.50'), new Prisma.Decimal('14.00')];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(baseDay);
    day.setUTCDate(day.getUTCDate() + dayOffset);

    halls.forEach((hall, hallIdx) => {
      slots.forEach((slot, slotIdx) => {
        const movie = movies[(dayOffset + hallIdx + slotIdx) % movies.length];
        sessionCreates.push({
          movieId: movie.id,
          hallId: hall.id,
          startTime: utcAt(day, slot.hour, slot.minute),
          price: prices[(dayOffset + slotIdx) % prices.length],
        });
      });
    });
  }

  await prisma.session.createMany({ data: sessionCreates });

  console.log(
    `[seed] Done: ${movies.length} movies, 2 halls (${grandHall.seatsPerRow * grandHall.rowsCount + miniHall.seatsPerRow * miniHall.rowsCount} seats), ${sessionCreates.length} sessions.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
