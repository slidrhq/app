// The words of the Tefer sample deck, one module a language: Ourela, a label in Porto that cuts
// its coats from the wool mills could not sell, presents its Autumn–Winter 2027 collection to
// buyers in Paris. Each language is written for its own readers, with the names of the people
// and the places as they are written in it, and its own way with figures.
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

/**
 * A short text in a narrow box, or the lines it is set in where the language would break it
 * badly there (Chinese and Japanese break between characters, Korean at any space).
 */
export type Lines = string | string[];

export interface TeferCopy {
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
  /** The big number: the share of the cloth that was surplus, and three figures beside it. */
  cloth: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: string };
    others: [value: string, label: string][];
  };
  /** Text and image: how a coat is cut. */
  cutting: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  /** The full picture: the workroom. */
  workroom: { name: string; place: string; title: string[]; body: Lines };
  quote: { name: string; text: Lines; who: string; role: string };
  /** The cards: the three cloths of the season. */
  cloths: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: Lines][];
    note: string;
  };
  /** The timeline: the season, from the mill to the shops. */
  season: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: Lines][];
    note: string;
  };
  /** The process: the making of a coat, the hours of each step over it. */
  making: {
    name: string;
    kicker: string;
    title: Title;
    steps: [hours: string, step: string, caption: string][];
    note: string;
  };
  /** The comparison: the usual cut, and the label's. */
  cut: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  /** The chart: the cloth left over a coat, season by season. */
  waste: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [usual: string, ours: string];
    figures: [value: string, body: Lines][];
  };
  /** The table: the cloths and their mills. */
  mills: {
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
    people: [team: string, name: string, role: Lines][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const TEFER_COPY: Localized<TeferCopy> = {
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
} satisfies Record<ContentLanguage, TeferCopy>;
