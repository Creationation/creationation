

## Problème

Les coins arrondis du bas de la vidéo hero ne sont plus visibles. Cela vient du fait que le `borderRadius: 28` est appliqué sur le conteneur, mais les débordements négatifs (top, left, right) poussent les coins arrondis hors de l'écran — ce qui est voulu pour le haut et les côtés. Par contre, le bas doit conserver ses coins arrondis visibles.

## Solution

Remplacer le `borderRadius: 28` uniforme par un border-radius ciblé : `0` en haut (les coins sont déjà cachés hors écran) et `28px` uniquement en bas-gauche et bas-droite.

## Changement

**`src/components/Hero.tsx`** — Modifier le style du conteneur vidéo :
- Remplacer `borderRadius: 28` par `borderRadius: '0 0 28px 28px'` pour n'arrondir que les coins du bas.

