import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Envelope Printer',
  description: 'Address management and envelope printing (10" × 4.5")',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
