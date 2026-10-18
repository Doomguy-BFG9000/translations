# Contributing

[![한국어](https://img.shields.io/badge/lang-한국어-blue)](CONTRIBUTING.ko.md)

Thanks for helping. Most changes here are small wording fixes, and a pull request that edits one line is welcome.

## What goes where

| You want to… | Do this |
| --- | --- |
| Fix a Korean or English sentence | Open a pull request that edits `lang/ko.json` or `lang/en.json` |
| Translate the viewer into another language | Open a pull request that adds `lang/<code>.json`; see [New languages](#new-languages) |
| Report a wrong game name or a missing icon | Open an issue with the "Wrong or missing name / icon" form |
| Report a bug or suggest a feature | Open an issue with the "Bug" or "Idea" form |

Not sure? Open an issue. Status labels (`roadmap`, `in-progress`, `deployed`) are set by maintainers.

## Editing text

1. **Find the key.** Search both files for the text you see on screen.
2. **Change the value only.** Keep the key as it is.
3. **Keep every slot.** Leave each `{slot}` with its exact name. You may move it anywhere in the sentence.
4. **No edge spaces.** Do not start or end a value with a space or `·`; the viewer adds separators itself.
5. **Run the check.** Run `node check.mjs` (Node 18 or newer) and make sure it prints `OK`. The same check runs on your pull request.

```json
"account.savedAtSize": "Saved {date} · {size} MiB"
```

## New languages

1. **Copy `lang/en.json`** to `lang/<code>.json`, using a language code such as `ja`, `de`, `zh-Hans` or `pt-BR`.
2. **Translate what you can.** A partial file is fine: delete the keys you have not translated, and the viewer shows English for them.
3. **Follow the same rules** as above: keep slots and no edge spaces. Use only keys that exist in `en.json`.
4. **Open a pull request.** Mention whether you can help keep it up to date.

The viewer menu only offers Korean and English today. When a new language arrives, the maintainers add it to the menu.

## Game names

- Use the game's own Korean and English names, as they appear in game.
- Do not guess, romanize or invent a name. If you are not sure, open an issue with a screenshot instead.
- Fixing a typo or an outdated name is welcome.

## Adding a key

New keys usually come with viewer changes, so the maintainers add them. If you add one, put it in both files and follow the patterns in the [README](README.md#keys).

## What does not belong here

This repository holds text only. Do not add any of these; the check rejects them:

- game IDs, hashes or internal names
- file paths
- images or icons

The mapping from game values to keys lives in the viewer, which is not public.

## How changes land

The main copy of this repository lives on the maintainers' own server and is kept in sync with GitHub both ways. A maintainer reviews and merges your pull request here as usual, and the merge flows back to the main copy automatically.

By contributing, you agree that your changes are released under the [MIT License](LICENSE). Please follow the [code of conduct](https://github.com/hd2-history-viewer/.github/blob/main/CODE_OF_CONDUCT.md).
