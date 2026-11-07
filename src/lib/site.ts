export const SITE_URL = "https://thomasbasquin.fr";

export const SITE = {
  name: "Thomas Basquin",
  firstName: "Thomas",
  lastName: "Basquin",
  role: "Développeur web",
  title: "Thomas Basquin — Développeur web",
  description:
    "Portfolio de Thomas Basquin, développeur web. Sites et applications conçus de bout en bout : interface, données, hébergement et mise en production.",
  tagline:
    "Développeur web. Je conçois des applications de bout en bout, du prototype à la mise en production.",
  email: "contact@basquin.eu",
  github: "https://github.com/ThomasBasquin",
  location: "France",
} as const;

type SideMedia =
  | { kind: "claudebar" }
  | { kind: "image"; src: string; alt: string; width: number; height: number };

type SideProject = {
  name: string;
  description: string;
  stack: string;
  year: number;
  href?: string;
  /** Absent tant que la capture du vrai produit manque. */
  media?: SideMedia;
};

export const SIDE_PROJECTS: readonly SideProject[] = [
  {
    name: "Virtual Deck",
    description:
      "Des raccourcis et un panneau à l'écran pour piloter mon PC de jeu sans quitter la partie : volume de l'égaliseur, micro, HDR, second écran, profils d'overclock et alertes de température. Le tout sans être pris pour une triche par les anti-cheats.",
    stack: "PowerShell · AutoHotkey",
    year: 2026,
    href: "https://github.com/ThomasBasquin/virtual-deck",
  },
  {
    name: "Ariane",
    description:
      "Un lanceur pour le Mac au look de Spotlight, qui affiche les apps et les fichiers dès la première lettre, là où Spotlight met jusqu'à une seconde à déplier ses résultats. Aucune recherche web, des alias perso, et il apprend mes choix.",
    stack: "Swift · SwiftUI",
    year: 2026,
    media: {
      kind: "image",
      src: "/media/side/ariane.webp",
      alt: "Le panneau d'Ariane ouvert sur la recherche « ariane » : l'app, ses commandes et ses dossiers.",
      width: 1120,
      height: 700,
    },
  },
  {
    name: "ClaudeBar",
    description:
      "Une icône dans la barre des menus du Mac qui s'allume quand une session Claude Code attend ma réponse. Un clic ramène au bon terminal, y compris dans VS Code.",
    stack: "Swift · extension VS Code",
    year: 2026,
    media: { kind: "claudebar" },
  },
  {
    name: "Shunt",
    description:
      "Une icône qui n'apparaît dans la barre des menus que si le Mac est mal alimenté : mauvais chargeur, ou batterie qui se vide alors qu'il est branché.",
    stack: "Swift · C",
    year: 2026,
    media: {
      kind: "image",
      src: "/media/side/shunt.webp",
      alt: "Le menu de Shunt sous son icône dans la barre des menus : batterie au repos, consommation du Mac et puissance de l'adaptateur.",
      width: 1120,
      height: 700,
    },
  },
  {
    name: "Statut des sites",
    description:
      "Une page qui vérifie toutes les deux heures que chacun de mes sites répond. Les sites sont trouvés automatiquement dans la configuration du serveur.",
    stack: "Bash · systemd · nginx",
    year: 2026,
    media: {
      kind: "image",
      src: "/media/side/statut.webp",
      alt: "La page de statut : le portfolio, le site de Marie Wach et Nook, tous en ligne.",
      width: 1120,
      height: 700,
    },
  },
];

export const SKILLS = [
  { label: "Front-end", items: ["React", "Next.js", "SvelteKit", "Astro", "Tailwind CSS", "TanStack Query"] },
  { label: "Langages", items: ["TypeScript", "JavaScript", "Swift", "HTML et CSS", "Bash", "PowerShell", "AutoHotkey"] },
  { label: "Back-end et données", items: ["Node.js", "SQLite", "Drizzle ORM", "Better Auth", "API REST"] },
  { label: "Mobile", items: ["Conception mobile-first", "PWA installable", "Service worker", "Gestes tactiles"] },
  { label: "Hébergement", items: ["Serveur Linux", "nginx", "systemd", "Sites statiques"] },
  { label: "Outils", items: ["Git et GitHub", "Playwright", "ffmpeg", "Leaflet"] },
] as const;
