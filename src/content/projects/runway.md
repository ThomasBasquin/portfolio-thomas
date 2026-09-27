---
title: "Runway"
tagline: "Apprendre la finance en prenant les décisions"
description: "Deux simulateurs de finance jouables dans le navigateur, pour diriger les finances d'une entreprise ou gérer un fonds d'investissement."
role: "Conception, design, développement et mise en ligne"
stack: ["SvelteKit", "TypeScript", "SQLite", "Drizzle ORM"]
accent: "#b9831a"
device: "browser"
year: 2026
links:
  demo: "https://runway.thomasbasquin.fr/"
media:
  poster: "/media/runway/poster.webp"
  video:
    webm: "/media/runway/loop.webm"
    mp4: "/media/runway/loop.mp4"
  gallery:
    - src: "/media/runway/capture-1.webp"
      caption: "CFO Heritage : le choix de l'entreprise à diriger"
    - src: "/media/runway/capture-2.webp"
      caption: "CFO Heritage : l'historique de l'entreprise, année après année"
    - src: "/media/runway/capture-3.webp"
      caption: "Alpha Fund : le bilan du trimestre et le portefeuille"
    - src: "/media/runway/capture-4.webp"
      caption: "Alpha Fund : l'économie et les marchés"
featured: false
order: 3
---

## Deux jeux

Runway réunit deux simulateurs où chaque décision pèse sur les comptes. On joue tour après tour et on voit les conséquences de ses choix.

Dans **CFO Heritage**, on est le directeur financier d'une entreprise pendant 10 à 25 ans, et chaque tour est une année. On choisit parmi huit entreprises, des plus saines aux plus en crise. Chaque année, il faut décider d'investir, d'emprunter, de verser des dividendes, de racheter des actions, et plus tard d'acquérir d'autres sociétés ou d'entrer en bourse.

Dans **Alpha Fund**, on gère un fonds d'investissement, un trimestre à la fois, sans limite de durée. Actions, obligations, matières premières, contrats à terme et options : chaque ordre a un coût, et il faut garder assez de liquidités quand les clients retirent leur argent.

## Voir la conséquence avant de décider

Le budget de l'année est calculé avec les décisions en cours. Quand on change une décision, il se met à jour tout de suite. Le résultat réel arrive à la clôture de l'année, avec les aléas du marché, et le bilan explique l'écart.

## Des comptes justes

Les montants sont comptés en centimes entiers et jamais en nombres à virgule, pour qu'aucune erreur d'arrondi ne s'accumule au fil des années.

Chaque partie est déterminée par une graine et la liste des décisions du joueur. Le hasard de chaque tour est tiré de cette graine, donc une partie peut être rejouée à l'identique. Les parties sont liées au compte et sauvegardées à chaque tour, ce qui permet de les reprendre sur n'importe quel appareil.
