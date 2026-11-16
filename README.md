# 漢字卡 – Flashcards de chinois traditionnel

Site web installable (PWA) pour réviser des cartes en chinois traditionnel, à héberger gratuitement sur GitHub Pages.

## Mise en ligne
1. Crée un dépôt **public** sur GitHub (ex. `flashcards`).
2. Dézippe l'archive, puis *Add file → Upload files* et glisse **tout le contenu** (dossiers `decks` et `icons` inclus). Commit.
3. *Settings → Pages* : Source = *Deploy from a branch*, branche `main`, dossier `/ (root)`. Attends ~1 minute.
4. Sur l'iPhone, ouvre `https://TON-PSEUDO.github.io/flashcards/` dans **Safari** → Partager → **Sur l'écran d'accueil**.

## Ajouter des mots
Dépose un fichier `.csv` dans le dossier `decks/` du dépôt (*Add file → Upload files*). Le nom du fichier = le nom du deck. Dans l'app : Réglages → Recharger.

Format (UTF-8, première ligne = en-têtes) :

    hanzi,pinyin,zhuyin,tags,meaning
    貓,māo,ㄇㄠ,animals;lesson 2,chat

- `tags` : plusieurs tags séparés par `;`. `meaning` est optionnel.
- Séparateur `,` ou `;` accepté. Depuis Excel : « CSV UTF-8 ».
- Tags supplémentaires : touche une carte dans l'onglet Cartes (ou « tag » au verso en révision).

## Niveaux
Nouveau → F (oublié) · E · D · C · B · A (maîtrisé). Prochaine révision : F ≈ 10 min, E 1 j, D 3 j, C 7 j, B 14 j, A 30 j.
Oublié → F · Difficile → −1 · Bien → +1 · Facile → +2 (une carte nouvelle démarre à F/E/D/B).

## Historique
L'onglet Historique affiche : cartes révisées, série en cours et record, meilleur jour, 7 et 30 derniers jours, graphique, calendrier, temps moyen par jour (par jour révisé, 60 s max par carte), taux de réussite (réponses hors « Oublié ») et répartition Oublié / Difficile / Bien / Facile. Il se remplit à partir de la première carte révisée après la mise à jour.

## Notes
- La progression est stockée dans le navigateur de l'iPhone : fais un export JSON de temps en temps (Réglages).
- L'audio utilise la voix mandarin de l'iPhone (zh-TW). Si elle manque : Réglages iOS → Accessibilité → Contenu énoncé → Voix → Chinois → Taïwan.
- Si la liste des decks ne se charge pas (domaine personnalisé…), ajoute le nom du fichier dans `decks/index.json`.
