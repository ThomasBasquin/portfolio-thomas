export {};

// Revenir dans l'historique rend l'accueil à la position exacte où on l'a
// quitté ; le lien, lui, ne sait viser que la section du projet.
const link = document.querySelector<HTMLAnchorElement>("a[data-back]");
const from = document.referrer ? new URL(document.referrer) : null;

if (link && from && from.origin === location.origin && from.pathname === "/") {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    history.back();
  });
}
