'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Volume2, VolumeX, ChevronRight, ChevronLeft, MessageCircle, Send, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getFingerprint } from '@/lib/fingerprint';
import { fireSmallConfetti } from '@/lib/confetti';

// ── helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getInitials(name = 'AN') {
  if (name.includes('DadBot')) return 'DB';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// Split a joke into setup + punchline using common patterns
function splitJoke(content) {
  const patterns = [
    /(.+?[.?!])\s*[""]?([^.?!]+[.?!]?)$/s,   // sentence break
    /(.+?)\s*[-–—]\s*(.+)/s,                    // dash separator
  ];
  for (const pattern of patterns) {
    const m = content.match(pattern);
    if (m && m[1].length > 10 && m[2].length > 4) {
      return { setup: m[1].trim(), punchline: m[2].trim() };
    }
  }
  // Fallback – treat first 60% as setup
  const split = Math.floor(content.length * 0.6);
  const breakAt = content.lastIndexOf(' ', split);
  return {
    setup: content.slice(0, breakAt).trim(),
    punchline: content.slice(breakAt).trim(),
  };
}

const REACTIONS = [
  { emoji: '😂', label: 'lol' },
  { emoji: '🤣', label: 'dying' },
  { emoji: '😆', label: 'haha' },
  { emoji: '🙄', label: 'eye roll' },
  { emoji: '👏', label: 'clap' },
  { emoji: '💀', label: 'ded' },
];

// ── ShowCard ───────────────────────────────────────────────────────────────────
export default function ShowCard({ joke, onUpdate, onPrev, onNext, hasPrev, hasNext, position, total }) {
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [started, setStarted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [localUpvotes, setLocalUpvotes] = useState(joke.upvotes || 0);
  const [localDownvotes, setLocalDownvotes] = useState(joke.downvotes || 0);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const synthRef = useRef(null);
  const cardRef = useRef(null);

  const { setup, punchline } = splitJoke(joke.content);

  // reset when joke changes
  useEffect(() => {
    setRevealed(false);
    setStarted(false);
    setSpeaking(false);
    if (synthRef.current) window.speechSynthesis?.cancel();
  }, [joke.id]);

  // Check existing vote
  useEffect(() => {
    const checkVote = async () => {
      const fp = getFingerprint();
      const { data } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('joke_id', joke.id)
        .eq('voter_fingerprint', fp)
        .maybeSingle();
      if (data) setUserVote(data.vote_type);
    };
    checkVote();
  }, [joke.id]);

  // ── voice narration ──────────────────────────────────────────────────────────
  // Voice preference order – first match wins
  const VOICE_PREFS = [
    'Google US English',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Zira - English (United States)',
    'Alex',          // macOS
    'Samantha',      // macOS / iOS
    'Karen',         // macOS / iOS
  ];

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    
    // 1. Try preferred list first
    for (const pref of VOICE_PREFS) {
      const v = voices.find(v => v.name === pref);
      if (v) return v;
    }
    
    // 2. Try to find any "Natural" voice in Edge/Chrome
    const natural = voices.find(v => v.name.toLowerCase().includes('natural') && v.lang.startsWith('en'));
    if (natural) return natural;

    // 3. Fall back to any en-US voice
    const enUS = voices.filter(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('compact'));
    if (enUS.length) return enUS[0];
    
    return voices.find(v => v.lang.startsWith('en')) || null;
  }

  function makeUtterance(text, { rate = 1.0, pitch = 1.0, voice } = {}) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;
    if (voice) u.voice = voice;
    return u;
  }

  // Fix for Edge/Chrome garbage collection bug where speech stops unexpectedly
  const currentUtterances = useRef([]);

  const startNarration = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    setStarted(true);

    const go = () => {
      // Small delay after cancel for Edge to clear its internal state
      setTimeout(() => {
        synth.resume(); 
        const voice = pickVoice();
        currentUtterances.current = [];

        // ── Warm-up ──
        const warmup = makeUtterance(' ', { voice });
        warmup.volume = 0;
        
        // ── Setup ──
        // Using 1.0 rate/pitch for Edge for maximum clarity
        const u1 = makeUtterance(setup, { rate: 1.0, pitch: 1.0, voice });
        
        // ── Punchline ──
        const u2 = makeUtterance(punchline, { rate: 0.95, pitch: 1.0, voice });

        currentUtterances.current = [warmup, u1, u2];

        warmup.onend = () => {
          setTimeout(() => synth.speak(u1), 50);
        };

        u1.onstart = () => setSpeaking(true);
        u1.onend = () => {
          setTimeout(() => {
            setRevealed(true);
            synth.speak(u2);
          }, 900);
        };

        u2.onend = () => {
          setSpeaking(false);
          currentUtterances.current = [];
        };

        synth.speak(warmup);
      }, 100);
    };

    const voices = synth.getVoices();
    if (voices.length) {
      go();
    } else {
      synth.addEventListener('voiceschanged', go, { once: true });
    }
  };

  const stopNarration = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // ── voting ───────────────────────────────────────────────────────────────────
  const handleVote = async (voteType, e) => {
    const fp = getFingerprint();
    if (userVote === voteType) {
      await supabase.from('votes').delete().eq('joke_id', joke.id).eq('voter_fingerprint', fp);
      if (voteType === 'up') {
        await supabase.from('jokes').update({ upvotes: localUpvotes - 1 }).eq('id', joke.id);
        setLocalUpvotes(p => p - 1);
      } else {
        await supabase.from('jokes').update({ downvotes: localDownvotes - 1 }).eq('id', joke.id);
        setLocalDownvotes(p => p - 1);
      }
      setUserVote(null);
      return;
    }
    if (userVote) {
      await supabase.from('votes').delete().eq('joke_id', joke.id).eq('voter_fingerprint', fp);
      if (userVote === 'up') { await supabase.from('jokes').update({ upvotes: localUpvotes - 1 }).eq('id', joke.id); setLocalUpvotes(p => p - 1); }
      else { await supabase.from('jokes').update({ downvotes: localDownvotes - 1 }).eq('id', joke.id); setLocalDownvotes(p => p - 1); }
    }
    await supabase.from('votes').insert({ joke_id: joke.id, voter_fingerprint: fp, vote_type: voteType });
    if (voteType === 'up') {
      await supabase.from('jokes').update({ upvotes: localUpvotes + 1 }).eq('id', joke.id);
      setLocalUpvotes(p => p + 1);
      const rect = e.currentTarget.getBoundingClientRect();
      fireSmallConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
    } else {
      await supabase.from('jokes').update({ downvotes: localDownvotes + 1 }).eq('id', joke.id);
      setLocalDownvotes(p => p + 1);
    }
    setUserVote(voteType);
  };

  // ── reactions ────────────────────────────────────────────────────────────────
  const handleReaction = (emoji) => {
    setSelectedReaction(prev => {
      if (prev === emoji) {
        setReactionCounts(c => { const n = { ...c }; n[emoji] = Math.max(0, (n[emoji] || 1) - 1); return n; });
        return null;
      }
      if (prev) setReactionCounts(c => ({ ...c, [prev]: Math.max(0, (c[prev] || 1) - 1) }));
      setReactionCounts(c => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));
      return emoji;
    });
  };

  // ── comments ─────────────────────────────────────────────────────────────────
  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments').select('*').eq('joke_id', joke.id).eq('is_approved', true)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  }, [joke.id]);

  const toggleComments = () => {
    setShowComments(v => !v);
    if (!showComments) loadComments();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await supabase.from('comments').insert({
        joke_id: joke.id,
        author_name: commentAuthor.trim() || 'Anonymous',
        content: commentText.trim(),
        is_approved: true,
      });
      setCommentText('');
      setCommentAuthor('');
      loadComments();
    } finally {
      setSubmittingComment(false);
    }
  };

  const commentCount = joke.comment_count || comments.length;

  return (
    <div className="show-card animate-fade-in-up" ref={cardRef}>
      {/* ── Stage header ── */}
      <div className="show-card-stage-bar">
        <span className="show-live-dot" />
        <span className="show-stage-label">LIVE SHOW</span>
        <span className="show-position">{position} / {total}</span>
      </div>

      {/* ── Author strip ── */}
      <div className="show-card-author-row">
        <div className="show-card-avatar">{getInitials(joke.author_name || 'AN')}</div>
        <div>
          <div className="show-card-author-name">{joke.author_name || 'Anonymous'}</div>
          <div className="show-card-time">
            <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            {timeAgo(joke.created_at)}
          </div>
        </div>
        <span className={`joke-card-source ${joke.source}`} style={{ marginLeft: 'auto' }}>
          {joke.source === 'api' ? '🤖 API' : '✍️ User'}
        </span>
      </div>

      {/* ── Joke content ── */}
      <div className="show-joke-body">
        {/* Setup */}
        <p className="show-joke-setup">{setup}</p>

        {/* Punchline reveal */}
        {revealed ? (
          <p className="show-joke-punchline animate-punchline">{punchline}</p>
        ) : (
          <button className="punchline-reveal-btn" onClick={() => setRevealed(true)}>
            <span>🥁</span> Reveal Punchline
          </button>
        )}
      </div>

      {/* ── Voice controls ── */}
      <div className="show-voice-row">
        {!started ? (
          <button className="show-voice-btn start" onClick={startNarration} title="Auto-read this joke aloud">
            <Volume2 size={16} />
            Start Auto-Read
          </button>
        ) : speaking ? (
          <button className="show-voice-btn stop" onClick={stopNarration}>
            <VolumeX size={16} />
            Stop
          </button>
        ) : (
          <button className="show-voice-btn done" onClick={startNarration}>
            <Volume2 size={16} />
            Replay
          </button>
        )}
      </div>


      {/* ── Vote + navigation ── */}
      <div className="show-card-footer">
        <div className="show-vote-cluster">
          <button
            className={`show-vote-btn up ${userVote === 'up' ? 'active' : ''}`}
            onClick={(e) => handleVote('up', e)}
            title="Upvote"
          >
            <ThumbsUp size={18} />
            <span>{localUpvotes}</span>
          </button>
          <button
            className={`show-vote-btn down ${userVote === 'down' ? 'active' : ''}`}
            onClick={(e) => handleVote('down', e)}
            title="Downvote"
          >
            <ThumbsDown size={18} />
            <span>{localDownvotes}</span>
          </button>
        </div>

        <button className="show-comment-btn" onClick={toggleComments}>
          <MessageCircle size={16} />
          {commentCount > 0 ? `${commentCount} comments` : 'Comment'}
        </button>

        <div className="show-nav-btns">
          <button className="show-nav-btn" onClick={onPrev} disabled={!hasPrev} title="Previous joke">
            <ChevronLeft size={20} />
          </button>
          <button className="show-nav-btn" onClick={onNext} disabled={!hasNext} title="Next joke">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* ── Comments panel ── */}
      {showComments && (
        <div className="show-comments-section animate-fade-in">
          {/* Reactions inside comments */}
          <div className="show-reactions-inline">
            {REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                className={`reaction-btn ${selectedReaction === emoji ? 'active' : ''}`}
                onClick={() => handleReaction(emoji)}
                title={label}
              >
                <span className="reaction-emoji">{emoji}</span>
                {reactionCounts[emoji] > 0 && (
                  <span className="reaction-count">{reactionCounts[emoji]}</span>
                )}
              </button>
            ))}
          </div>
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">{getInitials(comment.author_name)}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{comment.author_name}</span>
                  <span className="comment-time">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              No comments yet. Be the first!
            </p>
          )}
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text" className="comment-input" placeholder="Your name (optional)"
              value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
              style={{ maxWidth: '120px' }}
            />
            <input
              type="text" className="comment-input" placeholder="Write a comment..."
              value={commentText} onChange={e => setCommentText(e.target.value)} required
            />
            <button type="submit" className="btn btn-primary btn-sm btn-icon" disabled={submittingComment}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
