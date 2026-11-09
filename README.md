# StatSEGPA

**StatSEGPA** est une application locale pour consolider et présenter les résultats des élèves de 3e SEGPA au **DNB série professionnelle** et au **CFG**.

Elle fonctionne dans un navigateur, avec une interface React/TypeScript et un **fichier HTML autonome** (`StatSEGPA_Portable.html`). Le projet est développé pour répondre à un besoin concret de suivi d'un réseau d'établissements ; il ne nécessite actuellement ni compte utilisateur, ni serveur applicatif.

> **Données d'exemple :** les sessions 2024, 2025 et 2026 initialement fournies sont fictives. Elles ne constituent pas des résultats officiels. Remplacez-les par des chiffres vérifiés avant toute diffusion.

## Fonctionnalités disponibles

- Saisie des effectifs et des résultats DNB professionnel / CFG par établissement.
- Quatre mentions DNB : Assez Bien, Bien, Très Bien et Très Bien avec félicitations du jury (TBF). Pourcentage de chaque catégorie parmi les mentions dans le bilan.
- Contrôles des incohérences : inscrits, présents, admis, refusés et mentions.
- Distinction entre un examen **non renseigné (N.R.)** et un vrai résultat à **0 %**.
- Bassins géographiques configurables, couleurs par collège et filtres.
- Indicateurs agrégés pondérés par les effectifs ; affichage du nombre d'établissements renseignés.
- Sessions annuelles distinctes, sélection/création d'années et comparaison historique.
- Déclarations d'enseignants **enregistrées localement**, puis revue et validation.
- Prévisualisation avant remplacement des établissements lors d'un import Excel.
- Export Excel, sauvegarde/restauration JSON de **toutes les sessions** et rapport imprimable.
- Diaporama personnalisable et export PowerPoint (.pptx).
- Version HTML autonome destinée à être transmise à un utilisateur.

Les pourcentages agrégés reposent uniquement sur les établissements dont les résultats de l'examen concerné sont renseignés. L'effectif global du réseau est affiché séparément de l'effectif servant de dénominateur aux taux.

## Démarrer en développement

Prérequis : **Node.js 22**, npm et Git (versions utilisées par la CI). Depuis la racine du dépôt :

```powershell
npm ci
npm run dev
```

Vite indique alors l'adresse de développement à ouvrir dans le navigateur.

Pour contrôler et produire la version distribuable :

```powershell
npm test
npm run build
```

`npm test` exécute les tests de non-régression des calculs et des formats de données. `npm run build` exécute TypeScript, construit l'application avec Vite et **régénère automatiquement** `StatSEGPA_Portable.html` à partir de `dist/index.html`.

Le fichier `StatSEGPA_Portable.html` est destiné à une ouverture autonome dans un navigateur moderne. Les tests automatisés le servent toutefois via HTTP local ; une vérification manuelle en ouverture directe (`file://`) sur le poste cible reste recommandée.

## Guide d'utilisation

### Années, établissements et données manquantes

Sélectionnez une **Session** dans l'en-tête. Le bouton `+` crée une année vide. Chaque année conserve ses propres établissements et ses déclarations. L'onglet **Historique** compare les taux de présentation au DNB et les réussites DNB/CFG avec indication des établissements renseignés.

En **Saisie Tableur**, modifiez les résultats et cochez **Renseigné** lorsque les données sont connues, y compris si le nombre de candidats admis est réellement nul. Une saisie en cours peut présenter des valeurs momentanément incohérentes : elle reste récupérable par sauvegarde JSON, mais les rapports et exports de présentation sont bloqués jusqu'à correction.

### Sauvegarde et restauration

**Avant toute manipulation importante**, utilisez **Excel > Sauvegarder toutes les années (JSON)**. Cette sauvegarde contient les sessions, les bassins, les établissements, les déclarations et l'année active.

**Excel > Restaurer toutes les années (JSON)** remplace les sessions locales après confirmation. Le format est vérifié avant restauration. Une sauvegarde de travail contenant des chiffres métier provisoirement incohérents reste restaurable ; les contrôles bloquent leur publication, pas leur récupération.

Les anciens JSON d'une seule année restent acceptés sur la session active après confirmation.

**Import Excel :** seules les données des établissements de l'année active sont remplacées, après prévisualisation et confirmation. Les autres années ne sont pas touchées. Les champs d'un examen marqué comme renseigné doivent être présents ; les champs absents ne sont pas transformés silencieusement en vrais zéros. Pour un examen encore incomplet, renseignez explicitement `DNB_Renseigne=NON` ou `CFG_Renseigne=NON` dans la feuille `Donnees_StatSEGPA`.

**Attention :** un export Excel n'est **pas** une sauvegarde intégrale des années ou des déclarations en attente. Utilisez le JSON pour conserver l'ensemble du travail.

### Diaporama et rapport

Le **Rapport** présente les données de la session et du bassin sélectionnés, en mode papier ou sombre. Une anomalie métier est signalée avant impression. Le diaporama propose des réglages de titres et le choix des diapositives, ainsi qu'un export PPTX. Vérifiez les intitulés et la couverture des établissements avant diffusion externe.

## Confidentialité et limites

- Les données et préférences sont conservées dans le **stockage local du navigateur** (`localStorage`).
- Deux navigateurs, appareils ou profils n'ont **pas** une base commune. La « déclaration collègue » et sa validation ne constituent pas une collaboration réseau ; l'échange entre appareils exige un fichier exporté/importé.
- Le nettoyage du stockage local, un changement de profil ou un dysfonctionnement du navigateur peuvent entraîner une perte des données non sauvegardées.
- Une erreur de sauvegarde locale doit déclencher un avertissement ; en cas d'alerte, réalisez un export JSON.
- N'enregistrez pas de données personnelles d'élèves sans analyse et encadrement adaptés. Le stockage local **ne constitue pas** une certification RGPD, RGAA ou WCAG.

## Structure technique

| Élément | Rôle |
|---|---|
| `src/App.tsx` | État de la session, sélection de l'année, stockage local et navigation |
| `src/types.ts` | Modèles des examens, établissements, déclarations et statistiques |
| `src/utils/calculations.ts` | Calculs des taux et agrégations |
| `src/utils/dataIntegrity.ts` | Anomalies bloquant la publication |
| `src/utils/backup.ts` | Validation structurelle et sauvegarde JSON |
| `src/utils/excel.ts` | Import/export Excel |
| `src/utils/submissionMatching.ts` | Rapprochement non ambigu des déclarations |
| `src/components/` | Tableur, tableaux de bord, historique, rapport et présentation |
| `tests/` et `e2e/` | Tests unitaires et parcours navigateur |
| `scripts/sync-portable.mjs` | Synchronisation de l'HTML autonome lors du build |

## Qualité et contribution

La CI GitHub Actions sur `main` et les branches `fix/**` exécute : installation reproductible (`npm ci`), tests unitaires, compilation, tests Chromium sur les deux variantes (Vite et HTML portable servi localement), puis génération de l'artefact portable.

L'ouverture directe du fichier portable et l'ouverture d'un PPTX dans LibreOffice/PowerPoint doivent encore faire l'objet d'une recette manuelle.

**Ne fusionnez pas une branche dont la CI échoue.** Ne contournez pas les tests, TypeScript ni l'audit de sécurité pour obtenir artificiellement un résultat vert.

La séparation entre les fonctionnalités présentes, les améliorations prévues et les idées futures est documentée dans [ROADMAP.md](ROADMAP.md).
