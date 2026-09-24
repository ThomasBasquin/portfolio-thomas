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

export const SIDE_PROJECTS = [
  {
    name: "Peace Preamp",
    description:
      "Un script Windows qui règle le volume de l'égaliseur audio depuis le clavier, avec un affichage à l'écran et un profil pour le casque et un pour les enceintes.",
    stack: "AutoHotkey",
    year: 2026,
    href: "https://github.com/ThomasBasquin/peace-preamp-ahk",
  },
  {
    name: "Statut des sites",
    description:
      "Une page qui vérifie toutes les deux heures que chacun de mes sites répond. Les sites sont trouvés automatiquement dans la configuration du serveur.",
    stack: "Bash · systemd · nginx",
    year: 2026,
    href: "https://github.com/ThomasBasquin/thomas-homepage/tree/main/infra/status",
  },
] as const;

export const SKILLS = [
  { label: "Front-end", items: ["React", "Next.js", "Astro", "Tailwind CSS", "TanStack Query"] },
  { label: "Langages", items: ["TypeScript", "JavaScript", "HTML et CSS", "Bash", "AutoHotkey"] },
  { label: "Back-end et données", items: ["Node.js", "SQLite", "Drizzle ORM", "Better Auth", "API REST"] },
  { label: "Mobile", items: ["Conception mobile-first", "PWA installable", "Service worker", "Gestes tactiles"] },
  { label: "Hébergement", items: ["Serveur Linux", "nginx", "systemd", "Sites statiques"] },
  { label: "Outils", items: ["Git et GitHub", "Playwright", "ffmpeg", "Leaflet"] },
] as const;
