// The words of the Tavlin (Spice) sample deck, one module a language: Seven Spices, a food
// festival in Lisbon's Old Customs Market, briefs its partners (stallholders, chefs, sponsors) on
// its third edition, 14 to 16 May 2027. Each language is written for its own readers, with the
// names of the people and places as they are written in it, and its own way with figures.
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

export interface TavlinCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: Title; meta: string };
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
  masterclass: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  market: { name: string; place: string; title: string[]; body: string };
  quote: { name: string; text: string; who: string; role: string };
  programmes: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: string][];
    note: string;
  };
  countdown: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: string][];
    note: string;
  };
  blend: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  longTable: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  guests: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    /** The two editions the chart compares. */
    series: [first: string, second: string];
    /** The three days of the festival. */
    days: [friday: string, saturday: string, sunday: string];
    figures: [value: string, body: string][];
  };
  spices: {
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
    people: [city: string, name: string, role: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const TAVLIN_COPY: Localized<TavlinCopy> = {
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
} satisfies Record<ContentLanguage, TavlinCopy>;
