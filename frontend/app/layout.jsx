import { Inter } from 'next/font/google';
import './globals.css';
import { Web3AuthProvider } from '@/lib/Web3AuthContext';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Caribbean Trade Hub',
  description: 'Decentralized group purchasing and shipping platform for Caribbean trade',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </Web3AuthProvider>
      </body>
    </html>
  );
}
