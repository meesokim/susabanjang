import type { ItemDef } from '@quest-n-click/engine/content';

export const items: Record<string, ItemDef> = {
  notebook: {
    name: '수사수첩',
    icon: 'items/notebook',
    look: ['검은 수첩. 단서가 날짜순으로 꽂혀 있다. 사용하면 다음 할 일이 나온다.'],
  },
  lighter: {
    name: '지포 라이터',
    icon: 'items/lighter',
    look: ['닳은 지포. 엄지만 스치면 불이 붙는다.'],
  },
  gun: {
    name: '38구경',
    icon: 'items/gun',
    look: ['여섯 발이 들어 있다. 함부로 꺼낼 총이 아니다.'],
  },
  shell: {
    name: '탄피',
    icon: 'items/shell',
    look: ['소총 탄피. 밑동에 USA 1968이 찍혀 있다.'],
  },
  megaphone: {
    name: '확성기',
    icon: 'items/megaphone',
    look: ['경찰 확성기. 셔터 너머까지 목소리가 닿는다.'],
  },
  memo: {
    name: '자필 전표',
    icon: 'items/memo',
    look: ['대출 전표. 대부계 이 대리의 서명, 그리고 숫자 7의 획이 유독 길다.'],
  },
  mag: {
    name: '카빈 탄창',
    icon: 'items/mag',
    look: ['M1 카빈 탄창. USA 1968. 속에 접힌 쪽지의 글씨가 전표와 닮았다.'],
  },
  receipt: {
    name: '영수증 조각',
    icon: 'items/receipt',
    look: ['청계천 3가 평화시장 2열 4호. 도장은 금호상회.'],
  },
  match: {
    name: '성냥갑',
    icon: 'items/match',
    look: ['뷰익 글로브박스의 성냥. 상호는 비에 번져 읽히지 않는다.'],
  },
};
