// The words of the Taarucha (Exhibit) sample deck, one module a language: the Vellin Museum of
// Art previews its rehung collection wing to the press and its patrons, two days before the doors
// open. Each language is written for its own readers, with the names of the people as they are
// written in it, and its own way with figures and dates.
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

export interface TaaruchaCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: string[]; meta: string };
  section: { name: string; part: string; title: string[]; subtitle: Title };
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
  /** The big number: the figure on the tallest plinth, and three on the others. */
  figures: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: Title };
    others: [value: string, label: string][];
  };
  /** Text and image: the conservation studio. */
  studio: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  /**
   * The full image: a room of the new wing. Here and in the other short blocks below (the
   * quote, the cards, the tickets, the steps' captions, the people's roles) a script that may
   * break anywhere gives its lines.
   */
  gallery: { name: string; place: string; title: string[]; body: Title };
  quote: { name: string; text: Title; who: string; role: string };
  /** The cards: three new ways to visit. */
  visits: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: Title][];
    note: string;
  };
  /** The timeline: four dates of the wing's first year, a ticket each. */
  year: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: Title][];
    note: string;
  };
  /** The process: from the store to the wall, five rooms of a floor plan. */
  journey: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: Title][];
    note: string;
  };
  /** The comparison: the old hang and the new one. */
  rehang: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  /** The chart: works on view by period of making, before the closure and after. */
  onView: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [before: string, after: string];
    /** The five periods, oldest first. */
    periods: string[];
    figures: [value: string, body: string][];
  };
  /** The table: five of the twenty-two rooms. */
  rooms: {
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
    people: [department: string, name: string, role: Title][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

/** The sample's words in every language of the app, each a module of its own. */
export const TAARUCHA_COPY: Localized<TaaruchaCopy> = {
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
} satisfies Record<ContentLanguage, TaaruchaCopy>;
