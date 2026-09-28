export {};

const link = document.querySelector<HTMLAnchorElement>("a[data-back]");
const from = document.referrer ? new URL(document.referrer) : null;
// Doit suivre la condition de @view-transition dans effects.css.
const withTransition = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (link && from && from.origin === location.origin && from.pathname === "/") {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    // Sans transition, l'historique est le plus rapide : l'accueil ressort du
    // cache, déjà à sa position.
    if (!withTransition) {
      event.preventDefault();
      history.back();
      return;
    }

    // Un retour dans l'historique ne joue pas la transition dans WebKit : on
    // navigue vers l'accueil, qui se replace seul avant le premier affichage.
    try {
      const y = sessionStorage.getItem("home-scroll");
      if (y === null) return;
      sessionStorage.setItem("home-scroll-restore", y);
    } catch {
      return;
    }
    event.preventDefault();
    location.href = "/";
  });
}
