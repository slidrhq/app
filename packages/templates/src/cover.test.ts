import {
  createElement,
  SLIDE_HEIGHT,
  type Element,
  type Frame,
  type Slide,
  type TextElement,
} from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { builtInAvailable, builtInTemplates } from './builtin';
import { COVER_ATTACHED, COVER_TITLE_SIZE, templateCover } from './cover';
import { nightTemplate, paperTemplate } from './fixtures';
import { LETTER_WEIGHTS, LETTERS } from './letters.generated';
import type { Template } from './template';

const titleOf = (slide: Slide) =>
  slide.elements.find((e): e is TextElement => e.type === 'text' && e.role === 'title')!;
const sizeOf = (slide: Slide) => titleOf(slide).content.paragraphs[0]!.runs[0]!.marks!.size!;
const named = (slide: Slide, id: string) => slide.elements.find((e) => e.id.endsWith(`_${id}`))!;
const bottom = (frame: Frame) => frame.y + frame.h;

/** How tall a family's letters stand in a script at a weight, at a size of 1. */
function lettersAt(family: string, script: string, weight: number): number {
  const [light, bold] = LETTERS[family]![script]!;
  const [from, to] = LETTER_WEIGHTS;
  return light + (bold - light) * Math.min(1, Math.max(0, (weight - from) / (to - from)));
}
/** How tall the letters of every cover's name stand in a script: Heebo's, at the cover size. */
const height = (script: string, family = 'Heebo') =>
  COVER_TITLE_SIZE * lettersAt(family, script, 700);

/** Night, drawn as Migdal draws its opening: a tab beside the title, a bar under it. */
function towerLike(): Template {
  const template = nightTemplate();
  template.theme.id = 'migdal';
  const rect = (id: string, frame: Frame): Element =>
    createElement.shape({ id, frame, geometry: { kind: 'preset', preset: 'rect' } });
  template.layouts[0]!.objects = [
    rect('d_migdal_hero_tab', { x: 1888, y: 378, w: 32, h: 212 }),
    rect('d_migdal_hero_bar', { x: 1728, y: 606, w: 96, h: 6 }),
    rect('d_migdal_hero_field', { x: 0, y: 0, w: 720, h: 1080 }),
  ];
  return template;
}

describe('templateCover', () => {
  it('sets the name on one line at the start, its letters as tall as on every cover', () => {
    for (const [template, lang, dir, name, family, script] of [
      [nightTemplate(), 'he', 'rtl', 'לילה', 'Rubik', 'he'],
      [paperTemplate(), 'en', 'ltr', 'Paper', 'Playfair Display', 'latin'],
    ] as const) {
      const { slide } = templateCover(template, { lang, dir, name });
      const title = titleOf(slide);
      const placeholder = template.layouts[0]!.placeholders.find((p) => p.role === 'title')!;
      const { weight } = template.theme.textStyles.display;
      expect(title.content.paragraphs).toHaveLength(1);
      expect(title.content.paragraphs[0]!.align).toBe('start');
      expect(sizeOf(slide) * lettersAt(family, script, weight)).toBeCloseTo(height(script));
      expect(title.frame.w).toBe(placeholder.frame.w);
      // Smaller to fit, rather than out of the box or onto a second line.
      expect(title.autoFit).toBe('shrink');
      expect(title.frame.h).toBeLessThan(2 * sizeOf(slide));
    }
  });

  it('sets a name in Heebo at the cover size, and in a family it has not measured too', () => {
    for (const family of ['Heebo', 'A Font of the System']) {
      const template = nightTemplate();
      template.theme.fonts.heading = { he: family, latin: family };
      template.theme.textStyles.display.weight = 700;
      const { slide } = templateCover(template, { lang: 'he', dir: 'rtl', name: 'לילה' });
      expect(sizeOf(slide)).toBeCloseTo(COVER_TITLE_SIZE);
    }
  });

  it("measures the letters of a language the theme's families lack in their counterpart", () => {
    // Rubik has no Japanese: Zen Maru Gothic draws it, and Heebo's Noto Sans JP sets the height.
    const template = nightTemplate();
    template.theme.fonts.heading = { he: 'Rubik', latin: 'Rubik' };
    const { slide } = templateCover(template, { lang: 'ja', dir: 'ltr', name: '夜' });
    expect(sizeOf(slide) * lettersAt('Zen Maru Gothic', 'japanese', 800)).toBeCloseTo(
      height('japanese', 'Noto Sans JP'),
    );
  });

  it('sets a title the layout centres at the start too', () => {
    const template = nightTemplate();
    template.layouts[0]!.placeholders[0]!.align = 'center';
    const { slide } = templateCover(template, { lang: 'he', dir: 'rtl', name: 'הוד' });
    expect(titleOf(slide).content.paragraphs[0]!.align).toBe('start');
  });

  it('brings what the layout draws for its title to the letters, and leaves the rest', () => {
    const [, , top, foot] = LETTERS.Rubik!.he!;
    for (const dir of ['rtl', 'ltr'] as const) {
      const template = towerLike();
      const { slide } = templateCover(template, { lang: 'he', dir, name: 'מגדל' });
      const size = sizeOf(slide);
      const [tab, bar, field] = template.layouts[0]!.objects!;
      const moved = (id: string) => named(slide, id).frame;
      // Beside the letters, from their top to the line they stand on, on its own side.
      const drawnTab = moved('d_migdal_hero_tab');
      const baseline = bottom(drawnTab);
      expect(drawnTab.h).toBeCloseTo(top * size);
      expect(drawnTab.x).toBe(dir === 'rtl' ? tab!.frame.x : 0);
      // The letters stand across the middle of the slide.
      expect(baseline - height('he') / 2).toBeCloseTo(SLIDE_HEIGHT / 2);
      // Under the letters that go below the line, close to them.
      const drawnBar = moved('d_migdal_hero_bar');
      expect(drawnBar.y).toBeGreaterThan(baseline + foot * size);
      expect(drawnBar.y).toBeLessThan(baseline + foot * size + 0.2 * size);
      expect(drawnBar.h).toBe(bar!.frame.h);
      expect(drawnBar.x).toBe(dir === 'rtl' ? bar!.frame.x : 1920 - 1728 - 96);
      expect(moved('d_migdal_hero_field').y).toBe(field!.frame.y);
    }
  });

  it('shows the picture only on a layout that seats one', () => {
    const picture = {
      id: 'b'.repeat(64),
      file: `${'b'.repeat(64)}.webp`,
      mime: 'image/webp',
      kind: 'image',
      bytes: 1,
      origin: 'import',
    } as const;
    const { deck, slide } = templateCover(nightTemplate(), {
      lang: 'he',
      dir: 'rtl',
      name: 'לילה',
      picture,
    });
    expect(deck.assets[picture.id]).toEqual(picture);
    expect(slide.elements.some((e) => e.type === 'image' && e.assetId === picture.id)).toBe(true);
  });

  it('sets the name of a template without layouts in its display style', () => {
    const template = { ...nightTemplate(), layouts: [] };
    const { slide } = templateCover(template, { lang: 'he', dir: 'rtl', name: 'שלי' });
    const [text] = slide.elements;
    expect(text?.type === 'text' && text.content.paragraphs[0]!.runs[0]!.text).toBe('שלי');
  });
});

describe.skipIf(!builtInAvailable)('the covers of the built-in templates', () => {
  const templates = new Map(builtInTemplates().map((t) => [t.theme.id, t]));

  it.each(Object.entries(COVER_ATTACHED))(
    '%s draws what its cover brings to the name',
    (id, all) => {
      const objects = new Set(templates.get(id)?.layouts[0]?.objects?.map((object) => object.id));
      for (const attached of all) for (const one of attached.ids) expect(objects).toContain(one);
    },
  );

  it.each([...templates.keys()])('%s sets its name with letters as tall as the others', (id) => {
    const template = templates.get(id)!;
    const { heading } = template.theme.fonts;
    const { weight } = template.theme.textStyles.display;
    for (const [lang, dir, family, script] of [
      ['he', 'rtl', heading.he, 'he'],
      ['en', 'ltr', heading.latin, 'latin'],
    ] as const) {
      // A family the table does not have (`letters.generated.ts`).
      expect(LETTERS[family]?.[script]).toBeDefined();
      const { slide } = templateCover(template, { lang, dir, name: id });
      expect(sizeOf(slide) * lettersAt(family, script, weight)).toBeCloseTo(height(script));
    }
  });
});
