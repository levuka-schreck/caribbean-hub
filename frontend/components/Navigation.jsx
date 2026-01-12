'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConnectButton from './ConnectButton';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/shipping', label: 'Shipping' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Caribbean Trade Hub
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-all ${
                  pathname === link.href
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
