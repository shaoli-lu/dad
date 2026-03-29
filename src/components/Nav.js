'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusCircle, Shield, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/submit', label: 'Submit', icon: PlusCircle },
  { href: '/admin', label: 'Moderate', icon: Shield },
];

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          <span className="nav-logo-icon">😄</span>
          <span className="nav-logo-text">DadJokes</span>
        </Link>

        <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
