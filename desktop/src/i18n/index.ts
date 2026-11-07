import i18n, { type Resource } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { en } from './en';
import { he, type Messages } from './he';

/**
 * UI language (UI-05). Strings live in namespaces: the shell's are `shell` (he.ts, en.ts);
 * another area adds its own with `registerMessages`. Hebrew and English are written by hand, the
 * other languages are translated from them into `locales/<code>.json`, one file per language
 * with every namespace in it. Changing the language re-renders every `useTranslation` and
 * mirrors the layout, with no reload. Until the user picks one, the UI is in the language of the
 * system, or in English when the app does not have it.
 */

/** The UI languages, in the order the picker lists them: each by its own name, Latin first. */
export const languages = [
  'id',
  'de',
  'en',
  'es',
  'fr',
  'it',
  'pt-BR',
  'vi',
  'tr',
  'ru',
  'he',
  'ar',
  'hi',
  'ko',
  'zh-CN',
  'ja',
] as const;
export type Language = (typeof languages)[number];

/** Each language by its own name, for the picker, and by its English one, for the agent. */
const names: Record<Language, { native: string; english: string }> = {
  id: { native: 'Bahasa Indonesia', english: 'Indonesian' },
  de: { native: 'Deutsch', english: 'German' },
  en: { native: 'English', english: 'English' },
  es: { native: 'Español', english: 'Spanish' },
  fr: { native: 'Français', english: 'French' },
  it: { native: 'Italiano', english: 'Italian' },
  'pt-BR': { native: 'Português (Brasil)', english: 'Brazilian Portuguese' },
  vi: { native: 'Tiếng Việt', english: 'Vietnamese' },
  tr: { native: 'Türkçe', english: 'Turkish' },
  ru: { native: 'Русский', english: 'Russian' },
  he: { native: 'עברית', english: 'Hebrew' },
  ar: { native: 'العربية', english: 'Arabic' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
  ko: { native: '한국어', english: 'Korean' },
  'zh-CN': { native: '中文（简体）', english: 'Simplified Chinese' },
  ja: { native: '日本語', english: 'Japanese' },
};

/** A language's name in its own language, such as French or Hebrew. */
export const nativeName = (language: Language): string => names[language].native;

/** A language in English, the way the agent is told which language to answer in. */
export const englishName = (language: Language): string => names[language].english;

const STORAGE_KEY = 'slidr.language';

function isLanguage(value: unknown): value is Language {
  return languages.includes(value as Language);
}

/** Old codes some systems still give, by the code of today. */
const RENAMED: Record<string, string> = { iw: 'he', in: 'id' };

/**
 * The UI language for a language tag, as a system, a browser or a deck gives it: "fr-CA" is
 * French, "pt-PT" Portuguese and "zh-Hans-SG" Simplified Chinese. Undefined for a language the
 * app does not have, Traditional Chinese among them.
 */
export function languageOf(tag: string): Language | undefined {
  const [first = '', ...rest] = tag.toLowerCase().split(/[-_]/);
  const base = RENAMED[first] ?? first;
  if (base === 'zh') {
    const traditional = rest.some((part) => ['hant', 'tw', 'hk', 'mo'].includes(part));
    return traditional ? undefined : 'zh-CN';
  }
  return languages.find((language) => language.split('-')[0]!.toLowerCase() === base);
}

/**
 * The language of words the app writes into a deck, such as the labels of a new chart: the
 * deck's when the app has it, else English.
 */
export const deckLanguage = (lang: string): Language => languageOf(lang) ?? 'en';

/** The first of the system's languages the app has, or English. */
export function systemLanguage(): Language {
  const tags =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  for (const tag of tags) {
    const language = tag ? languageOf(tag) : undefined;
    if (language) return language;
  }
  return 'en';
}

function storedLanguage(): Language | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(value)) return value;
  } catch {
    // Storage can be unavailable; the system's language will do.
  }
  return undefined;
}

/** The document follows the language: `lang` for fonts and screen readers, `dir` for layout. */
function applyToDocument(language: string): void {
  document.documentElement.lang = language;
  document.documentElement.dir = i18n.dir(language);
}

/**
 * The translated languages, every namespace of each in one file: `locales/fr.json`. Each is a
 * chunk of its own, loaded when the language is shown (`loadLanguage`), so the app does not
 * carry the strings of fourteen languages to start in one.
 */
const translated = new Map<string, () => Promise<Resource[string]>>();
for (const [path, load] of Object.entries(
  import.meta.glob<Resource[string]>('./locales/*.json', { import: 'default' }),
)) {
  const language = /\/([^/]+)\.json$/.exec(path)?.[1];
  if (language) translated.set(language, load);
}

/** The loads of translated languages, started or done, by language. */
const loads = new Map<string, Promise<void>>();

/**
 * Loads the strings of a UI language, once: a file of the app, not of the network. Hebrew and
 * English are always there. A load that fails is said to the console and tried again next time;
 * meanwhile the language shows its English strings.
 */
export function loadLanguage(language: string): Promise<void> {
  const load = translated.get(language);
  if (!load) return Promise.resolve();
  let loaded = loads.get(language);
  if (!loaded) {
    loaded = load().then(
      (namespaces) => {
        for (const [namespace, strings] of Object.entries(namespaces)) {
          i18n.addResourceBundle(language, namespace, strings, true, true);
        }
      },
      (error: unknown) => {
        loads.delete(language);
        console.error(`The ${language} strings could not be loaded`, error);
      },
    );
    loads.set(language, loaded);
  }
  return loaded;
}

/** Loads every translated language: for the tests that read them all. */
export async function loadAllLanguages(): Promise<void> {
  await Promise.all(languages.map(loadLanguage));
}

/** Where the organization's last offer of languages is remembered (ADR-117). */
const OFFER_KEY = 'slidr.languageOffer';

/** What the organization offered: its languages, and the one it starts in. */
interface Offer {
  offered: readonly Language[];
  preferred?: Language;
}

/** The languages `allowed` names, in the picker's order: every one when it names none. */
function offerOf(allowed: readonly string[] | undefined, preferred: string | undefined): Offer {
  const named = allowed?.filter(isLanguage) ?? [];
  return {
    offered:
      named.length > 0 ? languages.filter((language) => named.includes(language)) : languages,
    ...(isLanguage(preferred) ? { preferred } : {}),
  };
}

/**
 * The organization's offer as the last start was told it, so this start shows the language it
 * will be told before its settings have come, and the UI does not change language before the
 * user's eyes. Every language when nothing is remembered.
 */
function rememberedOffer(): Offer {
  try {
    const stored = JSON.parse(localStorage.getItem(OFFER_KEY) ?? 'null') as {
      offered?: unknown;
      preferred?: unknown;
    } | null;
    if (stored && Array.isArray(stored.offered)) {
      return offerOf(
        stored.offered.filter((language): language is string => typeof language === 'string'),
        typeof stored.preferred === 'string' ? stored.preferred : undefined,
      );
    }
  } catch {
    // Storage can be unavailable, or hold something else: every language is offered.
  }
  return offerOf(undefined, undefined);
}

/** Remembers the organization's offer for the next start; forgets it when there is none. */
function rememberOffer(
  allowed: readonly string[] | undefined,
  preferred: string | undefined,
): void {
  try {
    if (allowed?.some(isLanguage) || isLanguage(preferred)) {
      localStorage.setItem(OFFER_KEY, JSON.stringify({ offered: allowed ?? [], preferred }));
    } else {
      localStorage.removeItem(OFFER_KEY);
    }
  } catch {
    // Not remembered: the next start shows the UI in its language once its settings have come.
  }
}

/**
 * The language to show under an offer: the user's own choice while it is offered; else the
 * organization's preferred one; else the system's, when it is offered; else the first offered.
 */
function shownUnder({ offered, preferred }: Offer): Language {
  const has = (language: string | undefined): language is Language =>
    isLanguage(language) && offered.includes(language);
  const own = storedLanguage();
  const system = systemLanguage();
  return has(own) ? own : has(preferred) ? preferred : has(system) ? system : (offered[0] ?? 'en');
}

const startOffer = rememberedOffer();

/**
 * The UI languages the organization offers (ADR-117): every one until its settings say, or as
 * the last start was told.
 */
let offered: readonly Language[] = startOffer.offered;

void i18n.use(initReactI18next).init({
  resources: { he: { shell: he }, en: { shell: en } },
  lng: shownUnder(startOffer),
  // Hebrew and English have every string (the compiler sees to it), and a key missing in both
  // is a bug that is reported below. A translated language that lacks a string newer than its
  // translation shows the English one (the tests list what is missing), and so does one whose
  // file has not loaded yet.
  fallbackLng: (code) => (code === 'he' || code === 'en' ? [] : ['en']),
  ns: ['shell'],
  defaultNS: 'shell',
  interpolation: { escapeValue: false },
  initAsync: false,
  saveMissing: true,
  missingKeyHandler: (lngs, ns, key) => {
    console.error(`Missing ${lngs.join('/')} string: ${ns}:${key}`);
  },
  // A language's strings that come after the first render (a deck in another language than the
  // UI's) draw again every component that reads strings.
  react: { bindI18nStore: 'added' },
});
applyToDocument(i18n.language);
i18n.on('languageChanged', applyToDocument);

/**
 * The strings of the language the UI starts in. The app draws once they are there, so the first
 * render is in its language: at once for Hebrew and English, else a file of the app.
 */
export const languageReady: Promise<void> = loadLanguage(i18n.language);

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : 'en';
}

/**
 * The UI language, for a component, which is drawn again when it changes. The ready-made content
 * of the panels is offered in it, whatever language the open deck is in: the templates, the
 * designs, the frames and the card sets are shown, and go onto a slide, in the language chosen.
 */
export function useLanguage(): Language {
  const { i18n: current } = useTranslation();
  return isLanguage(current.language) ? current.language : 'en';
}

/** The languages the picker offers, in its order. */
export const offeredLanguages = (): readonly Language[] => offered;

/**
 * Offers only `allowed` of the UI languages, as the organization's settings say (ADR-117), and
 * shows the UI in one of them: the user's own choice while it is offered; else the organization's
 * `preferred`; else the system's, when it is offered; else the first offered. A choice that is not
 * offered is kept, and comes back if the organization offers it again. The offer is remembered,
 * so the next start shows the same language from its first render.
 */
export async function offerLanguages(
  allowed?: readonly string[],
  preferred?: string,
): Promise<void> {
  const offer = offerOf(allowed, preferred);
  offered = offer.offered;
  rememberOffer(allowed, preferred);
  const shown = shownUnder(offer);
  if (i18n.language !== shown) {
    await loadLanguage(shown);
    await i18n.changeLanguage(shown);
  }
}

/** Switches the UI language live and remembers it. */
export async function setLanguage(language: Language): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not remembered, but still switched.
  }
  await loadLanguage(language);
  await i18n.changeLanguage(language);
}

/**
 * Adds an area's strings under its own namespace; read them with `useTranslation(namespace)`.
 * Both languages are required, with the same keys; the translations come from `locales/`.
 */
export function registerMessages<T extends object>(
  namespace: string,
  messages: { he: T; en: Messages<NoInfer<T>> },
): void {
  i18n.addResourceBundle('he', namespace, messages.he, true, true);
  i18n.addResourceBundle('en', namespace, messages.en, true, true);
}

export { i18n };
