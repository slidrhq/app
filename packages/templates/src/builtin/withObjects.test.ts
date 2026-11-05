import { createElement, createSlide, layoutObjects, type Element, type Layout } from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { nightTemplate } from '../fixtures';
import { mirrorLayout } from '../mirror';
import { Template } from '../template';
import { builtInAvailable, builtInTemplates, tzukTemplate } from './index';
import {
  at,
  lockedDrawings,
  pageNumber,
  rect,
  solid,
  token,
  toBackground,
  withObjects,
} from './kit';

/* What of a built-in layout becomes the slide's own (`withObjects`, ADR-094). */

const ids = (elements: readonly Element[] = []) => elements.map((element) => element.id);

function layout(decorations: Element[]): Layout {
  return {
    id: 'l_test_cards',
    name: 'Cards',
    archetype: 'cards',
    placeholders: [],
    decorations,
  };
}

function template(...layouts: Layout[]): Template {
  const { theme } = tzukTemplate();
  return { theme, dir: 'rtl', layouts, flipped: layouts.map(mirrorLayout) };
}

// The theme and the templates are the media library's: without it there is nothing to test.
describe.skipIf(!builtInAvailable)('the objects of a built-in layout', () => {
  const ground = rect('d_ground', at(0, 0, 1920, 1080), solid(token('surface')));
  const card = rect('d_card', at(96, 260, 600, 560), solid(token('surface')));
  const label = rect('d_label', at(140, 300, 80, 80), solid(token('primary')));
  const rule = rect('d_rule', at(96, 940, 1728, 1), solid(token('text', 0.14)));
  const number = pageNumber('d_number', at(96, 961, 60, 34));

  it('are what does not frame the slide; the ground, the foot and the slide number stay', () => {
    const [split] = withObjects(template(layout([ground, card, label, rule, number]))).layouts;
    expect(ids(split!.decorations)).toEqual(['d_ground', 'd_rule', 'd_number']);
    expect(ids(split!.objects)).toEqual(['d_card', 'd_label']);
  });

  it('leave under the slide number what it stands on, and under that what that stands on', () => {
    const plate = rect('d_plate', at(60, 900, 200, 120), solid(token('surface')));
    const glow = rect('d_glow', at(20, 700, 400, 300), solid(token('primary', 0.2)));
    const [split] = withObjects(template(layout([glow, plate, card, number]))).layouts;
    expect(ids(split!.decorations)).toEqual(['d_glow', 'd_plate', 'd_number']);
    expect(ids(split!.objects)).toEqual(['d_card']);
  });

  it('come with their groups fitted to what they hold, and the other direction is split too', () => {
    const loose = createElement.group({
      id: 'd_lanes',
      frame: { x: 0, y: 0, w: 900, h: 1080 },
      children: [rect('d_lane', { x: 100, y: 300, w: 200, h: 14 }, solid(token('primary')))],
    });
    const split = withObjects(template(layout([loose, number])));
    const [group] = split.layouts[0]!.objects!;
    expect(group!.frame).toEqual({ x: 100, y: 300, w: 200, h: 14 });
    expect(group!.type === 'group' && group.children[0]!.frame).toEqual({
      x: 0,
      y: 0,
      w: 200,
      h: 14,
    });
    expect(ids(split.flipped![0]!.objects)).toEqual(['d_lanes']);
    expect(withObjects(split)).toEqual(split);
  });

  it('never hold a master component in a built-in template', () => {
    const masters: string[] = [];
    for (const { layouts, flipped = [] } of builtInTemplates()) {
      for (const { objects = [] } of [...layouts, ...flipped]) {
        for (const object of objects) {
          if (object.role === 'logo' || object.role === 'slideNumber' || object.role === 'footer') {
            masters.push(object.id);
          }
        }
      }
    }
    expect(masters).toEqual([]);
  });
});

/* What a layout keeps that its slides should hold (`lockedDrawings`, ADR-094). */
describe('the drawings a layout keeps', () => {
  const card = rect('d_card', at(96, 260, 600, 560), solid(token('surface')));
  const number = pageNumber('d_number', at(96, 961, 60, 34));
  const given = (decorations: Element[]): Layout => ({ ...layout(decorations), objects: [card] });

  it('are all that do not frame the slide, when no layout gives its slides objects', () => {
    expect(ids(lockedDrawings([layout([card, number])]).get('l_test_cards'))).toEqual(['d_card']);
  });

  it('leave out what the slide number stands on', () => {
    const plate = rect('d_plate', at(60, 900, 200, 120), solid(token('surface')));
    expect(lockedDrawings([given([plate, number])]).size).toBe(0);
  });

  it('are what the foot only reaches into', () => {
    const courtyard = rect('d_courtyard', at(96, 200, 600, 770), solid(token('surface')));
    expect(ids(lockedDrawings([given([courtyard, number])]).get('l_test_cards'))).toEqual([
      'd_courtyard',
    ]);
  });
});

/* A drawing given to the background of its layout (`toBackground`, ADR-125). */
describe('a drawing given to the background', () => {
  const lanes = createElement.group({
    id: 'o_lanes',
    frame: { x: 0, y: 150, w: 800, h: 770 },
    children: [rect('o_lane', { x: 0, y: 0, w: 300, h: 12 }, solid(token('primary')))],
  });
  const card = rect('o_card', { x: 1000, y: 300, w: 600, h: 400 }, solid(token('surface')));
  const mark = rect('d_mark', { x: 1760, y: 90, w: 60, h: 40 }, solid(token('accent')));
  const ground = { fill: { kind: 'solid' as const, color: { token: 'bg' as const } } };

  function drawn(objects: Element[], background?: Layout['background']): Template {
    const theme = nightTemplate().theme;
    const hero: Layout = {
      ...layout([mark]),
      id: 'l_hero',
      archetype: 'hero',
      ...(background ? { background } : {}),
      objects,
    };
    const slide = createSlide({ id: 's_hero', layoutId: 'l_hero' });
    slide.elements = layoutObjects(hero, slide.id, new Set());
    return { theme, dir: 'rtl', layouts: [hero], flipped: [mirrorLayout(hero)], sample: [slide] };
  }

  it('leaves the objects for the background, in both directions, and the sample loses its copies', () => {
    const moved = toBackground(drawn([lanes, card], ground), ['o_lanes']);
    const [hero] = moved.layouts;
    expect(hero!.background).toEqual({ ...ground, elements: [lanes] });
    expect(ids(hero!.objects)).toEqual(['o_card']);
    expect(ids(hero!.decorations)).toEqual(['d_mark']);
    expect(moved.flipped![0]!.background!.elements).toEqual([
      mirrorLayout(drawn([lanes]).layouts[0]!).objects![0],
    ]);
    expect(ids(moved.flipped![0]!.objects)).toEqual(['o_card']);
    expect(ids(moved.sample![0]!.elements)).toEqual(['s_hero_o_card']);
    // The template is still one: the parse holds it to the schema and the sample to its layouts.
    expect(Template.parse(moved)).toEqual(moved);
  });

  it("gives a layout without a background of its own the theme's to hold the drawing", () => {
    const moved = toBackground(drawn([lanes]), ['o_lanes']);
    expect(moved.layouts[0]!.background).toEqual({ ...moved.theme.background, elements: [lanes] });
    expect(moved.layouts[0]!.objects).toBeUndefined();
  });

  it('refuses what would change the picture, and an object no layout has', () => {
    // Drawn over a decoration, or over an object under it: in the background it would be under.
    const overMark = { ...card, id: 'o_over', frame: { x: 1700, y: 60, w: 200, h: 100 } };
    expect(() => toBackground(drawn([overMark], ground), ['o_over'])).toThrow(/"d_mark"/);
    const onCard = { ...lanes, id: 'o_on', frame: { x: 1100, y: 400, w: 200, h: 100 } };
    expect(() => toBackground(drawn([card, onCard], ground), ['o_on'])).toThrow(/"o_card"/);
    // Moved together, the order between them stays.
    expect(
      toBackground(drawn([card, onCard], ground), ['o_card', 'o_on']).layouts[0]!.background!
        .elements,
    ).toEqual([card, onCard]);
    expect(() => toBackground(drawn([lanes], ground), ['o_nowhere'])).toThrow(/o_nowhere/);
  });

  it('refuses a sample slide whose copy was changed or is animated', () => {
    const moved = drawn([lanes], ground);
    moved.sample![0]!.elements[0]!.frame.x = 40;
    expect(() => toBackground(moved, ['o_lanes'])).toThrow(/s_hero_o_lanes/);
    const animated = drawn([lanes], ground);
    animated.sample![0]!.timeline = [
      {
        id: 'a_lanes',
        elementId: 's_hero_o_lanes',
        trigger: 'onClick',
        category: 'entrance',
        preset: 'fade',
        duration: 400,
        delay: 0,
        easing: 'ease-out',
      },
    ];
    expect(() => toBackground(animated, ['o_lanes'])).toThrow(/animated/);
  });
});
