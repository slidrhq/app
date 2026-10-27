# Media library

The content the app offers is a library published apart from the app: the built-in templates and their photographs, the designs, card sets, shapes, graphics, frames, emoji and art of Elements, the icon sets and the fonts of decks. It is a site on the web, **https://media.slidr.studio**, and the app reads it while it runs. Nothing of it is built into the app or installed with it ([ADR-090](adr/ADR-090-media-library-on-the-web.md)). It lives in the R2 bucket of [Slidr Library](https://github.com/slidrhq/library)'s Worker, and media.slidr.studio is that bucket itself, through Cloudflare's cache, with no Worker on the way ([ADR-113](adr/ADR-113-the-library-served-from-its-bucket.md); the library's README, "Serving the library"). Everything published reaches it through the library's API ([ADR-110](adr/ADR-110-library-published-through-its-api.md); the library's README, "Publishing the uploads"), and a publication empties the cache of the files it wrote. Releases before [ADR-112](adr/ADR-112-the-library-at-media-slidr-studio.md) read `https://slidr-media.pages.dev`, which no longer answers.

```text
manifest.json                  every file below: its size and SHA-256
fonts/catalog.json             the built-in fonts of decks, and fonts/<family>/*.woff2
icons/                         the Lucide and Tabler sets, their search words, hebrew.json
images/templates/*.webp        the photographs of the built-in templates
images/designs/                the pictures of the ready-made slides, and sizes.json
images/designs/thumbs/         each ready-made slide as the galleries show it, by width and language, and index.json
images/frames/                 the event magnets as the Elements panel shows them, and index.json
elements/designs/index.json    the ready-made slides of Elements
elements/designs/managed.json  the ready-made slides Slidr Studio makes
elements/designs/<language>/   both of them, with the slides of that language alone   (written on publishing)
elements/designs/revs.json     a word for each ready-made slide in each language       (written on publishing)
elements/cards/catalog.json    the card sets
elements/catalogs/             shapes, graphics, frames and emoji, with their notices
elements/art/                  the drawings of the art sets, with their notices
tags/<kind>.json               the search tags of the icons, graphics, emoji, frames, shapes, card sets and designs
templates/catalog.json         the built-in templates with their samples, as authored
templates/index.json           their ids in the order they are shown       (written on publishing)
templates/<id>/template.json   each of them as a deck takes it              (written on publishing)
templates/pictures.json        the pictures of their samples, by id         (written on publishing)
templates/reference-decks/     the reference decks
```

## How the app reads it

Pages never name the site. They ask `@slidr/media-library` (`packages/media-library`), which knows where the library is in the place they run:

- **In the app**, through the core's `media` protocol, `http://media.localhost/<path>` (`src-tauri/src/media_library.rs`). The webview stays closed to the network (SEC-05); Rust makes the calls.
  - When the app starts it reads `manifest.json` from the site and keeps it, in `%LOCALAPPDATA%\<identifier>\media\`. Without the network the last one read stands.
  - The library is never copied to the machine. A file is fetched only when a page asks for it: it comes from the cache (`media\objects\<sha256>`) when the cache holds those very bytes; otherwise it is fetched, checked against the manifest and kept. So what the app has used is there without the network, and nothing else is. A new manifest takes from the cache what it no longer names.
- **In a plain browser** (`pnpm dev`, the end-to-end tests, the browser tests), the dev server serves the library at `/media-library/` as the protocol does, from the site, with a cache in `desktop/node_modules/.cache/slidr-media` (`build/media.ts`).
- **In Node** (the unit tests, scripts), from the site itself.

## Without the library

No network, a library that was never published, or an empty one: the app starts and works without what it lacks. Without the network, what the app used before is at hand from its cache; what it never used is not.

| Content                         | Without it                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Built-in templates              | The template library holds the user's own; a new deck starts plain                             |
| Template photographs            | A cover shows its layout without the photograph                                                |
| Fonts of decks                  | Text is set in the fonts of the system; the font lists offer those and the user's own          |
| Icons, graphics, emoji, frames  | The panel says it could not load them, and tries again the next time it is opened              |
| Designs, card sets              | The galleries are empty; a card set already on a slide is a plain group                        |
| Shapes and lines                | The app's own list of them, as it was before the catalog moved to the library                  |

The unit tests that check the library's content (templates, designs, card sets, frames, art) are skipped when it is not published.

## Changing it

What comes from outside the app comes through Slidr Library's upload API, and nothing of it needs a copy: Slidr Studio's designs and samples, and the search tags (below). A reviewer approves each upload on the library's page, and approving writes it into the library at once. One that could not be written then is written by the library's own jobs, once a minute, or by **Try again** (`POST /api/publish`).

The app no longer makes any of the library's content. The scripts that wrote its catalogs, pictures and fonts into a local copy of the library are gone, with the copy and with `pnpm media:pull` and `pnpm media:publish` ([ADR-114](adr/ADR-114-no-copy-of-the-library.md)). The library's files are what they are: the templates of `templates/catalog.json`, the designs of `elements/designs/`, the catalogs of Elements and the fonts. A change to one comes through Slidr Library: an upload, or a file sent through its API.

A gallery of ready-made slides reads them in its own language, `elements/designs/<language>/index.json` and `managed.json`, which publishing writes from the two catalogs: one language is a sixteenth of them ([ADR-109](adr/ADR-109-ready-slides-by-language-and-as-pictures.md)). It shows each design as a picture made ahead, `images/designs/thumbs/<width>/<language>/<design>.webp` at 320 pixels wide ([ADR-111](adr/ADR-111-ready-slides-as-pictures-of-one-width.md)), of the renderer's own drawing. Each picture is of a word of its design, of its slide and its pictures (`desktop/src/elements/designWord.ts`): the gallery makes the word of each design it reads, and a design whose word is not its picture's is drawn live, alone. Slidr Library writes the files made of the catalogs on every publication, the catalogs in each language and the words (`elements/designs/revs.json`), and the word of each picture a design was uploaded with: Slidr Studio sends the picture of each slide as the galleries show it ([ADR-116](adr/ADR-116-pictures-of-the-designs-kept-up-by-the-library.md)). A change to how the renderer draws, or to a font, changes no word: raising `DESIGN_DRAWING` in `designWord.ts` puts every picture out of date.

The photo frames are in `elements/catalogs/frames-catalog.json`. The Elements panel shows an event magnet from a small picture of it, `images/frames/<language>/<frame>.webp`, of the renderer's own drawing. A magnet whose picture is of an earlier drawing is drawn live in the panel, and `frames.test.ts` fails.

### Search tags

Everything Elements and Ready slides offer is searched by its names and by its tags: words in Hebrew and in English for what it shows, what it is for, and the occasions and themes it suits, so "יום הולדת" finds the birthday invitation, the cake, the balloons and the birthday magnets ([ADR-108](adr/ADR-108-search-tags.md)). They are in `tags/`, a file a kind (`icons`, `graphics`, `emoji`, `frames`, `shapes`, `cards`, `designs`), each an item a line under the key its catalog gives it:

```json
{
  "version": 1,
  "tags": {
    "fluent-emoji:balloon": { "en": ["balloon", "party", "birthday"], "he": ["בלון", "מסיבה", "יום הולדת"] }
  }
}
```

Claude writes them: `desktop/scripts/tag-elements.mjs` gives it each item with what the catalogs say of it (its names, the words its set gives it, a design's text) and, for a graphic, a picture of the drawing, and checks every answer. It tags what has no tags yet, so run it after a catalog of the library changed; `--again <key,...>` writes an item's tags again. It needs the Claude Code CLI, signed in. It reads the published library, with no copy of it, and keeps the tags it writes in `desktop/.tags/<kind>.json` (`--work <dir>`), which a first run starts from the published tags, and where it goes on from the next time.

The search also reads tags in all the other `CONTENT_LANGUAGES`. Run `node desktop/scripts/translate-tags.mjs` to translate existing English tags into the other fourteen languages, using the Hebrew tags and item keys for context. `--languages fr,ja` limits a run; `--dry-run` reports what remains. Distinct phrases are translated once per language, with progress kept in `desktop/.tags/translations.json`; an incomplete run leaves the source files unchanged and can be resumed. Both the tags of `desktop/.tags/` (or the published `tags/`) and the designs' own in `managed.json` are included. English and Hebrew are preserved. The upload script sends every language present, and the library accepts these languages for the `tag` action. All supplied languages must tag the same item keys.

The tags reach the library through the upload API of [Slidr Library](https://github.com/slidrhq/library) (its README, "Uploading"): `--upload <the library's page>` with `LIBRARY_TOKEN`, a person's token of the `upload` scope (`slk_…`, made in the library's profile), sends each kind's tags as one upload of `tag`. The library checks each against what it publishes (every key an item of the kind, every list of tags in its language's letters) and keeps it until a reviewer approves it. Approving publishes it at once: it is merged into `tags/<kind>.json` of the library itself, where an item named takes these tags and the others keep theirs, and the upload is marked published. A new design comes with its tags in its own upload (`designs: add` takes them, and refuses a design without them), as Slidr Studio sends its designs; publishing writes them into `managed.json` (below). `src/media/icons/tags.test.ts` fails while an item of a kind the library tags has none. Without the files, the app finds everything by its names, as before.

A publication writes into the library's bucket and empties Cloudflare's cache of the files written, so every app reads them at its next start ([ADR-113](adr/ADR-113-the-library-served-from-its-bucket.md)). Slidr Library also takes files through its API, `PUT /api/library/staged/<sha256>` and `POST /api/library/files`, each file with the hash it was changed from (its README, "Publishing the uploads"). The bucket holds every catalog whole.

A development build and the dev server read another copy when `SLIDR_MEDIA_URL` names one: a dev server of Slidr Library (`http://127.0.0.1:5176/media/`), or another server on this machine. A release build reads the published library, unless its installation names another (below).

## A library of your own

An installed app reads the library from an address the organization chooses, in place of the published one. It is set in one of two places, and nothing of the app is built again for it ([ADR-107](adr/ADR-107-a-library-of-your-own.md)). An organization sets a policy; a single installer carries the address itself.

### A policy for the organization

`HKLM\SOFTWARE\Policies\Slidr`, the string value `MediaLibraryUrl`, is the address every app on the machine reads. Set it once for the domain with Group Policy or Intune (or `HKCU` for one user), and the machines run the **released installer, unchanged and signed as it is**; the end user sets nothing and need not know where the library is. The app reads the policy each time it starts, so a change reaches every machine at its next start. `HKLM` comes before `HKCU`, and both before an installer's own file below.

```powershell
New-Item   -Path 'HKLM:\SOFTWARE\Policies\Slidr' -Force | Out-Null
New-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Slidr' -Name MediaLibraryUrl `
  -PropertyType String -Value 'https://media.example.org/slidr/' -Force
```

### An installer that carries the address

An installed app also reads the library from a file beside `slidr.exe`, `media-library.json`: `{ "url": "https://media.example.org/slidr/" }`. The released installer writes that file, so a single installer that carries an address needs no build of the app:

```bat
Slidr_0.1.0_x64-setup.exe /S /MEDIA="https://media.example.org/slidr/"
```

Without a command line, a `media-library.json` beside the installer does the same: the installer copies it. A folder with the two is an installation that reads that copy. `/MEDIA=` wins over the file, and `/MEDIA=` with nothing after it takes the file away, back to the published library. An installation with neither keeps the address it had, so the app's own updates keep it; uninstalling takes it away. An administrator may also write the file by hand; the app reads it when it next starts.

A policy or a file that names no address the app may read leaves it with no library at all, as in [Without the library](#without-the-library). That covers a file that cannot be read, is not JSON, or has no `url`, and an address that is not HTTPS (plain HTTP is allowed only on `localhost`). The app never falls back to the published library then: the administrator chose a copy, and on a closed network a call to the published site would look like an attempt to get out. Only an installation with neither a policy nor a file reads the published library.

Keep the address in quotes. Unquoted, a part of its path that begins like one of the installer's own options turns that option on too (`/public/` is `/P`, passive; `/reports/` is `/R`, restart). cmd.exe and deployment tools pass the quotes on. PowerShell keeps them only inside one string: `Start-Process .\Slidr_0.1.0_x64-setup.exe -ArgumentList '/S /MEDIA="https://media.example.org/slidr/"'`.

### A Slidr Library of your own

An organization that would manage its library, and not only read a copy of it, installs Slidr Library on a Linux machine of its own (the library's README, "A local library"). It is one Docker image, installed by a script that asks for the folder of that machine's own disks that holds the media, the owner's address, and how the library is reached. It fills the media from the published library, and serves it at `<the library's address>/media/`: that is the address to give the apps, by the policy or the installer above. People upload to it, by its page or with a token of their own, and its reviewers' approval writes into its media at once. It and the published library go their own ways from then on: nothing it publishes reaches the published library, and nothing published there reaches it.

### A copy

The copy is any static site with the layout above, over HTTPS (plain HTTP only on `localhost`). It needs `manifest.json` at its root and every file at its path. A file it does not have is answered 404, not a page with 200, and a redirect stays on its host. The app reads it from Rust, so it needs no CORS. To make one from the published library, copy `manifest.json` and every file it names, at its path, from https://media.slidr.studio/ (any tool that downloads a list of addresses will do), and check each against its SHA-256. Nothing is published into such a copy: publishing writes into a Slidr Library, the published one or one of your own. The dev server and the studio read such a copy with `SLIDR_MEDIA_URL`.

On a machine that ran Slidr before, the manifest of the old address stands until the new one is read, when the app starts online. What is cached is kept by its hash, so a file both libraries have is not fetched again.

## Designs made by Slidr Studio

Slidr Studio ([slidrhq/studio](https://github.com/slidrhq/studio)) publishes the designs it makes into a catalog of their own, `elements/designs/managed.json`, so that it never writes over the authored `index.json`. Their ids start with `m-`. Their pictures are `images/designs/<id>.webp` (and `<id>-bg.webp`) like the others, but their pixel sizes, their names in both languages and their search tags (`tags`, written by Claude as it plans the design) are in `managed.json`, not in `sizes.json`, the app's messages or `tags/designs.json`. The app finds a design by the tags of both files.

A design's slide, and a template's sample, is written in Hebrew and in English, and may be written in any other language of `packages/model/src/languages.ts` (`slides[id].<code>`, `samples[template].<code>`). A deck gets the one in its own language, else the English one ([ADR-098](adr/ADR-098-content-in-every-language.md)). The fonts catalog tags each family with the scripts it ships (`he`, `latin`, `arabic`, `cyrillic`, `vietnamese`, `devanagari`, `japanese`, `korean`, `chinese`), the ones it was made for (`for`), and, for each script it lacks, its `counterparts`: the family of those letters closest to it in character. A deck's font lists offer the families of its language and of English (`familyForDeck`), and a design's text in another language is set in its source's family or that family's counterpart ([ADR-105](adr/ADR-105-fonts-of-every-language.md); `designs.test.ts` checks it).

The app reads `managed.json` after `index.json` and puts its designs after the authored ones: in a group the authored catalog has, after its designs; in a group of their own, after the authored groups. Where both have an id, the authored design is kept.

An author's publication sends only what the author changed since the pull, so it never takes away a design published from an upload. Pull before changing anything, since a pull puts the published bytes back over a file that differs.

## Licences

Content made from someone else's data carries its notice beside it (`<name>.notice.json`), and is published with it: the art sets, the emoji catalog, and each font family of decks as `fonts/<family>/<family>.notice.json` (the package, its licence, and the licence's text with the copyright). The app's own `THIRD-PARTY-NOTICES.txt` lists what its build contains, which is no longer this content; the licences dialog adds every notice the manifest names, read from the library when the dialog is opened (`src/about/notices.ts`). One that cannot be read then (no network, not read before) is counted as missing.
