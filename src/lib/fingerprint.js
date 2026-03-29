// Simple browser fingerprint to prevent duplicate votes
// Not bulletproof, but good enough for a fun app
export function getFingerprint() {
  if (typeof window === 'undefined') return 'server';
  
  let fp = localStorage.getItem('dad_jokes_fp');
  if (fp) return fp;
  
  // Generate a random fingerprint
  fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('dad_jokes_fp', fp);
  return fp;
}
