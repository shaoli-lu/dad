'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, Flame } from 'lucide-react';
import Nav from '@/components/Nav';
import JokeCard from '@/components/JokeCard';
import { supabase } from '@/lib/supabase';

const SORT_OPTIONS = [
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'top', label: 'Top', icon: TrendingUp },
];

export default function CuratedJokesPage() {
  const [jokes, setJokes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('hot');

  const loadJokes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('jokes')
      .select('*, comments(count)', { count: 'exact' })
      .eq('is_approved', true);

    if (sortBy === 'new') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'top') {
      query = query.order('upvotes', { ascending: false });
    } else {
      // "Hot" - combination of upvotes and recency
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.limit(50);
    
    if (error) {
      console.error('Failed to load jokes:', error);
    } else {
      setTotalCount(count || 0);
      let processedJokes = (data || []).map(j => ({
        ...j,
        comment_count: j.comments?.[0]?.count || 0,
      }));

      // For "hot" sorting, sort by a score combining votes and recency
      if (sortBy === 'hot') {
        processedJokes.sort((a, b) => {
          const scoreA = (a.upvotes - a.downvotes) + (new Date(a.created_at).getTime() / 1e10);
          const scoreB = (b.upvotes - b.downvotes) + (new Date(b.created_at).getTime() / 1e10);
          return scoreB - scoreA;
        });
      }

      setJokes(processedJokes);
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    loadJokes();

    // Subscribe to realtime updates for counts and new jokes
    const channel = supabase
      .channel('community-realtime')
      .on(
        'postgres_changes',
        { event: '*', table: 'jokes', schema: 'public' },
        () => {
          loadJokes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadJokes]);

  return (
    <>
      <Nav />
      <div className="page-wrapper">
        <div className="container-sm">
          <div className="section-header">
            <h1 className="section-title">
              <span className="hero-title-gradient">Community Jokes</span>
            </h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
              <span className="joke-count-badge">
                {loading ? '...' : totalCount} jokes and counting
              </span>
            </div>
            <p className="section-subtitle">
              The best jokes saved and submitted by our community. Vote for your favorites!
            </p>
          </div>

          <div className="feed-controls">
            <div className="feed-tabs">
              {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`feed-tab ${sortBy === key ? 'active' : ''}`}
                  onClick={() => setSortBy(key)}
                >
                  <Icon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="joke-feed">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="joke-card">
                  <div style={{ height: '20px', width: '40%', marginBottom: '1rem' }} className="skeleton"></div>
                  <div style={{ height: '60px', width: '100%', marginBottom: '1rem' }} className="skeleton"></div>
                  <div style={{ height: '30px', width: '60%' }} className="skeleton"></div>
                </div>
              ))
            ) : jokes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">😅</div>
                <h3 className="empty-state-title">No jokes yet!</h3>
                <p className="empty-state-text">
                  Head to the generate page to save some jokes from the API, or submit your own!
                </p>
              </div>
            ) : (
              jokes.map((joke) => (
                <JokeCard key={joke.id} joke={joke} onUpdate={loadJokes} />
              ))
            )}
          </div>
        </div>

        <footer className="footer">
          <div className="container">
            <p>Made with 😂 and ☕ — <a href="/generate">Back to Generate Jokes</a></p>
          </div>
        </footer>
      </div>
    </>
  );
}
