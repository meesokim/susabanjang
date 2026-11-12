import { defineRoom } from '@quest-n-click/engine/content';

export default defineRoom({
  id: 'bank',
  name: '한일은행 객장',
  decor: 'decor/bank',
  music: 'bank',
  description:
    '1972 bank lobby after a raid. Marble floor, open vault spilling paper, two carbines, a grey coat in the foreground, rain through an open shutter. No people painted in.',
  actors: {
    sangsoon: { char: 'sangsoon', facing: 'right' },
    kyunghwan: { char: 'kyunghwan', facing: 'left' },
    hojeong: { char: 'hojeong', facing: 'left' },
    obal: { char: 'obal', facing: 'left' },
    woman: { char: 'woman', facing: 'right' },
  },
  hotspots: {
    coat: { name: '코트', defaultVerb: 'open' },
    vault: { name: '비상금고' },
    carbine: { name: '카빈' },
    hostages: { name: '인질들' },
  },
  look: {
    sangsoon: '숨은 고르다. 코트 안을 재촉하는 눈이다.',
    kyunghwan: '문은 이미 열렸다. 어깨의 힘이 빠져 있다.',
    hojeong: '코트와 영수증을 기다리는 감식의 손.',
    obal: '복면은 반쯤 벗겨졌다. 오른손목이 뒤로 꺾여 있고, 숨은 있다.',
    woman: '여직원. 목덜미에 남의 손자국. 다리는 떨리지만 서 있다.',
    coat: '진회색 코트. 안주머니가 바스락이는 두께다.',
    vault: '사설 비상금고는 열려 있다. 현찰은 그대로고, 문서 칸만 헤집어져 있다.',
    carbine: 'M1 카빈 두 정. 개머리판의 군용 각인이 줄칼로 지워져 있다.',
    hostages: '열두 명. 울음은 잦아들었고, 아무도 피를 흘리지 않는다.',
  },
  on: [
    {
      id: 'bank.open-coat',
      verb: ['open', 'pull', 'take', 'use'],
      a: 'coat',
      if: { not: 'receipt_got' },
      do: [
        { set: 'receipt_got' },
        { gain: 'receipt' },
        { id: 'bank.open-coat.narr', say: ['narr', '안주머니에서 찢긴 영수증이 나온다.'] },
        '청계천 3가, 평화시장 2열 4호. 금호상회.',
        { id: 'bank.open-coat.hojeong', say: ['hojeong', '그 종이, 제게 주십시오.'] },
      ],
    },
    {
      id: 'bank.coat-empty',
      verb: ['open', 'pull', 'take', 'use'],
      a: 'coat',
      do: ['안주머니는 이미 비었다.'],
    },
    {
      id: 'bank.give-receipt',
      verb: ['give', 'use'],
      a: 'receipt',
      b: 'hojeong',
      if: { not: 'briefed' },
      do: [
        { set: 'briefed' },
        { id: 'bank.brief.hojeong', say: ['hojeong', '영수증 도장, 금호상회. 청계천 3가 평화시장 2열 4호. 군용 카빈이 민간의 장부 위로 떨어진 주소입니다.'] },
        { id: 'bank.brief.sangsoon', say: ['sangsoon', '동대문 찌꺼기들 소행이 아닙니다. 물건을 대 주는 손이 따로 있습니다.'] },
        '오늘 인질은 살았다. 다음 주소는 청계천이다.',
      ],
    },
    {
      id: 'bank.vault',
      verb: ['open', 'look'],
      a: 'vault',
      do: [{ id: 'bank.vault.line', say: ['narr', '돈보다 장부와 무기 대금을 노린 손이다. 현찰은 그대로다.'] }],
    },
    {
      id: 'bank.vault-close',
      verb: 'close',
      a: 'vault',
      do: ['닫으면 감식이 멈춘다. 열어 둔다.'],
    },
    {
      id: 'bank.carbine',
      verb: 'take',
      a: 'carbine',
      do: ['증거물은 현장에 둔다. 탄창 하나가 이미 내 수첩에 있다.'],
    },
  ],
  talk: {
    hojeong: [
      {
        id: 'bank.hojeong.finish',
        topic: '조서를 마친다.',
        if: 'briefed',
        do: [
          { music: 'end' },
          { id: 'bank.finish.line', say: ['hojeong', '제1화의 사실관계는 닫혔습니다. 다음 주소만 남았습니다. 제2화는 봉인입니다.'] },
          { set: 'ended' },
          { end: true, credits: true },
        ],
      },
      {
        id: 'bank.hojeong.ask',
        topic: '조서는 어디까지오.',
        do: [{ id: 'bank.hojeong.ask.line', say: ['hojeong', '코트 안의 종이를 읽고, 조서를 닫으면 이 화는 끝입니다.'] }],
      },
    ],
    woman: [
      {
        id: 'bank.woman.ask',
        topic: '다친 데는 없소.',
        do: [
          {
            id: 'bank.woman.ask.line',
            say: ['woman', '살았습니다. 카빈을 든 사람이 제 목을 잡았어요. 오른쪽 손으로요. 창구의 이 대리는 강도가 오기 전부터 손을 떨고 있었습니다.'],
          },
        ],
      },
    ],
    obal: [
      {
        id: 'bank.obal.ask',
        topic: '이름이 무엇이오.',
        do: [{ id: 'bank.obal.ask.line', say: ['obal', '손목… 잘했다, 형사. 이름은 금호… 아니다. 변호사를 불러.'] }],
      },
    ],
    sangsoon: [
      {
        id: 'bank.sangsoon.ask',
        topic: '인질은.',
        do: [{ id: 'bank.sangsoon.ask.line', say: ['sangsoon', '숨은 쉬고 있습니다. 코트 안을 안 뒤지면 내일 조서가 비겠습니다.'] }],
      },
    ],
    kyunghwan: [
      {
        id: 'bank.kyunghwan.ask',
        topic: '문은.',
        do: [{ id: 'bank.kyunghwan.ask.line', say: ['kyunghwan', '문은 제가 따 놨습니다. 인질은 뒤에 앉혀 두었습니다.'] }],
      },
    ],
  },
  hints: [
    { id: 'bank.hint-receipt', until: 'receipt_got', lines: ['오발탄의 코트 안주머니를 연다.'] },
    { id: 'bank.hint-brief', until: 'briefed', lines: ['영수증을 서호정에게 건넨다.'] },
    { id: 'bank.hint-end', until: 'ended', lines: ['서호정에게 조서를 마친다고 말한다.'] },
  ],
  onEnter: [
    {
      id: 'bank.arrive',
      once: [
        { id: 'bank.arrive.line', say: ['narr', '객장의 대리석이 젖은 구두를 비춘다. 오발탄은 손목을 움켜쥔 채 무릎을 꿇고 있다.'] },
        { id: 'bank.arrive.woman', say: ['woman', '살았습니다. 저 사람, 창구의 이 대리가 셔터 코드를 알고 있었어요.'] },
      ],
    },
  ],
});
