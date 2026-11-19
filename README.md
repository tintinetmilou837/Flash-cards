# 漢字卡 – Flashcards de chinois traditionnel

Site web installable (PWA) pour réviser des cartes en chinois traditionnel (caractère, pinyin, zhuyin, audio, traduction) et s'entraîner à écrire les caractères trait par trait. Il s'héberge gratuitement sur GitHub Pages et s'ouvre depuis une icône sur l'écran d'accueil de l'iPhone ou de l'iPad.

## Contenu du dépôt
- `index.html`, `app.js`, `style.css` : l'application
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et fonctionnement hors ligne
- `vendor/` : bibliothèque de tracé Hanzi Writer
- `decks/` : tes fichiers `.csv` (un fichier = un deck)

## Mise en ligne
1. Crée un dépôt **public** sur GitHub (ex. `Flash-cards`).
2. Dézippe l'archive, puis *Add file → Upload files* et glisse **tout le contenu** (dossiers `decks`, `icons` et `vendor` inclus). Commit.
3. *Settings → Pages* : Source = *Deploy from a branch*, branche `main`, dossier `/ (root)`. Attends environ une minute.
4. Sur l'iPhone, ouvre `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/` dans **Safari** → Partager → **Sur l'écran d'accueil**. Lance ensuite l'app depuis l'icône.

## Mettre à jour l'application
Remplace les fichiers modifiés dans le dépôt (*Add file → Upload files*, les fichiers de même nom sont remplacés). Ne renvoie pas le dossier `decks` si tu y as déjà mis tes CSV.
Attends environ une minute, puis ferme complètement l'app et rouvre-la **deux fois**. Le numéro de version est affiché tout en bas de Réglages. Le bouton « Forcer la mise à jour de l'application » vide le cache de l'app (pas ta progression) et recharge.

## Ajouter des mots
Dépose un fichier `.csv` dans le dossier `decks/` du dépôt (*Add file → Upload files*). Le nom du fichier devient le nom du deck. Dans l'app : Réglages → Recharger les decks (compte environ une minute avant que GitHub publie le fichier).

Format (UTF-8, première ligne = en-têtes) :

    hanzi,pinyin,zhuyin,tags,meaning
    貓,māo,ㄇㄠ,animals;lesson 2,chat

- `tags` : plusieurs tags séparés par `;`. `meaning` est optionnel.
- En-têtes reconnus : caractère = `hanzi`, `chinese`, `chinois`, `漢字` ; pinyin = `pinyin` ; zhuyin = `zhuyin`, `bopomofo`, `注音` ; tags = `tags`, `lesson`, `leçon`, `unit`, `category` ; traduction = `meaning`, `english`, `anglais`, `definition`, `traduction`. Les colonnes non reconnues sont ignorées.
- Une colonne `Lesson` contenant un nombre (`9`) donne le tag « lesson 9 » ; sinon la valeur est gardée telle quelle (`B3_L9`).
- Séparateur `,` ou `;` accepté. Depuis Excel : « CSV UTF-8 ».
- Un mot présent deux fois dans le même deck (sens différents) donne deux cartes distinctes, chacune avec sa propre progression.
- Tags supplémentaires : touche une carte dans l'onglet Cartes (ou « tag » au verso en révision). Ils sont stockés dans l'app, pas dans le CSV.

## Réviser
- **Recto** : uniquement le caractère (ou le mot), dont la taille s'adapte à la longueur. **Verso** : caractère, pinyin, zhuyin, traduction et bouton 🔊 (lecture automatique réglable).
- **Niveaux** : Nouveau → F (oublié) · E · D · C · B · A (maîtrisé). Prochaine révision : F ≈ 10 min, E 1 j, D 3 j, C 7 j, B 14 j, A 30 j. Oublié → F · Difficile → −1 · Bien → +1 · Facile → +2 (une carte nouvelle démarre à F, E, D ou B). Une carte « oubliée » revient une fois dans la même session.
- **Session** de 50, 80 ou 100 cartes : d'abord les cartes à revoir (les plus faibles en premier), puis les nouvelles, puis les prochaines à venir pour compléter.

## Mode Tableau
Dans l'onglet Réviser, le sélecteur **Flashcards / Tableau** change de mode. Le mode Tableau affiche toutes les cartes, une par ligne, avec Chinese, Pinyin, Zhuyin et English. Sur un grand écran (iPad), les quatre colonnes sont sur une seule ligne ; sur iPhone, Chinese, Pinyin et Zhuyin sont sur la première ligne et English sur la seconde. Les mêmes filtres decks / tags s'appliquent, plus une recherche texte (qui cherche aussi dans les tags et le nom du deck). Touche un caractère pour l'entendre. Le mode choisi est mémorisé.

## Choisir ses decks et ses tags
Dans Réviser et Écriture, deux menus déroulants à cases à cocher : **decks** et **tags** (avec recherche, « Tout cocher » / « Tout décocher »). Rien de coché = tout. Plusieurs tags cochés = cartes ayant au moins l'un d'eux. Le choix est mémorisé, et la liste des tags ne montre que ceux des decks choisis.

## Écriture
Trace chaque caractère au doigt ou à l'Apple Pencil (iPad), un caractère à la fois (les mots de plusieurs caractères sont découpés). Le pinyin et le zhuyin sont affichés au-dessus de la zone de tracé.
- **Apprentissage** : le caractère est en filigrane, l'ordre des traits est animé, puis tu traces. Après une erreur, le bon trait clignote.
- **Sans modèle** : aucun fond, tu écris de mémoire. Consulter « Ordre des traits » plafonne la note à « Moyen ».
- **Notes** : 🌟 Parfait (0 erreur) · 👍 Bien (≤ 15 % de traits ratés) · 😐 Moyen (≤ 50 %) · 🔁 À refaire. Un trait faux 3 fois est validé d'office et compte comme erreur.
- 10, 20 ou 30 caractères par session ; les moins bien réussis reviennent en premier. Tolérance réglable (Stricte / Normale / Souple).
- Les données de tracé sont chargées depuis jsDelivr (hanzi-writer-data 2.0.1) et gardées en cache : un caractère vu une fois marche ensuite hors ligne.

## Historique
Deux sous-onglets, **Flashcards** et **Écriture**, chacun avec ses statistiques : total, série en cours et record, meilleur jour, 7 et 30 derniers jours, graphique, calendrier, temps moyen par jour (par jour pratiqué ; 60 s max par carte, 3 min max par caractère), taux de réussite et qualité des réponses.
- Flashcards : le taux de réussite compte les réponses hors « Oublié ».
- Écriture : chaque tracé terminé compte (un « Recommencer » après un résultat compte comme un nouvel essai) ; le taux de réussite = tracés Bien ou Parfait.

## Réglages
Audio automatique, liste des decks chargés, rechargement des decks, export / import de la progression (fichier JSON), mise à jour forcée, réinitialisation (progression, historique et tags ajoutés).

## Notes
- La progression est stockée dans le navigateur de l'appareil : fais un export JSON de temps en temps. L'icône de l'écran d'accueil et Safari ont chacun leurs propres données, et chaque appareil (iPhone, iPad) aussi.
- La progression d'une carte est liée au nom du deck : renommer un deck ou déplacer des cartes vers un autre fichier les remet en « Nouveau ».
- L'audio utilise la voix mandarin de l'appareil (zh-TW). Si elle manque : Réglages iOS → Accessibilité → Contenu énoncé → Voix → Chinois → Taïwan. Vérifie aussi l'interrupteur silencieux.
- La liste des decks est lue via l'API publique de GitHub. Si elle ne se charge pas (domaine personnalisé, limite de requêtes), ajoute le nom du fichier dans `decks/index.json`.

## Crédits
Tracés : [Hanzi Writer](https://hanziwriter.org) (licence MIT, fichier dans `vendor/`) et données Make Me a Hanzi (Arphic Public License).
