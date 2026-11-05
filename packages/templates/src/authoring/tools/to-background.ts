/**
 * Gives objects of a template's layouts to the backgrounds of their layouts (ADR-125) in a
 * library catalog: the drawings that are a layout's atmosphere, which a slide drops by taking
 * another background. Every other template, sample and picture of the catalog stays as it is.
 * From packages/templates:
 *   node src/authoring/tools/run-ts.mjs src/authoring/tools/to-background.ts \
 *     <catalog.json> <out.json> <template id> <object id>...
 *
 * The catalog is the library's `templates/catalog.json`; the library writes the other files of
 * its templates from it when it is published. Nothing is written when the move would change the
 * picture of a layout or of its sample (`toBackground`), or the template would not parse.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { toBackground } from '../../builtin/kit';
import { Template } from '../../template';

export default function moveToBackground(file: string, out: string, id: string, ...ids: string[]) {
  if (!file || !out || !id || ids.length === 0) {
    throw new Error(
      'Pass the catalog, the file to write, the id of a template and the ids of its objects.',
    );
  }
  const catalog = JSON.parse(readFileSync(file, 'utf8')) as { templates: unknown[] };
  const index = catalog.templates.findIndex(
    (t) => (t as { theme?: { id?: string } }).theme?.id === id,
  );
  if (index < 0) throw new Error(`The catalog has no template "${id}".`);
  const before = Template.parse(catalog.templates[index]);
  const after = Template.parse(toBackground(before, ids));
  // Over the template as it was, so its fields keep their order in the file.
  catalog.templates[index] = { ...(catalog.templates[index] as object), ...after };
  for (const layout of [...after.layouts, ...(after.flipped ?? [])]) {
    const drawn = layout.background?.elements?.map((element) => element.id) ?? [];
    if (drawn.length > 0) console.log(`${layout.id}: the background draws ${drawn.join(', ')}`);
  }
  const copies = (template: Template) =>
    (template.sample ?? []).reduce((n, slide) => n + slide.elements.length, 0);
  console.log(`the sample: ${copies(before) - copies(after)} copies taken off its slides`);
  writeFileSync(out, `${JSON.stringify(catalog)}\n`);
  console.log(out);
}
