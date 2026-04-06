import { BookingClient } from './BookingClient';
import { SessionAuthGate } from './SessionAuthGate';

export default function SessionsPage() {
  return (
    <SessionAuthGate>
      <BookingClient />
    </SessionAuthGate>
  );
}
