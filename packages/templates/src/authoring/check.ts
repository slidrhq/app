/**
 * The structural checks the app's unit tests make of a built-in template, for one authored here:
 * `node tools/run-ts.mjs src/authoring/check.ts <id>` (from packages/templates). Prints what is
 * wrong, or "ok", and the grounds the layouts keep, to look at.
 */
import {
  Archetype,
  languageDir,
  languagesOf,
  rotatedBounds,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type Color,
  type Element,
  type Layout,
  type Theme,
} from '@slidr/model';
import { contractGaps } from '../builtin/contract';
import { framesTheSlide, lockedDrawings, sampleSlides } from '../builtin/kit';
import { Template } from '../template';
import type { Authored } from './registry';

const DRAWN = Archetype.options.filter((a) => a !== 'blank' && a !== 'title');

type Rgb = [number, number, number];
const hexRgb = (css: string): Rgb => {
  const d = /^#([0-9a-f]{6})$/i.exec(css.trim())?.[1];
  if (!d) throw new Error(`"${css}" is not #rrggbb`);
  return [0, 2, 4].map((i) => parseInt(d.slice(i, i + 2), 16)) as Rgb;
};
const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, i) => Math.round(v * (1 - t) + b[i]! * t)) as Rgb;
const lum = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [l, d] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (l + 0.05) / (d + 0.05);
};
const colorOf = (theme: Theme, c: Color, over: Rgb): Rgb => {
  const base = hexRgb('token' in c ? theme.colors[c.token] : c.value);
  return c.alpha === undefined ? base : mix(over, base, c.alpha);
};

/** Whether a decoration covers the slide, and so stays its ground (`framesTheSlide`). */
function coversTheSlide(d: Element): boolean {
  const box = rotatedBounds(d.frame, d.rotation);
  const x = Math.max(0, Math.min(box.x + box.w, SLIDE_WIDTH) - Math.max(box.x, 0));
  const y = Math.max(0, Math.min(box.y + box.h, SLIDE_HEIGHT) - Math.max(box.y, 0));
  return x * y >= 0.9 * SLIDE_WIDTH * SLIDE_HEIGHT;
}

/**
 * The text slide (ADR-136): the text-and-image slide without its picture. The kicker, the title
 * across the slide and the footer, as on the template's other slides (ADR-135); the points of
 * the text-and-image slide, each heading over its body in the same text styles, across the
 * width the picture left, none in another's way or in the foot's. Its sample, in every language,
 * fills the kicker, the footer and the three points.
 */
export function textSlideGaps(template: Template, samples: Authored['samples']): string[] {
  const layout = template.layouts.find((l) => l.archetype === 'text');
  const beside = template.layouts.find((l) => l.archetype === 'textImage');
  if (!layout) return [];
  const problems: string[] = [];
  type Seat = Layout['placeholders'][number];
  const points = (l: Layout | undefined) =>
    (l?.placeholders ?? []).filter((p) => p.role === 'subtitle' || p.role === 'body');
  const own = points(layout);
  const theirs = points(beside);
  const title = layout.placeholders.find((p) => p.role === 'title');
  const kicker = layout.placeholders.find((p) => p.role === 'caption');
  const footer = layout.placeholders.find((p) => p.role === 'footer');
  if (title && title.frame.w < 1300)
    problems.push(`${layout.id}: the title is ${title.frame.w}px wide; it runs across the slide`);
  if (own.length !== theirs.length || own.some((p, i) => p.role !== theirs[i]?.role))
    problems.push(
      `${layout.id}: seat the points of ${beside?.id ?? 'the text-and-image slide'}, in its order`,
    );
  own.forEach((p, i) => {
    const them = theirs[i];
    if (!them) return;
    if (p.styleRef !== them.styleRef)
      problems.push(
        `${layout.id}: ${p.id} is set in ${p.styleRef}; ${them.id} of ${beside!.id} is in ${them.styleRef}`,
      );
    // The bodies take the picture's width too; a heading beside its body may keep its own.
    const wider = p.role === 'body' ? 300 : 0;
    if (p.frame.w < them.frame.w + wider)
      problems.push(
        `${layout.id}: ${p.id} is ${p.frame.w}px wide, ${them.frame.w}px beside the picture; across the slide it takes the picture's width too`,
      );
  });
  const meet = (a: Seat, b: Seat) =>
    a.frame.x < b.frame.x + b.frame.w &&
    b.frame.x < a.frame.x + a.frame.w &&
    a.frame.y < b.frame.y + b.frame.h &&
    b.frame.y < a.frame.y + a.frame.h;
  const seats = [kicker, title, ...own].filter((p): p is Seat => p !== undefined);
  // What meets on the text-and-image slide too (a heading on its body's first pixels) is its design.
  const there = (a: Seat, b: Seat) => {
    const [x, y] = [a, b].map((p) => beside?.placeholders.find((q) => q.id === p.id));
    return x !== undefined && y !== undefined && meet(x, y);
  };
  seats.forEach((a, i) => {
    for (const b of seats.slice(i + 1))
      if (meet(a, b) && !there(a, b)) problems.push(`${layout.id}: ${a.id} runs into ${b.id}`);
  });
  for (const p of own)
    if (footer && p.frame.y + p.frame.h > footer.frame.y - 8)
      problems.push(`${layout.id}: ${p.id} ends at ${p.frame.y + p.frame.h}, in the foot`);
  for (const lang of languagesOf(samples)) {
    const slide = samples[lang]!.find((s) => s.layout === layout.id);
    if (!slide) continue;
    const filled = (role: 'subtitle' | 'body') => {
      const fill = slide.content[role];
      return Array.isArray(fill) ? fill.filter((f) => f && 'paragraphs' in f).length : fill ? 1 : 0;
    };
    if (!slide.content.caption || !slide.content.footer)
      problems.push(`${lang} sample of ${layout.id}: fill its kicker and its footer`);
    if (filled('subtitle') !== 3 || filled('body') !== 3)
      problems.push(
        `${lang} sample of ${layout.id}: three points, a heading and its body each, as on the text-and-image slide`,
      );
  }
  return problems;
}

/**
 * What a layout draws is the slide's own, to select, move, restyle and delete (ADR-094): only
 * what frames every slide stays the layout's (`framesTheSlide`), and what that stands on
 * (`lockedDrawings`). The grounds that stay, and what the foot stands on, are listed to look at.
 */
export function editability(template: Template): { problems: string[]; kept: string[] } {
  if (![...template.layouts, ...(template.flipped ?? [])].some((l) => l.objects?.length))
    return {
      problems: [
        'the layouts give their slides no objects, so only the text can be changed: pass the template through withObjects (ADR-094)',
      ],
      kept: [],
    };
  const problems: string[] = [];
  for (const [layouts, side] of [
    [template.layouts, ''],
    [template.flipped ?? [], ' (flipped)'],
  ] as const) {
    for (const [id, drawings] of lockedDrawings(layouts))
      problems.push(
        `${id}${side}: ${drawings.map((d) => d.id).join(', ')} stay the layout's only because what frames every slide is drawn over them and reaches into them: keep them clear of it`,
      );
  }
  const lockedHere = lockedDrawings(template.layouts);
  const kept = template.layouts.flatMap((l) => {
    const frames = framesTheSlide(l);
    const locked = new Set(lockedHere.get(l.id) ?? []);
    return l.decorations.flatMap((d) =>
      !frames(d) && !locked.has(d)
        ? [`${l.id}: ${d.id} (the foot stands on it)`]
        : frames(d) && !d.hidden && !d.role && coversTheSlide(d)
          ? [`${l.id}: ${d.id} (the ground)`]
          : [],
    );
  });
  return { problems, kept };
}

export default async function check(id: string) {
  // The module alone, so another template being drawn in this folder cannot break the check.
  // By its URL: on Windows the path Vite makes of `./<id>.ts` is not found.
  const module = (await import(/* @vite-ignore */ new URL(`./${id}.ts`, import.meta.url).href)) as {
    entry?: Authored;
  };
  const entry = module.entry;
  if (!entry) throw new Error(`no authored template "${id}"`);
  const template = entry.template();
  const problems: string[] = [];
  const parsed = Template.safeParse(template);
  if (!parsed.success)
    problems.push(
      ...parsed.error.issues.slice(0, 5).map((i) => `schema: ${i.path.join('.')}: ${i.message}`),
    );
  if (template.theme.id !== id) problems.push(`theme id ${template.theme.id} is not ${id}`);
  const order = template.layouts.map((l) => l.archetype);
  if (order.join() !== DRAWN.join())
    problems.push(`layouts must be, in order: ${DRAWN.join(', ')}; are ${order.join(', ')}`);
  for (const l of template.layouts)
    if (!l.id.startsWith(`l_${id}_`)) problems.push(`layout id ${l.id}`);
  problems.push(...template.layouts.flatMap(contractGaps));
  const drawn = (l: Layout) => [...l.decorations, ...(l.objects ?? [])].map((d) => d.id);
  const all = template.layouts.flatMap(drawn);
  const dup = all.filter((d, i) => all.indexOf(d) !== i);
  if (dup.length)
    problems.push(
      `ids of decorations and objects used twice in the template: ${[...new Set(dup)].join(', ')}`,
    );
  const editable = editability(template);
  problems.push(...editable.problems);
  problems.push(...textSlideGaps(template, entry.samples));
  for (const l of template.flipped ?? []) {
    const ids = drawn(l);
    const twice = ids.filter((d, i) => ids.indexOf(d) !== i);
    if (twice.length) problems.push(`${l.id} (flipped): ids twice: ${twice.join(', ')}`);
  }
  for (const l of [...template.layouts, ...(template.flipped ?? [])]) {
    if (!l.placeholders.some((p) => p.role === 'footer')) continue;
    const roles = l.decorations.map((d) => d.role);
    if (!roles.includes('slideNumber'))
      problems.push(`${l.id}: seats a footer but draws no slide number`);
    if (!roles.includes('logo')) problems.push(`${l.id}: seats a footer but draws no logo`);
  }
  for (const lang of languagesOf(entry.samples)) {
    const slides = entry.samples[lang]!;
    const shown = new Set(slides.map((s) => s.layout));
    const missing = template.layouts.filter((l) => !shown.has(l.id)).map((l) => l.id);
    if (missing.length) problems.push(`${lang} sample does not show ${missing.join(', ')}`);
    try {
      sampleSlides(template, slides, { dir: languageDir(lang), lang });
    } catch (error) {
      problems.push(`${lang} sample: ${(error as Error).message}`);
    }
  }
  const theme = template.theme;
  for (const [index, bg] of [theme.background, ...theme.backgroundVariants].entries()) {
    if (bg.fill.kind !== 'solid') continue;
    const ground = colorOf(theme, bg.fill.color, [255, 255, 255]);
    if (bg.overlay && bg.overlay.kind === 'radial') {
      for (const stop of bg.overlay.stops) {
        const g = colorOf(theme, stop.color, ground);
        for (const [ref, style] of Object.entries(theme.textStyles)) {
          const got = contrast(colorOf(theme, style.color, g), g);
          const need = style.size > 48 ? 3 : 4.5;
          if (got < need)
            problems.push(`background ${index}: ${ref} at ${got.toFixed(2)}:1 under its overlay`);
        }
      }
    }
    for (const [ref, style] of Object.entries(theme.textStyles)) {
      const got = contrast(colorOf(theme, style.color, ground), ground);
      const need = style.size > 48 ? 3 : 4.5;
      if (got < need)
        problems.push(`background ${index}: ${ref} at ${got.toFixed(2)}:1, needs ${need}:1`);
    }
  }
  console.log(problems.length ? problems.map((p) => `- ${p}`).join('\n') : `${id}: ok`);
  // A drawing that covers the slide stays its ground, and a press on the slide never picks it:
  // right for a grid, a border or a field; a drawing of the whole board is cut into its parts.
  if (editable.kept.length)
    console.log(
      `drawn by the layouts and not the slide's, to look at (a ground is a grid, a border or a field, not a drawing to cut into parts):\n${editable.kept.map((k) => `  ${k}`).join('\n')}`,
    );
}
