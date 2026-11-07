// @vitest-environment happy-dom
import { expect, it } from 'vitest';

// What the last start was told by the organization (ADR-117), before the UI's module is read.
localStorage.setItem(
  'slidr.languageOffer',
  JSON.stringify({ offered: ['ar', 'he'], preferred: 'ar' }),
);
const { currentLanguage, i18n, languageReady, offerLanguages, offeredLanguages } =
  await import('./index');

it('starts in the language the organization offered last time, its strings loaded first', async () => {
  expect(currentLanguage()).toBe('ar');
  expect(offeredLanguages()).toEqual(['he', 'ar']);
  expect(document.documentElement.dir).toBe('rtl');
  await languageReady;
  expect(i18n.t('crash.reload')).toBe('إعادة التحميل');
});

it('remembers a new offer, and forgets it when the organization has none', async () => {
  await offerLanguages(['he', 'en'], 'he');
  expect(currentLanguage()).toBe('he');
  expect(JSON.parse(localStorage.getItem('slidr.languageOffer') ?? 'null')).toEqual({
    offered: ['he', 'en'],
    preferred: 'he',
  });
  await offerLanguages();
  expect(localStorage.getItem('slidr.languageOffer')).toBeNull();
});
