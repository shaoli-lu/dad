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
                <Bookmark size={20} />
              </div>
              <div className="help-content">
                <h4>Curated Jokes</h4>
                <p>The main stage! Enjoy a late-night show experience with auto-read narration, suspenseful punchline reveals, and community voting.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Send size={20} />
              </div>
              <div className="help-content">
                <h4>Submit Jokes</h4>
                <p>Have a "terrible" joke of your own? Add it to our community library for others to enjoy and react to.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <MousePointerClick size={20} />
              </div>
              <div className="help-content">
                <h4>Generate Jokes</h4>
                <p>Need a quick laugh? Click or tap anywhere on the generation stage to instantly create a fresh, API-powered dad joke.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Heart size={20} />
              </div>
              <div className="help-content">
                <h4>Interact & React</h4>
                <p>Vote up or down, add emoji reactions in the comments, and keep your <b>Day Streak</b> alive by checking in daily.</p>
              </div>
            </div>

            <div className="help-item">
              <div className="help-icon">
                <Sparkles size={20} />
              </div>
              <div className="help-content">
                <h4>Keyboard Shortcuts</h4>
                <p>Navigate the show stage effortlessly using the <b>Left/Right</b> or <b>Up/Down</b> arrow keys on your keyboard.</p>
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
