import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HRC Sports | Book Your Cricket Turf',
  description: 'Book a cricket turf slot at HRC Sports. Choose your date, time and duration in minutes.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
