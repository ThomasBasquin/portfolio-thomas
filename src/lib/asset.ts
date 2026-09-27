import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const fingerprints = new Map<string, string>();

/**
 * Ajoute une empreinte de contenu aux médias servis depuis `public/`.
 *
 * Les captures gardent des noms stables d'une exécution de `npm run captures`
 * à l'autre, et nginx les sert avec `max-age=14400` : sans empreinte, un
 * visiteur déjà venu continue de voir les anciennes vidéos pendant quatre
 * heures après un déploiement. Le calcul a lieu au build, le client ne paie
 * rien.
 */
export function versioned(src: string): string {
  if (!src.startsWith("/")) return src;

  const known = fingerprints.get(src);
  if (known) return known;

  let out = src;
  try {
    const file = path.join(process.cwd(), "public", src);
    const hash = createHash("sha1").update(readFileSync(file)).digest("hex");
    out = `${src}?v=${hash.slice(0, 8)}`;
  } catch {
    // Média absent au build : servir le chemin nu vaut mieux qu'échouer.
  }

  fingerprints.set(src, out);
  return out;
}

/** Version pleine densité d'une capture de galerie, quand le script l'a produite. */
export function fullSize(src: string): string {
  const full = src.replace(/\.webp$/, "-full.webp");
  return full !== src && existsSync(path.join(process.cwd(), "public", full))
    ? versioned(full)
    : versioned(src);
}
