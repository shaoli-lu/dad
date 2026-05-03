'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Clock, Flame, Mic, ChevronRight, Loader2 } from 'lucide-react';
import Nav from '@/components/Nav';
import ShowCard from '@/components/ShowCard';
import { supabase } from '@/lib/supabase';

const SORT_OPTIONS = [
  { key: 'hot',  label: '🔥 Hot',  icon: Flame },
  { key: 'new',  label: '🆕 New',  icon: Clock },
  { key: 'top',  label: '🏆 Top',  icon: TrendingUp },
];

const BATCH = 50; // rows per fetch

const STREAK_KEY = 'dad_joke_streak';

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastDate: null };
    return JSON.parse(raw);
  } catch { return { count: 0, lastDate: null }; }
}

function bumpStreak() {
  const today = new Date().toDateString();
  const { count, lastDate } = loadStreak();
  if (lastDate === today) return count;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newCount = lastDate === yesterday ? count + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
  return newCount;
}

// Build a supabase query ordered by the current sort
function buildQuery(sortBy) {
  let q = supabase
    .from('jokes')
    .select('*, comments(count)', { count: 'exact' })
    .eq('is_approved', true);
  if (sortBy === 'top') return q.order('upvotes', { ascending: false });
  return q.order('created_at', { ascending: false }); // 'new' and initial pass of 'hot'
}

function processRows(rows, sortBy, existing = []) {
  const mapped = (rows || []).map(j => ({
    ...j,
    comment_count: j.comments?.[0]?.count || 0,
  }));
  const combined = [...existing, ...mapped];
  if (sortBy === 'hot') {
    combined.sort((a, b) => {
      const sA = (a.upvotes - a.downvotes) + (new Date(a.created_at).getTime() / 1e10);
      const sB = (b.upvotes - b.downvotes) + (new Date(b.created_at).getTime() / 1e10);
      return sB - sA;
    });
  }
  return combined;
}

export default function CuratedJokesPage() {
  const [jokes, setJokes]           = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy]         = useState('hot');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak]         = useState(0);
  const [queueLimit, setQueueLimit] = useState(5);
  const [direction, setDirection]   = useState('next');
  const [animKey, setAnimKey]       = useState(0);

  // track how many rows we've already fetched (for range pagination)
  const fetchedRef = useRef(0);
  const sortByRef  = useRef(sortBy);

  // ── Initial / sort-change load ──────────────────────────────────────────────
  const loadJokes = useCallback(async () => {
    setLoading(true);
    fetchedRef.current = 0;
    sortByRef.current  = sortBy;

    const { data, error, count } = await buildQuery(sortBy).range(0, BATCH - 1);

    if (!error) {
      const processed = processRows(data, sortBy);
      setJokes(processed);
      setTotalCount(count ?? 0);
      fetchedRef.current = processed.length;
      setCurrentIndex(0);
      setQueueLimit(5);
    }
    setLoading(false);
  }, [sortBy]);

  // ── Load next batch ─────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (fetchedRef.current >= totalCount) return;

    setLoadingMore(true);
    const from = fetchedRef.current;
    const to   = from + BATCH - 1;

    const { data, error } = await buildQuery(sortByRef.current).range(from, to);

    if (!error && data?.length) {
      setJokes(prev => {
        const next = processRows(data, sortByRef.current, prev);
        fetchedRef.current = next.length;
        return next;
      });
    }
    setLoadingMore(false);
  }, [loadingMore, totalCount]);

  // ── Auto-load when user is close to the end ─────────────────────────────────
  useEffect(() => {
    if (jokes.length === 0) return;
    const remaining = jokes.length - 1 - currentIndex; // jokes left after current
    if (remaining <= 10 && fetchedRef.current < totalCount && !loadingMore) {
      loadMore();
    }
  }, [currentIndex, jokes.length, totalCount, loadMore, loadingMore]);

  // ── Subscribe to realtime ───────────────────────────────────────────────────
  useEffect(() => {
    loadJokes();
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: '*', table: 'jokes', schema: 'public' }, loadJokes)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadJokes]);

  // ── Streak ──────────────────────────────────────────────────────────────────
  useEffect(() => { setStreak(loadStreak().count); }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = useCallback((dir) => {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setQueueLimit(5);
    if (dir === 'next') {
      setCurrentIndex(i => Math.min(i + 1, jokes.length - 1));
    } else {
      setCurrentIndex(i => Math.max(i - 1, 0));
    }
    setStreak(bumpStreak());
  }, [jokes.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next');
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate('prev');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const currentJoke      = jokes[currentIndex];
  const allNextUp        = jokes.slice(currentIndex + 1);
  const nextUpJokes      = allNextUp.slice(0, queueLimit);
  const hasMoreInQueue   = allNextUp.length > queueLimit;
  const hasMoreInDB      = fetchedRef.current < totalCount;
  const loadedCount      = jokes.length;

  return (
    <>
      <Nav />
      <div className="page-wrapper">
        <div className="show-stage">

          {/* ── Show header ── */}
          <div className="show-header">
            <div className="show-header-left">
              <div className="show-mic-icon"><Mic size={18} /></div>
              <div>
                <h1 className="show-title">
                  <span className="hero-title-gradient">The Dad Joke Show</span>
                </h1>
                <p className="show-subtitle">Late-night laughs, curated by the community</p>
              </div>
            </div>

            {/* Streak counter */}
            <div className="streak-badge" title="Jokes viewed today keep your streak alive!">
              <span className="streak-flame">🔥</span>
              <div>
                <div className="streak-number">{streak}</div>
                <div className="streak-label">day streak</div>
              </div>
            </div>
          </div>

          {/* ── Sort tabs + joke count pill ── */}
          <div className="show-sort-row">
            <div className="feed-tabs">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`feed-tab ${sortBy === key ? 'active' : ''}`}
                  onClick={() => { setSortBy(key); setCurrentIndex(0); }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Pill — click to load all */}
            {loadedCount > 0 && (
              <button
                className={`joke-count-pill ${loadingMore ? 'loading' : ''} ${!hasMoreInDB ? 'complete' : ''}`}
                onClick={hasMoreInDB ? loadMore : undefined}
                title={hasMoreInDB ? `${loadedCount} loaded · click to fetch more` : 'All jokes loaded'}
                disabled={loadingMore || !hasMoreInDB}
              >
                {loadingMore
                  ? <><Loader2 size={12} className="pill-spinner" /> Loading…</>
                  : hasMoreInDB
                    ? <>{loadedCount} / {totalCount} JOKES</>
                    : <>{loadedCount} JOKES ✓</>
                }
              </button>
            )}
          </div>

          {/* ── Main content: featured card + queue ── */}
          <div className="show-main-layout">

            {/* Featured card */}
            <div className="show-featured-col">
              {loading ? (
                <div className="show-card">
                  <div className="show-card-stage-bar">
                    <span className="show-live-dot" />
                    <span className="show-stage-label">LOADING…</span>
                  </div>
                  <div className="skeleton" style={{ height: '140px', margin: '1.5rem', borderRadius: '12px' }} />
                  <div className="skeleton" style={{ height: '40px', margin: '0 1.5rem 1.5rem', borderRadius: '8px' }} />
                </div>
              ) : jokes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">😅</div>
                  <h3 className="empty-state-title">No jokes yet!</h3>
                  <p className="empty-state-text">Generate some or submit your own.</p>
                </div>
              ) : (
                <ShowCard
                  key={`${currentJoke.id}-${animKey}`}
                  joke={currentJoke}
                  onUpdate={loadJokes}
                  onPrev={() => navigate('prev')}
                  onNext={() => navigate('next')}
                  hasPrev={currentIndex > 0}
                  hasNext={currentIndex < jokes.length - 1}
                  position={currentIndex + 1}
                  total={loadedCount}
                  slideDir={direction}
                />
              )}

              {jokes.length > 1 && (
                <p className="show-keyboard-hint">← → arrow keys to navigate</p>
              )}
            </div>

            {/* Next Up queue */}
            {nextUpJokes.length > 0 && (
              <div className="show-queue-col">
                <div className="show-queue-header">
                  <ChevronRight size={14} />
                  Next Up
                  <span className="show-queue-total">{allNextUp.length} remaining</span>
                </div>
                <div className="show-queue">
                  {nextUpJokes.map((j, idx) => (
                    <button
                      key={j.id}
                      className="show-queue-item"
                      onClick={() => {
                        setDirection('next');
                        setAnimKey(k => k + 1);
                        setCurrentIndex(currentIndex + 1 + idx);
                        setQueueLimit(5);
                        setStreak(bumpStreak());
                      }}
                    >
                      <div className="show-queue-num">{currentIndex + 2 + idx}</div>
                      <div className="show-queue-text">{j.content.slice(0, 80)}{j.content.length > 80 ? '…' : ''}</div>
                      <div className="show-queue-score">👍 {j.upvotes || 0}</div>
                    </button>
                  ))}
                </div>

                {/* Show more from already-fetched list */}
                {hasMoreInQueue && (
                  <button
                    className="show-queue-load-more"
                    onClick={() => setQueueLimit(l => l + 5)}
                  >
                    Show more ({allNextUp.length - queueLimit} in queue)
                  </button>
                )}

                {/* Fetch more from DB */}
                {!hasMoreInQueue && hasMoreInDB && (
                  <button
                    className="show-queue-load-more"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? <><Loader2 size={12} className="pill-spinner" /> Fetching…</>
                      : `Fetch more from library (${totalCount - loadedCount} left)`
                    }
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        <footer className="footer">
          <div className="container">
            <p>Made with 😂 and ☕ — <a href="/generate">Generate more jokes</a></p>
          </div>
        </footer>
      </div>
    </>
  );
}
