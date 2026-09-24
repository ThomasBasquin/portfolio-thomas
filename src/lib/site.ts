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

export const ABOUT = {
  paragraphs: [
    "Je conçois et développe des sites et applications web de bout en bout : interface, données, hébergement et mise en production.",
    "Mes projets couvrent des besoins variés (une PWA collaborative de suivi de médias, un site vitrine avec prise de rendez-vous pour un cabinet d'ostéopathie), construits avec Next.js, Astro et React.",
    "Je privilégie des systèmes simples, rapides et maintenables, pensés pour l'usage réel plutôt que pour la démonstration technique.",
  ],
  practices: [
    { label: "Frontend", items: "React · Next.js · Astro" },
    { label: "Langages", items: "TypeScript · HTML · CSS" },
    { label: "Mobile & PWA", items: "mobile-first · installable" },
    { label: "Déploiement", items: "Linux · export statique · auto-hébergement" },
  ],
} as const;
