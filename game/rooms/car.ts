import { defineRoom } from '@quest-n-click/engine/content';

export default defineRoom({
  id: 'car',
  name: '순찰차 안',
  decor: 'decor/car',
  music: 'car',
  description:
    '1970s police sedan interior in a monsoon, rain on the windshield, empty brown seats, a radio on the dash, a door handle at the left',
  hero: false,
  actors: {
    sangsoon: { char: 'sangsoon', facing: 'right' },
    hojeong: { char: 'hojeong', facing: 'left' },
    kyunghwan: { char: 'kyunghwan', facing: 'left' },
  },
  exits: {
    door: { name: '차문', to: 'street', entry: 'from_car', verbs: ['open', 'use', 'pull'], oneWay: true },
  },
  hotspots: {
    windshield: { name: '앞유리' },
    radio: { name: '무전기' },
  },
  look: {
    sangsoon: '종남서의 독종. 눈이 벌써 셔터 틈을 재고 있다.',
    hojeong: '안경 너머로 탄피와 시계를 함께 보는 형사.',
    kyunghwan: '씨름 출신의 어깨. 문짝이 보이면 참지 못한다.',
    windshield: '유리에 금이 간 네온이 흐른다. 은행 셔터가 삼 분의 이쯤 내려와 있다.',
    radio: '당직 주파수. 누군가가 숨어서 듣고 있을 소리.',
    door: '순찰차 문. 밖은 이미 사건 한가운데다.',
  },
  on: [
    {
      id: 'car.radio',
      verb: ['use', 'talk', 'pull'],
      a: 'radio',
      do: [
        { id: 'car.radio.line', say: ['narr', '무전기가 지직거린다. 본청 당직이 과잉을 삼가라 중얼거리고 끊긴다.'] },
        '과잉은 인질을 두고 가는 쪽이다.',
      ],
    },
    {
      id: 'car.door-close',
      verb: 'close',
      a: 'door',
      do: ['닫아 두면 인질이 더 오래 운다.'],
    },
  ],
  talk: {
    sangsoon: [
      {
        id: 'car.sangsoon.brief',
        topic: '현장은 어떻소.',
        do: [
          {
            id: 'car.sangsoon.brief.line',
            say: ['sangsoon', '반장님, 청원경찰 한 명이 어깨에 구멍을 냈습니다. 엽총이 아닙니다. 저건 군용입니다.'],
          },
        ],
      },
    ],
    hojeong: [
      {
        id: 'car.hojeong.brief',
        topic: '무엇부터 보나.',
        do: [{ id: 'car.hojeong.brief.line', say: ['hojeong', '현장에 탄피가 있을 겁니다. 각인부터 읽어야 총의 이름이 나옵니다.'] }],
      },
    ],
    kyunghwan: [
      {
        id: 'car.kyunghwan.brief',
        topic: '문은 누가 열까.',
        do: [{ id: 'car.kyunghwan.brief.line', say: ['kyunghwan', '주먹 뼈마디가 근질거립니다. 셔터만 열어 주시면 제가 먼저 들어갑니다.'] }],
      },
    ],
  },
  hints: [{ id: 'car.hint', until: { visited: 'street' }, lines: ['차문을 열면 현장이다.'] }],
  onEnter: [
    {
      id: 'car.arrive',
      once: [
        { id: 'car.arrive.line', say: ['narr', '와이퍼가 장마를 밀고 있다. 유리 너머, 인도 턱에 박힌 검은 차와 내려앉은 셔터.'] },
        { id: 'car.arrive.line2', say: ['sangsoon', '군용입니다, 반장님. 차문부터 여십시오.'] },
      ],
    },
  ],
});

export const checkpoints = {
  car: { room: 'car', inventory: ['notebook', 'lighter', 'gun'] },
};
