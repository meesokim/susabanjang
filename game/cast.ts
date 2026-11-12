import type { CharacterDef, SpriteSet } from '@quest-n-click/engine/content';

function human(id: string): SpriteSet {
  const r = (row: number, a: number, b: number) =>
    Array.from({ length: b - a + 1 }, (_, i) => `${id}/r${row}c${a + i}`);
  return {
    walk: r(2, 1, 6),
    idle: [`${id}/r3c3`],
    talk: [`${id}/r3c4`, `${id}/r3c3`],
    front: [`${id}/r3c1`],
    back: [`${id}/r3c2`],
    point: [`${id}/r3c5`],
    use: [`${id}/r3c6`],
    walk_front: r(4, 1, 3),
    walk_back: r(4, 4, 6),
  };
}

function person(
  id: string,
  name: string,
  color: string,
  description: string,
  extra: Partial<CharacterDef> = {},
): CharacterDef {
  return {
    name,
    color,
    height: 264,
    kind: ['person'],
    portrait: `${id}/r1c2`,
    sprites: human(id),
    description,
    refuse: '그걸 받을 사람이 아니다.',
    ...extra,
  };
}

export const characters: Record<string, CharacterDef> = {
  park: person(
    'cast/park',
    '박영한',
    '#e8e0c8',
    'Original fictional detective in a dark trench coat, short black hair, tired eyes, not a portrait of any actor',
    { height: 270 },
  ),
  sangsoon: person(
    'cast/sangsoon',
    '김상순',
    '#ffb36b',
    'Original fictional stocky detective in a dark trench coat, pressing and loud, not a portrait of any actor',
    { height: 264 },
  ),
  kyunghwan: person(
    'cast/kyunghwan',
    '조경환',
    '#ff8fa3',
    'Original fictional broad man in a brown jacket, wrestler build, not a portrait of any actor',
    { height: 272 },
  ),
  hojeong: person(
    'cast/hojeong',
    '서호정',
    '#8fd3ff',
    'Original fictional slim detective with round glasses and a grey coat, not a portrait of any actor',
    { height: 262 },
  ),
  manager: person(
    'cast/manager',
    '박 지점장',
    '#ffe08f',
    'Original fictional older bank manager in a navy suit, not a portrait of any actor',
    { height: 258 },
  ),
  officer: person(
    'cast/officer',
    '청원경찰',
    '#c9a3ff',
    'Original fictional guard in a dark uniform with a white shoulder bandage, not a portrait of any actor',
    { height: 260 },
  ),
  lee: person(
    'cast/lee',
    '이 대리',
    '#d8d0c0',
    'Original fictional pale young clerk in a beige suit, not a portrait of any actor',
    { height: 260 },
  ),
  obal: person(
    'cast/obal',
    '오발탄',
    '#ff6b6b',
    'Original fictional man in a long grey coat with a white bandage on his forehead, not a portrait of any actor',
    { height: 266 },
  ),
  woman: person(
    'cast/woman',
    '여직원',
    '#f0d0c0',
    'Original fictional bank clerk in a tan suit, not a portrait of any actor',
    { height: 254 },
  ),
  narr: {
    name: '서술',
    color: '#9bb',
    offscreen: true,
    description: 'Narrator, no face',
  },
};
