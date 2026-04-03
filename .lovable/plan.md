

# Plan: Add Legal Pages (Privacy, Terms, Impressum)

## Summary
Create three new legal pages with full i18n support, add routes in App.tsx, and add footer links.

## What will be built

### 1. Three new page components
- `src/pages/PrivacyPolicy.tsx` — Standard privacy policy for a web agency
- `src/pages/TermsOfService.tsx` — Terms of service
- `src/pages/Impressum.tsx` — Austrian-law-compliant Impressum with: Creationation, Vienna Austria, Hello@creationation.app, web & mobile app development services

Each page will:
- Use `useLang()` for i18n (content in FR/EN/DE)
- Use existing design system (CSS variables for fonts/colors, same max-width/padding as other sections)
- Include a back-to-home link and the Nav/Footer components
- Have a clean, readable layout with proper headings and paragraphs

### 2. Translations (`src/lib/translations.ts`)
Add translation keys for:
- Page titles: "Privacy Policy", "Terms of Service", "Impressum"
- Footer link labels for all three pages
- All legal content in FR/EN/DE

### 3. Routes (`src/App.tsx`)
Add three new routes: `/privacy`, `/terms`, `/impressum`

### 4. Footer update (`src/components/Footer.tsx`)
Add a row of three links (Privacy Policy | Terms of Service | Impressum) between the logo and the copyright text, styled consistently with `var(--text-ghost)` color and hover effect.

## Files to create/modify
| File | Action |
|------|--------|
| `src/pages/PrivacyPolicy.tsx` | Create |
| `src/pages/TermsOfService.tsx` | Create |
| `src/pages/Impressum.tsx` | Create |
| `src/lib/translations.ts` | Add legal page translations |
| `src/App.tsx` | Add 3 routes |
| `src/components/Footer.tsx` | Add footer links |

