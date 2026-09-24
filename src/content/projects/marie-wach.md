---
title: "Marie Wach"
tagline: "Un cabinet d'ostéopathie, en ligne"
description: "Le site d'un cabinet d'ostéopathie : les soins proposés, le cabinet et la prise de rendez-vous."
role: "Design, développement et mise en ligne"
stack: ["Astro", "JavaScript", "Leaflet"]
accent: "#57c785"
device: "phone"
year: 2026
links:
  demo: "https://mariewach.fr/"
media:
  poster: "/media/marie-wach/poster.webp"
  video:
    webm: "/media/marie-wach/loop.webm"
    mp4: "/media/marie-wach/loop.mp4"
  gallery:
    - src: "/media/marie-wach/capture-1.webp"
      caption: "La séance : le déroulé d'une consultation"
    - src: "/media/marie-wach/capture-2.webp"
      caption: "Pour qui : un encadré par profil de patient"
    - src: "/media/marie-wach/capture-3.webp"
      caption: "À propos : formation et expériences cliniques"
    - src: "/media/marie-wach/capture-4.webp"
      caption: "Contact, de nuit : carte, horaires, rendez-vous"
  galleryDevice: "browser"
featured: false
order: 2
---

## Ce dont le cabinet avait besoin

Marie Wach est ostéopathe à Dieffenbach-au-Val. Son site devait répondre à trois questions : ce qu'elle fait, où se trouve le cabinet, et comment prendre rendez-vous.

Il présente donc le déroulé d'une séance, les patients qu'elle accompagne (adultes, femmes enceintes, nourrissons, sportifs), son parcours, et une page contact avec les horaires et une carte. La carte est faite avec Leaflet plutôt qu'avec une intégration Google Maps, ce qui rend la page plus légère.

## La prise de rendez-vous

Les rendez-vous se prennent sur Doctolib. Marie y gère déjà son agenda et ses patients ont l'habitude de l'utiliser. Refaire un système de réservation aurait créé un deuxième agenda à tenir à jour, sans rien apporter aux patients. Le site envoie donc vers Doctolib, depuis chaque page.

## Un thème qui suit le soleil

Le site est clair le jour et sombre la nuit, automatiquement. L'heure du lever et du coucher du soleil est calculée à partir de la position du cabinet, sans faire appel à un service externe.

Le calcul se fait avant l'affichage de la page, donc on ne voit jamais le site changer de couleur au chargement. Un bouton permet quand même de choisir le thème à la main.
