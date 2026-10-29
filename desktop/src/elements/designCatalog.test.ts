import { createSlide } from '@slidr/model';
import { describe, expect, it } from 'vitest';
import {
  designTagsOf,
  localName,
  mergeCatalogs,
  type DesignCatalog,
  type ManagedDesignCatalog,
} from './designCatalog';

/** A design's slides in both languages; the merge never looks inside them. */
const slide = (name: string) => ({
  he: createSlide({ name: `${name}-he` }),
  en: createSlide({ name: `${name}-en` }),
});
const slides = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, slide(id)]));

/** The catalog: the first designs, and one made since, which it names. */
const catalog: Partial<DesignCatalog> = {
  groups: ['events', 'business'],
  groupIds: { events: ['wedding', 'concert', 'gone', 'm-picnic'], business: ['webinar'] },
  slides: slides('wedding', 'concert', 'webinar', 'm-picnic'),
  subjects: { wedding: [1500, 600], 'm-picnic': [10, 20] },
  names: { 'm-picnic': { he: 'פיקניק', en: 'Picnic' } },
  groupNames: { events: { he: 'אירועים', en: 'Events' } },
};

/** The catalog of the designs Slidr Studio made, of a library of before (ADR-118). */
const managed: Partial<ManagedDesignCatalog> = {
  version: 1,
  groups: ['invitations', 'events', 'empty'],
  groupNames: {
    invitations: { he: 'הזמנות', en: 'Invitations' },
    events: { he: 'אחר', en: 'Other' },
  },
  groupIds: {
    invitations: ['m-garden-wedding', 'm-garden-wedding', 'm-no-slide'],
    events: ['m-street-party', 'wedding'],
    empty: ['m-no-slide'],
  },
  slides: { ...slides('m-garden-wedding', 'm-street-party'), wedding: slide('managed-wedding') },
  subjects: {
    'm-garden-wedding': [1480, 520],
    wedding: [1, 1],
    // A point that is not two numbers, as a broken file could hold.
    'm-street-party': [1, 'x'] as unknown as [number, number],
  },
  names: {
    'm-garden-wedding': { he: 'חתונה בגן', en: 'Garden wedding' },
    wedding: { he: 'אחרת', en: 'Another' },
  },
  sizes: { 'm-garden-wedding': [1536, 1024], 'm-garden-wedding-bg': [1920, 1080] },
};

const order = (merged: Pick<DesignCatalog, 'groups' | 'groupIds'>) =>
  merged.groups.flatMap((group) => merged.groupIds[group]);

describe('the catalog of designs', () => {
  it('is empty without a file', () => {
    const merged = mergeCatalogs(undefined, undefined);
    expect(merged.groups).toEqual([]);
    expect(merged.groupIds).toEqual({});
  });

  it('is the catalog as it is, with its names, where there is no catalog of before', () => {
    const merged = mergeCatalogs(catalog, undefined);
    expect(merged.groups).toEqual(['events', 'business']);
    // A design without a slide is not listed.
    expect(order(merged)).toEqual(['wedding', 'concert', 'm-picnic', 'webinar']);
    expect(merged.subjects).toEqual({ wedding: [1500, 600], 'm-picnic': [10, 20] });
    expect(localName(merged.names.get('m-picnic'), 'he')).toBe('פיקניק');
    expect(merged.names.has('wedding')).toBe(false);
    expect(localName(merged.groupNames.get('events'), 'en')).toBe('Events');
    expect(merged.sizes.size).toBe(0);
  });

  it('puts the designs of a catalog of before after its own, as the library folds them', () => {
    const merged = mergeCatalogs(catalog, managed);
    // A group the catalog has takes them after its own; a new one comes last.
    expect(merged.groups).toEqual(['events', 'business', 'invitations']);
    expect(merged.groupIds.events).toEqual(['wedding', 'concert', 'm-picnic', 'm-street-party']);
    expect(merged.groupIds.invitations).toEqual(['m-garden-wedding']);
    expect(order(merged)).toEqual([
      'wedding',
      'concert',
      'm-picnic',
      'm-street-party',
      'webinar',
      'm-garden-wedding',
    ]);
    expect(merged.slides['m-garden-wedding']?.en?.name).toBe('m-garden-wedding-en');
    // The catalog's own name of a group is kept.
    expect(localName(merged.groupNames.get('events'), 'en')).toBe('Events');
    expect(localName(merged.groupNames.get('invitations'), 'he-IL')).toBe('הזמנות');
  });

  it('keeps the catalog’s design where both have an id', () => {
    const merged = mergeCatalogs(catalog, managed);
    expect(merged.slides.wedding?.he?.name).toBe('wedding-he');
    expect(merged.groupIds.events!.filter((id) => id === 'wedding')).toHaveLength(1);
    expect(merged.subjects.wedding).toEqual([1500, 600]);
    expect(merged.names.has('wedding')).toBe(false);
  });

  it('lists a design of before once, only with a slide, and a new group only with a design', () => {
    const merged = mergeCatalogs(catalog, managed);
    expect(order(merged).filter((id) => id === 'm-garden-wedding')).toHaveLength(1);
    expect(merged.slides['m-no-slide']).toBeUndefined();
    expect(merged.groups).not.toContain('empty');
  });

  it('takes the subjects, the names and the sizes of the designs of before it keeps', () => {
    const merged = mergeCatalogs(catalog, managed);
    expect(merged.subjects['m-garden-wedding']).toEqual([1480, 520]);
    // A point that is not two numbers is left out.
    expect(merged.subjects['m-street-party']).toBeUndefined();
    expect(localName(merged.names.get('m-garden-wedding'), 'he')).toBe('חתונה בגן');
    expect(localName(merged.names.get('m-garden-wedding'), 'en-US')).toBe('Garden wedding');
    expect(localName(merged.names.get('m-street-party'), 'en')).toBeUndefined();
    expect(merged.sizes.get('m-garden-wedding')).toEqual([1536, 1024]);
    expect(merged.sizes.get('m-garden-wedding-bg')).toEqual([1920, 1080]);
    expect(merged.sizes.get('m-street-party')).toBeUndefined();
    expect(merged.sizes.get('constructor')).toBeUndefined();
  });

  it('names a design in the language of the interface, else in English, but Hebrew in Hebrew', () => {
    const names = { he: 'מפגש מפתחים', en: 'Developer meetup', de: 'Entwicklertreffen' };
    expect(localName(names, 'de-AT')).toBe('Entwicklertreffen');
    expect(localName(names, 'fr')).toBe('Developer meetup');
    expect(localName(names, 'he')).toBe('מפגש מפתחים');
    expect(localName({ en: 'Developer meetup' }, 'he')).toBeUndefined();
    expect(localName({ de: '  ', en: 'Developer meetup' }, 'de')).toBe('Developer meetup');
  });

  it('survives a file that is not what it should be', () => {
    const broken = {
      groups: 'invitations',
      groupIds: { invitations: 'm-a' },
      slides: null,
      names: [],
      groupNames: 7,
      sizes: [],
    } as unknown as Partial<ManagedDesignCatalog>;
    const merged = mergeCatalogs(catalog, broken);
    expect(merged.groups).toEqual(['events', 'business']);
    expect(merged.groupNames.size).toBe(1);
    expect(mergeCatalogs(broken).groups).toEqual([]);
    // An id that is a name of Object's own is not taken for a design.
    const sneaky = mergeCatalogs(undefined, {
      groups: ['x'],
      groupIds: { x: ['constructor', 'toString'] },
      slides: {},
    });
    expect(sneaky.groups).toEqual([]);
  });

  it('takes the tags of the designs of before it keeps, with the library’s', () => {
    const tagged = mergeCatalogs(catalog, {
      ...managed,
      tags: {
        'm-garden-wedding': { he: ['חתונה', 7], en: ['wedding'] },
        // The catalog's design of this id is kept, without the other's tags.
        wedding: { he: ['אחר'], en: ['other'] },
      } as unknown as ManagedDesignCatalog['tags'],
    });
    expect(tagged.tags.get('m-garden-wedding')).toEqual({ he: ['חתונה'], en: ['wedding'] });
    expect(tagged.tags.has('wedding')).toBe(false);
    expect(mergeCatalogs(catalog, managed).tags.size).toBe(0);
    const all = designTagsOf(
      {
        'm-garden-wedding': { he: ['גן'], en: ['garden', 'wedding'], fr: ['mariage'] },
        concert: { en: ['music'] },
      },
      tagged.tags,
    );
    expect(all['m-garden-wedding']).toEqual({
      he: ['חתונה', 'גן'],
      en: ['wedding', 'garden'],
      fr: ['mariage'],
    });
    expect(all.concert).toEqual({ en: ['music'] });
  });
});
