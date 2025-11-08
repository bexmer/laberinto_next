import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Generador de Laberintos',
  description: 'Aplicación para generar laberintos con múltiples algoritmos.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
