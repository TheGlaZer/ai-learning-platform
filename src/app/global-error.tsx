'use client';

import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ marginBottom: '1rem', color: '#333' }}>
            Something went wrong!
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666', maxWidth: '500px' }}>
            We're sorry, but there was a problem loading the application. 
            This is a global error that affected the entire app.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
} 