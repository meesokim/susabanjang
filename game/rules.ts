import type { GameRules } from '@quest-n-click/engine/content';

function insider(id: string) {
  return [
    { set: 'insider' },
    {
      id: `${id}.line1`,
      say: ['hojeong', '같습니다. 자음 사이, 그리고 숫자 7의 긴 획. 탄창 쪽지와 이 대리 전표는 한 사람의 손입니다.'] as [
        string,
        string,
      ],
    },
    {
      id: `${id}.line2`,
      say: ['hojeong', '내부 첩자 확정. 여직원을 방패로 세운 주모자, 오른손목만 맞추십시오. 조경환에게 셔터를 맡기십시오.'] as [
        string,
        string,
      ],
    },
    '사람 탈을 쓰고 도면을 판 놈은 나중에 조서로 남긴다. 지금은 인질이다.',
  ];
}

export const rules: GameRules = {
  fallbacks: {
    give: ['그걸 건넬 상대가 아니다.', '지금 그 손에는 줄 것이 아니다.'],
    open: ['열릴 구조가 아니다.'],
    close: ['닫혀 있는 것이 아니다.'],
    take: ['집어 갈 물건이 아니다.'],
    look: ['빗물 외에 새로울 것이 없다.'],
    talk: ['말이 통할 상대가 아니다.'],
    use: ['그렇게 쓰이진 않는다.'],
    push: ['밀어 봤자 꿈쩍도 하지 않는다.'],
    pull: ['당겨 봤자 소용없다.'],
    use2: ['그걸 거기에 쓸 자리는 아니다.', '이 둘은 아직 한 문장이 되지 않는다.'],
  },
  kinds: [{ verb: 'take', kind: 'person', say: '{nom}은 데려갈 수 없다.' }],
  on: [
    {
      id: 'rules.notebook',
      verb: 'use',
      a: 'notebook',
      do: [{ hint: true }],
    },
    {
      id: 'rules.lighter',
      verb: 'use',
      a: 'lighter',
      do: [
        {
          id: 'rules.lighter.line',
          say: ['narr', '치익, 팟. 청자 한 개비가 비에 젖기 전에 붙는다.'] as [string, string],
        },
        '죄는 미워해도 사람은 미워하지 말라고 했다. 사람 탈을 쓴 놈은 따로 논다.',
      ],
    },
    {
      id: 'rules.gun',
      verb: 'use',
      a: 'gun',
      if: { not: 'arrested' },
      do: ['아직은 겨눌 자리가 아니다. 인질이 선 뒤에는 함부로 총구를 올리지 않는다.'],
    },
    {
      id: 'rules.shell',
      verb: ['give', 'use'],
      a: 'shell',
      b: 'hojeong',
      if: { not: 'analyzed' },
      do: [
        { set: 'analyzed' },
        {
          id: 'rules.shell.line1',
          say: ['hojeong', '밑동 각인 USA 1968. 지난달 미8군 불법 유출 목록의 M1 카빈 탄약과 일치합니다.'] as [
            string,
            string,
          ],
        },
        {
          id: 'rules.shell.line2',
          say: ['hojeong', '엽총이 아닙니다. 놈들은 사설 비상금고와 셔터 배선까지 알고 들어왔습니다. 내부입니다.'] as [
            string,
            string,
          ],
        },
      ],
    },
    {
      id: 'rules.shell-done',
      verb: ['give', 'use'],
      a: 'shell',
      b: 'hojeong',
      do: [{ id: 'rules.shell-done.line', say: ['hojeong', '각인은 이미 대조했습니다. USA 1968, 미8군 유출 카빈 탄약.'] as [string, string] }],
    },
    {
      id: 'rules.memo-early',
      verb: ['give', 'use'],
      a: 'memo',
      b: 'hojeong',
      if: { not: 'mag_got' },
      do: [{ id: 'rules.memo-early.line', say: ['hojeong', '한 손의 글씨로는 부족합니다. 전표와 탄창 속 쪽지, 둘 다 있어야 합니다.'] as [string, string] }],
    },
    {
      id: 'rules.mag-early',
      verb: ['give', 'use'],
      a: 'mag',
      b: 'hojeong',
      if: { not: 'memo_got' },
      do: [{ id: 'rules.mag-early.line', say: ['hojeong', '쪽지만으로는 부족합니다. 이 대리의 오늘 자 전표와 맞대야 합니다.'] as [string, string] }],
    },
    {
      id: 'rules.memo-mag',
      verb: 'use',
      a: 'memo',
      b: 'mag',
      if: { not: 'insider' },
      do: insider('rules.memo-mag'),
    },
    {
      id: 'rules.mag-memo',
      verb: 'use',
      a: 'mag',
      b: 'memo',
      if: { not: 'insider' },
      do: insider('rules.mag-memo'),
    },
    {
      id: 'rules.memo-hojeong',
      verb: ['give', 'use'],
      a: 'memo',
      b: 'hojeong',
      if: { all: ['mag_got', { not: 'insider' }] },
      do: insider('rules.memo-hojeong'),
    },
    {
      id: 'rules.mag-hojeong',
      verb: ['give', 'use'],
      a: 'mag',
      b: 'hojeong',
      if: { all: ['memo_got', { not: 'insider' }] },
      do: insider('rules.mag-hojeong'),
    },
    {
      id: 'rules.insider-done',
      verb: ['give', 'use'],
      a: 'memo',
      b: 'hojeong',
      do: [{ id: 'rules.insider-done.line', say: ['hojeong', '이미 확정입니다. 이 대리, 내부 첩자. 남은 것은 주모자의 오른손목입니다.'] as [string, string] }],
    },
  ],
};
