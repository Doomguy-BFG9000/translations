# HD2 History viewer — language pack

Korean and English text for the HD2 History replay viewer. The viewer includes this repository as its `translations/` submodule and reads the two files below directly; nothing needs building.

| File | Contents |
| --- | --- |
| `lang/ko.json` | Korean text |
| `lang/en.json` | English text |

Both files have exactly the same keys. A key missing from a language falls back to Korean, then to the key itself.

## Keys

- **Interface text** uses `module.name` (`account.signIn`, `share.copyLink`, `limits.alphaLimitations`) or, for older strings, a plain name (`landingTitle`).
- **Game names** use `kind.name`, where the name is the English name in snake case: `enemy.warp_ship`, `stratagem.extraction_beacon`, `booster.stamina_enhancement`, `gear.primary_…`, `objective.…`, `stat.…`, `item.…` (names the viewer has not classified).
- **Slots** look like `{count}` or `{date}`. The viewer fills them; keep each slot, and move it wherever the sentence needs it.
- The viewer adds the ` · ` between pieces it joins, so a value never starts or ends with a space or `·`.
- English plurals that differ get two keys (`app.callCountOne` / `app.callCount`).

## Changing text

- Game names are the game's own Korean and English strings. Fix a typo or an outdated name freely; do not invent a name the game does not use.
- Add a new key to both files in the same change.
- This pack holds text only. Which game value maps to which key, and the icons, live in the viewer.

## License

MIT; see `LICENSE`.
