'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Send, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getFingerprint } from '@/lib/fingerprint';
import { fireSmallConfetti } from '@/lib/confetti';

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

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function JokeCard({ joke, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [localUpvotes, setLocalUpvotes] = useState(joke.upvotes || 0);
  const [localDownvotes, setLocalDownvotes] = useState(joke.downvotes || 0);

  // Check if user already voted
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

  const handleVote = async (voteType, e) => {
    const fp = getFingerprint();
    
    if (userVote === voteType) {
      // Remove vote
      await supabase.from('votes').delete().eq('joke_id', joke.id).eq('voter_fingerprint', fp);
      
      if (voteType === 'up') {
        await supabase.from('jokes').update({ upvotes: localUpvotes - 1 }).eq('id', joke.id);
        setLocalUpvotes(prev => prev - 1);
      } else {
        await supabase.from('jokes').update({ downvotes: localDownvotes - 1 }).eq('id', joke.id);
        setLocalDownvotes(prev => prev - 1);
      }
      setUserVote(null);
      return;
    }

    // If switching vote, remove old one
    if (userVote) {
      await supabase.from('votes').delete().eq('joke_id', joke.id).eq('voter_fingerprint', fp);
      if (userVote === 'up') {
        await supabase.from('jokes').update({ upvotes: localUpvotes - 1 }).eq('id', joke.id);
        setLocalUpvotes(prev => prev - 1);
      } else {
        await supabase.from('jokes').update({ downvotes: localDownvotes - 1 }).eq('id', joke.id);
        setLocalDownvotes(prev => prev - 1);
      }
    }

    // Add new vote
    await supabase.from('votes').insert({
      joke_id: joke.id,
      voter_fingerprint: fp,
      vote_type: voteType,
    });

    if (voteType === 'up') {
      await supabase.from('jokes').update({ upvotes: localUpvotes + 1 }).eq('id', joke.id);
      setLocalUpvotes(prev => prev + 1);
      // Fire confetti on upvote
      const rect = e.target.getBoundingClientRect();
      fireSmallConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
    } else {
      await supabase.from('jokes').update({ downvotes: localDownvotes + 1 }).eq('id', joke.id);
      setLocalDownvotes(prev => prev + 1);
    }

    setUserVote(voteType);
  };

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('joke_id', joke.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
  }, [joke.id]);

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) loadComments();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({
        joke_id: joke.id,
        author_name: commentAuthor.trim() || 'Anonymous',
        content: commentText.trim(),
        is_approved: true, // Auto-approve for now, can be moderated later
      });

      if (error) throw error;
      setCommentText('');
      setCommentAuthor('');
      loadComments();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const commentCount = joke.comment_count || comments.length;

  return (
    <div className="joke-card animate-fade-in-up">
      <div className="joke-card-header">
        <div className="joke-card-author">
          <div className="joke-card-avatar">{getInitials(joke.author_name || 'AN')}</div>
          <div>
            <div className="joke-card-author-name">{joke.author_name || 'Anonymous'}</div>
            <div className="joke-card-time">
              <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {timeAgo(joke.created_at)}
            </div>
          </div>
        </div>
        <span className={`joke-card-source ${joke.source}`}>
          {joke.source === 'api' ? '🤖 API' : '✍️ User'}
        </span>
      </div>

      <p className="joke-card-content">{joke.content}</p>

      <div className="joke-card-footer">
        <div className="joke-card-actions">
          <button
            className={`vote-btn ${userVote === 'up' ? 'upvoted' : ''}`}
            onClick={(e) => handleVote('up', e)}
            title="Upvote"
          >
            <ThumbsUp size={16} />
            {localUpvotes}
          </button>
          <button
            className={`vote-btn ${userVote === 'down' ? 'downvoted' : ''}`}
            onClick={(e) => handleVote('down', e)}
            title="Downvote"
          >
            <ThumbsDown size={16} />
            {localDownvotes}
          </button>
        </div>
        <button className="comment-btn" onClick={toggleComments}>
          <MessageCircle size={16} />
          {commentCount > 0 ? `${commentCount} comments` : 'Comment'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section animate-fade-in">
          {comments.map((comment) => (
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
              No comments yet. Be the first to comment!
            </p>
          )}

          <form className="comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              className="comment-input"
              placeholder="Your name (optional)"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              style={{ maxWidth: '120px' }}
            />
            <input
              type="text"
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
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
