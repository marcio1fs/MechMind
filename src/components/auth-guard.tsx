'use client';

// AuthGuard is disabled for testing purposes. It will simply render children.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
