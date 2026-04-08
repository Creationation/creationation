// Admin Dark Theme Constants
// Import this in all admin pages instead of defining colors locally

export const C = {
  bg: '#2C2F3E',
  bgSoft: '#343849',
  bgCard: 'rgba(255,255,255,0.08)',
  bgCardHover: 'rgba(255,255,255,0.13)',
  border: 'rgba(255,255,255,0.10)',
  borderHover: 'rgba(255,255,255,0.18)',
  borderGlass: 'rgba(255,255,255,0.14)',

  teal: '#2DD4B8',
  tealDim: '#2A9D8F',
  tealGlow: 'rgba(45,212,184,0.22)',
  tealSoft: 'rgba(45,212,184,0.10)',

  gold: '#F0C95C',
  goldGlow: 'rgba(240,201,92,0.18)',
  goldSoft: 'rgba(240,201,92,0.10)',

  coral: '#F07067',
  coralGlow: 'rgba(240,112,103,0.15)',

  purple: '#A78BDB',
  purpleGlow: 'rgba(167,139,219,0.15)',

  cream: '#F5F0E8',
  textPrimary: '#F5F0E8',
  textSecondary: 'rgba(245,240,232,0.65)',
  textMuted: 'rgba(245,240,232,0.38)',
};

// Re-export individual constants for backward compatibility
export const TEXT_PRIMARY = C.textPrimary;
export const TEXT_SECONDARY = C.textSecondary;
export const TEXT_MUTED = C.textMuted;
export const TEAL = C.teal;
export const CORAL = C.coral;
export const GOLD = C.gold;
export const PURPLE = C.purple;
