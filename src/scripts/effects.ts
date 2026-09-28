export {};

const root = document.documentElement;
const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Renvoie vrai tant que l'effet bouge encore. */
type Tick = () => boolean;

// Une seule boucle pour tous les effets, arrêtée dès que tout est au repos.
const ticks = new Set<Tick>();
let frame = 0;

const run = (tick: Tick): void => {
  ticks.add(tick);
  if (!frame) frame = requestAnimationFrame(loop);
};

function loop(): void {
  frame = 0;
  for (const tick of ticks) if (!tick()) ticks.delete(tick);
  if (ticks.size > 0) frame = requestAnimationFrame(loop);
}

const lerp = (from: number, to: number, k: number): number => from + (to - from) * k;
const settled = (a: number, b: number, eps = 0.01): boolean => Math.abs(a - b) < eps;

trackAccent();

if (motionOK) {
  scrambleMail();
  if (finePointer) {
    heroWeight();
    tiltDevices();
    buttonFill();
  }
}

function trackAccent(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-showcase]"));
  if (sections.length === 0 || !("IntersectionObserver" in window)) return;

  let current: HTMLElement | null = null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const section = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          current = section;
          const accent = getComputedStyle(section).getPropertyValue("--accent").trim();
          if (accent) root.style.setProperty("--live-accent", accent);
        } else if (current === section) {
          current = null;
          root.style.removeProperty("--live-accent");
        }
      }
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  for (const section of sections) observer.observe(section);
}

function heroWeight(): void {
  const hero = document.querySelector<HTMLElement>("[data-hero-name]");
  if (!hero) return;
  const letters = Array.from(hero.querySelectorAll<HTMLElement>(".ch"));
  const REST = { w: 620, s: 105 };
  const PEAK = { w: 900, s: 125 };
  const state = letters.map(() => ({ w: REST.w, s: REST.s }));
  let pointer: { x: number; y: number } | null = null;

  const tick: Tick = () => {
    const radius = Math.max(180, hero.getBoundingClientRect().height * 0.9);
    let moving = false;
    letters.forEach((letter, i) => {
      let t = 0;
      if (pointer) {
        const r = letter.getBoundingClientRect();
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
        t = Math.max(0, 1 - d / radius) ** 2;
      }
      const s = state[i];
      s.w = lerp(s.w, REST.w + (PEAK.w - REST.w) * t, 0.14);
      s.s = lerp(s.s, REST.s + (PEAK.s - REST.s) * t, 0.14);
      letter.style.setProperty("--w", s.w.toFixed(1));
      letter.style.setProperty("--s", `${s.s.toFixed(2)}%`);
      const tw = REST.w + (PEAK.w - REST.w) * t;
      if (!settled(s.w, tw, 0.5)) moving = true;
    });
    return moving;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      const box = hero.getBoundingClientRect();
      const near = event.clientY < box.bottom + 200 && event.clientY > box.top - 200;
      if (!near && !pointer) return;
      pointer = near ? { x: event.clientX, y: event.clientY } : null;
      run(tick);
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => {
    pointer = null;
    run(tick);
  });
}

function tiltDevices(): void {
  for (const device of document.querySelectorAll<HTMLElement>("[data-tilt]")) {
    // Le cadre est centré dans son parent, qui ne bascule pas : ses bornes à
    // lui restent stables sous le curseur, contrairement à celles du cadre.
    const holder = device.parentElement ?? device;
    // Un téléphone est étroit : à angle égal, il paraît presque immobile.
    const amp = device.classList.contains("device--phone") ? { x: 16, y: 26 } : { x: 9, y: 12 };
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const tick: Tick = () => {
      cur.x = lerp(cur.x, target.x, 0.1);
      cur.y = lerp(cur.y, target.y, 0.1);
      device.style.setProperty("--tilt-x", `${cur.x.toFixed(3)}deg`);
      device.style.setProperty("--tilt-y", `${cur.y.toFixed(3)}deg`);
      return !(settled(cur.x, target.x) && settled(cur.y, target.y));
    };

    device.addEventListener("pointermove", (event) => {
      const r = holder.getBoundingClientRect();
      const px = (event.clientX - (r.left + r.width / 2)) / device.offsetWidth;
      const py = (event.clientY - (r.top + r.height / 2)) / device.offsetHeight;
      target.x = -py * amp.x;
      target.y = px * amp.y;
      run(tick);
    });

    device.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
      run(tick);
    });
  }
}

function buttonFill(): void {
  for (const btn of document.querySelectorAll<HTMLElement>(".btn")) {
    const origin = (event: PointerEvent): void => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--bx", `${(((event.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      btn.style.setProperty("--by", `${(((event.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };
    btn.addEventListener("pointerenter", origin);
    btn.addEventListener("pointerleave", origin);
  }
}

function scrambleMail(): void {
  const mail = document.querySelector<HTMLElement>(".outro-mail");
  if (!mail) return;
  const text = mail.textContent ?? "";
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=";
  const DURATION = 900;
  let start = 0;

  mail.setAttribute("aria-label", text);

  const tick: Tick = () => {
    const progress = Math.min(1, (performance.now() - start) / DURATION);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const resolved = progress * 1.25 > i / text.length + 0.25;
      out += resolved || char === "@" || char === "." ? char : glyphs[(Math.random() * glyphs.length) | 0];
    }
    mail.textContent = out;
    if (progress >= 1) {
      mail.textContent = text;
      mail.style.removeProperty("min-width");
      return false;
    }
    return true;
  };

  const play = (): void => {
    if (ticks.has(tick)) return;
    mail.style.minWidth = `${mail.getBoundingClientRect().width}px`;
    start = performance.now();
    run(tick);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 1 }
    );
    observer.observe(mail);
  }
  mail.addEventListener("pointerenter", play);
  mail.addEventListener("focus", play);
}
