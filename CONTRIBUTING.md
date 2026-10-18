# Contributing · 기여 안내

Thanks for helping. Most changes here are small wording fixes, and a pull request that edits one line is welcome.

도와주셔서 고맙습니다. 대부분은 작은 문구 수정이고, 한 줄만 고친 풀 리퀘스트도 환영합니다.

## What goes where · 무엇을 어디로

| You want to… · 하려는 일 | Do this · 방법 |
| --- | --- |
| Fix a Korean or English sentence · 문장 고치기 | Pull request editing `lang/ko.json` or `lang/en.json` · 풀 리퀘스트 |
| Report a wrong game name or a missing icon · 게임 이름·아이콘 오류 | Issue, "Wrong or missing name / icon" form · 이슈 양식 |
| Report a bug or suggest a feature · 버그·제안 | Issue, "Bug" or "Idea" form · 이슈 양식 |

Not sure? Open an issue. · 잘 모르겠으면 이슈로 보내 주세요.

## Editing text · 문구 고치기

1. Find the key. Search both files for the text you see on screen. · 화면에 보이는 문장으로 두 파일을 검색해 키를 찾습니다.
2. Change the value. Keep the key as it is. · 값만 바꾸고 키는 그대로 둡니다.
3. Keep every `{slot}` and its exact name. You may move it anywhere in the sentence. · `{자리}`는 이름 그대로 남기고, 문장 안 위치는 자유롭게 옮겨도 됩니다.
4. Do not start or end a value with a space or `·`. The viewer adds separators itself. · 값의 앞뒤에 공백이나 `·`를 넣지 마세요. 구분자는 뷰어가 붙입니다.
5. Run `node check.mjs` (Node 18 or newer) and make sure it prints `OK`. The same check runs on your pull request. · `node check.mjs`를 실행해 `OK`가 나오는지 확인합니다. PR에서도 같은 검사가 돕니다.

```json
"account.savedAtSize": "Saved {date} · {size} MiB"
```

## Game names · 게임 이름

- Use the game's own Korean and English names, as they appear in game. · 게임 안에 나오는 공식 한국어·영어 이름을 씁니다.
- Do not guess, romanize or invent a name. If you are not sure, open an issue with a screenshot instead. · 추측하거나 음역해서 만들지 마세요. 확실하지 않으면 스크린샷과 함께 이슈로 보내 주세요.
- Fixing a typo or an outdated name is welcome. · 오타나 바뀐 이름을 고치는 것은 환영합니다.

## Adding a key · 키 추가

New keys come with viewer changes, so the maintainers usually add them. If you add one, put it in both files, using the patterns in [README.md](README.md#keys). · 새 키는 보통 뷰어 변경과 함께 관리자가 추가합니다. 직접 추가한다면 두 파일 모두에 넣어 주세요.

## What does not belong here · 여기에 두지 않는 것

This repository holds text only. Do not add game IDs, hashes, internal names, file paths, images or icons; the check rejects them. Which game value maps to which key lives in the viewer, which is not public.

이 저장소에는 문구만 둡니다. 게임 ID, 해시, 내부 이름, 파일 경로, 이미지·아이콘은 넣지 마세요. 검사에서 걸립니다. 게임 값과 키를 잇는 매핑은 비공개인 뷰어 쪽에 있습니다.

## How changes land · 반영 방식

The main copy of this repository lives on the maintainers' own server and is mirrored here. A maintainer applies your pull request there, with you as the author, and the mirror then updates this repository. Your pull request may show as closed rather than merged; that is expected.

이 저장소의 원본은 관리자 서버에 있고 여기는 미러입니다. 관리자가 PR을 원본에 반영하고(작성자는 그대로 유지), 미러가 이 저장소를 갱신합니다. 그래서 PR이 "병합"이 아닌 "닫힘"으로 보일 수 있습니다.

By contributing you agree that your changes are released under the [MIT License](LICENSE). Please follow the [code of conduct](https://github.com/hd2-history-viewer/.github/blob/main/CODE_OF_CONDUCT.md).

기여한 내용은 [MIT 라이선스](LICENSE)로 배포됩니다. [행동 강령](https://github.com/hd2-history-viewer/.github/blob/main/CODE_OF_CONDUCT.md)을 지켜 주세요.
