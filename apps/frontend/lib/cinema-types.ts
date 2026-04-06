export type UserPublic = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthSuccessResponse = {
  accessToken: string;
  user: UserPublic;
};

export type HallPublic = {
  id: string;
  name: string;
  rowsCount: number;
  seatsPerRow: number;
};

export type SessionPublic = {
  id: string;
  movieId: string;
  hallId: string;
  startTime: string;
  price: string | number;
  movie: { id: string; title: string; duration: number };
  hall: { id: string; name: string };
};

export type SeatAvailabilityStatus = 'AVAILABLE' | 'BOOKED';

export type SessionSeatWithAvailability = {
  id: string;
  hallId: string;
  row: number;
  number: number;
  status: SeatAvailabilityStatus;
};

export type ReservationPublic = {
  id: string;
  userId: string;
  sessionId: string;
  seatId: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  session: {
    id: string;
    startTime: string;
    price: string | number;
    hall: { id: string; name: string };
    movie: { id: string; title: string; duration: number };
  };
  seat: { id: string; hallId: string; row: number; number: number };
};
