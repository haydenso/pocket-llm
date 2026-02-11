import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'pocket llm',
  description: 'WebGPU-powered LLM inference in the browser',
  icons: {
    icon: '/windows.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" id="theme-stylesheet" href="https://unpkg.com/xp.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
