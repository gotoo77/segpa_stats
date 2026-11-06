# ROADMAP - StatSEGPA

**Statut de ce document :** vision de développement, sans engagement de date.  
**Référence :** branche de travail `fix/data-integrity-review` et PR #1, non fusionnée dans `main` au moment de la rédaction.

L'objectif est un **outil métier autonome, vérifiable et facile à utiliser**. Les priorités privilégient l'intégrité des données et l'expérience d'un utilisateur réel. Pas de backend, de gestion de comptes ou de refonte d'architecture sans besoin démontré.

## 1. État actuel de la branche de travail

Fonctionnalités **implémentées** (à valider en recette avant fusion) :

- Saisie DNB professionnel / CFG, mentions, contrôles métier et taux agrégés.
- Gestion des établissements, bassins et couleurs personnalisées.
- Sessions annuelles indépendantes, avec comparaison historique.
- Distinction `N.R.` / vrai zéro et couverture des saisies.
- Sauvegarde globale JSON, restauration et import Excel avec confirmation.
- Récupération des brouillons au format JSON même si leurs résultats sont momentanément incohérents ; blocage des rapports définitifs tant que des anomalies subsistent.
- Rapprochement des déclarations par établissement et bassin, avec refus des homonymes ambigus.
- Rapport imprimable, diaporama paramétrable et export PPTX.
- Fichier HTML portable issu du même build que l'application.
- Tests unitaires, scénarios Chromium et automatisation de génération du portable.

**Important :** les données des sessions 2024, 2025 et 2026 livrées par défaut sont fictives. Les déclarations « collègue » restent sur le navigateur où elles sont saisies.

## 2. Avant fusion de la PR #1

| Vérification | Critère d'acceptation |
|---|---|
| Calculs et formats | `npm test` vert ; dénominateurs conformes aux seuls établissements renseignés |
| Restaurations JSON | Un export JSON de travail reste restaurable ; structure malformée rejetée ; aucune année ressuscitée |
| Import Excel | Aucun champ manquant d'un examen renseigné ne devient silencieusement zéro |
| Déclarations homonymes | Aucune déclaration ne peut modifier un collège homonyme du mauvais bassin |
| Rapport et diaporama | Anomalies visibles, export bloqué en cas de données incohérentes |
| Portable | CI verte, fichier synchronisé ; ouverture directe sur le poste utilisateur vérifiée manuellement |
| Présentation | Vérifier dans LibreOffice Impress / PowerPoint un PPTX produit par une session représentative |

Ne fusionner qu'après confirmation de la CI et d'une recette métier courte. Éviter tout refactoring annexe.

## 3. Court terme, après fusion

1. **Recette avec les données réelles.** Établir un jeu de vérification sur une année et un bassin, comparer manuellement les agrégats aux calculs attendus, et conserver un JSON de référence.
2. **Sécuriser l'autonomie.** Documenter et tester la sauvegarde/restauration entre deux navigateurs, l'ouverture `file://`, la récupération après nettoyage du stockage, et le comportement en cas de quota dépassé.
3. **Qualité des livrables.** Vérifier l'impression papier, le contraste et l'ouverture des PPTX. Réduire les différences de build dues à l'identifiant Git embarqué.
4. **Dépendances.** Examiner les avertissements `npm audit` sur `image-size` (via `pptxgenjs`) et effectuer uniquement une mise à jour compatible et testée.

## 4. Évolutions métier candidates (non implémentées)

### Granularité des statistiques

- Vue supplémentaire par collège, bassin et éventuellement lycée d'orientation, **si les données et leur définition existent**.
- Indicateurs paramétrables à partir de mesures réellement disponibles, avec dénominateurs et provenance explicités.
- Exports adaptés à une présentation de secteur ou d'inspection.

**Prérequis :** définir avec l'utilisateur quelles statistiques sont utiles et quelles données permettent effectivement de les calculer.

### Suivi de cohortes (piste V2, non implémentée)

Un suivi des cohortes ne se déduit **pas** de simples résultats annuels agrégés.

- Définir ce qu'est une cohorte (année de sortie, établissement, bassin).
- Déterminer quelles données de devenir/lycée sont effectivement disponibles et comparables.
- Définir une approche agrégée ou pseudonymisée selon la finalité et les obligations applicables.
- Vérifier la nécessité d'identifiants persistants, la durée de conservation et les droits d'accès **avant** tout développement.

**Critère de lancement :** un exemple métier validé et un modèle de données explicite. Aucun suivi nominatif d'élève n'est prévu à ce stade.

## 5. Hors périmètre actuel

- Base de données distante et synchronisation automatique entre utilisateurs.
- Authentification et gestion des droits.
- Tableau de bord lycée ou suivi longitudinal déjà fonctionnel.
- Certification RGPD / RGAA / WCAG, qui exige des démarches et audits indépendants.

Ces sujets seront réévalués uniquement si un besoin concret les justifie.

## Règle de gestion du scope

Pour chaque évolution : **besoin utilisateur identifié -> changement minimal -> test vérifiable -> recette -> intégration**. Garder séparés les faits (déjà implémenté), les décisions (acceptées), les hypothèses et les pistes futures.
