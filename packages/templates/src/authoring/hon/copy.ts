// The words of the Hon sample deck, one module a language: the annual results of Larkfield
// Mutual, a savings bank owned by its members since 1931, presented to them at the Annual General
// Meeting. Each language is written for its own readers, with its own way with figures.
import type { ContentLanguage, Localized } from '@slidr/model';
import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { he } from './he';
import { hi } from './hi';
import { id } from './id';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { ptBR } from './pt-BR';
import { ru } from './ru';
import { tr } from './tr';
import { vi } from './vi';
import { zhCN } from './zh-CN';

/**
 * A title or a short block: one paragraph, or the lines it breaks into where the box would break
 * it badly (Korean breaks only at spaces, Chinese and Japanese between any two characters).
 */
export type Title = string | string[];

export interface HonCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: string[]; meta: string };
  /**
   * The text slide: a lead of two lines, given in its lines where the language may break
   * anywhere, and four points, each one line that opens with a few words in bold.
   */
  agenda: {
    name: string;
    title: Title;
    intro: Title;
    items: [opening: string, rest: string][];
  };
  section: { name: string; part: string; title: string[]; subtitle: string };
  figures: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: string };
    others: [value: string, label: Title][];
  };
  savings: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [savings: string, loans: string];
    figures: [value: string, body: Title][];
  };
  lines: {
    name: string;
    kicker: string;
    title: Title;
    note: string;
    header: string[];
    rows: string[][];
  };
  profit: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: Title][];
    note: string;
  };
  owners: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  homes: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  street: { name: string; place: string; title: string[]; body: string };
  quote: { name: string; text: Title; who: string; role: string };
  lending: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: Title][];
    note: string;
  };
  history: {
    name: string;
    kicker: string;
    title: Title;
    stops: [year: string, title: string, body: Title][];
    note: string;
  };
  team: {
    name: string;
    kicker: string;
    title: Title;
    people: [desk: string, name: string, role: Title][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

/** The sample in every language of the app, each a module of its own. */
export const HON_COPY: Localized<HonCopy> = {
  he,
  en,
  ar,
  de,
  es,
  fr,
  it,
  'pt-BR': ptBR,
  ru,
  tr,
  vi,
  id,
  hi,
  ja,
  ko,
  'zh-CN': zhCN,
} satisfies Record<ContentLanguage, HonCopy>;
