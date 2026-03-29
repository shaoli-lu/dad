'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, MousePointerClick, Sparkles } from 'lucide-react';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { fireConfetti } from '@/lib/confetti';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [joke, setJoke] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const fetchJoke = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://icanhazdadjoke.com/slack');
      const data = await response.json();
      setJoke(data.attachments[0].fallback);
    } catch (err) {
      console.error('Failed to fetch joke:', err);
      setJoke("Why don't scientists trust atoms? Because they make up everything!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoke();
  }, [fetchJoke]);

  const handlePageClick = useCallback((e) => {
    // Don't fire on interactive elements
    if (e.target.closest('a, button, .nav, .hero-actions')) return;

    fireConfetti();
    fetchJoke();
  }, [fetchJoke]);

  const handleSaveJoke = async () => {
    if (!joke || saving) return;
    setSaving(true);
    try {
      // Check for duplicates
      const { data: existingJoke, error: checkError } = await supabase
        .from('jokes')
        .select('id')
        .eq('content', joke)
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingJoke) {
        setToast({ type: 'error', message: '💡 This joke is already in the community!' });
        return;
      }

      const { error } = await supabase.from('jokes').insert({
        content: joke,
        author_name: 'DadBot 🤖',
        source: 'api',
        is_approved: true,
      });

      if (error) throw error;
      window.dispatchEvent(new Event('joke-saved'));
      setToast({ type: 'success', message: '🎉 Joke saved to community!' });
    } catch (err) {
      console.error('Failed to save joke:', err);
      setToast({ type: 'error', message: 'Failed to save joke. Try again!' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrapper" onClick={handlePageClick}>
        <section className="hero" id="hero-section">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Click anywhere for a new joke
          </div>

          <div className="hero-logo">
            <div style={{ fontSize: '6rem', lineHeight: 1 }}>😄</div>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-gradient">Dad Jokes</span>
          </h1>

          <p className="hero-subtitle">
            The internet&apos;s finest collection of groan-worthy, eye-rolling,
            absolutely legendary dad jokes.
          </p>

          <div className="hero-joke-card">
            <p className={`hero-joke-text ${loading ? 'loading' : ''}`} id="joke-display">
              {loading ? 'Loading a knee-slapper...' : joke}
            </p>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={handleSaveJoke} disabled={saving}>
              <Bookmark size={18} />
              {saving ? 'Saving...' : 'Save to Community'}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/community');
              }}
            >
              <Sparkles size={18} />
              Browse Jokes
            </button>
          </div>

          <div className="hero-hint">
            <MousePointerClick size={14} className="hero-hint-icon" />
            <span>Click anywhere on the page for confetti + a new joke</span>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <p>Made with 😂 and ☕</p>
          </div>
        </footer>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
