# HD2 History Viewer — 언어 팩

[![English](https://img.shields.io/badge/lang-English-red)](README.md)
[![Check](https://github.com/hd2-history-viewer/translations/actions/workflows/check.yml/badge.svg)](https://github.com/hd2-history-viewer/translations/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Helldivers 2 임무 기록을 재생하는 비공식 웹 뷰어 [HD2 History 리플레이 뷰어](https://hd2-replay.code0987.me)의 한국어·영어 문구 저장소입니다. 뷰어의 공개 이슈 게시판도 겸합니다.

- **버그·이름 오류 제보와 제안:** [이슈 열기](https://github.com/hd2-history-viewer/translations/issues/new/choose)
- **번역 고치기, 새 언어 추가:** [CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)를 보세요. 새 언어는 풀 리퀘스트로 환영합니다.

## 파일

| 파일 | 내용 |
| --- | --- |
| `lang/ko.json` | 한국어 문구 |
| `lang/en.json` | 영어 문구 |
| `check.mjs` | 모든 언어 파일을 검사합니다. 모든 풀 리퀘스트에서도 자동으로 돕니다 |
| `scripts/roadmap-sync.mjs` | 이슈 라벨이 바뀌면 로드맵을 옮깁니다(아래 참고) |

뷰어는 두 JSON 파일을 그대로 읽습니다. 빌드 과정은 없습니다.

- 두 파일의 키는 똑같아야 합니다.
- 한 언어에 키가 없으면 영어, 한국어, 키 이름 순으로 대신 보여 줍니다.
- 다른 언어는 `lang/<코드>.json`에 두며, 일부만 번역해도 됩니다.
- 값이 비어 있으면 아무것도 보이지 않습니다. 예: `roadmapLanguage`는 영어에서 일부러 비워 둡니다.

## 키

- **화면 문구**는 `모듈.이름` 형식입니다. 예: `account.signIn`, `share.copyLink`. 예전 키 일부는 모듈 없이 이름만 씁니다. 예: `landingTitle`
- **게임 이름**은 `종류.이름` 형식이고, 이름은 영어 이름을 snake_case로 쓴 것입니다. 예: `enemy.warp_ship`, `stratagem.extraction_beacon`
  - 종류: `enemy`, `stratagem`, `objective`, `booster`, `gear`, `stat`, `item`
  - `item`은 뷰어가 아직 종류를 나누지 않은 이름입니다.
- **자리**는 `{count}`, `{date}`처럼 씁니다. 뷰어가 값을 채웁니다.
- **복수형:** 영어 복수형이 다르면 키가 두 개입니다. 예: `app.callCountOne`, `app.callCount`

## 이슈

이슈 양식을 골라 주세요. 한국어나 영어 모두 괜찮습니다.

임무 로그 원본은 올리지 마세요. 다른 플레이어 이름이 들어 있습니다. 뷰어에서 리플레이를 저장한 뒤 공유 링크를 붙여 주세요.

## 상태 라벨

관리자가 라벨로 이슈 상태를 옮기면 [뷰어 로드맵](https://hd2-replay.code0987.me)이 자동으로 따라갑니다.

| 라벨 | 뜻 | 로드맵 |
| --- | --- | --- |
| `roadmap` | 계획됨 | "다음 예정"에 표시 |
| `in-progress` | 작업 중 | "진행 중" |
| `deployed` | 사이트에 반영됨. 이슈는 자동으로 닫힙니다 | "반영됨" |

관리자는 `/roadmap` 댓글(뒤에 영어 제목을 붙일 수 있음)로도 이슈를 로드맵에 올릴 수 있습니다.

## 라이선스

[MIT](LICENSE). 게임 이름은 게임의 공식 한국어·영어 표기입니다. Helldivers 2의 권리는 Arrowhead Game Studios와 Sony Interactive Entertainment에 있습니다. 이 프로젝트는 비공식 팬 프로젝트이며, 이들이나 HD2 History 모드 제작자와 관련이 없습니다.
