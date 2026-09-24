import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    role: z.string(),
    stack: z.array(z.string()).min(1),
    /** Couleur du fil conducteur — hex 6 chiffres, dérivées calculées au build. */
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    /** Cadre dans lequel le produit est présenté, et format des captures. */
    device: z.enum(["phone", "browser"]).default("browser"),
    year: z.number().int(),
    /** Un projet `wip` n'a ni lien ni média : le site en ligne n'est pas encore le sien. */
    status: z.enum(["live", "wip"]).default("live"),
    links: z
      .object({
        demo: z.url().optional(),
        code: z.url().optional(),
      })
      .default({}),
    media: z
      .object({
        poster: z.string().optional(),
        video: z
          .object({
            webm: z.string().optional(),
            mp4: z.string().optional(),
          })
          .optional(),
        gallery: z
          .array(z.object({ src: z.string(), caption: z.string() }))
          .default([]),
        /** Format des captures de galerie, quand il diffère de celui du cadre. */
        galleryDevice: z.enum(["phone", "browser"]).optional(),
      })
      .default({ gallery: [] }),
    featured: z.boolean().default(false),
    order: z.number().int(),
  }),
});

export const collections = { projects };
