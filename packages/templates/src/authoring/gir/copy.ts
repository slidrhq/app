// The words of the Gir (Chalk) sample deck, one module a language: the parents' evening of Hillside
// Middle School, which welcomes the parents of its new Grade 7 a week before the school year begins.
// Each language is written for its own readers, with the names of the people as they are written
// in it, its own school's words for the grade, the homeroom teacher and the term, and its own way
// with dates and figures. A language is added as a module beside these and a line in `GIR_COPY`.
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

export interface GirCopy {
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
  /** The picture and the words beside it: the new science labs. */
  labs: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  /** The full picture: a lesson in the school garden. */
  garden: { name: string; place: string; title: Title; body: string };
  /** The principal's words, or the lines they are set in where the language breaks them badly. */
  quote: { name: string; text: Title; who: string; role: string };
  courses: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: string][];
    note: string;
  };
  year: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: string][];
    note: string;
  };
  help: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  classroom: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  reading: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    /** The months of the school year the chart counts, in order. */
    months: string[];
    series: [grade: string, town: string];
    figures: [value: string, body: string][];
  };
  clubs: {
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
    people: [subject: string, name: string, role: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const GIR_COPY: Localized<GirCopy> = {
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
} satisfies Record<ContentLanguage, GirCopy>;
