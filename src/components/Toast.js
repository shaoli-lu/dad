'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ type = 'success', message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? <CheckCircle size={16} color="#22c55e" /> : <AlertCircle size={16} color="#ef4444" />}
      {message}
    </div>
  );
}
