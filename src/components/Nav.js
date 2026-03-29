'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusCircle, Shield, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/community', label: 'Community', icon: Users, hasBadge: true },
  { href: '/submit', label: 'Submit', icon: PlusCircle },
  { href: '/admin', label: 'Moderate', icon: Shield },
];

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [jokeCount, setJokeCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('jokes')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);
      
      setJokeCount(count || 0);
    };

    fetchCount();

    // Listener for local manual updates
    window.addEventListener('joke-saved', fetchCount);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('jokes-realtime-count')
      .on(
        'postgres_changes',
        { event: '*', table: 'jokes', schema: 'public' },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('joke-saved', fetchCount);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          <span className="nav-logo-icon">😄</span>
          <span className="nav-logo-text">DadJokes</span>
        </Link>

        <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation">
          {isOpen ? <X size={22} /> : (
            <div style={{ position: 'relative' }}>
              <Menu size={22} />
              {jokeCount > 0 && (
                <span className="nav-toggle-badge animate-pulse-soft">{jokeCount}</span>
              )}
            </div>
          )}
        </button>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, hasBadge }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon size={16} />
              {label}
              {hasBadge && jokeCount > 0 && (
                <span className="nav-badge animate-pulse-soft">{jokeCount}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
