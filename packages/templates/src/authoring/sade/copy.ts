// The words of the Harvest sample deck, one module a language: the harvest report of
// Commonfield, a cooperative of 212 family farms, at its members' assembly. Each language is
// written for its own readers, with the names of the people as they are written in it, and its
// own way with figures. A language is added as a module of its own and a line in `SADE_COPY`.
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

export interface SadeCopy {
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
  /** The harvest in figures: the main one, and three that stand on the grain bins. */
  figures: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: string };
    others: [value: string, label: string][];
  };
  /** The project of the year, in three points on a drip line. */
  project: {
    name: string;
    kicker: string;
    title: Title;
    items: [title: string, body: string][];
  };
  /** The fields from above. */
  fields: { name: string; place: string; title: string[]; body: string };
  /** The quote: one paragraph, or the lines it is set in where the language breaks anywhere. */
  quote: { name: string; text: Title; who: string; role: string };
  /** The three programmes, a seed packet each. */
  programmes: {
    name: string;
    kicker: string;
    title: Title;
    cards: [label: string, title: string, body: string][];
    note: string;
  };
  /** The season ahead: winter, spring, summer, autumn. */
  season: {
    name: string;
    kicker: string;
    title: Title;
    stops: [when: string, title: string, body: string][];
    note: string;
  };
  /** How a farm joins the switch, in five steps on five plots. */
  joining: {
    name: string;
    kicker: string;
    title: Title;
    steps: [step: string, caption: string][];
    note: string;
  };
  /** Two soil profiles: ploughed, and no-till. */
  soil: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  water: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [ours: string, region: string];
    figures: [value: string, body: string][];
  };
  crops: {
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
    people: [role: string, name: string, about: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const SADE_COPY: Localized<SadeCopy> = {
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
} satisfies Record<ContentLanguage, SadeCopy>;
