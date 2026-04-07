import styles from './not-found.module.scss';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>This scene is missing</h1>
      <p className={styles.text}>
        The page you are looking for is not in our programme. It may have been moved or never existed.
      </p>
      <Link className={styles.link} href="/">
        Back to home
      </Link>
    </div>
  );
}
