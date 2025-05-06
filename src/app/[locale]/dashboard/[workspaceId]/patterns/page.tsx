import { lazy } from 'react';

// Use dynamic import with lazy for improved loading performance
const PatternsPage = lazy(() => import('@/_pages/patterns/PatternsPage'));

export default function PatternsRoute() {
  return (
    <PatternsPage />
  );
} 