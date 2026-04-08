// Admin Dark Theme Constants
// Import this in all admin pages instead of defining colors locally

export const C = {
  bg: '#1C1F2E',
  bgSoft: '#222639',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardHover: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  borderGlass: 'rgba(255,255,255,0.12)',

  teal: '#2DD4B8',
  tealDim: '#2A9D8F',
  tealGlow: 'rgba(45,212,184,0.20)',
  tealSoft: 'rgba(45,212,184,0.08)',

  gold: '#F0C95C',
  goldGlow: 'rgba(240,201,92,0.15)',
  goldSoft: 'rgba(240,201,92,0.08)',

  coral: '#F07067',
  coralGlow: 'rgba(240,112,103,0.12)',

  purple: '#A78BDB',
  purpleGlow: 'rgba(167,139,219,0.12)',

  cream: '#F2EDE4',
  textPrimary: '#F2EDE4',
  textSecondary: 'rgba(242,237,228,0.55)',
  textMuted: 'rgba(242,237,228,0.28)',
};

// Re-export individual constants for backward compatibility
export const TEXT_PRIMARY = C.textPrimary;
export const TEXT_SECONDARY = C.textSecondary;
export const TEXT_MUTED = C.textMuted;
export const TEAL = C.teal;
export const CORAL = C.coral;
export const GOLD = C.gold;
export const PURPLE = C.purple;
