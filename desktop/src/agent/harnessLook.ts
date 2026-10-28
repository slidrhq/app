import { customAgent } from '../settings/systemSettings';

/**
 * How the app shows the harnesses it knows: a short name for the chat, the mark beside it, and
 * how the CLI is installed once the user approves (`setup.rs`, `install`). An agent of the
 * organization's own is shown as its system settings say (ADR-117). A harness it does not know
 * is shown by its own name, with a terminal for a mark.
 */
export interface HarnessLook {
  /** The product's name, without "CLI". */
  name: string;
  /** One or two characters on the mark; without them, a terminal. */
  glyph?: string;
  /** The mark's background and text colours. */
  tone: string;
  /**
   * `winget`: Windows App Installer installs the CLI. `npm`: npm installs it, and Windows App
   * Installer first installs Node.js when npm is missing (Gemini CLI is published on npm only).
   * `organization`: the organization installs it; the app does not.
   */
  installer: 'winget' | 'npm' | 'organization';
}

/** The tints an agent of the organization's may take, each its classes, written out whole. */
const TONES: Record<string, string> = {
  orange: 'bg-ui-tool-orange text-ui-tool-orange-fg',
  green: 'bg-ui-tool-green text-ui-tool-green-fg',
  blue: 'bg-ui-tool-blue text-ui-tool-blue-fg',
  violet: 'bg-ui-tool-violet text-ui-tool-violet-fg',
  teal: 'bg-ui-tool-teal text-ui-tool-teal-fg',
  pink: 'bg-ui-tool-pink text-ui-tool-pink-fg',
  rose: 'bg-ui-tool-rose text-ui-tool-rose-fg',
};

const LOOKS: Record<string, HarnessLook> = {
  'claude-code': {
    name: 'Claude',
    glyph: '✳',
    tone: 'bg-ui-tool-orange text-ui-tool-orange-fg',
    installer: 'winget',
  },
  'codex-cli': {
    name: 'Codex',
    glyph: '>_',
    tone: 'bg-ui-tool-green text-ui-tool-green-fg',
    installer: 'winget',
  },
  'copilot-cli': {
    name: 'GitHub Copilot',
    glyph: 'GH',
    tone: 'bg-ui-tool-blue text-ui-tool-blue-fg',
    installer: 'winget',
  },
  'gemini-cli': {
    name: 'Gemini',
    glyph: '✦',
    tone: 'bg-ui-tool-violet text-ui-tool-violet-fg',
    installer: 'npm',
  },
  'grok-cli': {
    name: 'Grok',
    glyph: 'G',
    tone: 'bg-ui-tool-teal text-ui-tool-teal-fg',
    installer: 'winget',
  },
};

export function harnessLook(id: string): HarnessLook | undefined {
  const own = LOOKS[id];
  if (own) return own;
  const agent = customAgent(id);
  if (!agent) return undefined;
  return {
    name: agent.name,
    ...(agent.glyph ? { glyph: agent.glyph } : {}),
    tone: TONES[agent.tone ?? ''] ?? TONES.violet!,
    installer: !agent.install ? 'organization' : 'npm' in agent.install ? 'npm' : 'winget',
  };
}

/** The short name of a harness: its look's, or its own without "CLI". */
export function harnessName(harness: { id: string; name: string }): string {
  return harnessLook(harness.id)?.name ?? harness.name.replace(/\s+CLI\b/gi, '');
}

/** Whether the CLI of a harness is installed with npm rather than Windows App Installer alone. */
export function installsWithNpm(id: string | undefined): boolean {
  return !!id && harnessLook(id)?.installer === 'npm';
}

/** Whether the organization installs the CLI of a harness, and the app offers no installation. */
export function installedByOrganization(id: string | undefined): boolean {
  return !!id && harnessLook(id)?.installer === 'organization';
}
