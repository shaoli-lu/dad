'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Check, X, Trash2, MessageSquare, Lock, LogOut, RefreshCw } from 'lucide-react';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabase';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('pending-jokes');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalJokes: 0,
    pendingJokes: 0,
    totalComments: 0,
    pendingComments: 0,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const loadStats = useCallback(async () => {
    const [jokesRes, pendingJokesRes, commentsRes, pendingCommentsRes] = await Promise.all([
      supabase.from('jokes').select('id', { count: 'exact', head: true }),
      supabase.from('jokes').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    ]);

    setStats({
      totalJokes: jokesRes.count || 0,
      pendingJokes: pendingJokesRes.count || 0,
      totalComments: commentsRes.count || 0,
      pendingComments: pendingCommentsRes.count || 0,
    });
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    let query;

    switch (activeTab) {
      case 'pending-jokes':
        query = supabase.from('jokes').select('*').eq('is_approved', false).order('created_at', { ascending: false });
        break;
      case 'all-jokes':
        query = supabase.from('jokes').select('*').order('created_at', { ascending: false });
        break;
      case 'pending-comments':
        query = supabase.from('comments').select('*').eq('is_approved', false).order('created_at', { ascending: false });
        break;
      case 'all-comments':
        query = supabase.from('comments').select('*').order('created_at', { ascending: false });
        break;
      default:
        query = supabase.from('jokes').select('*').eq('is_approved', false).order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(100);
    if (error) {
      console.error('Failed to load items:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (authenticated) {
      loadStats();
      loadItems();
    }
  }, [authenticated, loadStats, loadItems]);

  const handleApprove = async (id, table) => {
    const { error } = await supabase.from(table).update({ is_approved: true }).eq('id', id);
    if (error) {
      setToast({ type: 'error', message: 'Failed to approve' });
    } else {
      setToast({ type: 'success', message: '✅ Approved!' });
      loadItems();
      loadStats();
    }
  };

  const handleReject = async (id, table) => {
    const { error } = await supabase.from(table).update({ is_approved: false }).eq('id', id);
    if (error) {
      setToast({ type: 'error', message: 'Failed to reject' });
    } else {
      setToast({ type: 'success', message: '❌ Rejected' });
      loadItems();
      loadStats();
    }
  };

  const handleDelete = async (id, table) => {
    if (!window.confirm('Are you sure you want to permanently delete this?')) return;
    
    // If deleting a joke, also delete its comments and votes
    if (table === 'jokes') {
      await supabase.from('comments').delete().eq('joke_id', id);
      await supabase.from('votes').delete().eq('joke_id', id);
    }
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      setToast({ type: 'error', message: 'Failed to delete' });
    } else {
      setToast({ type: 'success', message: '🗑️ Deleted' });
      loadItems();
      loadStats();
    }
  };

  const isJokesTab = activeTab.includes('jokes');
  const tableName = isJokesTab ? 'jokes' : 'comments';

  if (!authenticated) {
    return (
      <>
        <Nav />
        <div className="page-wrapper">
          <div className="admin-login">
            <div className="admin-login-card">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Shield size={40} color="var(--amber-400)" />
              </div>
              <h1 className="admin-login-title">Moderation Panel</h1>
              <p className="admin-login-subtitle">Enter the admin password to continue</p>
              
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {loginError && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.813rem', marginTop: '0.5rem' }}>
                      {loginError}
                    </p>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Access Panel
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="page-wrapper">
        <div className="container">
          <div className="admin-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h1 className="section-title">
                  <Shield size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--amber-400)' }} />
                  <span className="hero-title-gradient">Moderation</span>
                </h1>
                <p className="section-subtitle">Manage jokes and comments</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { loadItems(); loadStats(); }}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAuthenticated(false)}>
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-card-value">{stats.totalJokes}</div>
                <div className="stat-card-label">Total Jokes</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: stats.pendingJokes > 0 ? 'var(--amber-400)' : 'var(--text-muted)' }}>
                  {stats.pendingJokes}
                </div>
                <div className="stat-card-label">Pending Jokes</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{stats.totalComments}</div>
                <div className="stat-card-label">Total Comments</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: stats.pendingComments > 0 ? 'var(--amber-400)' : 'var(--text-muted)' }}>
                  {stats.pendingComments}
                </div>
                <div className="stat-card-label">Pending Comments</div>
              </div>
            </div>

            <div className="admin-tabs">
              {[
                { key: 'pending-jokes', label: `Pending Jokes (${stats.pendingJokes})` },
                { key: 'all-jokes', label: 'All Jokes' },
                { key: 'pending-comments', label: `Pending Comments (${stats.pendingComments})` },
                { key: 'all-comments', label: 'All Comments' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`admin-tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {key.includes('comments') && <MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />}
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✨</div>
                <h3 className="empty-state-title">All clear!</h3>
                <p className="empty-state-text">Nothing to moderate right now.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="admin-item">
                  <div className="admin-item-content">
                    <p className="admin-item-text">{item.content}</p>
                    <div className="admin-item-meta">
                      <span>By {item.author_name || 'Anonymous'}</span>
                      <span> · {timeAgo(item.created_at)}</span>
                      {item.is_approved !== undefined && (
                        <span> · <span className={`badge ${item.is_approved ? 'badge-approved' : 'badge-pending'}`}>
                          {item.is_approved ? 'Approved' : 'Pending'}
                        </span></span>
                      )}
                      {item.source && <span> · {item.source === 'api' ? '🤖 API' : '✍️ User'}</span>}
                    </div>
                  </div>
                  <div className="admin-item-actions">
                    {!item.is_approved && (
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(item.id, tableName)} title="Approve">
                        <Check size={14} />
                      </button>
                    )}
                    {item.is_approved && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleReject(item.id, tableName)} title="Unapprove">
                        <X size={14} />
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, tableName)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="footer">
          <div className="container">
            <p>Moderation Panel — Handle with care 🛡️</p>
          </div>
        </footer>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
