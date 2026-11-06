# StatSEGPA

Application locale React/Vite pour la consolidation des résultats DNB professionnel et CFG en SEGPA.

## Démarrer et vérifier

```powershell
npm ci
npm test
npm run build
```

Le build Vite produit `dist/index.html` et synchronise automatiquement `StatSEGPA_Portable.html`. Les deux versions utilisent le même code compilé.

## Données annuelles

- Les années 2024, 2025 et 2026 sont des **jeux d'exemple fictifs**.
- La sélection d'une année n'efface pas les autres. Le bouton `+` crée une année vide.
- Les données sont enregistrées dans le stockage local de chaque navigateur (aucun transfert automatique à un autre appareil).
- L'onglet **Historique** compare les années avec les mêmes indicateurs (DNB/CFG/présentation) et affiche la couverture des saisies.
- Un résultat **N.R.** (non renseigné) est distinct d'un **0 % réellement obtenu**. Cochez « Renseigné » pour chaque examen dans la saisie.

## Sauvegarde et échanges

- **Sauvegarde JSON globale** : conserve toutes les années, leurs déclarations, leurs régions et l'année active. La restauration demande confirmation et remplace toutes les années.
- Les anciennes sauvegardes JSON annuelles restent importables sur l'année active.
- **Excel** : échange les établissements de l'année courante. Une prévisualisation est obligatoire avant remplacement. Les déclarations en attente et les autres années ne sont pas modifiées.
- Exportez une sauvegarde globale avant les imports ou les réinitialisations importantes.

## Présentation et version portable

Le diaporama permet de personnaliser les titres, la conclusion et les diapositives visibles. L'export PPTX respecte le choix des diapositives. La version de l'application est affichée en pied de page.

Le fichier HTML portable peut être envoyé directement au collègue pour exécution dans un navigateur moderne. Chaque navigateur possède son propre stockage local, et les sauvegardes doivent être échangées manuellement.

## Qualité

- `npm test` : tests de calcul, de sauvegarde et d'import Excel.
- GitHub Actions : tests, build, puis tests Chromium sur Vite et sur le fichier HTML portable.
- Les captures du rapport papier sont jointes aux résultats Playwright.
- Le fait de stocker localement les données ne constitue pas une certification RGPD, RGAA ou WCAG.
