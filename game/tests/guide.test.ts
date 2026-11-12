import { describe, expect, it } from 'vitest';
import {
  aimAnswer,
  aimToken,
  choiceLabel,
  guideMove,
  HINT_MS,
  pressSpots,
  progressKey,
  secondsLeft,
  type PlayState,
  type ScenarioStep,
} from '../guide';

function play(room: string, flags: string[] = [], extra: Partial<PlayState> = {}): PlayState {
  return {
    room,
    flags: Object.fromEntries(flags.map((id) => [id, true])),
    visitedStreet: room !== 'car',
    done: false,
    ...extra,
  };
}

const playSurface = { kind: 'play' as const };

describe('progress guide', () => {
  it('suggests opening the car door and leaves the other ways to open it', () => {
    const move = guideMove(play('car', [], { visitedStreet: false }), playSurface);
    expect(move).toMatchObject({
      sole: true,
      hint: '차문을 열면 현장이다.',
      verb: 'open',
      verbs: ['open', 'use', 'pull'],
      action: { verb: 'open', target: 'door' },
    });
  });

  it('on the street, keeps every verb that still advances and suggests the shell', () => {
    const move = guideMove(play('street'), playSurface);
    expect(move?.sole).toBe(false);
    expect(move?.verb).toBe('take');
    expect(move?.hint).toBe('청원경찰 발치의 탄피를 집는다.');
    expect(move?.verbs).toEqual(['take', 'use', 'pull', 'open']);
    expect(move?.action).toEqual({ verb: 'take', target: 'shell' });
  });

  it('plays the only remaining verb by itself', () => {
    const move = guideMove(
      play('street', ['mega_got', 'saw_inside', 'clerk_out', 'know_lee', 'memo_got', 'mag_got', 'insider', 'arrested']),
      playSurface,
    );
    expect(move).toMatchObject({
      sole: true,
      verb: 'take',
      verbs: ['take'],
      action: { verb: 'take', target: 'shell' },
    });
  });

  it('plays the megaphone on the shutter when that is the only step', () => {
    const move = guideMove(play('street', ['shell_got', 'analyzed', 'mega_got', 'saw_inside']), playSurface);
    expect(move).toMatchObject({
      sole: true,
      hint: '확성기를 셔터에 쓰고, 땀 흘리는 양복부터 내보내라.',
      action: { verb: 'use', target: 'shutter', item: 'megaphone' },
    });
  });

  it('plays the handwriting check when that is the only step, using the slip on the magazine', () => {
    const move = guideMove(play('street', ['shell_got', 'analyzed', 'mega_got', 'saw_inside', 'clerk_out', 'know_lee', 'memo_got', 'mag_got']), playSurface);
    expect(move?.sole).toBe(true);
    expect(move?.verb).toBe('use');
    expect(move?.verbs).toEqual(['use', 'give']);
    expect(move?.items).toEqual(['memo', 'mag']);
    expect(move?.action).toEqual({ verb: 'use', target: 'mag', item: 'memo' });
  });

  it('disables the negotiation lines that do not bring the clerk out', () => {
    const move = guideMove(play('street', ['mega_got']), {
      kind: 'choice',
      options: [
        { label: '인질은 무사하냐.', exit: false },
        { label: '원하는 게 뭐냐.', exit: false },
        { label: '땀 흘리는 양복부터 내보내라.', exit: false },
        { label: '대화를 끝낸다.', exit: true },
      ],
    });
    expect(move).toMatchObject({
      sole: true,
      choice: '땀 흘리는 양복부터 내보내라.',
      choices: ['땀 흘리는 양복부터 내보내라.'],
      action: null,
    });
  });

  it('suggests the earlier story choice when two of them are on screen', () => {
    const steps: ScenarioStep[] = [
      { id: 'a', hint: '갑을 고른다.', room: 'street', when: () => true, verbs: ['talk'], target: 'a', choice: '갑' },
      { id: 'b', hint: '을을 고른다.', room: 'street', when: () => true, verbs: ['talk'], target: 'b', choice: '을' },
    ];
    const move = guideMove(
      play('street'),
      {
        kind: 'choice',
        options: [
          { label: '갑', exit: false },
          { label: '을', exit: false },
          { label: '물러선다.', exit: true },
        ],
      },
      steps,
    );
    expect(move?.sole).toBe(false);
    expect(move?.choice).toBe('갑');
    expect(move?.choices).toEqual(['갑', '을']);
  });

  it('leaves a side conversation through the exit', () => {
    const move = guideMove(play('street'), {
      kind: 'choice',
      options: [
        { label: '어찌 보나.', exit: false },
        { label: '물러선다.', exit: true },
      ],
    });
    expect(move).toMatchObject({ sole: true, choice: '물러선다.', choices: ['물러선다.'] });
  });

  it('picks the accomplice, then only the right wrist', () => {
    expect(aimAnswer('아래 양쪽이다. 카빈을 든 공범.')).toBe('mook');
    expect(aimAnswer('한가운데는 여직원이다. 오른손목만 맞춘다.')).toBe('wrist');
    expect(aimAnswer('손목이다. 권총이 떨어졌다.')).toBeNull();
    const aim = guideMove(play('street', ['insider']), {
      kind: 'aim',
      prompt: '한가운데는 여직원이다. 오른손목만 맞춘다.',
      tokens: ['hostage', 'chest', 'wrist'],
    });
    expect(aim).toMatchObject({ sole: true, aim: 'wrist' });
    expect(aimToken('/assets/img/aim/wrist.webp')).toBe('wrist');
  });

  it('suggests opening the coat, then giving the receipt', () => {
    expect(guideMove(play('bank'), playSurface)).toMatchObject({
      sole: true,
      action: { verb: 'open', target: 'coat' },
    });
    const brief = guideMove(play('bank', ['receipt_got']), playSurface);
    expect(brief).toMatchObject({
      sole: true,
      action: { verb: 'give', target: 'hojeong', item: 'receipt' },
    });
    expect(guideMove(play('bank', ['receipt_got', 'briefed']), playSurface)).toMatchObject({
      sole: true,
      action: { verb: 'talk', target: 'hojeong' },
    });
  });

  it('counts the last five seconds and stops when the wait is over', () => {
    expect(secondsLeft(0)).toBeNull();
    expect(secondsLeft(HINT_MS - 5_000 - 1)).toBeNull();
    expect(secondsLeft(HINT_MS - 5_000)).toBe(5);
    expect(secondsLeft(HINT_MS - 4_999)).toBe(5);
    expect(secondsLeft(HINT_MS - 1_000)).toBe(1);
    expect(secondsLeft(HINT_MS - 1)).toBe(1);
    expect(secondsLeft(HINT_MS)).toBeNull();
    expect(secondsLeft(HINT_MS + 500)).toBeNull();
  });

  it('names the button and the spot a press will show', () => {
    const door = guideMove(play('car', [], { visitedStreet: false }), playSurface);
    expect(pressSpots(door!)).toEqual([
      { kind: 'verb', id: 'open' },
      { kind: 'scene', id: 'door' },
    ]);
    const clerk = guideMove(play('street', ['shell_got', 'analyzed', 'mega_got', 'saw_inside']), playSurface);
    expect(pressSpots(clerk!)).toEqual([
      { kind: 'verb', id: 'use' },
      { kind: 'item', id: 'megaphone' },
      { kind: 'scene', id: 'shutter' },
    ]);
    const line = guideMove(play('street', ['mega_got']), {
      kind: 'choice',
      options: [
        { label: '인질은 무사하냐.', exit: false },
        { label: '땀 흘리는 양복부터 내보내라.', exit: false },
        { label: '대화를 끝낸다.', exit: true },
      ],
    });
    expect(pressSpots(line!)).toEqual([{ kind: 'choice', id: '땀 흘리는 양복부터 내보내라.' }]);
    const aim = guideMove(play('street', ['insider']), {
      kind: 'aim',
      prompt: '한가운데는 여직원이다. 오른손목만 맞춘다.',
      tokens: ['hostage', 'chest', 'wrist'],
    });
    expect(pressSpots(aim!)).toEqual([{ kind: 'aim', id: 'wrist' }]);
  });

  it('reads a choice label and changes the progress key when a flag flips', () => {
    expect(choiceLabel('• 땀 흘리는 양복부터 내보내라.')).toBe('땀 흘리는 양복부터 내보내라.');
    const before = progressKey(play('street'));
    const after = progressKey(play('street', ['shell_got']));
    expect(after).not.toBe(before);
  });
});
