// app/layout.tsx
import type { ReactNode } from "react";
import { Metadata } from 'next';
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: 'AI Learning Platform',
  description: 'AI-powered learning platform for generating quizzes and educational content',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
