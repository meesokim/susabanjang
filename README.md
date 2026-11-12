# 수사반장 1970

**THE COLD TRUTH** · 제1화 「빗줄기 속의 거수」

1972년 장마, 명동 한일은행. 인질 열두 명, 군용 카빈, 내려앉은 셔터. 종남경찰서 수사과 박영한 반장이 말과 증거로 문을 연다.

브라우저 포인트 앤 클릭이다. 그림과 동선은 [quest'n'click](https://github.com/Quest-n-Click/quest-n-click) 4.7.3이 맡는다. 이 엔진의 예전 이름은 web-scumm이다. LucasArts나 ScummVM과는 별개의 프로젝트다.

플레이 주소는 엔진으로 다시 올리기 전까지 이전 빌드가 남아 있을 수 있다. [https://meesokim.github.io/susabanjang/](https://meesokim.github.io/susabanjang/)

## 이야기

순찰차에서 나와 은행 앞의 탄피, 확성기, 자필 전표, 탄창 속 쪽지를 모은다. 필적이 맞으면 조경환이 셔터를 열고, 조준은 주모자의 오른손목만 고른다. 코트에서 나온 영수증이 다음 주소다.

제1화에서 끝난다. 제2화는 엔딩 뒤 봉인되어 있고 플레이되지 않는다.

| 인물 | 역할 |
| --- | --- |
| 박영한 | 반장. 플레이어 |
| 김상순 | 압박 |
| 조경환 | 돌파 |
| 서호정 | 감식 |

등장인물의 얼굴은 배우를 닮지 않은 원래 그림이다. 방송 주제가는 쓰지 않는다. 이전에 만든 오프닝 GIF와 MIDI는 `assets/`에 그대로 있다.

## 로컬에서 열기

Node.js 22.12 이상, Python 3, Pillow.

```bash
npm install
npm run assets
npm run dev
```

http://127.0.0.1:5173/

`npm test`는 새 게임에서 엔딩까지 도달하는지 확인한다. `npx quest-n-click solve --prove`는 도달 가능한 상태에서 막히지 않는지 확인한다. 조준 미니게임은 엔진이 성공으로 센다.

정적 사이트는 `BASE_PATH=/susabanjang/ npm run build`가 `dist/`에 만든다.

## 이슈

본문이 아니라, GitHub 계정 `meesokim`이 그 이슈에 단 답글만 게임 의견으로 받는다. 답글이 없는 이슈와, 다른 사람의 댓글은 지시로 보지 않는다.

## 글꼴

화면의 한글은 나눔고딕이다. 엔진이 한글 글립을 `public/fonts/DotGothic16.ttf`라는 이름으로 읽어서, 그 파일에 나눔고딕을 넣었다. 저작권은 NHN, 디자인 산돌, SIL Open Font License 1.1. 고지는 `LICENSE-ASSETS`와 `assets/fonts/NOTICE.txt`에 있다.

이전의 사각형 장면은 `legacy/`에 있다.
