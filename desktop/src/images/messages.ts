import type { Messages } from '../i18n/he';

/*
 * The strings of the image providers in the app's own screens (GEN-01, GEN-03): the settings
 * section, and what a provider's state is called wherever it is shown. Nothing here names a
 * provider: a provider is described by what its descriptor says it can do (ADR-025).
 * Hebrew is the source of the keys; `en` must have the same ones.
 */
export const he = {
  settings: {
    title: 'תמונות AI',
    hint: 'מי יוצר את התמונות: בכלים של האפליקציה ובכלים של הסוכן.',
    providers: 'ספק התמונות',
    forProvider: 'ההגדרות של {{name}}',
    chooseFailed: 'הספק לא הוחלף. נסו שוב.',
    listFailed: 'לא ניתן לקרוא את רשימת הספקים',
    quality: 'איכות התמונה',
    qualityHint: 'איכות גבוהה יותר עולה יותר ולוקחת יותר זמן.',
  },
  quality: {
    low: 'נמוכה',
    medium: 'בינונית',
    high: 'גבוהה',
    auto: 'אוטומטית',
  },
  state: {
    not_chosen: 'לא נבחר',
    checking: 'בודק…',
    ready: 'מוכן',
    not_installed: 'לא מותקן',
    not_logged_in: 'לא מחובר',
    needs_key: 'דרוש מפתח',
    key_rejected: 'המפתח נדחה',
    unavailable: 'לא זמין',
  },
  edit: {
    exact: 'עורך תמונה קיימת במדויק, גם בתוך מסכה',
    regenerate: 'עריכה של תמונה היא ציור מחדש שלה',
    none: 'יוצר תמונות, בלי עריכה',
  },
  cost: {
    key: 'בתשלום לפי תמונה, במפתח שלכם',
    signIn: 'בלי מפתח, על ההתחברות של הכלי',
  },
  account: 'מחובר דרך {{account}}',
  // A provider that runs on an agent CLI (its `harness`): the app installs the CLI and signs it in.
  setup: {
    busy: 'בתהליך…',
    not_installed: 'הכלי לא מותקן במחשב.',
    not_logged_in: 'הכלי מותקן. נדרשת התחברות לחשבון.',
    installing: 'מתקינים את הכלי. הפעולה עשויה להימשך כמה דקות…',
    signingIn: 'השלימו את ההתחברות בחלון שנפתח.',
    install: 'התקנה…',
    signIn: 'התחברות לחשבון',
  },
  // Upscaling (AIO-04): the button of row B, its choices, and what it says while it works.
  upscale: {
    title: 'הגדלת רזולוציה',
    factor: 'פי {{factor}}',
    result: '{{size}} פיקסלים',
    missing: 'המודל אינו מותקן',
    tooLarge: 'התמונה גדולה מדי',
    starting: 'מגדיל את התמונה…',
    working: 'מגדיל את התמונה: {{percent}}%',
    cancel: 'ביטול ההגדלה',
    failed: 'התמונה לא הוגדלה',
    history: 'הגדלת רזולוציה',
  },
};

export const en: Messages<typeof he> = {
  settings: {
    title: 'AI images',
    hint: "Who makes the images: for the app's own tools and for the agent's.",
    providers: 'Image provider',
    forProvider: '{{name}} settings',
    chooseFailed: 'The provider was not changed. Try again.',
    listFailed: 'The list of providers could not be read',
    quality: 'Image quality',
    qualityHint: 'Higher quality costs more and takes longer.',
  },
  quality: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    auto: 'Automatic',
  },
  state: {
    not_chosen: 'Not chosen',
    checking: 'Checking…',
    ready: 'Ready',
    not_installed: 'Not installed',
    not_logged_in: 'Not signed in',
    needs_key: 'Needs a key',
    key_rejected: 'Key rejected',
    unavailable: 'Unavailable',
  },
  edit: {
    exact: 'Edits an existing image exactly, also inside a mask',
    regenerate: 'Editing an image redraws it',
    none: 'Makes images; no editing',
  },
  cost: {
    key: 'Paid per image, with your key',
    signIn: "No key: it uses the tool's own sign-in",
  },
  account: 'Signed in with {{account}}',
  setup: {
    busy: 'Working…',
    not_installed: 'The tool is not installed on this computer.',
    not_logged_in: 'The tool is installed. Sign in to your account to use it.',
    installing: 'Installing the tool. This may take a few minutes…',
    signingIn: 'Complete sign-in in the window that opened.',
    install: 'Install…',
    signIn: 'Sign in',
  },
  upscale: {
    title: 'Upscale',
    factor: '{{factor}} times the size',
    result: '{{size}} pixels',
    missing: 'The model is not installed',
    tooLarge: 'The picture is too large',
    starting: 'Upscaling the picture…',
    working: 'Upscaling the picture: {{percent}}%',
    cancel: 'Stop upscaling',
    failed: 'The picture was not upscaled',
    history: 'Upscale image',
  },
};
