// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { harnessLook, installedByOrganization, installsWithNpm } from '../agent/harnessLook';
import { currentLanguage, i18n, languages, offerLanguages, offeredLanguages } from '../i18n';
import {
  customAgent,
  defaultAgent,
  setSystemPolicy,
  webAccessOf,
  webBlocked,
  webDefault,
  type SystemPolicy,
} from './systemSettings';

const policy = (agents: Partial<SystemPolicy['agents']> = {}): SystemPolicy => ({
  agents: { custom: [], ...agents },
  languages: {},
  images: {},
  stock: {},
});

afterEach(async () => {
  setSystemPolicy(null);
  localStorage.clear();
  await offerLanguages();
  await i18n.changeLanguage('en');
});

describe("the organization's settings (ADR-117)", () => {
  it('turn web access on, off to start with, or never', () => {
    // Without settings, on, and the user's to turn off.
    expect([webAccessOf(undefined), webAccessOf(false), webAccessOf(true)]).toEqual([
      true,
      false,
      true,
    ]);
    const off = policy({ webAccess: 'off' });
    expect([webDefault(off), webAccessOf(undefined, off), webAccessOf(true, off)]).toEqual([
      false,
      false,
      true,
    ]);
    const blocked = policy({ webAccess: 'blocked' });
    expect(webBlocked(blocked)).toBe(true);
    expect([webAccessOf(undefined, blocked), webAccessOf(true, blocked)]).toEqual([false, false]);
  });

  it("show the organization's agents by their name and mark, and say who installs them", () => {
    setSystemPolicy(
      policy({
        default: 'acme',
        custom: [
          { id: 'acme', name: 'Acme Agent', glyph: 'A', tone: 'teal', install: { winget: 'A.B' } },
          { id: 'webui', name: 'Open WebUI', install: { npm: '@acme/webui' } },
          { id: 'inhouse', name: 'In-house', tone: 'no-such-tint' },
        ],
      }),
    );
    expect(defaultAgent()).toBe('acme');
    expect(customAgent('acme')?.name).toBe('Acme Agent');
    expect(harnessLook('acme')).toEqual({
      name: 'Acme Agent',
      glyph: 'A',
      tone: 'bg-ui-tool-teal text-ui-tool-teal-fg',
      installer: 'winget',
    });
    // Without a mark, a terminal; without a tint of the design system, violet.
    expect(harnessLook('webui')?.glyph).toBeUndefined();
    expect(harnessLook('inhouse')?.tone).toBe('bg-ui-tool-violet text-ui-tool-violet-fg');
    expect([installsWithNpm('webui'), installedByOrganization('webui')]).toEqual([true, false]);
    expect(installedByOrganization('inhouse')).toBe(true);
    expect(installedByOrganization('acme')).toBe(false);
    // The app's own agents keep their looks.
    expect(harnessLook('claude-code')?.name).toBe('Claude');
    expect(installedByOrganization('claude-code')).toBe(false);
  });

  it('offer only their languages, and start in their default unless the user chose one', async () => {
    await offerLanguages(['he', 'en', 'xx'], 'he');
    expect(offeredLanguages()).toEqual(['en', 'he']);
    expect(currentLanguage()).toBe('he');

    // The user's own choice stands while it is offered.
    localStorage.setItem('slidr.language', 'en');
    await offerLanguages(['he', 'en'], 'he');
    expect(currentLanguage()).toBe('en');

    // A choice that is not offered gives way to the default, and is kept for when it is.
    localStorage.setItem('slidr.language', 'fr');
    await offerLanguages(['he', 'ar'], 'ar');
    expect(currentLanguage()).toBe('ar');
    expect(localStorage.getItem('slidr.language')).toBe('fr');

    // Without a default, the first offered when the system's is not.
    localStorage.clear();
    await offerLanguages(['ja', 'ko']);
    expect(['ja', 'ko']).toContain(currentLanguage());

    // A list that names none this version has offers every language.
    await offerLanguages(['xx']);
    expect(offeredLanguages()).toEqual(languages);
  });
});
