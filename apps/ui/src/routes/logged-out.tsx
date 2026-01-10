import { createFileRoute, Navigate } from '@tanstack/react-router';

// AUTHENTICATION DISABLED - Redirect to home
export const Route = createFileRoute('/logged-out')({
  component: () => <Navigate to="/" />,
});
