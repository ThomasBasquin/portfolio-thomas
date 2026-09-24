/**
 * Dérivations de couleur exécutées au build (aucun JS client).
 * À partir de l'accent hex d'un projet, produit des variantes garanties
 * lisibles (WCAG AA) sur le fond du site.
 */

/** Doit suivre `--bg` : les seuils de contraste sont calculés contre lui. */
const BG_HEX = "#0c0d10";

type Oklch = { l: number; c: number; h: number };

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

export function contrast(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Conversions OKLab d'après Björn Ottosson (https://bottosson.github.io/posts/oklab/)
function hexToOklch(hex: string): Oklch {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: L,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklchToHex({ l, c, h }: Oklch): string | null {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  if (r < -0.001 || r > 1.001 || g < -0.001 || g > 1.001 || bl < -0.001 || bl > 1.001) {
    return null;
  }
  const to = (v: number) => linearToSrgb(v).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(bl)}`;
}

function toGamut(target: Oklch): string {
  let c = target.c;
  for (let i = 0; i < 40; i++) {
    const hex = oklchToHex({ ...target, c });
    if (hex) return hex;
    c -= target.c / 40;
  }
  return oklchToHex({ ...target, c: 0 }) ?? "#ffffff";
}

export type AccentRoles = {
  /** Couleur brute du projet — aplats, dégradés, lueurs. */
  accent: string;
  /** Variante texte, ≥ 4.5:1 garanti sur le fond du site. */
  ink: string;
  /** Teinte sombre du même accent — fonds discrets, lavis. */
  deep: string;
  /** Couleur de la barre navigateur (meta theme-color). */
  theme: string;
};

export function accentRoles(accentHex: string): AccentRoles {
  const base = hexToOklch(accentHex);

  let ink = toGamut({ l: Math.max(base.l, 0.74), c: Math.min(base.c, 0.14), h: base.h });
  let l = Math.max(base.l, 0.74);
  while (contrast(ink, BG_HEX) < 4.6 && l < 0.98) {
    l += 0.02;
    ink = toGamut({ l, c: Math.min(base.c, 0.14), h: base.h });
  }

  const deep = toGamut({ l: 0.22, c: Math.min(base.c, 0.055), h: base.h });
  const theme = toGamut({ l: 0.16, c: Math.min(base.c, 0.03), h: base.h });

  return { accent: accentHex, ink, deep, theme };
}

/** Accent par défaut du site (vert mousse), même pipeline que les projets. */
export const SITE_ACCENT = accentRoles("#3fae6a");
