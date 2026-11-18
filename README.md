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
- Noms d'en-têtes reconnus : caractère = hanzi / chinese / chinois / 漢字 ; tags = tags / lesson / leçon / unit / category ; traduction = meaning / english / anglais / definition / traduction. Une colonne `Lesson` avec `9` donne le tag « lesson 9 ». Les colonnes non reconnues sont ignorées.
- Séparateur `,` ou `;` accepté. Depuis Excel : « CSV UTF-8 ».
- Tags supplémentaires : touche une carte dans l'onglet Cartes (ou « tag » au verso en révision).

## Choisir ses decks et ses tags
Dans Réviser et Écriture, deux menus déroulants à cases à cocher : **decks** et **tags** (avec recherche, « Tout cocher » / « Tout décocher »). Rien de coché = tout. Plusieurs tags cochés = cartes ayant au moins l'un d'eux. Le choix est mémorisé, et la liste des tags ne montre que ceux des decks choisis.

## Niveaux
Nouveau → F (oublié) · E · D · C · B · A (maîtrisé). Prochaine révision : F ≈ 10 min, E 1 j, D 3 j, C 7 j, B 14 j, A 30 j.
Oublié → F · Difficile → −1 · Bien → +1 · Facile → +2 (une carte nouvelle démarre à F/E/D/B).

## Historique
L'onglet Historique a deux sous-onglets : **Flashcards** et **Écriture**, avec chacun ses propres statistiques (total, série, meilleur jour, 7/30 jours, graphique, calendrier, temps moyen par jour (par jour pratiqué ; 60 s max par carte, 3 min max par caractère), taux de réussite, qualité). Flashcards : le taux de réussite compte les réponses hors « Oublié ». Écriture : chaque tracé terminé compte (un « Recommencer » après un résultat compte comme un nouvel essai) et le taux de réussite = tracés Bien ou Parfait.

## Écriture
L'onglet Écriture fait tracer les caractères du deck (ou du tag) choisi, un caractère à la fois (les mots de plusieurs caractères sont découpés).
- **Apprentissage** : le caractère est en filigrane, l'ordre des traits est animé, puis tu traces. Après une erreur, le bon trait clignote.
- **Sans modèle** : aucun fond, tu écris de mémoire. Consulter « Ordre des traits » plafonne la note à « Moyen ».
- **Notes** : 🌟 Parfait (0 erreur) · 👍 Bien (≤ 15 % de traits ratés) · 😐 Moyen (≤ 50 %) · 🔁 À refaire. Un trait faux 3 fois est validé d'office et compte comme erreur.
- Les caractères les moins bien réussis reviennent en premier. Tolérance réglable (Stricte / Normale / Souple).
- Les données de tracé sont chargées depuis jsDelivr (hanzi-writer-data 2.0.1) et gardées en cache : un caractère vu une fois marche ensuite hors ligne.

## Crédits
Tracés : [Hanzi Writer](https://hanziwriter.org) (MIT, fichier dans `vendor/`) et données Make Me a Hanzi (Arphic Public License).

## Notes
- La progression est stockée dans le navigateur de l'iPhone : fais un export JSON de temps en temps (Réglages).
- L'audio utilise la voix mandarin de l'iPhone (zh-TW). Si elle manque : Réglages iOS → Accessibilité → Contenu énoncé → Voix → Chinois → Taïwan.
- Si la liste des decks ne se charge pas (domaine personnalisé…), ajoute le nom du fichier dans `decks/index.json`.
