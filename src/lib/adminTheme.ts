// Admin Dark Theme Constants
// Import this in all admin pages instead of defining colors locally

export const C = {
  bg: '#454860',
  bgSoft: '#4A4D66',
  bgCard: 'rgba(255,255,255,0.10)',
  bgCardHover: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.12)',
  borderHover: 'rgba(255,255,255,0.20)',
  borderGlass: 'rgba(255,255,255,0.16)',

  teal: '#2DD4B8',
  tealDim: '#2A9D8F',
  tealGlow: 'rgba(45,212,184,0.25)',
  tealSoft: 'rgba(45,212,184,0.12)',

  gold: '#F0C95C',
  goldGlow: 'rgba(240,201,92,0.20)',
  goldSoft: 'rgba(240,201,92,0.12)',

  coral: '#F07067',
  coralGlow: 'rgba(240,112,103,0.18)',

  purple: '#A78BDB',
  purpleGlow: 'rgba(167,139,219,0.18)',

  cream: '#F5F0E8',
  textPrimary: '#2a2722',
  textSecondary: '#6b6560',
  textMuted: '#9a9490',
};

// Re-export individual constants for backward compatibility
export const TEXT_PRIMARY = C.textPrimary;
export const TEXT_SECONDARY = C.textSecondary;
export const TEXT_MUTED = C.textMuted;
export const TEAL = C.teal;
export const CORAL = C.coral;
export const GOLD = C.gold;
export const PURPLE = C.purple;
