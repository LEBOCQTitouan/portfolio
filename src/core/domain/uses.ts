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
      { name: "Ghostty", why: "GPU-fast terminal, config-as-code, no Electron tax." },
      { name: "Neovim (LazyVim)", why: "A LazyVim setup tuned by hand: fast, modal, mine." },
      { name: "tmux", why: "Persistent sessions; my workspace survives a closed lid." },
      { name: "zsh + starship", why: "A quiet shell with a prompt that surfaces git and context." },
    ],
  },
  {
    title: "Tooling",
    items: [
      { name: "chezmoi", why: "Every dotfile as code; a fresh machine set up in one command." },
      { name: "atuin", why: "Shell history as a searchable, synced database." },
      { name: "git-delta", why: "Diffs and blames actually worth reading." },
      { name: "zoxide", why: "A cd that learns where I go." },
      { name: "fzf", why: "Fuzzy-find anything: files, history, branches." },
      { name: "lazygit", why: "A git TUI for everything beyond commit." },
    ],
  },
  {
    title: "Dev workflow",
    items: [
      { name: "Conductor", why: "Many coding agents in parallel, each in its own workspace." },
      { name: "Claude Code", why: "Agentic development as a daily driver, not a demo." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Edge hosting, DNS, and Workers; fast by default." },
      { name: "GitHub", why: "Where the code, reviews, and CI live." },
      { name: "Figma", why: "Designing in the same tokens the site ships." },
    ],
  },
];

const fr: UsesCategory[] = [
  {
    title: "Éditeur & Terminal",
    items: [
      { name: "Ghostty", why: "Terminal rapide (GPU), config-as-code, sans la taxe Electron." },
      { name: "Neovim (LazyVim)", why: "Une config LazyVim peaufinée à la main : rapide, modale, la mienne." },
      { name: "tmux", why: "Sessions persistantes ; mon espace de travail survit au capot fermé." },
      { name: "zsh + starship", why: "Un shell sobre, avec un prompt qui montre le git et le contexte." },
    ],
  },
  {
    title: "Outils",
    items: [
      { name: "chezmoi", why: "Chaque dotfile en tant que code ; une machine neuve configurée en une commande." },
      { name: "atuin", why: "L'historique du shell comme une base de données, cherchable et synchronisée." },
      { name: "git-delta", why: "Des diffs et des blames enfin lisibles." },
      { name: "zoxide", why: "Un cd qui apprend où je vais." },
      { name: "fzf", why: "Recherche floue de tout : fichiers, historique, branches." },
      { name: "lazygit", why: "Une interface git en terminal pour tout ce qui dépasse le commit." },
    ],
  },
  {
    title: "Workflow (IA / agents)",
    items: [
      { name: "Conductor", why: "Plusieurs agents de code en parallèle, chacun dans son espace." },
      { name: "Claude Code", why: "Le développement agentique au quotidien, pas en démo." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Hébergement edge, DNS et Workers ; rapides par défaut." },
      { name: "GitHub", why: "Là où vivent le code, les revues et la CI." },
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
