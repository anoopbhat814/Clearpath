import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="cp-login">
      <div className="cp-card">
        <h1>Page not found</h1>
        <p className="cp-muted">The page you requested does not exist or you do not have access to it.</p>
        <Link href="/dashboard">Back to the dashboard</Link>
      </div>
    </main>
  );
}
