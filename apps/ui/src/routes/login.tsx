import { createFileRoute, Navigate } from '@tanstack/react-router';

// AUTHENTICATION DISABLED - Redirect to home
export const Route = createFileRoute('/login')({
  component: () => <Navigate to="/" />,
});
