import { describe, expect, it } from 'vitest';
import { builtInAvailable, tzukTemplate } from './builtin';
import { nightTemplate } from './fixtures';
import { Template } from './template';
import { withStandardLayouts } from './standardLayouts';

describe('the standard text layout', () => {
  it('adds them to an older template in the requested order without changing its drawing', () => {
    const old = nightTemplate();
    const complete = withStandardLayouts(old);
    const kinds = complete.layouts.map((layout) => layout.archetype);
    expect(kinds).not.toContain('title');
    expect(kinds.indexOf('text')).toBe(kinds.indexOf('textImage') - 1);
    expect(
      complete.layouts
        .find((layout) => layout.archetype === 'text')
        ?.placeholders.map((place) => place.role),
    ).toEqual(['title', 'body']);
    expect(old.layouts.some((layout) => layout.archetype === 'title')).toBe(false);
    expect(complete.layouts.filter((layout) => old.layouts.includes(layout))).toEqual(old.layouts);
    expect(withStandardLayouts(complete)).toEqual(complete);
  });

  it('sets the title on one line where the content slides set theirs, the body right under it', () => {
    const night = nightTemplate();
    const complete = withStandardLayouts(night);
    const style = night.theme.textStyles.title;
    const line = Math.ceil(style.size * style.lineHeight);
    const [textTitle, body] = complete.layouts.find(
      (layout) => layout.archetype === 'text',
    )!.placeholders;
    // The table of the template sets its title at the top margin, across the slide.
    expect(textTitle!.frame).toEqual({ x: 96, y: 96, w: 1728, h: line });
    expect(body!.frame.x).toBe(96);
    expect(body!.frame.w).toBe(1728);
    expect(body!.frame.y).toBeGreaterThan(96 + line);
    expect(body!.frame.y).toBeLessThan(96 + 2 * line);
  });

  it.skipIf(!builtInAvailable)(
    'draws them on the ground and in the frame of the content slides',
    () => {
      // A built-in template as it was before it drew a title and a text layout of its own.
      const tzuk = tzukTemplate();
      const older = {
        ...tzuk,
        layouts: tzuk.layouts.filter((l) => l.archetype !== 'title' && l.archetype !== 'text'),
      };
      const complete = withStandardLayouts(older);
      const table = tzuk.layouts.find((layout) => layout.archetype === 'table')!;
      const seat = (layout: typeof table, role: string) =>
        layout.placeholders.find((place) => place.role === role)!;
      for (const archetype of ['text'] as const) {
        const layout = complete.layouts.find((l) => l.archetype === archetype)!;
        expect(seat(layout, 'title').frame.y).toBe(seat(table, 'title').frame.y);
        // The kicker over the title and the footer, where the table seats them, and between them
        // the points of the text-and-image slide across the width (ADR-136).
        expect(layout.placeholders.map((place) => place.role)).toEqual([
          'caption',
          'title',
          'subtitle',
          'body',
          'subtitle',
          'body',
          'subtitle',
          'body',
          'footer',
        ]);
        const beside = tzuk.layouts.find((l) => l.archetype === 'textImage')!;
        const points = (l: typeof table) =>
          l.placeholders.filter((place) => place.role === 'subtitle' || place.role === 'body');
        points(layout).forEach((place, i) => {
          const them = points(beside)[i]!;
          expect(place.styleRef).toBe(them.styleRef);
          expect(place.frame.h).toBe(them.frame.h);
          expect(place.frame.x).toBe(96);
          expect(place.frame.w).toBeGreaterThan(them.frame.w + 600);
          expect(place.frame.y).toBeGreaterThan(seat(layout, 'title').frame.y);
        });
        // Their numbers and the rules between them come too, and nothing of the picture.
        const drawn = [...layout.decorations, ...(layout.objects ?? [])].map((o) => o.id);
        expect(drawn.filter((id) => /_n\d/.test(id))).toHaveLength(3);
        expect(drawn.filter((id) => /_rule\d/.test(id))).toHaveLength(3);
        const kicker = table.placeholders.find(
          (place) =>
            place.role === 'caption' &&
            place.frame.y + place.frame.h <= seat(table, 'title').frame.y + 4,
        )!;
        expect(seat(layout, 'caption').frame).toEqual(kicker.frame);
        expect(seat(layout, 'footer').frame).toEqual(seat(table, 'footer').frame);
        // The brass rule over the title, and the rule, the mark and the number of the foot, under
        // ids of their own; nothing of the table itself. Then what the points are drawn with.
        expect(layout.decorations.map((d) => d.id).slice(0, 4)).toEqual([
          `d_tzuk_table_tick_${archetype}`,
          `d_tzuk_table_rule_${archetype}`,
          `d_tzuk_table_mark_${archetype}`,
          `d_tzuk_table_number_${archetype}`,
        ]);
        expect(layout.decorations.map((d) => d.role)).toContain('slideNumber');
        expect(layout.decorations.map((d) => d.role)).toContain('logo');
        for (const body of layout.placeholders.filter((place) => place.role === 'body'))
          expect(body.frame.y + body.frame.h).toBeLessThanOrEqual(940);
      }
    },
  );

  it('places a previously saved text layout before a newly added text and image layout', () => {
    const complete = withStandardLayouts(nightTemplate());
    const text = complete.layouts.find((layout) => layout.archetype === 'text')!;
    const outOfOrder = {
      ...complete,
      layouts: [...complete.layouts.filter((layout) => layout !== text), text],
    };
    expect(withStandardLayouts(outOfOrder).layouts).toEqual(complete.layouts);
  });
});

it('removes saved title-only layouts, their flipped versions and previews', () => {
  const original = nightTemplate();
  const title = { ...original.layouts[0]!, id: 'retired_title', archetype: 'title' as const };
  const template = {
    ...original,
    layouts: [...original.layouts, title],
    flipped: [title],
    sample: [{ id: 's_retired', layoutId: title.id, elements: [], timeline: [] }],
  };
  const result = withStandardLayouts(template);
  expect(result.layouts.some((layout) => layout.archetype === 'title')).toBe(false);
  expect(result.flipped).toEqual([]);
  expect(result.sample).toEqual([]);
  expect(Template.safeParse(result).success).toBe(true);
  expect(template.layouts).toContain(title);
});
