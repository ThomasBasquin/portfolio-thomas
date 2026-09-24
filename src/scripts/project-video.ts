/**
 * Lecture des boucles vidéo dans les cadres d'appareil.
 *
 * Lazy strict : les <video> sortent du HTML avec preload="none" et des
 * <source data-src> vides ; les src ne sont posés qu'à l'approche du viewport,
 * et rien n'est téléchargé avant la lecture effective. Une seule boucle tourne
 * à la fois — celle de la section que le visiteur est en train de regarder.
 */

export {};

/** Doit suivre la transition d'opacité de `.device-screen video`. */
const FADE_MS = 300;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const saveData =
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData === true;
const videos = Array.from(
  document.querySelectorAll<HTMLVideoElement>(".device-screen video[data-lazy]")
);

if (
  videos.length > 0 &&
  !reducedMotion.matches &&
  !saveData &&
  "IntersectionObserver" in window
) {
  init();
}

function init(): void {
  const attached = new WeakSet<HTMLVideoElement>();
  const wanted = new Set<HTMLVideoElement>();

  const attach = (video: HTMLVideoElement): void => {
    if (attached.has(video)) return;
    attached.add(video);
    for (const source of video.querySelectorAll("source[data-src]")) {
      source.setAttribute("src", source.getAttribute("data-src") ?? "");
    }
    video.load();
  };

  const play = (video: HTMLVideoElement): void => {
    attach(video);
    void video.play().catch(() => {});
  };

  // `playing` part avant que la première image soit peinte : révéler la vidéo
  // à ce moment laisserait voir un cadre vide ou l'image précédente.
  const reveal = (video: HTMLVideoElement): void => {
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => {
        if (!video.paused) video.classList.add("is-playing");
      });
    } else {
      video.classList.add("is-playing");
    }
  };

  // La boucle démarre sur l'image exacte du poster : la rembobiner une fois
  // masquée garantit que chaque reprise enchaîne sans saut visible.
  const rewind = (video: HTMLVideoElement): void => {
    video.classList.remove("is-playing");
    window.setTimeout(() => {
      if (video.paused) video.currentTime = 0;
    }, FADE_MS);
  };

  for (const video of videos) {
    video.addEventListener("playing", () => reveal(video));
    video.addEventListener("pause", () => rewind(video));
  }

  // Câblage des sources à l'approche — preload="none" garantit qu'aucune
  // donnée vidéo n'est encore téléchargée à ce stade.
  const near = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          attach(entry.target as HTMLVideoElement);
          near.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "300px" }
  );
  for (const video of videos) near.observe(video);

  const majority = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.intersectionRatio >= 0.55) {
          wanted.add(video);
          if (!document.hidden) play(video);
        } else {
          wanted.delete(video);
          video.pause();
        }
      }
    },
    { threshold: [0, 0.55] }
  );
  for (const video of videos) majority.observe(video);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      for (const video of videos) video.pause();
    } else {
      for (const video of wanted) play(video);
    }
  });

  reducedMotion.addEventListener("change", (e) => {
    if (e.matches) {
      wanted.clear();
      for (const video of videos) video.pause();
    }
  });
}
