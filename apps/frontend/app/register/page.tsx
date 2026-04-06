import { AuthMarketingShell } from '../login/auth-marketing-shell';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <AuthMarketingShell
      cardTitle="Create account"
      cardLead="Register with email and password to book seats and track reservations."
    >
      <RegisterForm />
    </AuthMarketingShell>
  );
}
