import { z } from "zod";
import type { Locale } from "@/core/domain/locale";

const usesItemSchema = z.object({
  name: z.string().min(1),
  why: z.string().min(1),
});

export const usesCategorySchema = z.object({
  title: z.string().min(1),
  items: z.array(usesItemSchema).min(1),
});

export type UsesItem = z.infer<typeof usesItemSchema>;
export type UsesCategory = z.infer<typeof usesCategorySchema>;

const en: UsesCategory[] = [
  {
    title: "Editor & Terminal",
    items: [
      { name: "VS Code", why: "Daily driver — rich extensions and remote dev where the team lives." },
      { name: "Neovim", why: "Muscle memory that outlives editor trends; fast edits over SSH." },
      { name: "Ghostty", why: "GPU-fast, config-as-code, no Electron tax." },
      { name: "zsh + starship", why: "A prompt that surfaces git and context without noise." },
    ],
  },
  {
    title: "Languages & Tooling",
    items: [
      { name: "TypeScript", why: "Taste at the UI edge, types all the way down." },
      { name: "Go", why: "Small, boring services that just run." },
      { name: "Rust", why: "When correctness has to be load-bearing." },
      { name: "pnpm / npm", why: "Reproducible installs and lockfiles I trust in CI." },
    ],
  },
  {
    title: "Hardware",
    items: [
      { name: "MacBook Pro", why: "Silent, all-day battery, no compromises." },
      { name: "External display", why: "Vertical space for diffs, logs, and docs side by side." },
      { name: "Mechanical keyboard", why: "Tactile feedback that makes long sessions painless." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Edge deploys, DNS, and Workers — fast by default." },
      { name: "GitHub", why: "Where the code, reviews, and CI live." },
      { name: "Linear", why: "Issue tracking that stays out of the way." },
      { name: "Figma", why: "Designing in the same tokens the site ships." },
    ],
  },
];

const fr: UsesCategory[] = [
  {
    title: "Éditeur & Terminal",
    items: [
      { name: "VS Code", why: "Outil principal — extensions riches et dev à distance, là où l'équipe travaille." },
      { name: "Neovim", why: "Une mémoire musculaire qui survit aux modes ; édition rapide en SSH." },
      { name: "Ghostty", why: "Rapide (GPU), config-as-code, sans la taxe Electron." },
      { name: "zsh + starship", why: "Un prompt qui montre le git et le contexte sans bruit." },
    ],
  },
  {
    title: "Langages & Outils",
    items: [
      { name: "TypeScript", why: "Le goût à la lisière de l'UI, des types de bout en bout." },
      { name: "Go", why: "Des services petits, sobres, qui tournent sans surprise." },
      { name: "Rust", why: "Quand la justesse doit être porteuse." },
      { name: "pnpm / npm", why: "Des installs reproductibles et des lockfiles fiables en CI." },
    ],
  },
  {
    title: "Matériel",
    items: [
      { name: "MacBook Pro", why: "Silencieux, autonomie toute la journée, sans compromis." },
      { name: "External display", why: "De la place verticale pour les diffs, logs et docs côte à côte." },
      { name: "Mechanical keyboard", why: "Un retour tactile qui rend les longues sessions indolores." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Déploiements edge, DNS et Workers — rapides par défaut." },
      { name: "GitHub", why: "Là où vivent le code, les revues et la CI." },
      { name: "Linear", why: "Un suivi des tickets qui se fait oublier." },
      { name: "Figma", why: "Concevoir avec les mêmes tokens que le site livre." },
    ],
  },
];

// Validate at module load — same discipline as project.ts.
export const uses: Record<Locale, UsesCategory[]> = {
  en: z.array(usesCategorySchema).parse(en),
  fr: z.array(usesCategorySchema).parse(fr),
};

export function getUses(locale: Locale): UsesCategory[] {
  return uses[locale];
}
