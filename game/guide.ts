// When a puzzle sits still, the last five seconds count down and the next press is previewed.
// At ten seconds, wrong buttons fade. One story step plays itself after a pause that shows the button and the spot.
// Two or more stay up, and the earliest is outlined.
// Holding Space skips the wait and still shows that press before it happens.

export const HINT_MS = 10_000;
export const COUNTDOWN_MS = 5_000;
/** How long the press stays on screen before the button is actually pushed. */
export const REVEAL_MS = 1_600;

const EXITS = new Set(['물러선다.', '대화를 끝낸다.']);

export interface PlayState {
  room: string;
  flags: Readonly<Record<string, boolean>>;
  visitedStreet: boolean;
  done: boolean;
}

export interface ScenarioStep {
  id: string;
  hint: string;
  room: string;
  when: (s: PlayState) => boolean;
  /** Verbs that really do this step. The first one is the one we suggest and play. */
  verbs: readonly string[];
  target: string;
  item?: string;
  /** Inventory buttons that belong to this step. */
  items?: readonly string[];
  /** Topic or inline choice that completes the step. */
  choice?: string;
}

export type Surface =
  | { kind: 'play' }
  | { kind: 'choice'; options: { label: string; exit: boolean }[] }
  | { kind: 'aim'; prompt: string; tokens: string[] };

export interface GuideAction {
  verb: string;
  target: string;
  item?: string;
}

/** What the screen should do with the current buttons. */
export interface GuideMove {
  /** One correct button is left, so it should play on its own. */
  sole: boolean;
  hint: string;
  verbs: string[];
  items: string[];
  verb: string | null;
  item: string | null;
  choice: string | null;
  choices: string[];
  aim: string | null;
  action: GuideAction | null;
}

const on = (s: PlayState, id: string) => !!s.flags[id];

export const scenarioSteps: readonly ScenarioStep[] = [
  {
    id: 'door',
    hint: '차문을 열면 현장이다.',
    room: 'car',
    when: (s) => !s.visitedStreet,
    verbs: ['open', 'use', 'pull'],
    target: 'door',
  },
  {
    id: 'shell',
    hint: '청원경찰 발치의 탄피를 집는다.',
    room: 'street',
    when: (s) => !on(s, 'shell_got'),
    verbs: ['take'],
    target: 'shell',
  },
  {
    id: 'analyze',
    hint: '탄피를 서호정에게 준다.',
    room: 'street',
    when: (s) => on(s, 'shell_got') && !on(s, 'analyzed'),
    verbs: ['give', 'use'],
    target: 'hojeong',
    item: 'shell',
    items: ['shell'],
    choice: '탄피를 맡긴다.',
  },
  {
    id: 'mega',
    hint: '차단선 옆의 확성기를 집는다.',
    room: 'street',
    when: (s) => !on(s, 'mega_got'),
    verbs: ['take', 'use'],
    target: 'megaphone',
  },
  {
    id: 'saw',
    hint: '셔터 틈을 당겨 안을 본다.',
    room: 'street',
    when: (s) => !on(s, 'saw_inside'),
    verbs: ['pull', 'open'],
    target: 'shutter',
  },
  {
    id: 'clerk',
    hint: '확성기를 셔터에 쓰고, 땀 흘리는 양복부터 내보내라.',
    room: 'street',
    when: (s) => on(s, 'mega_got') && !on(s, 'clerk_out'),
    verbs: ['use'],
    target: 'shutter',
    item: 'megaphone',
    items: ['megaphone'],
    choice: '땀 흘리는 양복부터 내보내라.',
  },
  {
    id: 'memo',
    hint: '지점장에게 이 대리의 자필 전표를 받는다.',
    room: 'street',
    when: (s) => on(s, 'know_lee') && !on(s, 'memo_got'),
    verbs: ['talk'],
    target: 'manager',
    choice: '이 대리의 자필을 주시오.',
  },
  {
    id: 'mag',
    hint: '이 대리의 안주머니를 당긴다.',
    room: 'street',
    when: (s) => on(s, 'clerk_out') && !on(s, 'mag_got'),
    verbs: ['pull', 'open'],
    target: 'lee',
  },
  {
    id: 'insider',
    hint: '전표를 탄창에 사용한다.',
    room: 'street',
    when: (s) => on(s, 'memo_got') && on(s, 'mag_got') && !on(s, 'insider'),
    verbs: ['use', 'give'],
    target: 'mag',
    item: 'memo',
    items: ['memo', 'mag'],
  },
  {
    id: 'raid',
    hint: '조경환에게 셔터를 맡긴다. 오른손목만 고른다.',
    room: 'street',
    when: (s) => on(s, 'insider') && !on(s, 'arrested'),
    verbs: ['talk'],
    target: 'kyunghwan',
    choice: '셔터를 맡긴다.',
  },
  {
    id: 'receipt',
    hint: '오발탄의 코트 안주머니를 연다.',
    room: 'bank',
    when: (s) => !on(s, 'receipt_got'),
    verbs: ['open', 'pull', 'take', 'use'],
    target: 'coat',
  },
  {
    id: 'brief',
    hint: '영수증을 서호정에게 건넨다.',
    room: 'bank',
    when: (s) => on(s, 'receipt_got') && !on(s, 'briefed'),
    verbs: ['give', 'use'],
    target: 'hojeong',
    item: 'receipt',
    items: ['receipt'],
  },
  {
    id: 'end',
    hint: '서호정에게 조서를 마친다고 말한다.',
    room: 'bank',
    when: (s) => on(s, 'briefed') && !on(s, 'ended') && !s.done,
    verbs: ['talk'],
    target: 'hojeong',
    choice: '조서를 마친다.',
  },
];

export function availableSteps(s: PlayState, steps: readonly ScenarioStep[] = scenarioSteps): ScenarioStep[] {
  if (s.done || on(s, 'ended')) return [];
  return steps.filter((step) => step.room === s.room && step.when(s));
}

export function choiceLabel(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/^[•·\s]+/, '').trim();
}

export function isExitLabel(label: string): boolean {
  return EXITS.has(choiceLabel(label));
}

/** The aim the prompt is asking for. The win line also says 손목, after the buttons are gone. */
export function aimAnswer(prompt: string): 'mook' | 'wrist' | null {
  if (prompt.includes('공범') || prompt.includes('카빈을 든')) return 'mook';
  if (prompt.includes('오른손목') || prompt.includes('여직원')) return 'wrist';
  return null;
}

export function aimToken(src: string): string | null {
  for (const token of ['mook', 'hostage', 'chest', 'wrist']) if (src.includes(token)) return token;
  return null;
}

function unique(xs: readonly (string | undefined)[]): string[] {
  return [...new Set(xs.filter((x): x is string => !!x))];
}

function actionOf(step: ScenarioStep): GuideAction {
  const verb = step.verbs[0];
  if (!verb) throw new Error(`scenario step ${step.id} has no verb`);
  return { verb, target: step.target, ...(step.item ? { item: step.item } : {}) };
}

/**
 * The next hint. One open story step plays itself (`sole`), even when several verbs can do it.
 * Two or more story steps stay on screen: the earliest is outlined, and the others stay clickable.
 */
export function guideMove(s: PlayState, surface: Surface, steps: readonly ScenarioStep[] = scenarioSteps): GuideMove | null {
  const open = availableSteps(s, steps);
  if (surface.kind === 'aim') {
    const token = aimAnswer(surface.prompt);
    if (!token) return null;
    const hits = surface.tokens.filter((t) => t === token);
    if (!hits.length) return null;
    return {
      sole: hits.length === 1,
      hint: token === 'wrist' ? '오른손목만 고른다.' : '카빈을 든 공범을 고른다.',
      verbs: [],
      items: [],
      verb: null,
      item: null,
      choice: null,
      choices: [],
      aim: token,
      action: null,
    };
  }

  if (!open.length) return null;
  const preferred = open[0]!;

  if (surface.kind === 'choice') {
    const labels = new Set(open.map((step) => step.choice).filter((x): x is string => !!x));
    const matching = surface.options.filter((o) => labels.has(o.label));
    if (!matching.length) {
      const exits = surface.options.filter((o) => o.exit);
      if (!exits.length) return null;
      return {
        sole: exits.length === 1,
        hint: preferred.hint,
        verbs: [],
        items: [],
        verb: null,
        item: null,
        choice: exits[0]!.label,
        choices: exits.map((o) => o.label),
        aim: null,
        action: null,
      };
    }
    const story = open.find((step) => step.choice && matching.some((o) => o.label === step.choice));
    const label = story?.choice ?? matching[0]!.label;
    return {
      sole: matching.length === 1,
      hint: story?.hint ?? preferred.hint,
      verbs: [],
      items: [],
      verb: null,
      item: null,
      choice: label,
      choices: matching.map((o) => o.label),
      aim: null,
      action: null,
    };
  }

  return {
    sole: open.length === 1,
    hint: preferred.hint,
    verbs: unique(open.flatMap((step) => step.verbs)),
    items: unique(open.flatMap((step) => step.items ?? [])),
    verb: preferred.verbs[0] ?? null,
    item: preferred.item ?? null,
    choice: null,
    choices: [],
    aim: null,
    action: actionOf(preferred),
  };
}

export function progressKey(s: PlayState): string {
  const flags = [
    'shell_got',
    'analyzed',
    'mega_got',
    'saw_inside',
    'clerk_out',
    'know_lee',
    'memo_got',
    'mag_got',
    'insider',
    'arrested',
    'receipt_got',
    'briefed',
    'ended',
  ];
  return [s.room, s.visitedStreet ? 1 : 0, s.done ? 1 : 0, flags.map((id) => (s.flags[id] ? 1 : 0)).join('')].join('|');
}

export interface PressSpot {
  kind: 'verb' | 'item' | 'scene' | 'choice' | 'aim';
  id: string;
}

/** Seconds still on the clock. Null before the last five seconds, and once the wait is over. */
export function secondsLeft(elapsed: number, total = HINT_MS, countdown = COUNTDOWN_MS): number | null {
  const left = total - elapsed;
  if (left <= 0 || left > countdown) return null;
  return Math.ceil(left / 1000);
}

/** The button and the scene spot a move presses. A dialogue line or an aim target is only that button. */
export function pressSpots(move: GuideMove): PressSpot[] {
  if (move.choice) return [{ kind: 'choice', id: move.choice }];
  if (move.aim) return [{ kind: 'aim', id: move.aim }];
  const spots: PressSpot[] = [];
  if (move.verb) spots.push({ kind: 'verb', id: move.verb });
  if (move.item) spots.push({ kind: 'item', id: move.item });
  if (move.action) spots.push({ kind: 'scene', id: move.action.target });
  return spots;
}

interface GuideHost {
  onTitle: boolean;
  choosing: boolean;
  speechEl: HTMLElement | null;
  verbsEl: HTMLElement;
  invEl: HTMLElement;
  scene: HTMLElement;
  g: HTMLElement;
  endSpeech(): void;
  engine: {
    busy: boolean;
    state: {
      room: string;
      flags: Record<string, unknown>;
      visited: Record<string, number>;
      done?: boolean;
    } | null;
  };
  presenter: {
    intent(i: { kind: 'act'; verb: string; target: string; item?: string }): Promise<void>;
  };
}

function readState(app: GuideHost): PlayState | null {
  const s = app.engine.state;
  if (!s) return null;
  const flags: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(s.flags)) flags[id] = !!value;
  return {
    room: s.room,
    flags,
    visitedStreet: (s.visited.street ?? 0) > 0 || s.room === 'street' || s.room === 'bank',
    done: !!s.done,
  };
}

type Live =
  | { kind: 'paused' }
  | { kind: 'play' }
  | { kind: 'choice'; options: { label: string; exit: boolean; button: HTMLButtonElement }[] }
  | { kind: 'aim'; prompt: string; buttons: { token: string; button: HTMLButtonElement }[] };

function liveSurface(app: GuideHost): Live {
  if (app.onTitle || !app.engine.state) return { kind: 'paused' };
  if (app.scene.querySelector('.dim, .overlay.mapview')) return { kind: 'paused' };
  const aimButtons = [...app.scene.querySelectorAll<HTMLButtonElement>('button.mg-opt')];
  if (aimButtons.length) {
    const prompt = app.scene.querySelector('.narr')?.textContent ?? '';
    return {
      kind: 'aim',
      prompt,
      buttons: aimButtons.flatMap((button) => {
        const token = aimToken(button.querySelector('img')?.getAttribute('src') ?? '');
        return token ? [{ token, button }] : [];
      }),
    };
  }
  const choiceButtons = [...app.g.querySelectorAll<HTMLButtonElement>('button.choice')].filter(
    (button) => !button.closest('.mapview'),
  );
  if (choiceButtons.length) {
    return {
      kind: 'choice',
      options: choiceButtons.map((button) => {
        const label = choiceLabel(button.textContent ?? '');
        return { label, exit: button.classList.contains('gl') || isExitLabel(label), button };
      }),
    };
  }
  if (app.speechEl || app.engine.busy || app.verbsEl.hidden) return { kind: 'paused' };
  return { kind: 'play' };
}

function surfaceOf(live: Live): Surface | null {
  if (live.kind === 'play') return { kind: 'play' };
  if (live.kind === 'choice') return { kind: 'choice', options: live.options.map(({ label, exit }) => ({ label, exit })) };
  if (live.kind === 'aim') return { kind: 'aim', prompt: live.prompt, tokens: live.buttons.map((b) => b.token) };
  return null;
}

const STYLE = `
button.guide-off:disabled { opacity: .32; filter: grayscale(.85); cursor: default; }
button.guide-pick { box-shadow: 0 0 0 2px #ffd84d inset; animation: blink .8s steps(2) infinite; }
.guide-hint { position: absolute; left: 50%; top: 6%; transform: translateX(-50%); z-index: 1000; pointer-events: none;
  max-width: 86%; background: rgba(20, 12, 30, .92); border: 2px solid #ffd84d; color: #ffd84d;
  padding: .35em .8em; border-radius: 6px; text-align: center; line-height: 1.35; }
.guide-layer { position: absolute; inset: 0; z-index: 1200; pointer-events: none; }
.guide-count { position: absolute; transform: translate(-50%, -50%); z-index: 3; display: flex; align-items: baseline;
  gap: .08em; color: #ffd84d; text-shadow: 0 0 16px #000, 4px 4px 0 #000, -2px 0 0 #000; line-height: 1; pointer-events: none; }
.guide-count b { font-size: 88px; font-weight: 700; }
.guide-count span { font-size: 32px; font-weight: 700; }
.guide-count.pop { animation: guide-pop .35s ease-out; }
@keyframes guide-pop { from { transform: translate(-50%, -50%) scale(1.35); } to { transform: translate(-50%, -50%) scale(1); } }
.guide-ring { position: absolute; box-sizing: border-box; border-radius: 8px; pointer-events: none; }
.guide-preview { background: rgba(255, 216, 77, .14); border: 3px dashed #ffd84d; box-shadow: 0 0 0 2px rgba(0, 0, 0, .5); }
.guide-press { background: rgba(255, 216, 77, .32); border: 4px solid #fff3b0; box-shadow: 0 0 0 4px rgba(0, 0, 0, .6), 0 0 22px #ffd84d;
  animation: guide-pulse .45s steps(2) infinite; }
.guide-press::after { content: ''; position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; transform: translate(-50%, -50%);
  border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 3px #ffd84d; background: rgba(255, 80, 80, .9); }
@keyframes guide-pulse { 50% { background: rgba(255, 216, 77, .62); } }
.guide-ring .cap { position: absolute; left: 50%; max-width: 16rem; background: rgba(20, 12, 30, .94); color: #ffd84d;
  border: 2px solid #ffd84d; border-radius: 6px; padding: .12em .5em; font-size: 18px; line-height: 1.3; text-align: center; }
.guide-ring .cap.above { top: -.25em; transform: translate(-50%, -100%); }
.guide-ring .cap.below { top: calc(100% + .25em); transform: translate(-50%, 0); }
`;

const AIM_NAME: Record<string, string> = {
  wrist: '오른손목',
  mook: '카빈을 든 공범',
  hostage: '인질',
  chest: '가슴',
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function clearChrome(root: ParentNode) {
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-guide-off]')) {
    button.disabled = false;
    delete button.dataset.guideOff;
    button.classList.remove('guide-off');
  }
  for (const button of root.querySelectorAll('.guide-pick')) button.classList.remove('guide-pick');
  root.querySelector('.guide-hint')?.remove();
  root.querySelector('.guide-count')?.remove();
  root.querySelectorAll('.guide-preview').forEach((node) => node.remove());
}

function clearPress(root: ParentNode) {
  root.querySelectorAll('.guide-press').forEach((node) => node.remove());
}

function markOff(button: HTMLButtonElement) {
  // A button the game itself disabled (a spent item, a page arrow) stays as it is.
  if (button.disabled && button.dataset.guideOff !== '1') return;
  button.disabled = true;
  button.dataset.guideOff = '1';
  button.classList.add('guide-off');
  button.classList.remove('guide-pick');
}

function markPick(button: HTMLButtonElement) {
  button.disabled = false;
  delete button.dataset.guideOff;
  button.classList.remove('guide-off');
  button.classList.add('guide-pick');
}

function release(button: HTMLButtonElement) {
  if (button.dataset.guideOff) {
    button.disabled = false;
    delete button.dataset.guideOff;
    button.classList.remove('guide-off');
  }
  button.classList.remove('guide-pick');
}

function showHint(scene: HTMLElement, text: string) {
  let hint = scene.querySelector<HTMLElement>('.guide-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'guide-hint';
    scene.append(hint);
  }
  if (hint.textContent !== text) hint.textContent = text;
}

function applyButtons(app: GuideHost, live: Live, move: GuideMove, onlyPreferred: boolean) {
  if (live.kind === 'play') {
    const verbs = onlyPreferred ? (move.verb ? [move.verb] : []) : move.verbs;
    const items = onlyPreferred ? (move.item ? [move.item] : []) : move.items;
    for (const button of app.verbsEl.querySelectorAll<HTMLButtonElement>('button.verb')) {
      const verb = button.dataset.verb ?? '';
      if (verb && verb === move.verb) markPick(button);
      else if (!verbs.includes(verb)) markOff(button);
      else release(button);
    }
    for (const button of app.invEl.querySelectorAll<HTMLButtonElement>('button.slot[data-id]')) {
      const id = button.dataset.id ?? '';
      if (!id) continue;
      if (id === move.item) markPick(button);
      else if (!items.includes(id)) markOff(button);
      else release(button);
    }
    return;
  }
  if (live.kind === 'choice') {
    const labels = onlyPreferred ? (move.choice ? [move.choice] : []) : move.choices;
    for (const option of live.options) {
      if (option.label === move.choice) markPick(option.button);
      else if (!labels.includes(option.label)) markOff(option.button);
      else release(option.button);
    }
    return;
  }
  if (live.kind === 'aim' && move.aim) {
    for (const option of live.buttons) {
      if (option.token === move.aim) markPick(option.button);
      else markOff(option.button);
    }
  }
}

function layerOf(host: HTMLElement): HTMLElement {
  let layer = host.querySelector<HTMLElement>(':scope > .guide-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'guide-layer';
    host.append(layer);
  }
  return layer;
}

function spotElement(app: GuideHost, live: Live, spot: PressSpot): HTMLElement | null {
  const id = CSS.escape(spot.id);
  if (spot.kind === 'verb') return app.verbsEl.querySelector<HTMLButtonElement>(`button.verb[data-verb="${id}"]`);
  if (spot.kind === 'item') return app.invEl.querySelector<HTMLButtonElement>(`button.slot[data-id="${id}"]`);
  if (spot.kind === 'scene') return app.g.querySelector<HTMLButtonElement>(`button.a11y-target[data-target="${id}"]`);
  if (spot.kind === 'choice' && live.kind === 'choice') return live.options.find((option) => option.label === spot.id)?.button ?? null;
  if (spot.kind === 'aim' && live.kind === 'aim') return live.buttons.find((option) => option.token === spot.id)?.button ?? null;
  return null;
}

function spotCaption(spot: PressSpot, el: HTMLElement): string {
  if (spot.kind === 'aim') return AIM_NAME[spot.id] ?? spot.id;
  if (spot.kind === 'choice') return spot.id;
  const aria = el.getAttribute('aria-label')?.replace(/\s+/g, ' ').trim();
  if (aria) return aria;
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text || spot.id;
}

/** Dashed preview, or the solid press. Existing rings of that class are moved, not rebuilt, so the pulse keeps running. */
function syncRings(app: GuideHost, live: Live, move: GuideMove, className: 'guide-preview' | 'guide-press'): HTMLElement[] {
  const host = layerOf(app.g);
  const origin = app.g.getBoundingClientRect();
  const keep = new Set<HTMLElement>();
  const made: HTMLElement[] = [];
  for (const spot of pressSpots(move)) {
    const target = spotElement(app, live, spot);
    if (!target) continue;
    const box = target.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;
    const key = `${className}:${spot.kind}:${spot.id}`;
    let ring = [...host.children].find((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.spot === key);
    if (!ring) {
      ring = document.createElement('div');
      ring.className = `guide-ring ${className}`;
      ring.dataset.spot = key;
      const cap = document.createElement('span');
      cap.className = 'cap';
      ring.append(cap);
      host.append(ring);
    }
    ring.style.left = `${box.left - origin.left}px`;
    ring.style.top = `${box.top - origin.top}px`;
    ring.style.width = `${box.width}px`;
    ring.style.height = `${box.height}px`;
    const cap = ring.querySelector('span');
    if (cap) {
      const caption = spotCaption(spot, target);
      if (cap.textContent !== caption) cap.textContent = caption;
      const above = box.top - origin.top >= 36;
      cap.classList.toggle('above', above);
      cap.classList.toggle('below', !above);
    }
    keep.add(ring);
    made.push(ring);
  }
  for (const node of host.querySelectorAll(`.${className}`)) if (!keep.has(node as HTMLElement)) node.remove();
  return made;
}

function showCount(app: GuideHost, seconds: number) {
  const host = layerOf(app.g);
  let el = host.querySelector<HTMLElement>('.guide-count');
  if (!el) {
    el = document.createElement('div');
    el.className = 'guide-count';
    host.append(el);
  }
  const scene = app.scene.getBoundingClientRect();
  const origin = app.g.getBoundingClientRect();
  el.style.left = `${scene.left - origin.left + scene.width / 2}px`;
  el.style.top = `${scene.top - origin.top + scene.height * 0.42}px`;
  const text = String(seconds);
  if (el.dataset.n === text) return;
  el.dataset.n = text;
  el.replaceChildren();
  const num = document.createElement('b');
  num.textContent = text;
  const unit = document.createElement('span');
  unit.textContent = '초';
  el.append(num, unit);
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function showWaiting(app: GuideHost, live: Live, move: GuideMove, seconds: number) {
  showHint(app.scene, move.hint);
  const verb = live.kind === 'play' ? move.verb : null;
  const item = live.kind === 'play' ? move.item : null;
  for (const button of app.verbsEl.querySelectorAll<HTMLButtonElement>('button.verb')) {
    button.classList.toggle('guide-pick', (button.dataset.verb ?? '') === verb && !!verb);
  }
  for (const button of app.invEl.querySelectorAll<HTMLButtonElement>('button.slot[data-id]')) {
    button.classList.toggle('guide-pick', (button.dataset.id ?? '') === item && !!item);
  }
  if (live.kind === 'choice') {
    for (const option of live.options) option.button.classList.toggle('guide-pick', option.label === move.choice);
  }
  if (live.kind === 'aim') {
    for (const option of live.buttons) option.button.classList.toggle('guide-pick', option.token === move.aim);
  }
  syncRings(app, live, move, 'guide-preview');
  showCount(app, seconds);
}

function paint(app: GuideHost, live: Live, move: GuideMove, preview: boolean, onlyPreferred: boolean) {
  app.g.querySelector('.guide-count')?.remove();
  showHint(app.scene, move.hint);
  applyButtons(app, live, move, onlyPreferred);
  if (preview) syncRings(app, live, move, 'guide-preview');
  else app.g.querySelectorAll('.guide-preview').forEach((node) => node.remove());
}

function pressChoice(live: Extract<Live, { kind: 'choice' }>, label: string) {
  const button = live.options.find((option) => option.label === label)?.button;
  if (button?.isConnected) button.click();
}

function pressAim(live: Extract<Live, { kind: 'aim' }>, token: string) {
  const button = live.buttons.find((option) => option.token === token)?.button;
  if (button?.isConnected) button.click();
}

/**
 * Watches the running player (`window.__game`) and applies the hint.
 * A follow-up topic of a step we already started plays after a short reveal, not another 10 seconds.
 * Leaving a side conversation waits its own 10 seconds.
 * Space skips the wait. The press is still drawn, then the step runs.
 */
export function installProgressGuide(): void {
  if (typeof document === 'undefined') return;
  const mark = globalThis as { __susaGuide?: boolean };
  if (mark.__susaGuide) return;
  mark.__susaGuide = true;
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  let elapsed = 0;
  let engaged = false;
  let lastState = '';
  let lastSet = '';
  let lastAt = 0;
  let worldLock = false;
  let revealing = false;
  let holdRunning = false;
  const pressed = new Set<string>();
  let holdTimer = 0;
  let holding = false;
  let holdPlayed = false;

  const appOf = () => (globalThis as { __game?: GuideHost }).__game;

  const playWorld = (app: GuideHost, action: GuideAction) => {
    if (worldLock || app.engine.busy) return;
    worldLock = true;
    void app.presenter.intent({ kind: 'act', verb: action.verb, target: action.target, ...(action.item ? { item: action.item } : {}) }).finally(() => {
      worldLock = false;
    });
  };

  const signature = (live: Live, move: GuideMove) => {
    if (live.kind === 'choice') return move.choice ? `choice:${move.choice}:${lastSet}` : null;
    if (live.kind === 'aim') return move.aim ? `aim:${move.aim}:${lastSet}` : null;
    if (live.kind === 'play' && move.action) {
      const action = move.action;
      return `play:${action.verb}:${action.target}:${action.item ?? ''}:${lastSet}`;
    }
    return null;
  };

  const revealAndAct = async (app: GuideHost, live: Live, move: GuideMove, force: boolean): Promise<boolean> => {
    if (revealing || (!force && !move.sole)) return false;
    const sig = signature(live, move);
    if (!sig || pressed.has(sig)) return false;
    pressed.add(sig);
    revealing = true;
    const before = readState(app);
    const keyAtStart = before ? progressKey(before) : '';
    try {
      paint(app, live, move, false, force || move.sole);
      clearPress(app.g);
      const marks = syncRings(app, live, move, 'guide-press');
      window.setTimeout(() => {
        for (const node of marks) node.remove();
      }, REVEAL_MS + 1_000);
      await sleep(REVEAL_MS);
      const after = readState(app);
      if (live.kind === 'play' && after && progressKey(after) !== keyAtStart) return;
      if (live.kind === 'choice' && move.choice) pressChoice(live, move.choice);
      else if (live.kind === 'aim' && move.aim) pressAim(live, move.aim);
      else if (live.kind === 'play' && move.action) playWorld(app, move.action);
    } finally {
      revealing = false;
    }
    return true;
  };

  const tick = () => {
    const app = appOf();
    if (!app) return;
    const now = performance.now();
    const dt = lastAt ? Math.min(1000, now - lastAt) : 0;
    lastAt = now;
    if (revealing) return;
    const state = readState(app);
    if (!state) {
      clearChrome(app.g);
      clearPress(app.g);
      return;
    }
    const key = progressKey(state);
    if (key !== lastState) {
      lastState = key;
      elapsed = 0;
      engaged = false;
      pressed.clear();
      clearChrome(app.g);
    }
    const live = liveSurface(app);
    const surface = surfaceOf(live);
    if (!surface) {
      clearChrome(app.g);
      return;
    }
    const setKey = `${key}|${live.kind}|${
      live.kind === 'choice' ? live.options.map((o) => o.label).join('\n') : live.kind === 'aim' ? live.prompt : ''
    }`;
    if (setKey !== lastSet) {
      lastSet = setKey;
      // Each set of buttons gets its own 10 seconds. A hint already on screen still continues a story choice.
      elapsed = 0;
      pressed.clear();
    }
    elapsed += dt;
    if (elapsed >= HINT_MS) engaged = true;
    const move = guideMove(state, surface);
    if (!move) {
      clearChrome(app.g);
      return;
    }
    // A side conversation's "물러선다" waits its own 10 seconds. A story choice continues a hint already showing.
    const exitOnly = live.kind === 'choice' && move.choice !== null && isExitLabel(move.choice);
    const due = elapsed >= HINT_MS;
    const continuation = engaged && !exitOnly;
    if (!due && !continuation) {
      const left = secondsLeft(elapsed);
      if (left === null) {
        clearChrome(app.g);
        return;
      }
      showWaiting(app, live, move, left);
      return;
    }
    if (move.sole) {
      void revealAndAct(app, live, move, false);
      return;
    }
    paint(app, live, move, true, false);
  };

  const holdPass = async () => {
    if (holdRunning) return;
    holdRunning = true;
    try {
      while (holding) {
        const app = appOf();
        if (!app) return;
        if (revealing) {
          await sleep(120);
          continue;
        }
        if (app.speechEl) {
          app.endSpeech();
          await sleep(340);
          continue;
        }
        const live = liveSurface(app);
        const surface = surfaceOf(live);
        const state = readState(app);
        if (live.kind === 'paused' || !surface || !state) {
          await sleep(120);
          continue;
        }
        const move = guideMove(state, surface);
        if (!move) {
          await sleep(120);
          continue;
        }
        engaged = true;
        const exitOnly = live.kind === 'choice' && move.choice !== null && isExitLabel(move.choice);
        if (exitOnly) {
          // Step out of a side talk, then play the scenario on a later pass of this hold.
          await revealAndAct(app, live, move, true);
        } else if (!holdPlayed) {
          const played = await revealAndAct(app, live, move, true);
          if (played) holdPlayed = true;
        } else if (live.kind === 'choice' || live.kind === 'aim') {
          await revealAndAct(app, live, move, true);
        }
        await sleep(120);
      }
    } finally {
      holdRunning = false;
    }
  };

  const typing = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    return !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  };

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== ' ' || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      const app = appOf();
      if (!app || app.onTitle || app.scene.querySelector('.dim')) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat || holdTimer || holding) return;
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        holding = true;
        holdPlayed = false;
        void holdPass();
      }, 450);
    },
    true,
  );
  document.addEventListener(
    'keyup',
    (e) => {
      if (e.key !== ' ') return;
      const pending = holdTimer;
      if (pending) {
        window.clearTimeout(pending);
        holdTimer = 0;
        const app = appOf();
        if (app?.speechEl) app.endSpeech();
      }
      holding = false;
    },
    true,
  );

  window.setInterval(tick, 200);
}
