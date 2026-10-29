// The words of the Dofek sample deck, one module a language: Coastal District Health briefs the
// district council on Four Minutes, its programme to restart a heart before the ambulance
// arrives. Each language is written for its own readers, with the names of the people and the
// places as they are written in it, and its own way with figures. A language is added as a module
// of its own and a line in `DOFEK_COPY`.
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

export interface DofekCopy {
  /** The deck's footer. */
  footer: string;
  hero: { name: string; org: string; title: string[]; subtitle: string[]; meta: string };
  /**
   * The text slide: a lead of two lines, given in its lines where the language may break
   * anywhere, and four points, each one line that opens with a few words in bold.
   */
  agenda: { name: string; title: Title; intro: Title; items: [opening: string, rest: string][] };
  section: { name: string; part: string; title: string[]; subtitle: string };
  /** The year in figures, on the monitor: the main channel and three beside it. */
  figures: {
    name: string;
    kicker: string;
    title: Title;
    hero: { value: string; label: string; note: string };
    others: [value: string, label: string][];
  };
  /** Before the programme and since. */
  change: {
    name: string;
    kicker: string;
    title: Title;
    before: [label: string, title: string, body: string];
    after: [label: string, title: string, body: string];
  };
  /** The first minutes after a call, in five steps, each at its time. */
  chain: {
    name: string;
    kicker: string;
    title: Title;
    steps: [time: string, step: string, caption: string][];
    note: string;
  };
  responders: { name: string; kicker: string; title: Title; items: [title: string, body: string][] };
  park: { name: string; place: string; title: string[]; body: string };
  /** The words, given in their lines where the language breaks between phrases. */
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
  trend: {
    name: string;
    kicker: string;
    title: Title;
    source: string;
    series: [cpr: string, home: string];
    figures: [value: string, body: string][];
  };
  areas: {
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
    people: [unit: string, name: string, role: string][];
  };
  closing: { name: string; kicker: string; title: string[]; lines: string[]; meta: string };
}

export const DOFEK_COPY: Localized<DofekCopy> = {
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
} satisfies Record<ContentLanguage, DofekCopy>;
