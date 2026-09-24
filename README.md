# thomasbasquin.fr

Portfolio personnel one-page (+ pages projet), construit avec [Astro](https://astro.build) en sortie 100 % statique. Français.

Le principe du site : **un projet, un écran**. Chaque projet est montré dans un cadre d'appareil dessiné en CSS (navigateur ou téléphone), avec une capture réelle du site en production et un screencast qui joue quand la section est à l'écran. Aucune vignette n'est une illustration : tout ce qui est affiché vient des sites eux-mêmes, produits par `npm run captures`.

Le JavaScript se limite à deux îlots vanilla (lecture des boucles vidéo, repérage dans la page), chacun sans effet si le navigateur ou les préférences du visiteur ne s'y prêtent pas.

## Commandes

```bash
npm install      # dépendances
npm run dev      # serveur de développement
npm run build    # build statique dans dist/
npm run preview  # sert dist/ localement
npm run check    # vérification TypeScript / Astro
npm run captures # régénère les médias depuis les sites en production
./deploy.sh      # build + rsync dist/ vers /var/www/html/
```

## Structure

```
src/
  content/projects/       un fichier .md par projet (frontmatter + corps)
  content.config.ts       schéma de la collection projects
  layouts/Base.astro      head commun (SEO, fontes, accent de page)
  components/             header, footer, cadre d'appareil, section projet
  pages/                  index, projets/[slug], 404, status
  scripts/                îlots vanilla (lecture vidéo, compteur de section)
  styles/global.css       système de design (jetons, grille 12 colonnes)
  lib/site.ts             profil, petits projets, compétences, contact
  lib/colors.ts           dérivations d'accent calculées au build (AA garanti)
scripts/capture.mjs       pipeline Playwright + ffmpeg des médias projet
public/
  fonts/                  Archivo + Hanken Grotesk (variables, latin, auto-hébergées)
  media/<slug>/           poster, captures et boucles vidéo générés
```

## Générer les médias d'un projet

`npm run captures` visite chaque `links.demo`, prend les captures et enregistre un screencast, puis convertit le tout avec `ffmpeg`. Sans argument il traite tous les projets ; sinon `npm run captures <slug>`.

Sortie dans `public/media/<slug>/` : `poster.webp`, `capture-1.webp`, `capture-2.webp`, `loop.webm`, `loop.mp4`. L'écriture passe par un dossier temporaire et n'est promue qu'en cas de succès — un site momentanément cassé ne détruit pas des médias corrects.

Ces noms de fichiers sont stables d'une capture à l'autre, alors que nginx les sert avec `max-age=14400`. Chaque URL de média reçoit donc au build une empreinte de contenu (`?v=…`, voir `src/lib/asset.ts`) : un visiteur déjà venu voit les nouveaux médias immédiatement après un déploiement, sans rechargement forcé.

**Sites protégés par une connexion.** Nook exige un compte. Créer un `.env` à la racine (déjà couvert par `.gitignore`) :

```
NOOK_EMAIL=...
NOOK_PASSWORD=...
```

Sans ces variables, le script capture l'écran de connexion et le signale — donc jamais de chemin d'image mort, mais l'application elle-même n'est pas montrée. Utiliser de préférence un compte de démonstration garni de contenu présentable : **ce qui est capturé devient public**.

**Poster et boucle sont le même écran.** Le poster est pris juste avant la boucle, sur la page remise dans son état d'arrivée, et la boucle commence par un plan fixe. Le point de coupe n'est pas calculé à l'horloge (le screencast de Playwright n'émet d'images que lorsque la page change) : un aplat blanc est affiché juste avant le poster et `ffmpeg` le repère dans l'enregistrement. Côté site, la vidéo n'apparaît qu'une fois sa première image peinte, et elle est rembobinée quand on la quitte. Aucun raccord n'est donc visible au démarrage.

**Ajuster une boucle.** Le scénario de chaque projet est défini dans `SCENARIOS`, en haut de `scripts/capture.mjs` : défilement animé pour les sites qui défilent, interactions réelles pour les applications (Pokédex utilise sa recherche, chaque résultat repeignant l'écran). Une page qui ne défile pas et n'a pas de scénario donne une boucle figée — c'est le signe qu'il faut lui en écrire un.

## Ajouter un projet

1. Créer `src/content/projects/mon-projet.md` — le nom du fichier devient le slug (`/projets/mon-projet`). Le schéma est validé au build (`content.config.ts`).
2. Renseigner `links.demo`, puis lancer `npm run captures mon-projet`.
3. `device` : `browser` (capture 1440×900, cadre navigateur avec le vrai nom d'hôte) ou `phone` (capture 390×844, cadre téléphone). Le choix se fait sur ce qu'est le produit, pas sur ce qui rend bien.
4. `accent` : couleur hex du fil conducteur. Les variantes lisibles (texte, fonds, theme-color) sont dérivées au build avec contraste AA garanti.
5. `order` contrôle la position ; les sections alternent automatiquement de côté.
6. `status: "wip"` pour un projet pas encore en ligne dans sa version actuelle : ni lien, ni média, un écran « Refonte en cours » à la place, et « En cours » au lieu de l'année dans l'index. Le script de capture l'ignore tant qu'il n'a pas de `links.demo`.

Le corps de la fiche reste court et factuel : ce que fait le produit et les choix techniques réellement observables. Pas de plan d'étude de cas générique.
