// The words of the Rakia sample deck, one module a language: the first-light briefing of Meridian
// Peak Observatory, a mountain observatory whose new 2.4-metre telescope sees its first starlight
// on 12 March 2027. Each language is written for its own readers, with the names of the people
// as they are written in it, and its own way with figures. A language is one more module and one
// more line in the map below.
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

/** A title of one line, or the lines it breaks into where the box would break it badly. */
export type Title = string | string[];

export interface RakiaCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: string[]; meta: string };
  section: { name: string; part: string; title: string[]; subtitle: string };
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
  figures: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: string };
    others: [value: string, label: string][];
  };
  mirror: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  site: { name: string; place: string; title: string[]; body: string };
  /** The quote, given in its lines where the language may break anywhere. */
  quote: { name: string; text: Title; who: string; role: string };
  programmes: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: string][];
    note: string;
  };
  milestones: {
    name: string;
    kicker: string;
    title: Title;
    stops: [year: string, title: string, body: string][];
    note: string;
  };
  nights: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  views: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  clear: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    /** The four seasons of the year, the chart's categories. */
    seasons: [string, string, string, string];
    series: [clear: string, sharp: string];
    figures: [value: string, body: string][];
  };
  targets: {
    name: string;
    kicker: string;
    title: Title;
    note: string;
    header: string[];
    rows: string[][];
  };
  team: {
    name: string;
    kicker: string;
    title: Title;
    people: [field: string, name: string, role: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const RAKIA_COPY: Localized<RakiaCopy> = {
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
} satisfies Record<ContentLanguage, RakiaCopy>;
