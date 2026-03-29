'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Lightbulb, ArrowRight } from 'lucide-react';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { fireConfetti } from '@/lib/confetti';

export default function SubmitPage() {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent || submitting) return;

    setSubmitting(true);
    try {
      // Check for duplicates
      const { data: existingJoke, error: checkError } = await supabase
        .from('jokes')
        .select('id')
        .eq('content', cleanContent)
        .limit(1)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingJoke) {
        setToast({ type: 'error', message: '💡 This joke is already in the community!' });
        return;
      }

      const { error } = await supabase.from('jokes').insert({
        content: cleanContent,
        author_name: authorName.trim() || 'Anonymous',
        source: 'user',
        is_approved: false, // Needs moderation
      });

      if (error) throw error;

      fireConfetti();
      setToast({ type: 'success', message: '🎉 Joke submitted! It will appear after moderation.' });
      setContent('');
      setAuthorName('');
    } catch (err) {
      console.error('Failed to submit joke:', err);
      setToast({ type: 'error', message: 'Failed to submit. Please try again!' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrapper">
        <div className="container-sm">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h1 className="section-title">
              <span className="hero-title-gradient">Submit a Joke</span>
            </h1>
            <p className="section-subtitle">
              Got a groan-worthy dad joke? Share it with the community!
            </p>
          </div>

          <div className="submit-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="joke-content">
                  Your Dad Joke *
                </label>
                <textarea
                  id="joke-content"
                  className="form-textarea"
                  placeholder="Why did the scarecrow win an award? Because he was outstanding in his field!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  maxLength={500}
                />
                <p className="form-hint">{content.length}/500 characters</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="author-name">
                  Your Name
                </label>
                <input
                  id="author-name"
                  type="text"
                  className="form-input"
                  placeholder="Anonymous"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={50}
                />
                <p className="form-hint">Leave empty to submit anonymously</p>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                <Send size={18} />
                {submitting ? 'Submitting...' : 'Submit Joke'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--amber-400)', fontWeight: 600, fontSize: '0.875rem' }}>
                <Lightbulb size={16} />
                Tips for a great dad joke
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.813rem', lineHeight: 1.8 }}>
                <li>Keep it family-friendly</li>
                <li>Puns are always welcome (and encouraged!)</li>
                <li>The more groan-worthy, the better</li>
                <li>Setup → Punchline format works great</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/community')}>
              Browse community jokes <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <footer className="footer">
          <div className="container">
            <p>Made with 😂 and ☕ — Jokes are moderated before appearing in the community.</p>
          </div>
        </footer>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
