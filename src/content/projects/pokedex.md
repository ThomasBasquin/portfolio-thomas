---
title: "Pokédex"
tagline: "L'encyclopédie Pokémon interactive"
description: "Une encyclopédie des Pokémon avec recherche, fiches détaillées et navigation au doigt."
role: "Conception, design, développement et mise en ligne"
stack: ["Next.js", "React", "Tailwind"]
accent: "#ef4444"
device: "phone"
year: 2023
links:
  demo: "https://pokedex.thomasbasquin.fr/"
media:
  poster: "/media/pokedex/poster.webp"
  video:
    webm: "/media/pokedex/loop.webm"
    mp4: "/media/pokedex/loop.mp4"
  gallery:
    - src: "/media/pokedex/capture-1.webp"
      caption: "Bulbizarre : la page prend la couleur du type Plante"
    - src: "/media/pokedex/capture-2.webp"
      caption: "Ectoplasma : la couleur du type Spectre"
featured: false
order: 4
---

## Ce qu'on y trouve

Le Pokédex couvre les 1 008 premiers Pokémon. Chaque fiche donne le nom français et le nom japonais, la description, les types, les talents, la taille et le poids. On peut aussi écouter le cri du Pokémon.

La page entière prend la couleur du type du Pokémon affiché : rouge pour le Feu, violet pour le Spectre, et ainsi de suite.

## Chercher et naviguer

La recherche accepte le nom français, le nom anglais ou le numéro, et elle tolère les fautes de frappe. Sur téléphone, on passe d'un Pokémon au suivant en glissant le doigt.

## Rapide sans serveur

Le site est composé de fichiers statiques, sans serveur derrière. La première fiche est préparée à l'avance pour s'afficher tout de suite. Les autres sont chargées depuis PokéAPI, une base de données publique.

Pour que ces chargements ne se sentent pas, chaque fiche consultée est gardée en mémoire, et la fiche suivante est chargée à l'avance quand on fait glisser l'écran. Sur mobile, la liste n'affiche que les lignes visibles à l'écran, ce qui la garde fluide malgré le millier d'entrées.
