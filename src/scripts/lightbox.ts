/**
 * Agrandissement des captures de galerie dans un <dialog> natif : fermeture
 * par Échap, focus piégé et rendu au déclencheur par le navigateur. Sans
 * JavaScript, le lien ouvre simplement l'image pleine densité.
 */

export {};

const dialog = document.querySelector<HTMLDialogElement>("dialog.lightbox");
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.gallery-zoom"));

if (dialog && links.length > 0) init(dialog, links);

function init(dialog: HTMLDialogElement, links: HTMLAnchorElement[]): void {
  const img = dialog.querySelector<HTMLImageElement>(".lightbox-img")!;
  const count = dialog.querySelector<HTMLElement>(".lightbox-count")!;
  const text = dialog.querySelector<HTMLElement>(".lightbox-text")!;
  let current = 0;
  let pending: HTMLImageElement | null = null;

  const show = (index: number): void => {
    current = (index + links.length) % links.length;
    const link = links[current];
    const thumb = link.querySelector("img");
    const caption = link.closest("figure")?.querySelector("figcaption")?.textContent ?? "";

    // La vignette est déjà en cache : on l'affiche tout de suite, puis on la
    // remplace par la pleine densité dès qu'elle est chargée.
    img.src = thumb?.currentSrc || link.href;
    img.alt = thumb?.alt ?? "";
    count.textContent = `${current + 1} / ${links.length}`;
    text.textContent = caption;

    const full = new Image();
    pending = full;
    full.onload = () => {
      if (pending === full) img.src = full.src;
    };
    full.src = link.href;

    // Précharge la voisine pour que la navigation au clavier soit instantanée.
    if (links.length > 1) new Image().src = links[(current + 1) % links.length].href;
  };

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox-close")?.addEventListener("click", () => dialog.close());
  dialog.querySelector(".lightbox-prev")?.addEventListener("click", () => show(current - 1));
  dialog.querySelector(".lightbox-next")?.addEventListener("click", () => show(current + 1));

  // Un clic hors de l'image et de ses commandes ferme, comme sur le fond.
  dialog.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (!target.closest(".lightbox-img, .lightbox-btn, .lightbox-caption")) dialog.close();
  });

  dialog.addEventListener("keydown", (event) => {
    if (links.length < 2) return;
    if (event.key === "ArrowLeft") show(current - 1);
    else if (event.key === "ArrowRight") show(current + 1);
  });

  dialog.addEventListener("close", () => {
    pending = null;
    img.removeAttribute("src");
  });
}
