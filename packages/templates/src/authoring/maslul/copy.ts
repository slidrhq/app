// The words of the Maslul sample deck, one module a language: the 2027 season launch of Kestrel
// Athletics Club, a club of 640 athletes that moves from a borrowed school field to a floodlit
// track of its own. Each language is written for its own readers, with the names of the people
// as they are written in it, and its own way with figures and dates.
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

export interface MaslulCopy {
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
  academy: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  track: { name: string; place: string; title: string[]; body: string };
  quote: { name: string; text: string; who: string; role: string };
  groups: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: string][];
    note: string;
  };
  season: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: string][];
    note: string;
  };
  joining: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  thenNow: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  bests: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [youth: string, adults: string];
    figures: [value: string, body: string][];
  };
  timetable: {
    name: string;
    kicker: string;
    title: Title;
    note: string;
    header: string[];
    rows: string[][];
  };
  coaches: {
    name: string;
    kicker: string;
    title: Title;
    people: [group: string, name: string, role: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const MASLUL_COPY: Localized<MaslulCopy> = {
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
} satisfies Record<ContentLanguage, MaslulCopy>;
