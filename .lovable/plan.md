

## Améliorations proposées pour rendre le site plus attirant

Après avoir parcouru l'ensemble du site, voici les axes d'amélioration identifiés :

### 1. Section FAQ avant le CTA final
Ajouter une section FAQ avec 5-6 questions fréquentes (délais, processus, paiement, maintenance). Ça rassure les prospects et réduit les frictions avant le passage à l'action. Format en accordéon avec le composant Radix déjà installé.

### 2. Compteurs animés dans le Hero
Les stats du hero (8+, 500+, etc.) sont statiques. Les animer avec un effet de comptage progressif quand la section apparait donnerait un effet "wow" et plus de dynamisme.

### 3. Ajout de "Tarifs" dans la navigation
Le lien vers la section pricing n'existe pas dans la nav ni le footer. Les visiteurs ne peuvent pas y accéder directement.

### 4. Section "Garanties" ou badges de confiance
Ajouter une petite bande entre le pricing et le CTA final avec des éléments de réassurance : "Satisfaction garantie", "Premier rendez-vous offert", "Paiement en plusieurs fois possible", "Support 7j/7". Ça renforce la crédibilité.

### 5. Hover et micro-interactions sur les boutons CTA
Les boutons principaux manquent d'animations au survol. Ajouter un léger scale + déplacement du texte ou de la flèche pour rendre les interactions plus vivantes.

### 6. Menu hamburger mobile
Sur mobile, les liens de navigation (Portfolio, Process, Services) sont masqués (`hidden md:flex`). Il n'y a aucun menu mobile, les utilisateurs ne peuvent naviguer que par scroll.

### Plan technique

- **FAQ** : Nouveau composant `FAQ.tsx` utilisant `@radix-ui/react-accordion` (déjà installé). Traductions FR/EN/DE dans `translations.ts`. Inséré entre Pricing et CtaSection.
- **Compteurs animés** : Hook `useCountUp` dans Hero, déclenché par `IntersectionObserver`.
- **Nav "Tarifs"** : Ajout dans `Nav.tsx` et `Footer.tsx`.
- **Garanties** : Nouveau composant `Guarantees.tsx` avec 4 icones et textes courts, entre Pricing et CTA.
- **Micro-interactions** : CSS animations sur les boutons CTA du Hero et du CTA final.
- **Menu mobile** : Ajout d'un bouton hamburger et d'un drawer/sheet pour la navigation mobile dans `Nav.tsx`.

