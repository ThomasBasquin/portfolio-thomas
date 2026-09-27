/**
 * Génère les médias réels des projets à partir des sites en production.
 *
 *   node scripts/capture.mjs            tous les projets
 *   node scripts/capture.mjs nook       un seul
 *
 * Chaque projet produit poster.webp, capture-1.webp, capture-2.webp,
 * loop.webm et loop.mp4 dans public/media/<slug>/. Les fichiers sont écrits
 * dans un dossier temporaire puis promus d'un bloc : un site momentanément
 * cassé ne détruit pas des médias corrects.
 */

import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, readFile, rm, cp, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "src/content/projects");
const MEDIA = path.join(ROOT, "public/media");
const WORK = path.join(ROOT, ".capture-tmp");

const VIEWPORT = {
  browser: { width: 1920, height: 1080 },
  phone: { width: 390, height: 844 },
};
const LOOP_SECONDS = 5;
const MAX_LOOP_BYTES = 2_500_000;
// Plan fixe sur l'écran du poster en tête de boucle : la vidéo apparaît en
// fondu, il faut que ce fondu se fasse sur une image immobile.
const HOLD_MS = 600;

/* -------------------------------------------------------------------------
   Configuration par projet
   ------------------------------------------------------------------------- */

/**
 * Un scénario reçoit la page déjà chargée et stabilisée, et anime pendant
 * environ LOOP_SECONDS. `prepare` s'exécute avant la navigation.
 */
const SCENARIOS = {
  "marie-wach": {
    // Le thème du site est circadien (clair le jour, sombre la nuit) : on le
    // fige pour que deux exécutions donnent la même image.
    prepare: (page) =>
      page.addInitScript(() => sessionStorage.setItem("theme", "light")),
    // En mobile la page fait trois écrans et demi : s'arrêter à l'entrée des
    // publics garde un défilement lisible sur cinq secondes.
    act: (page) => smoothScroll(page, 0, 0.62),
    // La boucle montre déjà l'accueil en mobile : la galerie passe au format
    // bureau et va chercher le reste du site, une information par page. Le
    // contact est pris de nuit pour montrer le thème circadien.
    gallery: {
      device: "browser",
      // Le site tient dans une colonne étroite : en 1920 les captures sont à
      // moitié vides, et le pied de page remonte dans celle du contact.
      viewport: { width: 1440, height: 900 },
      shots: [
        { path: "/seance", y: 560 },
        { path: "/pour-qui", y: 600 },
        { path: "/a-propos", y: 560 },
        { path: "/contact", y: 520, theme: "dark" },
      ],
    },
  },
  pokedex: {
    // L'accueil du site est Bulbizarre, vert comme l'accent de Marie Wach :
    // le poster part de Dracaufeu, rouge comme l'accent du projet.
    opening: async (page) => {
      await searchPokemon(page, "Dracaufeu");
      await page.waitForTimeout(1400);
    },
    // La page ne défile pas : ce qui vit, c'est la recherche — chaque résultat
    // repeint l'écran entier à la couleur du type de la créature.
    act: async (page) => {
      await searchPokemon(page, "Bulbizarre");
      await page.waitForTimeout(1600);
      await searchPokemon(page, "Mewtwo");
      await page.waitForTimeout(1400);
    },
    stills: async (page, shoot) => {
      await shoot();
      await searchPokemon(page, "Ectoplasma");
      await page.waitForTimeout(1400);
      await shoot();
    },
  },
  nook: {
    login: async (page) => {
      const email = process.env.NOOK_EMAIL;
      const password = process.env.NOOK_PASSWORD;
      if (!email || !password) return false;
      await page.goto("https://nook.thomasbasquin.fr/login", {
        waitUntil: "domcontentloaded",
      });
      await page.fill("#login-email", email);
      await page.fill("#login-password", password);
      // Redirection côté client : aucun événement `load` ne suit la connexion.
      await Promise.all([
        page.waitForURL((url) => !url.pathname.startsWith("/login"), {
          timeout: 20000,
          waitUntil: "commit",
        }),
        page.click('button[type="submit"]'),
      ]);
      await settle(page);
      // La fenêtre « Nouveautés » s'ouvre tant que le compte n'a pas vu la
      // dernière entrée ; la fermer l'enregistre côté serveur, une fois pour toutes.
      const dismiss = page.getByRole("button", { name: "Compris" });
      if (await dismiss.isVisible().catch(() => false)) {
        await dismiss.click();
        await page.waitForTimeout(600);
      }
      return true;
    },
    // La bibliothèque tient dans un écran : faire défiler ne montrerait rien.
    // Ce qui vaut d'être montré, c'est l'argument même du produit — tous les
    // médias au même endroit — donc on parcourt les onglets, chacun repeignant
    // l'écran de ses jaquettes, et on revient aux jeux pour boucler sans saut.
    act: async (page) => {
      const tabs = ["/movies", "/tv", "/anime", "/livres", "/games"];
      for (const tab of tabs) {
        await openTab(page, tab);
        await page.waitForTimeout((LOOP_SECONDS * 1000) / tabs.length);
      }
    },
    stills: async (page, shoot) => {
      await openTab(page, "/movies");
      await page.waitForTimeout(1300);
      await shoot();
      await openTab(page, "/anime");
      await page.waitForTimeout(1300);
      await shoot();
      await openTab(page, "/games");
      await page.waitForTimeout(1100);
    },
  },
  runway: {
    // Les jeux exigent un compte : le compte de démonstration a une partie en
    // cours dans chaque simulateur, qu'on ne fait jamais avancer ici pour que
    // deux exécutions montrent les mêmes chiffres.
    login: async (page) => {
      const email = process.env.RUNWAY_EMAIL;
      const password = process.env.RUNWAY_PASSWORD;
      if (!email || !password) return false;
      await page.goto("https://runway.thomasbasquin.fr/login", {
        waitUntil: "domcontentloaded",
      });
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await Promise.all([
        page.waitForURL((url) => !url.pathname.startsWith("/login"), {
          timeout: 20000,
        }),
        page.click("form button.button"),
      ]);
      return true;
    },
    // La boucle suit le parcours d'un joueur, de l'accueil jusqu'aux courbes
    // de sa partie, puis revient à l'accueil par le logo pour boucler sans saut.
    act: async (page) => {
      await page.waitForTimeout(900);
      await followLink(page, 'a.card[href="/cfo-heritage"]', /\/cfo-heritage$/);
      await page.waitForTimeout(1400);
      await followLink(page, 'a[href^="/cfo-heritage/"]', /\/cfo-heritage\/.+/);
      await page.waitForTimeout(1200);
      await page.getByRole("tab", { name: "Historique" }).click();
      await page.waitForTimeout(2400);
      await followLink(page, "a.brand", /\/$/);
      await page.waitForTimeout(400);
    },
    stills: async (page, shoot) => {
      await page.goto("https://runway.thomasbasquin.fr/cfo-heritage", {
        waitUntil: "domcontentloaded",
      });
      await settle(page);
      await shoot();
      await openSavedGame(page, "cfo-heritage");
      await openRunwayTab(page, "Historique");
      await shoot();
      await openSavedGame(page, "alpha-fund");
      await shoot();
      await openRunwayTab(page, "Marchés");
      await shoot();
    },
  },
};

/* -------------------------------------------------------------------------
   Utilitaires
   ------------------------------------------------------------------------- */

/** Lecture des seuls champs dont le script a besoin — pas de parseur YAML. */
async function readProjects() {
  const files = (await readdir(CONTENT)).filter((f) => f.endsWith(".md"));
  const projects = [];
  for (const file of files) {
    const raw = await readFile(path.join(CONTENT, file), "utf8");
    const front = raw.split(/^---$/m)[1] ?? "";
    const demo = front.match(/^\s*demo:\s*"([^"]+)"/m)?.[1];
    const device = front.match(/^\s*device:\s*"?(phone|browser)"?/m)?.[1];
    const order = Number(front.match(/^order:\s*(\d+)/m)?.[1] ?? 99);
    if (demo) {
      projects.push({
        slug: file.replace(/\.md$/, ""),
        url: demo,
        device: device ?? "browser",
        order,
      });
    }
  }
  return projects.sort((a, b) => a.order - b.order);
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(700);
}

/** Défilement animé avec easing — un scroll brut donne une boucle mécanique. */
function smoothScroll(page, fromRatio, toRatio) {
  return page.evaluate(
    ([from, to, duration]) =>
      new Promise((resolve) => {
        const max = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const start = max * from;
        const distance = max * to - start;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        const step = (now) => {
          const t = Math.min(1, (now - t0) / duration);
          window.scrollTo(0, start + distance * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [fromRatio, toRatio, LOOP_SECONDS * 1000]
  );
}

function openTab(page, href) {
  return page.click(`a[href="${href}"]`, { timeout: 5000 }).catch(() => {});
}

async function openSavedGame(page, game) {
  await page.goto(`https://runway.thomasbasquin.fr/${game}`, {
    waitUntil: "domcontentloaded",
  });
  await page.click(`a[href^="/${game}/"]`, { timeout: 10000 });
  await page.waitForURL(new RegExp(`/${game}/.+`));
  await settle(page);
}

async function followLink(page, selector, url) {
  await Promise.all([page.waitForURL(url), page.click(selector)]);
  await page.waitForLoadState("networkidle").catch(() => {});
}

// Le changement d'onglet garde la position de défilement de l'onglet quitté.
async function openRunwayTab(page, name) {
  await page.getByRole("tab", { name }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1200);
}

/** Frappe visible plutôt que `fill` : la boucle doit montrer l'usage réel. */
async function searchPokemon(page, name) {
  const input = page.locator("input").first();
  await input.fill("", { force: true });
  await input.pressSequentially(name, { delay: 110 });
  await input.press("Enter");
}

async function scrollToRatio(page, ratio) {
  await page.evaluate((r) => {
    const max = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    window.scrollTo(0, max * r);
  }, ratio);
  await page.waitForTimeout(600);
}

/**
 * Le screencast de Playwright n'émet d'images que lorsque la page change :
 * sa durée ne suit pas l'horloge, et un point de coupe calculé en temps réel
 * tombe à côté d'une seconde. On marque donc le départ dans l'image même —
 * un aplat blanc pur, qu'aucun site capturé n'affiche plein écran — et
 * ffmpeg le retrouve.
 */
async function flashMarker(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const veil = document.createElement("div");
        veil.style.cssText =
          "position:fixed;inset:0;z-index:2147483647;background:#fff;pointer-events:none";
        document.documentElement.append(veil);
        setTimeout(() => {
          veil.remove();
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }, 400);
      })
  );
}

/** Fin du dernier aplat blanc — about:blank, au tout début, en est un aussi. */
async function markerEnd(file) {
  const { stderr } = await run("ffmpeg", [
    "-hide_banner",
    "-i", file,
    "-vf", "negate,blackdetect=d=0.2:pix_th=0.02:pic_th=0.995",
    "-an",
    "-f", "null",
    "-",
  ]);
  const ends = [...stderr.matchAll(/black_end:([\d.]+)/g)].map((m) => Number(m[1]));
  if (ends.length === 0) throw new Error("repère de départ introuvable dans l'enregistrement");
  // Une image de marge : le fondu de retrait de l'aplat ne doit pas apparaître.
  return ends.at(-1) + 0.04;
}

/**
 * Enregistrement image par image via le screencast de Chromium, à la densité
 * de l'écran. L'enregistreur intégré de Playwright filme en 1x et compresse
 * en VP8 à 1 Mbit/s : la boucle finale serait un ré-encodage d'une source
 * déjà floue. Ici chaque image est un JPEG quasi intact, horodaté par le
 * navigateur, et l'assemblage intermédiaire est quasi sans perte.
 */
async function startRecording(page, dir, viewport) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  const writes = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `frame-${String(frames.length).padStart(5, "0")}.jpg`);
    frames.push({ file, time: metadata.timestamp });
    writes.push(writeFile(file, Buffer.from(data, "base64")));
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    maxWidth: viewport.width * 2,
    maxHeight: viewport.height * 2,
  });

  return {
    async stop() {
      const stoppedAt = Date.now() / 1000;
      await cdp.send("Page.stopScreencast");
      await Promise.all(writes);
      await cdp.detach().catch(() => {});
      if (frames.length === 0) throw new Error("aucune image enregistrée");

      // Le screencast n'émet qu'aux changements : chaque image dure jusqu'à
      // la suivante, la dernière jusqu'à l'arrêt.
      const list = frames
        .map(({ file, time }, i) => {
          const end = frames[i + 1]?.time ?? Math.max(time + 0.1, stoppedAt);
          return `file '${file}'\nduration ${(end - time).toFixed(4)}`;
        })
        .join("\n");
      const listFile = path.join(dir, "frames.txt");
      await writeFile(listFile, `${list}\nfile '${frames.at(-1).file}'\n`);

      const out = path.join(dir, "raw.mp4");
      await run("ffmpeg", [
        "-y",
        "-loglevel", "error",
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
        "-c:v", "libx264",
        "-crf", "8",
        "-preset", "veryfast",
        out,
      ]);
      return out;
    },
  };
}

/**
 * Captures fixes prises dans un autre format que la boucle, sur d'autres
 * pages que l'accueil. Le défilement se fait par paliers : les sites qui
 * révèlent leur contenu à l'entrée dans le viewport resteraient vides sinon.
 */
async function captureGallery(browser, url, gallery, outDir) {
  const pngs = [];
  for (const [i, shot] of gallery.shots.entries()) {
    const context = await browser.newContext({
      viewport: gallery.viewport ?? VIEWPORT[gallery.device],
      deviceScaleFactor: 2,
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
      reducedMotion: "no-preference",
    });
    await context.addInitScript(
      (theme) => sessionStorage.setItem("theme", theme),
      shot.theme ?? "light"
    );
    const page = await context.newPage();
    try {
      await page.goto(new URL(shot.path, url).href, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await settle(page);
      for (let y = 0; y <= shot.y; y += 200) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), shot.y);
      await page.waitForTimeout(1400);
      const png = path.join(outDir, `capture-${i + 1}.png`);
      await page.screenshot({ path: png });
      pngs.push(png);
    } finally {
      await context.close();
    }
  }
  return pngs;
}

async function toWebp(pngPath, webpPath, maxWidth) {
  await run("ffmpeg", [
    "-y",
    "-loglevel", "error",
    "-i", pngPath,
    "-vf", `scale='min(${maxWidth},iw)':-2:flags=lanczos`,
    "-quality", "82",
    webpPath,
  ]);
}

/**
 * Ré-encode la capture brute de Playwright en webm (VP9) + mp4 (h264),
 * muettes, coupées à la fenêtre utile et redescendues sous le budget de poids.
 */
async function encodeLoop(sourceVideo, offsetSeconds, seconds, outDir, device) {
  const height = device === "phone" ? 960 : 1080;
  const common = [
    "-y",
    "-loglevel", "error",
    "-ss", offsetSeconds.toFixed(3),
    "-t", seconds.toFixed(3),
    "-i", sourceVideo,
    "-an",
    "-vf", `scale=-2:'min(${height},ih)':flags=lanczos`,
  ];
  const webm = path.join(outDir, "loop.webm");
  const mp4 = path.join(outDir, "loop.mp4");

  for (const crf of [30, 34, 38, 42]) {
    await run("ffmpeg", [
      ...common,
      "-c:v", "libvpx-vp9",
      "-crf", String(crf),
      "-b:v", "0",
      "-row-mt", "1",
      "-deadline", "good",
      webm,
    ]);
    if ((await stat(webm)).size <= MAX_LOOP_BYTES) break;
  }

  await run("ffmpeg", [
    ...common,
    "-c:v", "libx264",
    "-crf", "24",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    mp4,
  ]);
}

/* -------------------------------------------------------------------------
   Capture d'un projet
   ------------------------------------------------------------------------- */

async function capture(browser, project) {
  const { slug, url, device } = project;
  const scenario = SCENARIOS[slug] ?? { act: (p) => smoothScroll(p, 0, 0.85), stills: [0.35, 0.7] };
  const outDir = path.join(WORK, slug);
  const videoDir = path.join(WORK, `${slug}-video`);
  await mkdir(outDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });

  const viewport = VIEWPORT[device];
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    isMobile: device === "phone",
    hasTouch: device === "phone",
    reducedMotion: "no-preference",
  });

  const page = await context.newPage();

  try {
    if (scenario.prepare) await scenario.prepare(page);

    // Sans identifiants on capture quand même l'écran public : mieux vaut une
    // image réelle mais pauvre qu'un chemin mort dans les fiches projet.
    const loggedIn = scenario.login ? await scenario.login(page) : null;
    if (loggedIn === false) {
      console.warn(
        `  ⚠ ${slug} : identifiants absents du .env — seul l'écran de connexion ` +
          `sera capturé. Renseigner ${slug.toUpperCase()}_EMAIL / ${slug.toUpperCase()}_PASSWORD puis relancer ` +
          `« npm run captures ${slug} » pour montrer l'application elle-même.`
      );
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    } else if (loggedIn === null) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    await settle(page);
    const landing = page.url();

    // Conversion webp différée : entre le poster et le départ de la boucle,
    // une page animée ne doit pas avoir le temps de changer.
    const shots = [];
    let shotIndex = 0;
    const shoot = async (name) => {
      const png = path.join(outDir, `${name ?? `capture-${++shotIndex}`}.png`);
      await page.screenshot({ path: png });
      shots.push(png);
    };

    const stills = scenario.gallery ? [] : (scenario.stills ?? [0.35, 0.7]);
    if (typeof stills === "function") {
      await stills(page, shoot);
    } else {
      for (const ratio of stills) {
        await scrollToRatio(page, ratio);
        await shoot();
      }
    }

    // Les captures ont déplacé la page : on revient à l'état d'arrivée pour
    // que le poster et la première image de la boucle soient le même écran.
    // Recharger la même URL restaure la position de défilement.
    await page.goto(landing, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await settle(page);
    if (scenario.opening) await scenario.opening(page);

    await shoot("poster");
    const recording = await startRecording(page, videoDir, viewport);
    await flashMarker(page);
    await page.waitForTimeout(250 + HOLD_MS);
    const actStart = Date.now();
    await scenario.act(page);
    const actSeconds = (Date.now() - actStart) / 1000;
    await page.waitForTimeout(300);

    const videoPath = await recording.stop();
    await context.close();
    const offset = await markerEnd(videoPath);
    await encodeLoop(videoPath, offset, (250 + HOLD_MS) / 1000 + actSeconds, outDir, device);

    const widthFor = (kind) => (kind === "phone" ? 900 : 1920);
    const converted = shots.map((png) => [png, widthFor(device)]);
    if (scenario.gallery) {
      const gallery = await captureGallery(browser, url, scenario.gallery, outDir);
      for (const png of gallery) converted.push([png, widthFor(scenario.gallery.device)]);
    }
    for (const [png, maxWidth] of converted) {
      await toWebp(png, png.replace(/\.png$/, ".webp"), maxWidth);
      // Pleine densité pour l'agrandissement dans les fiches projet.
      if (!png.endsWith("poster.png")) {
        const full = png.replace(/\.png$/, "-full.webp");
        await toWebp(png, full, 4000);
        // Capture déjà à pleine densité : la fiche retombe sur la version courante.
        const [a, b] = await Promise.all([readFile(full), readFile(png.replace(/\.png$/, ".webp"))]);
        if (a.equals(b)) await rm(full);
      }
      await rm(png);
    }
    await rm(videoDir, { recursive: true, force: true });
    return true;
  } catch (error) {
    await context.close().catch(() => {});
    await rm(videoDir, { recursive: true, force: true });
    throw error;
  }
}

/* -------------------------------------------------------------------------
   Entrée
   ------------------------------------------------------------------------- */

async function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!existsSync(file)) return;
  for (const line of (await readFile(file, "utf8")).split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  await loadDotEnv();
  const only = process.argv.slice(2);
  const projects = (await readProjects()).filter(
    (p) => only.length === 0 || only.includes(p.slug)
  );
  if (projects.length === 0) {
    console.error("Aucun projet à capturer.");
    process.exit(1);
  }

  await rm(WORK, { recursive: true, force: true });
  await mkdir(WORK, { recursive: true });

  const browser = await chromium.launch();
  const done = [];
  try {
    for (const project of projects) {
      console.log(`→ ${project.slug} (${project.device}) ${project.url}`);
      try {
        if (await capture(browser, project)) done.push(project.slug);
      } catch (error) {
        console.warn(`  ✗ ${project.slug} : ${error.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
  }

  // Promotion : les médias ne sont remplacés qu'une fois tout produit.
  for (const slug of done) {
    const target = path.join(MEDIA, slug);
    await rm(target, { recursive: true, force: true });
    await cp(path.join(WORK, slug), target, { recursive: true });
    console.log(`  ✓ public/media/${slug}`);
  }
  await rm(WORK, { recursive: true, force: true });

  if (done.length < projects.length) {
    console.warn("\nCertains projets ont été ignorés (voir ci-dessus).");
  }
}

await main();
