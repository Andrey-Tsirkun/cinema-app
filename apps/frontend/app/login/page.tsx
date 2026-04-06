import { Suspense } from 'react';
import { AuthMarketingShell } from './auth-marketing-shell';
import { LoginForm } from './login-form';
import styles from './page.module.scss';

function LoginFormFallback() {
  return (
    <p className={styles.formFallback} role="status">
      Loading…
    </p>
  );
}

export default function LoginPage() {
  return (
    <AuthMarketingShell
      cardTitle="Welcome back"
      cardLead="Sign in with email to manage your bookings and rewards."
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthMarketingShell>
  );
}
