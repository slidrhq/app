import { CONTENT_LANGUAGES, languageDir, type RichText } from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { sampleDeck } from '../../builtin/kit';
import { entry as anan } from '../anan';
import { entry as mutzar } from '../mutzar';
import { entry as shvav } from '../shvav';

describe.each([anan, shvav, mutzar])('$id in every supported language', (entry) => {
  it('provides a complete sample with the original layouts, pictures and numeric chart data', () => {
    expect(Object.keys(entry.samples)).toEqual([...CONTENT_LANGUAGES]);
    const template = entry.template();
    for (const lang of CONTENT_LANGUAGES) {
      const samples = entry.samples[lang]!;
      expect(
        samples.map((s) => s.layout),
        lang,
      ).toEqual(entry.samples.en.map((s) => s.layout));
      const deck = sampleDeck(template, samples, { lang, dir: languageDir(lang) });
      expect(deck.meta.lang).toBe(lang);
      expect(deck.meta.dir).toBe(languageDir(lang));
      expect(deck.slides).toHaveLength(15);
      for (const [i, sample] of samples.entries()) {
        const original = entry.samples[lang === 'he' ? 'he' : 'en'][i]!;
        expect(sample.content.image, `${lang}/${sample.layout}`).toEqual(original.content.image);
        if (sample.chart) {
          expect(sample.chart.data.series.map((s) => s.values)).toEqual(
            original.chart!.data.series.map((s) => s.values),
          );
          expect(sample.chart.data.categories).toHaveLength(original.chart!.data.categories.length);
        }
        if (sample.table) {
          expect(sample.table.rows.map((r) => r.length)).toEqual(
            original.table!.rows.map((r) => r.length),
          );
          expect(sample.table.rows.flat().every((cell) => typeof cell === 'string')).toBe(true);
        }
      }
    }
  });

  it('fills the three points of the text slide in each added language (ADR-136)', () => {
    for (const lang of CONTENT_LANGUAGES.filter((l) => l !== 'he' && l !== 'en')) {
      const slide = entry.samples[lang]!.find((s) => s.layout === `l_${entry.id}_text`)!;
      for (const role of ['subtitle', 'body'] as const) {
        const fill = slide.content[role] as RichText[];
        expect(fill, `${lang} ${role}`).toHaveLength(3);
        for (const one of fill)
          expect(one.paragraphs[0]!.runs[0]!.text.trim().length, lang).toBeGreaterThan(0);
      }
    }
  });
});
