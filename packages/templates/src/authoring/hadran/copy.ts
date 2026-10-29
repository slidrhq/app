// The words of the Hadran (Encore) sample deck, one module a language: Night Tram Records, an
// independent label in Lisbon, launches its 2027 season (twelve records, a tour of eighteen
// cities, a school for teenagers) to its artists, partners and press. Each language is written
// for its own readers, with the names of the people and places as they are written in it, and
// its own way with figures. A language is added as a module beside these and a line in the map.
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
 * A title or a short block of one line, or the lines it breaks into where the box would break
 * it badly (Chinese breaks between any two characters, Korean only at its spaces).
 */
export type Title = string | string[];

export interface HadranCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: string[]; meta: string };
  section: { name: string; part: string; title: string[]; subtitle: string };
  /**
   * The text slide, the evening's setlist: a lead of two lines, given in its lines where the
   * language may break anywhere, and four points, each one line that opens with a few words in
   * bold.
   */
  setlist: {
    name: string;
    title: Title;
    intro: Title;
    items: [opening: string, rest: string][];
  };
  /** The big number: last season. */
  season: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: Title };
    others: [value: string, label: string][];
  };
  /** Text and image: how the label records. */
  room: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  /** The full image: the home stage. */
  depot: { name: string; place: string; title: string[]; body: string };
  /** The quote, given in its lines where the language breaks it badly by itself. */
  quote: { name: string; text: Title; who: string; role: string };
  /** The cards: the three stages of the season. */
  stages: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: Title][];
    note: string;
  };
  /** The timeline: the season, stop by stop. */
  calendar: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: Title][];
    note: string;
  };
  /** The process: from a demo to a record. */
  making: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  /** The comparison: the school, then and now. */
  school: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  /** The chart: records and tickets, year by year. */
  growth: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [records: string, tickets: string];
    figures: [value: string, body: Title][];
  };
  /** The table: five dates of the tour. */
  tour: {
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
    people: [city: string, name: string, role: Title][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const HADRAN_COPY: Localized<HadranCopy> = {
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
} satisfies Record<ContentLanguage, HadranCopy>;
