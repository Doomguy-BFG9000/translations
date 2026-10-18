# HD2 History Viewer — language pack

Korean and English text for the [HD2 History replay viewer](https://hd2-replay.code0987.me), an unofficial web viewer for Helldivers 2 mission exports. This repository is also the viewer's public issue board.

[HD2 History 리플레이 뷰어](https://hd2-replay.code0987.me)의 한국어·영어 문구 저장소입니다. 뷰어의 공개 이슈 게시판도 겸합니다.

- **Report a bug, a wrong name or an idea · 버그·이름 오류 제보와 제안**: [open an issue](https://github.com/hd2-history-viewer/translations/issues/new/choose)
- **Fix a translation · 번역 고치기**: see [CONTRIBUTING.md](CONTRIBUTING.md)

## Files

| File | Contents |
| --- | --- |
| `lang/ko.json` | Korean text · 한국어 |
| `lang/en.json` | English text · 영어 |
| `check.mjs` | Checks both files; also runs on every pull request |

The viewer loads the two JSON files directly as its `translations/` submodule; nothing needs building. Both files have exactly the same keys. A key missing from a language falls back to Korean, then to the key itself. An empty value shows nothing (`roadmapLanguage` is empty in English on purpose).

## Keys

- **Interface text** uses `module.name`, e.g. `account.signIn`, `share.copyLink`, `limits.alphaLimitations`. Some older keys have no module: `landingTitle`.
- **Game names** use `kind.name`. The name part is the English name in snake case: `enemy.warp_ship`, `stratagem.extraction_beacon`, `booster.stamina_enhancement`. Kinds are `enemy`, `stratagem`, `objective`, `booster`, `gear`, `stat` and `item`. `item` holds names the viewer has not sorted into a kind.
- **Slots** look like `{count}` or `{date}`. The viewer fills them in.
- English plurals that differ get two keys, e.g. `app.callCountOne` and `app.callCount`.

## Issues

Use the issue forms; Korean or English is fine. Please do not attach raw mission logs: they contain other players' names. Save the replay in the viewer and paste its share link instead.

이슈 양식을 골라 한국어나 영어로 써 주세요. 임무 로그 원본에는 다른 플레이어 이름이 들어 있으니 올리지 말고, 뷰어에서 저장한 뒤 공유 링크를 붙여 주세요.

## License

[MIT](LICENSE). Game names are the game's own Korean and English strings; Helldivers 2 belongs to Arrowhead Game Studios and Sony Interactive Entertainment. This is an unofficial fan project, not affiliated with them or with the HD2 History mod authors.
