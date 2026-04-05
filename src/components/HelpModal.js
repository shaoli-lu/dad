'use client';

import { X, MousePointerClick, Sparkles, Bookmark, Send, Heart } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">How to Use Dad Jokes</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="help-list">
            <div className="help-item">
              <div className="help-icon">
                <MousePointerClick size={20} />
              </div>
              <div className="help-content">
                <h4>Click Anywhere</h4>
                <p>Tap any empty space on the home screen to generate a fresh, groan-worthy dad joke instantly.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Sparkles size={20} />
              </div>
              <div className="help-content">
                <h4>Confetti Celebration</h4>
                <p>Every new joke is a celebration! Watch the confetti burst as you find your new favorite pun.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Bookmark size={20} />
              </div>
              <div className="help-content">
                <h4>Community Vault</h4>
                <p>Found a legendary joke? Save it to our community vault for everyone to see and react to.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Send size={20} />
              </div>
              <div className="help-content">
                <h4>Submit Your Own</h4>
                <p>Have a "terrible" joke of your own? Use the Submit page to add it to the collection.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Heart size={20} />
              </div>
              <div className="help-content">
                <h4>Interact with Others</h4>
                <p>Browse the Community feed to vote on and comment on jokes submitted by other dad-joke enthusiasts.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it, Dad!
          </button>
        </div>
      </div>
    </div>
  );
}
