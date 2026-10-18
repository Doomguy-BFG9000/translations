# HD2 History Viewer — language pack

[![한국어](https://img.shields.io/badge/lang-한국어-blue)](README.ko.md)
[![Check](https://github.com/hd2-history-viewer/translations/actions/workflows/check.yml/badge.svg)](https://github.com/hd2-history-viewer/translations/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Korean and English text for the [HD2 History replay viewer](https://hd2-replay.code0987.me), an unofficial web viewer for Helldivers 2 mission exports. This repository is also the viewer's public issue board.

- **Report a bug, a wrong name or an idea:** [open an issue](https://github.com/hd2-history-viewer/translations/issues/new/choose)
- **Fix a translation or add a new language:** see [CONTRIBUTING.md](CONTRIBUTING.md). New languages are welcome as pull requests.

## Files

| File | Contents |
| --- | --- |
| `lang/ko.json` | Korean text |
| `lang/en.json` | English text |
| `check.mjs` | Checks every language file; also runs on every pull request |
| `scripts/roadmap-sync.mjs` | Moves roadmap rows when issue labels change (see below) |

The viewer loads the two JSON files directly; nothing needs building.

- Both files have exactly the same keys.
- A key missing from a language falls back to English, then Korean, then the key itself.
- Other languages go in `lang/<code>.json` and may be partial.
- An empty value shows nothing. For example, `roadmapLanguage` is empty in English on purpose.

## Keys

- **Interface text** uses `module.name`, e.g. `account.signIn`, `share.copyLink`. Some older keys have no module, e.g. `landingTitle`.
- **Game names** use `kind.name`, where the name is the English name in snake case, e.g. `enemy.warp_ship`, `stratagem.extraction_beacon`.
  - Kinds: `enemy`, `stratagem`, `objective`, `booster`, `gear`, `stat`, `item`.
  - `item` holds names the viewer has not sorted into a kind yet.
- **Slots** look like `{count}` or `{date}`. The viewer fills them in.
- **Plurals:** when the English plural differs, there are two keys, e.g. `app.callCountOne` and `app.callCount`.

## Issues

Pick an issue form; Korean or English is fine.

Please do not attach raw mission logs. They contain other players' names. Save the replay in the viewer and paste its share link instead.

## Status labels

Maintainers move issues with labels, and the [viewer roadmap](https://hd2-replay.code0987.me) follows automatically:

| Label | Meaning | Roadmap |
| --- | --- | --- |
| `roadmap` | Planned | Listed under "Up next" |
| `in-progress` | Being worked on | "In progress" |
| `deployed` | Live on the site; the issue is then closed | "Shipped" |

A maintainer can also comment `/roadmap` (optionally followed by an English title) to put an issue on the roadmap.

## License

[MIT](LICENSE). Game names are the game's own Korean and English strings. Helldivers 2 belongs to Arrowhead Game Studios and Sony Interactive Entertainment. This is an unofficial fan project, not affiliated with them or with the HD2 History mod authors.
