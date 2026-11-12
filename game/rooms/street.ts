import { defineRoom } from '@quest-n-click/engine/content';

const release = [
  { set: 'clerk_out' },
  { set: 'know_lee' },
  { set: 'saw_inside' },
  { id: 'street.release.obal', say: ['obal', '창백한 놈 하나 가져가라. 쓰러지면 너희 책임이니까. 다음은 없다.'] },
  { id: 'street.release.narr', say: ['narr', '셔터 틈으로 양복 사내가 밀려 나온다. 안색이 종이장이고, 안주머니가 각지게 불룩하다.'] },
  { id: 'street.release.hojeong', say: ['hojeong', '인질치고는 주머니를 너무 지킵니다. 저 손부터 보십시오.'] },
];

const mag = [
  { set: 'mag_got' },
  { gain: 'mag' },
  { id: 'street.mag.sangsoon', say: ['sangsoon', '이 대리. 안주머니, 본인이 까든지 내가 까든지 하시오.'] },
  { id: 'street.mag.narr', say: ['narr', '젖은 안주머니에서 M1 카빈 탄창이 떨어진다. 스프링 옆에 접힌 쪽지가 끼어 있다.'] },
  { id: 'street.mag.lee', say: ['lee', '빚만 갚아 준다기에 도면을 넘겼습니다. 사는 놈 이름은 모릅니다. 두목이 코트만 꼭 붙잡고 있었습니다.'] },
  { id: 'street.mag.hojeong', say: ['hojeong', '쪽지 필적과 전표를 맞대면 첩자인지 확정됩니다. 수첩을 쓰시거나, 둘 다 제게 주십시오.'] },
];

export default defineRoom({
  id: 'street',
  name: '한일은행 앞',
  decor: 'decor/street',
  music: 'street',
  description:
    'Rainy 1972 Seoul street. Left a black car against the curb. Center a yellow rope. Right a stone bank with a half-lowered shutter and warm light underneath. No people painted in.',
  actors: {
    sangsoon: { char: 'sangsoon', facing: 'right' },
    kyunghwan: { char: 'kyunghwan', facing: 'right' },
    hojeong: { char: 'hojeong', facing: 'left' },
    manager: { char: 'manager', facing: 'left' },
    officer: { char: 'officer', facing: 'left' },
    lee: { char: 'lee', facing: 'left', visible: 'clerk_out' },
  },
  props: {
    shell: { name: '탄피', img: 'items/shell', visible: '!shell_got' },
    megaphone: { name: '확성기', img: 'items/megaphone', visible: '!mega_got' },
    crate: { name: '군수 상자', img: 'items/mag', visible: 'trunk_open' },
    match: { name: '글로브박스', img: 'items/match', visible: { all: ['door_open', { not: 'match_got' }] } },
  },
  hotspots: {
    shutter: { name: '셔터', defaultVerb: 'pull' },
    buick: { name: '뷰익' },
    trunk: { name: '트렁크', defaultVerb: 'open' },
    buick_door: { name: '차문', defaultVerb: 'open' },
    sign: { name: '간판' },
    cordon: { name: '차단선' },
    doors: { name: '현관' },
  },
  look: {
    sangsoon: '종남서의 독종. 눈이 벌써 셔터 틈을 재고 있다.',
    kyunghwan: '씨름 출신의 어깨. 문짝이 보이면 참지 못한다.',
    hojeong: '안경 너머로 탄피와 시계를 함께 보는 형사.',
    manager: '박 지점장. 우산도 없이 서류 가방을 끌어안고 있다.',
    officer: '청원경찰. 어깨에 탄창 하나 들어갈 구멍. 의식은 있다. 사냥용 산탄이 남긴 상처가 아니다.',
    lee: '이 대리. 동공이 크고, 안주머니가 각진 무게로 처져 있다.',
    shell: '청원경찰 손등 옆, 젖은 보도 위에 소총 탄피.',
    megaphone: '순찰 확성기. 누군가 차단선에 내려놓고 웅크렸다.',
    crate: '빈 상자. 옆면에 미8군, 그리고 지워진 물품 번호.',
    match: '반쯤 열린 글로브박스. 성냥갑 하나가 비에 젖어 있다.',
    shutter: '철제 셔터가 내려와 있다. 아래 틈으로 화약 냄새와 객장의 노란 불이 샌다.',
    buick: '검은 뷰익. 인도 턱을 들이받고 멈췄다. 도주 차량이다.',
    trunk: '뷰익의 트렁크. 자물쇠는 이미 부러져 있다.',
    buick_door: '운전석 문. 급히 내리다 덜 닫혔다.',
    sign: '은행 간판. 금박이 빗물에 어둡다. 글자는 읽지 않는다.',
    cordon: '노란 줄. 구경꾼은 장마가 대신 밀어 냈다.',
    doors: '나무 문짝. 오늘 열린 문은 이쪽이 아니다. 셔터다.',
  },
  on: [
    {
      id: 'street.take-shell',
      verb: 'take',
      a: 'shell',
      if: '!shell_got',
      do: [
        { set: 'shell_got' },
        { gain: 'shell' },
        '탄피를 주웠다. 아직 따뜻하다.',
        { id: 'street.take-shell.line', say: ['hojeong', '그 각인, 제게 주십시오. 유출 목록과 맞대겠습니다.'] },
      ],
    },
    {
      id: 'street.take-mega',
      verb: ['take', 'use'],
      a: 'megaphone',
      if: '!mega_got',
      do: [
        { set: 'mega_got' },
        { gain: 'megaphone' },
        '확성기를 들었다. 셔터에 사용하면 안의 목소리가 들린다.',
      ],
    },
    {
      id: 'street.pull-shutter',
      verb: ['pull', 'open'],
      a: 'shutter',
      if: { not: 'saw_inside' },
      do: [
        { set: 'saw_inside' },
        { set: 'know_lee' },
        { id: 'street.pull-shutter.line1', say: ['narr', '틈을 더 당기자 안이 보인다. 복면 셋. 한가운데 사내가 여직원을 앞에 세우고 카빈을 겨눈다.'] },
        { id: 'street.pull-shutter.line2', say: ['narr', '창구 쪽 양복 사내는 얼굴이 종이처럼 희고, 안주머니를 움켜쥔 채 땀을 쏟고 있다.'] },
      ],
    },
    {
      id: 'street.pull-shutter-again',
      verb: ['pull', 'open'],
      a: 'shutter',
      do: [{ id: 'street.pull-shutter-again.line', say: ['narr', '한 번 본 안이다. 복면과, 땀 흘리는 양복.'] }],
    },
    {
      id: 'street.push-shutter',
      verb: 'push',
      a: 'shutter',
      do: [{ id: 'street.push-shutter.line', say: ['kyunghwan', '밀지 마십시오. 셔터는 제가 뜯습니다. 저를 지정해 맡기십시오.'] }],
    },
    {
      id: 'street.mega-shutter',
      verb: 'use',
      a: 'megaphone',
      b: 'shutter',
      do: [
        { id: 'street.mega-shutter.narr', say: ['narr', '박영한이 확성기의 스위치를 올린다. 쇳소리가 장마를 가른다.'] },
        {
          choice: [
            {
              id: 'street.nego.host',
              text: '인질은 무사하냐.',
              do: [{ id: 'street.nego.host.line', say: ['obal', '열둘은 살아 있다. 경관 하나가 어깨에 구멍을 냈을 뿐이야.'] }],
            },
            {
              id: 'street.nego.demand',
              text: '원하는 게 뭐냐.',
              do: [{ id: 'street.nego.demand.line', say: ['obal', '차 한 대, 그리고 길을 비워. 금고는 이미 끝났다.'] }],
            },
            {
              id: 'street.nego.release',
              text: '땀 흘리는 양복부터 내보내라.',
              if: { not: 'clerk_out' },
              once: true,
              do: release,
            },
            {
              id: 'street.nego.done',
              text: '대화를 끝낸다.',
              do: ['확성기를 내린다.'],
            },
          ],
        },
      ],
    },
    {
      id: 'street.talk-shutter',
      verb: 'talk',
      a: 'shutter',
      if: { not: 'mega_got' },
      do: ['목소리가 빗소리에 묻힌다. 확성기가 차단선 옆에 있다.'],
    },
    {
      id: 'street.open-trunk',
      verb: ['open', 'pull', 'use'],
      a: 'trunk',
      do: [
        { set: 'trunk_open' },
        { id: 'street.open-trunk.line', say: ['narr', '트렁크가 들린다. 빈 나무 상자. 스텐실이 미8군이다. 실었던 것은 이미 은행 안에 있다.'] },
      ],
    },
    {
      id: 'street.close-trunk',
      verb: 'close',
      a: 'trunk',
      if: 'trunk_open',
      do: [{ unset: 'trunk_open' }, '트렁크를 닫는다.'],
    },
    {
      id: 'street.open-buick',
      verb: ['open', 'pull', 'use'],
      a: 'buick_door',
      do: [{ set: 'door_open' }, { id: 'street.open-buick.line', say: ['narr', '문이 삐걱 열린다. 대시보드 너머 글로브박스가 반쯤 빠져 있다.'] }],
    },
    {
      id: 'street.close-buick',
      verb: 'close',
      a: 'buick_door',
      do: ['문을 닫아 둔다.'],
    },
    {
      id: 'street.take-match',
      verb: ['take', 'open', 'pull'],
      a: 'match',
      if: { not: 'match_got' },
      do: [{ set: 'match_got' }, { gain: 'match' }, '성냥갑을 꺼냈다. 상호는 번져서 오늘 단서가 되지 못한다.'],
    },
    {
      id: 'street.look-crate',
      verb: ['look', 'open'],
      a: 'crate',
      do: [{ id: 'street.look-crate.line', say: ['narr', '빈 상자. 옆면에 미8군. 무게의 흔적만 나무에 남아 있다.'] }],
    },
    {
      id: 'street.pull-lee',
      verb: ['pull', 'open'],
      a: 'lee',
      if: { all: ['clerk_out', { not: 'mag_got' }] },
      do: mag,
    },
    {
      id: 'street.pull-lee-done',
      verb: ['pull', 'open'],
      a: 'lee',
      do: [{ id: 'street.pull-lee-done.line', say: ['sangsoon', '탄창은 이미 우리 손입니다. 다음이나 하시죠.'] }],
    },
    {
      id: 'street.push-lee',
      verb: 'push',
      a: 'lee',
      do: [{ id: 'street.push-lee.line', say: ['lee', '왜 저를 미십니까. 저는 인질입니다!'] }],
    },
    {
      id: 'street.raid-early',
      verb: 'use',
      a: 'kyunghwan',
      b: 'shutter',
      if: { not: 'clerk_out' },
      do: [{ id: 'street.raid-early.line', say: ['kyunghwan', '인질이 열둘입니다. 섞여 있는 놈부터 빼내기 전에 문짝을 부수면, 카빈이 먼저 납니다.'] }],
    },
    {
      id: 'street.raid-wait',
      verb: 'use',
      a: 'kyunghwan',
      b: 'shutter',
      if: { not: 'insider' },
      do: [{ id: 'street.raid-wait.line', say: ['kyunghwan', '누구 손목인지 모릅니다. 잘못 쏘면 여직원이 맞습니다. 필적부터 확정하십시오.'] }],
    },
  ],
  talk: {
    officer: [
      {
        id: 'street.officer.wound',
        topic: '누가 쏘았소.',
        do: [
          { set: 'know_lee' },
          { id: 'street.officer.wound.line', say: ['officer', '대부계… 양복 입은 놈… 셔터 배선을 알고 있었어. 내가 말리려다…'] },
        ],
      },
    ],
    manager: [
      {
        id: 'street.manager.sit',
        topic: '상황을 말해 보시오.',
        do: [
          { set: 'know_lee' },
          { id: 'street.manager.sit.line1', say: ['manager', '사설 비상금고와 셔터 차단 배선은 제 책상 서랍에만 있었습니다.'] },
          { id: 'street.manager.sit.line2', say: ['manager', '오늘 아침 대부계 이 대리가 열쇠를 빌려 갔고, 서랍이 아직 헐겁습니다. 그 친구가 안에 있습니다.'] },
        ],
      },
      {
        id: 'street.manager.memo',
        topic: '이 대리의 자필을 주시오.',
        if: { all: ['know_lee', { not: 'memo_got' }] },
        do: [
          { set: 'memo_got' },
          { gain: 'memo' },
          { id: 'street.manager.memo.line', say: ['manager', '오늘 아침 이 대리가 대출 결재란에 쓴 전표입니다. 서랍 열쇠도 그 친구가 빌려 갔습니다.'] },
          '숫자 7을 아래에서 끌어 올리는 획. 잊지 말자.',
        ],
      },
    ],
    lee: [
      {
        id: 'street.lee.pocket',
        topic: '안주머니를 까라.',
        if: { not: 'mag_got' },
        do: [{ id: 'street.lee.pocket.line', say: ['sangsoon', '말은 됐습니다. 안주머니를 당기십시오.'] }],
      },
    ],
    sangsoon: [
      {
        id: 'street.sangsoon.press',
        topic: '이 대리를 압박해라.',
        if: { all: ['clerk_out', { not: 'mag_got' }] },
        do: [{ id: 'street.sangsoon.press.line', say: ['sangsoon', '고개는 끄덕였습니다. 반장님이 안주머니를 당기십시오.'] }],
      },
      {
        id: 'street.sangsoon.ask',
        topic: '어찌 보나.',
        do: [{ id: 'street.sangsoon.ask.line', say: ['sangsoon', '저 양복, 인질 표정이 아닙니다. 안주머니를 보면 됩니다.'] }],
      },
    ],
    kyunghwan: [
      {
        id: 'street.kyunghwan.raid',
        topic: '셔터를 맡긴다.',
        if: { all: ['insider', { not: 'arrested' }] },
        do: [
          { music: 'tense' },
          { sfx: 'shutter' },
          { id: 'street.kyunghwan.raid.line', say: ['kyunghwan', '문짝은 제가 뜯습니다. 열리면 오른손목만 보십시오.'] },
          {
            minigame: 'pick',
            params: {
              rounds: [
                {
                  prompt: '아래 양쪽이다. 카빈을 든 공범.',
                  options: ['aim/mook', 'aim/hostage', 'aim/chest'],
                  answer: 0,
                },
                {
                  prompt: '한가운데는 여직원이다. 오른손목만 맞춘다.',
                  options: ['aim/hostage', 'aim/chest', 'aim/wrist'],
                  answer: 2,
                },
              ],
              wrongLine: '거기가 아니다. 인질과 가슴은 죽인다.',
              win: '손목이다. 권총이 떨어졌다.',
            },
            then: [
              { set: 'arrested' },
              { id: 'street.raid.win1', say: ['kyunghwan', '손목입니다! 권총이 떨어졌습니다!'] },
              { id: 'street.raid.win2', say: ['sangsoon', '인질 열둘, 전원 호흡 확인. 오발탄은 생포. 죽이지 않은 게 오늘은 정답입니다.'] },
              { id: 'street.raid.win3', say: ['hojeong', '코트입니다, 반장님. 이 대리가 두목이 붙잡고 있었다던 그 코트.'] },
              { goto: 'bank' },
            ],
          },
        ],
      },
      {
        id: 'street.kyunghwan.wait',
        topic: '지금 들어가나.',
        if: { all: [{ not: 'insider' }, { not: 'arrested' }] },
        do: [{ id: 'street.kyunghwan.wait.line', say: ['kyunghwan', '누구 손목인지 정해지기 전에는 문짝을 안 뜯습니다.'] }],
      },
    ],
    hojeong: [
      {
        id: 'street.hojeong.shell',
        topic: '탄피를 맡긴다.',
        if: { all: [{ has: 'shell' }, { not: 'analyzed' }] },
        do: [
          { set: 'analyzed' },
          { id: 'street.hojeong.shell.line', say: ['hojeong', '밑동 각인 USA 1968. 미8군에서 빠진 M1 카빈 탄약과 같습니다. 내부입니다.'] },
        ],
      },
      {
        id: 'street.hojeong.ask',
        topic: '다음은 무엇이오.',
        do: [{ id: 'street.hojeong.ask.line', say: ['hojeong', '탄피, 확성기, 자필, 탄창 쪽지. 그 넷이 셔터를 엽니다.'] }],
      },
    ],
  },
  hints: [
    { id: 'street.hint-shell', until: 'shell_got', lines: ['청원경찰 발치의 탄피를 집는다.'] },
    { id: 'street.hint-analyzed', until: 'analyzed', lines: ['탄피를 서호정에게 준다.'] },
    { id: 'street.hint-mega', until: 'mega_got', lines: ['차단선 옆의 확성기를 집는다.'] },
    { id: 'street.hint-saw', until: 'saw_inside', lines: ['셔터 틈을 당겨 안을 본다.'] },
    { id: 'street.hint-clerk', until: 'clerk_out', lines: ['확성기를 셔터에 쓰고, 땀 흘리는 양복부터 내보내라.'] },
    { id: 'street.hint-memo', until: 'memo_got', lines: ['지점장에게 이 대리의 자필 전표를 받는다.'] },
    { id: 'street.hint-mag', until: 'mag_got', lines: ['이 대리의 안주머니를 당긴다.'] },
    { id: 'street.hint-insider', until: 'insider', lines: ['전표를 탄창에 사용한다.'] },
    { id: 'street.hint-raid', until: 'arrested', lines: ['조경환에게 셔터를 맡긴다. 오른손목만 고른다.'] },
  ],
  onEnter: [
    {
      id: 'street.arrive',
      once: [{ id: 'street.arrive.line', say: ['narr', '1972년 장마. 명동 인도에 화약 냄새가 셔터 틈으로 샌다.'] }],
    },
  ],
});
