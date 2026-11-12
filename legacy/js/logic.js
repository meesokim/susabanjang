/* 수사반장 1970 — 제1화 빗줄기 속의 거수
   SCUMM-style verb/object rules. Pure state, no DOM. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SusaLogic = factory();
})(typeof self !== "undefined" ? self : globalThis, function () {
  const VERBS = [
    ["give", "준다"],
    ["open", "연다"],
    ["close", "닫는다"],
    ["pick", "집는다"],
    ["look", "본다"],
    ["talk", "말한다"],
    ["use", "사용"],
    ["push", "민다"],
    ["pull", "당긴다"],
  ];

  const ITEMS = {
    notebook: ["수사수첩", "검은 수첩. 단서가 날짜순으로 꽂혀 있다. 사용하면 펼쳐진다."],
    lighter: ["지포 라이터", "닳은 지포. 엄지만 스치면 불이 붙는다."],
    gun: ["38구경", "여섯 발이 들어 있다. 함부로 꺼낼 총이 아니다."],
    shell: ["탄피", "소총 탄피. 밑동에 USA 1968이 찍혀 있다."],
    megaphone: ["확성기", "경찰 확성기. 셔터 너머까지 목소리가 닿는다."],
    memo: ["자필 전표", "대출 전표. 대부계 이 대리의 서명, 그리고 숫자 7의 획이 유독 길다."],
    mag: ["카빈 탄창", "M1 카빈 탄창. USA 1968. 속에 접힌 쪽지의 글씨가 전표와 닮았다."],
    receipt: ["영수증 조각", "청계천 3가 평화시장 2열 4호. 도장은 금호상회."],
    match: ["성냥갑", "뷰익 글로브박스의 성냥. 상호는 비에 번져 읽히지 않는다."],
  };

  const TEAM = {
    sangsoon: ["김상순", "압박", "종남서의 독종. 눈이 벌써 셔터 틈을 재고 있다."],
    kyunghwan: ["조경환", "돌파", "씨름 출신의 어깨. 문짝이 보이면 참지 못한다."],
    hojeong: ["서호정", "감식", "안경 너머로 탄피와 시계를 함께 보는 형사."],
  };

  const LAYOUT = {
    buick: [8, 100, 118, 58],
    trunk: [10, 112, 30, 32],
    buickDoor: [86, 112, 34, 34],
    glove: [96, 122, 18, 14],
    crate: [14, 118, 22, 22],
    manager: [132, 48, 42, 120],
    megaphone: [128, 154, 16, 12],
    officer: [174, 50, 44, 118],
    shell: [220, 152, 14, 10],
    shutter: [214, 42, 96, 100],
    clerk: [194, 48, 40, 120],
    sign: [228, 22, 72, 16],
    cordon: [150, 158, 28, 10],
    coat: [48, 108, 44, 32],
    obal: [36, 46, 78, 120],
    woman: [136, 48, 44, 118],
    vault: [228, 32, 80, 96],
    carbine: [16, 142, 40, 16],
    hostages: [176, 108, 44, 40],
    sangsoon: [18, 42, 84, 118],
    hojeong: [200, 46, 70, 114],
    kyunghwan: [258, 36, 58, 124],
    windshield: [92, 18, 112, 70],
    door: [4, 136, 78, 40],
    radio: [146, 112, 48, 28],
  };

  const WAVES = [
    {
      banner: "아래 양쪽이다. 1번, 그리고 3번. 카빈을 든 공범.",
      targets: { 1: "mook", 3: "mook" },
      ms: 2600,
      boss: false,
    },
    {
      banner: "여직원은 5번 한가운데. 주모자의 오른손목은 6번. 머리와 가슴은 죽인다.",
      targets: { 6: "wrist" },
      bad: { 4: "kill", 5: "hostage", 7: "kill" },
      soft: { 1: 1, 2: 1, 3: 1, 8: 1, 9: 1 },
      ms: 4800,
      boss: true,
      labels: {
        7: "7 머리",
        8: "8 어깨",
        9: "9 왼팔",
        4: "4 가슴",
        5: "5 인질",
        6: "6 오른손목",
        1: "1 왼다리",
        2: "2 허리",
        3: "3 오른다리",
      },
    },
  ];

  const NO = {
    give: "그걸 건넬 상대가 아니다.",
    open: "열릴 구조가 아니다.",
    close: "닫혀 있는 것이 아니다.",
    pick: "집어 갈 물건이 아니다.",
    look: "빗물 외에 새로울 것이 없다.",
    talk: "말이 통할 상대가 아니다.",
    use: "그렇게 쓰이진 않는다.",
    push: "밀어 봤자 꿈쩍도 하지 않는다.",
    pull: "당겨 봤자 소용없다.",
  };

  function line(who, text) {
    return { who, text };
  }
  function P(text) {
    return line("park", text);
  }

  function newGame() {
    return {
      room: "car",
      phase: "play",
      flags: {},
      inv: ["notebook", "lighter", "gun"],
      held: null,
      verb: "look",
      talk: null,
      hp: 2,
      ammo: 6,
      cover: 1,
      covering: false,
      reloading: false,
      combatStep: 0,
      targets: {},
      checkpoint: null,
      ending: null,
      gameover: null,
      trunkOpen: false,
      buickOpen: false,
    };
  }

  function has(s, id) {
    return s.inv.indexOf(id) !== -1;
  }
  function addItem(s, id) {
    if (!has(s, id)) s.inv.push(id);
  }
  function nameOf(id) {
    if (!id) return "";
    if (ITEMS[id]) return ITEMS[id][0];
    if (TEAM[id]) return TEAM[id][0];
    const names = {
      bg: "그곳",
      buick: "뷰익",
      trunk: "트렁크",
      buickDoor: "차문",
      glove: "글로브박스",
      crate: "군수 상자",
      manager: "박 지점장",
      megaphone: "확성기",
      officer: "청원경찰",
      shell: "탄피",
      shutter: "셔터",
      clerk: "이 대리",
      sign: "간판",
      cordon: "차단선",
      coat: "코트 안주머니",
      obal: "오발탄",
      woman: "여직원",
      vault: "비상금고",
      carbine: "카빈",
      hostages: "인질들",
      windshield: "앞유리",
      door: "차문",
      radio: "무전기",
      sangsoon: "김상순",
      kyunghwan: "조경환",
      hojeong: "서호정",
    };
    return names[id] || id;
  }

  function snapshot(state) {
    const kept = state.checkpoint;
    state.checkpoint = null;
    const copy = structuredClone(state);
    state.checkpoint = kept;
    copy.checkpoint = null;
    return copy;
  }

  function thought(s) {
    const f = s.flags;
    if (s.room === "car") return "차문을 열면 현장이다. 서두르면 바로 열어도 된다.";
    if (s.room === "bank") {
      if (!f.receiptGot) return "오발탄의 코트 안주머니를 연다.";
      if (!f.briefed) return "영수증을 서호정에게 건넨다.";
      return "조서를 마칠 때다. 서호정에게 말을 건다.";
    }
    if (!f.insider && !f.shellPicked && !f.clerkOut) return "청원경찰 손 옆에 탄피가 있다.";
    if (!f.insider && has(s, "shell") && !f.shellAnalyzed && !f.clerkOut) return "탄피를 서호정에게 건네 각인을 맞긴다.";
    if (!f.clerkOut) {
      if (!f.megaPicked) return "차단선 옆의 확성기를 집는다.";
      if (!f.sawInside) return "셔터 틈을 당겨 안을 보고, 창백한 양복을 빼낸다.";
      return "확성기를 셔터에 쓰고, 땀 흘리는 남자부터 빼낸다.";
    }
    if (!f.memoGot) return "지점장에게 이 대리의 자필 전표를 받는다.";
    if (!f.magGot) return "이 대리의 안주머니를 당긴다.";
    if (!f.insider) return "수첩을 펼쳐 전표와 탄창 쪽지를 맞댄다.";
    if (!f.arrested) return "조경환에게 셔터를 맡긴다. 들어가서 오른손목, 6번.";
    return "객장으로 들어간다.";
  }

  function roomTitle(s) {
    if (s.room === "car") return "순찰차 안  ·  명동";
    if (s.room === "street") return "명동  ·  한일은행 앞";
    return "한일은행 객장";
  }

  const PEOPLE = {
    sangsoon: 1, kyunghwan: 1, hojeong: 1,
    manager: 1, officer: 1, clerk: 1, obal: 1, woman: 1, hostages: 1,
  };

  function isPerson(id) {
    return !!(id && (TEAM[id] || PEOPLE[id]));
  }

  function sentenceParts(s, hoverId) {
    const verb = VERBS.filter((x) => x[0] === s.verb)[0][1];
    const held = s.held || "";
    const hover = hoverId && hoverId !== "bg" ? hoverId : "";
    let who = "";
    let what = "";
    if (s.verb === "use" || s.verb === "give") {
      if (isPerson(held)) {
        who = nameOf(held);
        what = hover ? nameOf(hover) : "";
      } else if (held && isPerson(hover)) {
        who = nameOf(hover);
        what = nameOf(held);
      } else if (held && hover) {
        what = nameOf(held) + " → " + nameOf(hover);
      } else if (held) {
        what = nameOf(held);
      } else if (isPerson(hover)) {
        who = nameOf(hover);
      } else if (hover) {
        what = nameOf(hover);
      }
    } else if (isPerson(hover)) {
      who = nameOf(hover);
    } else if (hover) {
      what = nameOf(hover);
    }
    return { who: who || "—", verb: verb, what: what || "—" };
  }

  function sentence(s, hoverId) {
    const p = sentenceParts(s, hoverId);
    return p.who + "   " + p.verb + "   " + p.what;
  }

  function fullBg() {
    return { id: "bg", name: "그곳", x: 0, y: 0, w: 320, h: 180, z: 0 };
  }

  function hotspots(s) {
    const f = s.flags;
    const box = (id) => {
      const r = LAYOUT[id];
      return { id, name: nameOf(id), x: r[0], y: r[1], w: r[2], h: r[3], z: 1 };
    };
    if (s.room === "car") {
      return [fullBg(), box("windshield"), box("radio"), box("sangsoon"), box("hojeong"), box("kyunghwan"), box("door")];
    }
    if (s.room === "bank") {
      return [fullBg(), box("vault"), box("hostages"), box("carbine"), box("woman"), box("obal"), box("coat")];
    }
    const list = [fullBg(), box("sign"), box("cordon"), box("buick"), box("trunk")];
    if (s.trunkOpen) list.push(box("crate"));
    list.push(box("buickDoor"));
    if (s.buickOpen) list.push(box("glove"));
    list.push(box("shutter"));
    list.push(box("manager"));
    list.push(box("officer"));
    if (!f.shellPicked) list.push(box("shell"));
    if (!f.megaPicked) list.push(box("megaphone"));
    if (f.clerkOut) list.push(box("clerk"));
    return list;
  }

  function hitTest(s, x, y) {
    const list = hotspots(s);
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) return h;
    }
    return null;
  }

  function cluebook(s) {
    const f = s.flags;
    const rows = [
      ["shell", f.shellPicked, "USA 1968 탄피", "소총 탄피. 미군 각인. 사냥용 엽총이 아니다."],
      ["analysis", f.shellAnalyzed, "8군 유출 대조", "지난달 미8군에서 빠진 M1 카빈 탄약과 각인이 같다."],
      ["crate", f.crateSeen, "빈 군수 상자", "뷰익 트렁크. 스텐실은 미8군. 상자는 이미 비었다."],
      ["face", f.sawInside, "창백한 양복", "셔터 안, 땀을 쏟으며 안주머니를 움켜쥔 사내."],
      ["officer", f.officerTalked, "청원경찰의 말", "대부계 양복이 셔터 배선을 알고 있었다."],
      ["memo", f.memoGot, "이 대리 자필 전표", "오늘 아침 대출 전표. 숫자 7의 획이 길다."],
      ["mag", f.magGot, "탄창 속 쪽지", "카빈 탄창에 끼운 쪽지. 글씨가 전표와 같은 손이다."],
      ["insider", f.insider, "내부 첩자 확정", "이 대리가 도면을 넘겼다. 주모자 오른손목만 쏜다."],
      ["receipt", f.receiptGot, "금호상회 영수증", "청계천 3가 평화시장 2열 4호. 무기가 향한 다음 주소."],
    ];
    return rows.filter((r) => r[1]).map((r) => ({ id: r[0], name: r[2], text: r[3] }));
  }

  function pack(s, lines, extra) {
    const out = { state: s, lines: lines || [], sfx: null, resetTimer: false };
    if (extra) Object.assign(out, extra);
    return out;
  }

  function busy(s) {
    return s.talk || s.phase === "qte" || s.phase === "combat" || s.phase === "notebook" || s.phase === "ending" || s.phase === "gameover";
  }

  function doAnalysis(s) {
    if (!has(s, "shell")) return [line("hojeong", "탄피부터 집어 주십시오. 청원경찰 손 옆에 있습니다.")];
    if (s.flags.shellAnalyzed) return [line("hojeong", "각인은 이미 대조했습니다. USA 1968, 미8군 유출 카빈 탄약.")];
    s.flags.shellAnalyzed = true;
    const lines = [
      line("hojeong", "밑동 각인 USA 1968. 지난달 미8군 불법 유출 목록의 M1 카빈 탄약과 일치합니다."),
      line("hojeong", "엽총이 아닙니다. 그리고 놈들은 사설 비상금고 위치와 셔터 배선까지 알고 들어왔습니다. 내부입니다."),
    ];
    if (s.flags.crateSeen) lines.push(line("hojeong", "트렁크의 빈 상자 스텐실도 미8군입니다. 같은 선에서 나온 물건입니다."));
    return lines;
  }

  function doMemo(s) {
    if (s.flags.memoGot) return [line("manager", "그 전표밖에 없습니다. 벌써 드리지 않았습니까.")];
    if (!s.flags.knowLee) return [line("manager", "누구 글씨를 말씀하시는지… 저는 지금 손이 떨려서.")];
    s.flags.memoGot = true;
    addItem(s, "memo");
    return [
      line("manager", "오늘 아침 이 대리가 대출 결재란에 쓴 전표입니다. 서랍 열쇠도 그 친구가 빌려 갔습니다."),
      P("숫자 7을 아래에서 끌어 올리는 획. 잊지 말자."),
    ];
  }

  function doRelease(s) {
    if (s.flags.clerkOut) return [line("obal", "한 명 가져갔으면 됐다. 다음은 총이다.")];
    s.flags.clerkOut = true;
    s.flags.knowLee = true;
    s.flags.sawInside = true;
    return [
      line("obal", "창백한 놈 하나 가져가라. 쓰러지면 너희 책임이니까. 다음은 없다."),
      line("narr", "셔터 틈으로 양복 사내가 밀려 나온다. 안색이 종이장이고, 안주머니가 각지게 불룩하다."),
      line("hojeong", "인질치고는 주머니를 너무 지킵니다. 저 손부터 보십시오."),
    ];
  }

  function doMag(s) {
    if (!s.flags.clerkOut) return [P("아직 저 남자는 셔터 안이다.")];
    if (s.flags.magGot) return [line("sangsoon", "탄창은 이미 우리 손입니다. 다음이나 하시죠.")];
    s.flags.magGot = true;
    addItem(s, "mag");
    return [
      line("sangsoon", "이 대리. 안주머니, 본인이 까든지 내가 까든지 하시오."),
      line("narr", "젖은 안주머니에서 M1 카빈 탄창이 떨어진다. 스프링 옆에 접힌 쪽지가 끼어 있다."),
      line("lee", "빚… 빚만 갚아 준다기에 도면을 넘겼습니다. 사는 놈 이름은 모릅니다. 두목이 코트만 꼭 붙잡고 있었습니다."),
      line("hojeong", "쪽지 필적과 전표를 맞대면 첩자인지 확정됩니다. 수첩을 쓰시거나, 둘 다 제게 주십시오."),
    ];
  }

  function doInsider(s) {
    if (s.flags.insider) return [line("hojeong", "이미 확정입니다. 이 대리, 내부 첩자. 남은 것은 주모자의 오른손목입니다.")];
    if (!s.flags.memoGot || !s.flags.magGot) {
      return [line("hojeong", "한 손의 글씨로는 부족합니다. 전표와 탄창 속 쪽지, 둘 다 있어야 합니다.")];
    }
    s.flags.insider = true;
    return [
      line("hojeong", "같습니다. 자음 사이, 그리고 숫자 7의 긴 획. 탄창 쪽지와 이 대리 전표는 한 사람의 손입니다."),
      line("hojeong", "내부 첩자 확정. 여직원을 방패로 세운 주모자, 오른손목만 맞추십시오. 머리와 가슴은 인질과 배후를 함께 죽입니다. 그리드로 치면 6번입니다."),
      P("사람 탈을 쓰고 도면을 판 놈은 나중에 조서로 남긴다. 지금은 인질이다."),
    ];
  }

  function doRaid(s) {
    if (s.flags.arrested) return [line("kyunghwan", "문은 이미 열렸습니다. 안의 코트나 뒤지시죠.")];
    if (!s.flags.clerkOut) return [line("kyunghwan", "인질이 열둘입니다. 섞여 있는 놈부터 빼내기 전에 문짝을 부수면, 카빈이 먼저 납니다.")];
    if (!s.flags.insider) return [line("kyunghwan", "누구 손목인지 모릅니다. 잘못 쏘면 여직원이 맞습니다. 필적부터 확정하십시오.")];
    s.phase = "qte";
    s.talk = null;
    return [line("kyunghwan", "문짝은 제가 뜯습니다. 스페이스를 같이 눌러 주십시오. 열리면 오른손목, 6번만!")];
  }

  function doBrief(s) {
    if (!has(s, "receipt")) return [line("hojeong", "종이가 없습니다. 코트 안을 여십시오.")];
    s.flags.briefed = true;
    return [
      line("hojeong", "영수증 도장, 금호상회. 청계천 3가 평화시장 2열 4호. 군용 카빈이 민간의 장부 위로 떨어진 주소입니다."),
      line("sangsoon", "동대문 찌꺼기들 소행이 아닙니다. 물건을 대 주는 손이 따로 있습니다."),
      P("오늘 인질은 살았다. 다음 주소는 청계천이다."),
    ];
  }

  function enterCombat(s) {
    s.talk = null;
    s.phase = "play";
    s.held = null;
    const snap = snapshot(s);
    s.room = "bank";
    s.phase = "combat";
    s.combatStep = 0;
    s.hp = 2;
    s.ammo = 6;
    s.cover = 1;
    s.covering = false;
    s.reloading = false;
    s.gameover = null;
    s.checkpoint = snap;
    const w = WAVES[0];
    s.targets = Object.assign({}, w.targets);
    return [
      line("narr", "셔터가 비명을 내며 말린다. 객장의 노란 불 아래, 복면이 카빈을 든다."),
      line("park", "손목이다. 사람은 살린다."),
    ];
  }

  function loadWave(s) {
    const w = WAVES[s.combatStep];
    s.targets = Object.assign({}, w.targets);
  }

  function damage(s) {
    if (s.covering && s.cover > 0) {
      s.covering = false;
      s.cover -= 1;
      return { lines: [line("kyunghwan", "제가 막았습니다! 한 발은 제가 받습니다!")], sfx: "hurt", down: false };
    }
    s.hp -= 1;
    if (s.hp <= 0) {
      s.phase = "gameover";
      s.gameover = "down";
      return {
        lines: [line("narr", "총에 맞았다. 명동 한복판에서 반장이 쓰러지면, 인질은 여기서 끝난다.")],
        sfx: "bad",
        down: true,
      };
    }
    return { lines: [line("narr", "소매가 찢긴다. 스쳤다. 한 발 더 맞으면 끝이다.")], sfx: "hurt", down: false };
  }

  function winCombat(s) {
    s.phase = "play";
    s.room = "bank";
    s.flags.arrested = true;
    s.held = null;
    s.targets = {};
    return [
      line("kyunghwan", "손목입니다! 권총이 떨어졌습니다!"),
      line("sangsoon", "인질 열둘, 전원 호흡 확인. 오발탄은 생포. 죽이지 않은 게 오늘은 정답입니다."),
      line("hojeong", "코트입니다, 반장님. 이 대리가 두목이 붙잡고 있었다던 그 코트."),
      line("woman", "살… 살았습니다. 저 사람, 창구의 이 대리가 셔터 코드를 알고 있었어요."),
    ];
  }

  function failCombat(s, kind) {
    s.phase = "gameover";
    s.gameover = kind;
    if (kind === "hostage") {
      return [line("narr", "한가운데는 여직원이다. 방패가 먼저 맞고, 객장이 비명으로 접힌다.")];
    }
    return [line("narr", "오발탄이 절명했다. 코트 안의 종이와 배후가 함께 묻힌다. 손목을 노렸어야 했다.")];
  }

  function waveInfo(s) {
    if (s.phase !== "combat") return null;
    const w = WAVES[s.combatStep] || WAVES[0];
    return {
      banner: w.banner,
      ms: w.ms,
      boss: w.boss,
      labels: w.labels || null,
      live: Object.keys(s.targets || {}),
    };
  }

  function getNode(s, tree, node) {
    const close = { label: "알겠다.", close: true };
    if (tree === "ack") return { lines: [], choices: [close] };

    if (tree === "sangsoon") {
      let text = "반장님, 청원경찰 한 명이 어깨에 구멍을 냈습니다. 엽총이 아닙니다. 저건 군용입니다.";
      if (s.flags.magGot && !s.flags.insider) text = "탄창은 확보했습니다. 글씨 맞추는 건 서호정 몫입니다. 저는 입만 더 열게 하면 됩니다.";
      else if (s.flags.insider && !s.flags.arrested) text = "첩자는 밖에 있습니다. 안의 두목만 남았습니다. 문만 열리면 제가 고함을 맡겠습니다.";
      else if (s.flags.arrested && !s.flags.receiptGot) text = "숨은 쉬고 있습니다. 코트 안을 안 뒤지면 내일 조서가 비겠습니다.";
      else if (s.flags.briefed) text = "금호상회. 청계천 바닥의 상호치고는 카빈을 너무 잘 압니다.";
      else if (s.flags.clerkOut && !s.flags.magGot) text = "저 양복, 인질 표정이 아닙니다. 안주머니를 까라 하시면 제가 깝니다.";
      const choices = [];
      if (s.flags.clerkOut && !s.flags.magGot) choices.push({ label: "이 대리를 압박해라.", custom: "mag" });
      choices.push(close);
      return { lines: [line("sangsoon", text)], choices };
    }

    if (tree === "kyunghwan") {
      let text = "주먹 뼈마디가 근질거립니다. 셔터만 열어 주시면 제가 먼저 들어갑니다.";
      if (s.flags.arrested) text = "문은 제가 따 놨습니다. 인질은 뒤에 앉혀 두었습니다.";
      const choices = [{ label: "셔터를 맡긴다.", custom: "raid" }, close];
      return { lines: [line("kyunghwan", text)], choices };
    }

    if (tree === "hojeong" && node === "after") {
      return {
        lines: [],
        choices: [
          { label: "조서를 마친다.", custom: "finish" },
          { label: "한 번 더 현장을 본다.", close: true },
        ],
      };
    }

    if (tree === "hojeong") {
      let text = "현장에 탄피가 있습니다. 각인부터 읽어야 총의 이름이 나옵니다.";
      if (s.flags.shellAnalyzed && !s.flags.clerkOut) text = "내부 공모자입니다. 창백하게 땀 흘리는 남자를 셔터 밖으로 빼 주십시오.";
      if (s.flags.clerkOut && !s.flags.memoGot) text = "필적 샘플이 필요합니다. 지점장이 이 대리의 오늘 자 전표를 갖고 있을 겁니다.";
      if (s.flags.memoGot && !s.flags.magGot) text = "전표는 확보했습니다. 대조할 다른 손글씨가 안주머니에 있을 가능성이 큽니다.";
      if (s.flags.magGot && s.flags.memoGot && !s.flags.insider) text = "두 장의 글씨를 제게 주십시오. 수첩에서 맞대셔도 됩니다.";
      if (s.flags.insider && !s.flags.arrested) text = "확정입니다. 조경환 형사가 셔터를 따면, 6번 오른손목만 보십시오.";
      if (s.flags.receiptGot && !s.flags.briefed) text = "그 종이, 제가 읽겠습니다.";
      if (s.flags.briefed) text = "제1화의 사실관계는 닫혔습니다. 다음 주소만 남았습니다. 조서를 마칠 수 있습니다.";
      const choices = [];
      if (has(s, "shell") && !s.flags.shellAnalyzed) choices.push({ label: "탄피를 맡긴다.", custom: "analysis" });
      if (s.flags.memoGot && s.flags.magGot && !s.flags.insider) choices.push({ label: "필적을 맞춰 주게.", custom: "insider" });
      if (s.flags.receiptGot && !s.flags.briefed) choices.push({ label: "영수증을 대조하게.", custom: "brief", goto: "after" });
      if (s.flags.briefed) choices.push({ label: "조서를 마친다.", custom: "finish" });
      choices.push(close);
      return { lines: [line("hojeong", text)], choices };
    }

    if (tree === "manager") {
      if (node === "root") {
        const choices = [
          { label: "상황을 말해 보시오.", goto: "sit" },
          { label: "비상금고를 누가 알았소.", goto: "vault" },
        ];
        if (s.flags.knowLee && !s.flags.memoGot) choices.push({ label: "이 대리의 자필을 주시오.", custom: "memo" });
        if (s.flags.memoGot) choices.push({ label: "전표 외에 더 있소.", goto: "nomore" });
        choices.push({ label: "물러선다.", close: true });
        return { lines: [line("manager", "반장님, 안에 아이들이… 직원들이 있습니다. 창구의 유리 뒤에서 울고 있어요.")], choices };
      }
      if (node === "sit") {
        return {
          lines: [
            line("manager", "사설 비상금고와 셔터 차단 배선은 제 책상 서랍에만 있었습니다."),
            line("manager", "오늘 아침 대부계 이 대리가 열쇠를 빌려 갔고, 서랍이 아직 헐겁습니다. 그 친구가 안에 있습니다. 얼굴이 이상하게 희었어요."),
          ],
          choices: [{ label: "자필 전표를 주시오.", custom: "memo" }, { label: "알겠다.", close: true }],
          side: "know",
        };
      }
      if (node === "vault") {
        return {
          lines: [line("manager", "금고 번호는 간부 둘만 알았습니다. 놈들이 헤매지 않고 열었습니다. 누군가 가르쳐 준 겁니다.")],
          choices: [{ label: "누가 가르칠 수 있소.", goto: "sit" }, close],
        };
      }
      if (node === "nomore") {
        return { lines: [line("manager", "전표가 전부입니다. 저는 총을 만져 본 적도 없습니다.")], choices: [close] };
      }
    }

    if (tree === "officer") {
      return {
        lines: [line("officer", "대부계… 양복 입은 놈… 셔터 배선을 알고 있었어. 내가 말리려다…")],
        choices: [close],
        side: "officer",
      };
    }

    if (tree === "clerk") {
      const choices = [];
      if (!s.flags.magGot) {
        choices.push({ label: "안주머니를 까라.", custom: "mag" });
        choices.push({ label: "김상순에게 맡긴다.", custom: "mag" });
      }
      choices.push({ label: "물러선다.", close: true });
      const said = s.flags.magGot
        ? "이 대리"
        : "저, 저는 그냥 행원입니다. 심장약이 안주머니에… 살려 주셔서 감사합니다. 진짜로.";
      const who = s.flags.magGot ? "lee" : "lee";
      const text = s.flags.magGot
        ? "말했습니다. 이름은 모릅니다. 도면만… 코트는 두목이 갖고 있습니다."
        : said;
      return { lines: [line(who, text)], choices };
    }

    if (tree === "nego") {
      if (node === "root") {
        const choices = [
          { label: "인질은 무사하냐.", goto: "host" },
          { label: "원하는 게 뭐냐.", goto: "demand" },
          { label: "다친 사람부터 내보내라.", goto: "wound" },
        ];
        if (!s.flags.clerkOut) choices.push({ label: "땀 흘리는 양복부터 내보내라.", custom: "release" });
        choices.push({ label: "대화를 끝낸다.", close: true });
        const intro = s.flags.clerkOut
          ? "확성기 너머로 쉰 목소리가 웃는다. 한 명 가져갔으면 협상은 끝 아니냐."
          : "확성기 너머로 쇳소리가 빗소리를 가른다. 쏘지 마. 한 발만 더 나오면 인질부터다.";
        return { lines: [line("obal", intro)], choices };
      }
      if (node === "host") {
        return {
          lines: [line("obal", "열둘은 살아 있다. 경관 하나가 어깨에 구멍을 냈을 뿐이야. 그 다음은 네 선택이다.")],
          choices: [
            { label: "쓰러지는 남자부터 내보내라.", custom: "release" },
            { label: "뒤로.", goto: "root" },
          ],
        };
      }
      if (node === "demand") {
        return {
          lines: [line("obal", "차 한 대, 그리고 길을 비워. 금고는 이미 끝났다. 우리는 나가기만 하면 된다.")],
          choices: [
            { label: "쓰러지는 남자부터 내보내라.", custom: "release" },
            { label: "뒤로.", goto: "root" },
          ],
        };
      }
      if (node === "wound") {
        return {
          lines: [line("obal", "인질은 협상 카드야. 공짜로는 안 내준다.")],
          choices: [
            { label: "시간은 준다. 창백한 그 남자부터.", custom: "release" },
            { label: "뒤로.", goto: "root" },
          ],
        };
      }
    }

    if (tree === "woman") {
      return {
        lines: [line("woman", "카빈을 든 사람이 제 목을 잡았어요. 오른쪽 손으로요. 반장님이 그 손목을 맞추셨어요. 창구의 이 대리는… 강도가 오기 전부터 손을 떨고 있었습니다.")],
        choices: [close],
      };
    }

    if (tree === "obal") {
      return {
        lines: [line("obal", "손목… 잘했다, 형사. 죽이지 않아서 아쉽나. 이름은 금호… 아니다. 변호사를 불러.")],
        choices: [close],
      };
    }

    return { lines: [P("더 물을 것이 없다.")], choices: [close] };
  }

  // radio node above is clumsy because I stuffed a line into choices by mistake.
  // Replaced below by fixing getNode radio — see openTalk path. We'll special-case in hotspot.

  function applyCustom(s, name) {
    if (name === "analysis") return doAnalysis(s);
    if (name === "memo") return doMemo(s);
    if (name === "release") return doRelease(s);
    if (name === "mag") return doMag(s);
    if (name === "insider") return doInsider(s);
    if (name === "raid") return doRaid(s);
    if (name === "brief") return doBrief(s);
    if (name === "finish") {
      s.phase = "ending";
      s.ending = "clear";
      s.talk = null;
      return [line("narr", "조서가 닫힌다.")];
    }
    return [];
  }

  function enterTalk(s, tree, node) {
    s.talk = { tree, node };
    s.held = null;
    const n = getNode(s, tree, node);
    if (n.side === "know") s.flags.knowLee = true;
    if (n.side === "officer") {
      s.flags.officerTalked = true;
      s.flags.knowLee = true;
    }
    return n.lines;
  }

  function onChoice(s, index) {
    if (!s.talk) return pack(s, []);
    const tree = s.talk.tree;
    const node = s.talk.node;
    const n = getNode(s, tree, node);
    const c = n.choices[index];
    if (!c) return pack(s, [P("그 말은 삼킨다.")]);
    let lines = [];
    if (c.custom) lines = lines.concat(applyCustom(s, c.custom));
    if (s.phase === "qte" || s.phase === "ending" || s.phase === "combat") {
      s.talk = null;
      return pack(s, lines, { sfx: "talk" });
    }
    if (c.goto) {
      s.talk = { tree, node: c.goto };
      const next = getNode(s, tree, c.goto);
      if (next.side === "know") s.flags.knowLee = true;
      lines = lines.concat(next.lines);
      return pack(s, lines, { sfx: "talk" });
    }
    s.talk = null;
    return pack(s, lines, { sfx: lines.length ? "talk" : null });
  }

  function lookItem(id) {
    return [P(ITEMS[id][1])];
  }

  function pair(s, tool, target) {
    const verb = s.verb;
    if (verb === "give" && tool === "gun") return pack(s, [P("총은 내가 든다.")]);

    if ((verb === "use" || verb === "give") && ((tool === "hojeong" && target === "shell") || (tool === "shell" && target === "hojeong"))) {
      const lines = doAnalysis(s);
      if (s.flags.shellAnalyzed) s.held = null;
      return pack(s, lines, { sfx: "clue" });
    }
    if ((verb === "use" || verb === "give") && ((tool === "memo" && target === "mag") || (tool === "mag" && target === "memo") || (tool === "hojeong" && (target === "memo" || target === "mag")) || ((tool === "memo" || tool === "mag") && target === "hojeong"))) {
      const lines = doInsider(s);
      if (s.flags.insider) s.held = null;
      return pack(s, lines, { sfx: s.flags.insider ? "good" : "talk" });
    }
    if ((verb === "use" || verb === "give") && ((tool === "receipt" && target === "hojeong") || (tool === "hojeong" && target === "receipt"))) {
      const lines = doBrief(s);
      s.held = null;
      if (s.flags.briefed) {
        s.talk = { tree: "hojeong", node: "after" };
        lines.push(line("hojeong", "사실관계는 충분합니다. 조서를 닫으시겠습니까."));
      }
      return pack(s, lines, { sfx: "clue" });
    }
    if (verb === "use" && ((tool === "sangsoon" && target === "clerk") || (tool === "clerk" && target === "sangsoon"))) {
      s.held = null;
      return pack(s, doMag(s), { sfx: "clue" });
    }
    if (verb === "use" && ((tool === "kyunghwan" && target === "shutter") || (tool === "shutter" && target === "kyunghwan"))) {
      s.held = null;
      const lines = doRaid(s);
      return pack(s, lines, { sfx: s.phase === "qte" ? "shutter" : "talk" });
    }
    if (verb === "use" && ((tool === "megaphone" && target === "shutter") || (tool === "shutter" && target === "megaphone"))) {
      if (!has(s, "megaphone")) return pack(s, [P("확성기가 차단선에 있다.")]);
      s.held = null;
      const lines = [line("narr", "박영한이 확성기의 스위치를 올린다. 쇳소리가 장마를 가른다.")].concat(enterTalk(s, "nego", "root"));
      return pack(s, lines, { sfx: "talk" });
    }
    if ((verb === "use" || verb === "give") && ((tool === "lighter" && target === "clerk") || (tool === "clerk" && target === "lighter"))) {
      s.flags.oil = true;
      s.held = null;
      return pack(s, [line("lee", "저는 피우지…"), line("narr", "손이 라이터를 피하다 멈춘다. 손톱 밑에 총기름 냄새가 배어 있다.")], { sfx: "zippo" });
    }
    if (verb === "give" && tool === "lighter" && target === "manager") {
      return pack(s, [line("manager", "저는 피우지 않습니다. 손이 떨려서 불을 못 지키겠어요.")]);
    }
    if (verb === "give" && tool === "memo" && target === "clerk") {
      s.held = null;
      const lines = [line("lee", "그 전표는 오늘 아침… 어떻게.")].concat(doMag(s));
      return pack(s, lines, { sfx: "clue" });
    }
    if (verb === "use" && tool === "lighter" && (target === "bg" || target === "lighter")) {
      s.flags.smoked = true;
      s.held = null;
      return pack(s, [line("narr", "치익, 팟. 청자 한 개비가 비에 젖기 전에 붙는다."), P("죄는 미워해도 사람은 미워하지 말라고 했다. 사람 탈을 쓴 놈은 따로 논다.")], { sfx: "zippo" });
    }
    if (verb === "use" && (tool === "notebook" || target === "notebook")) {
      s.phase = "notebook";
      s.held = null;
      return pack(s, [], { sfx: "click" });
    }
    if (verb === "use" && tool === "gun") {
      return pack(s, [P("아직은 겨눌 자리가 아니다. 인질이 선 뒤에는 함부로 총구를 올리지 않는다.")]);
    }
    if (verb === "use" && tool === "kyunghwan" && target === "trunk") {
      return pack(s, [line("kyunghwan", "상자는 증거입니다. 부수면 스텐실이 죽습니다.")]);
    }
    if (verb === "use" && tool === "sangsoon" && target === "manager") {
      return pack(s, [line("sangsoon", "지점장은 범인이 아닙니다. 고함 지르면 안에 총만 예민해집니다.")]);
    }
    if (verb === "use" && tool === "sangsoon" && target === "shutter") {
      return pack(s, [line("sangsoon", "인질 앞에서 고함은 총성입니다. 확성기로 말을 섞으시죠.")]);
    }
    const who = TEAM[tool] ? tool : "park";
    if (TEAM[tool]) return pack(s, [line(who, tool === "hojeong" ? "그 대상은 감식할 것이 없습니다." : tool === "sangsoon" ? "거길 쪼아 봤자 입에서 나오는 건 없습니다." : "거긴 어깨로 밀 곳이 아닙니다.")]);
    return pack(s, [P(verb === "give" ? "그걸 거기 건네 봤자 사건이 움직이지 않는다." : "그걸 거기에 쓸 자리는 아니다.")]);
  }

  function onHotspot(s, id) {
    const verb = s.verb;
    const f = s.flags;
    if ((verb === "use" || verb === "give") && s.held) return pair(s, s.held, id);

    if (id === "bg") {
      if (verb === "look") {
        if (s.room === "car") return pack(s, [line("narr", "와이퍼가 장마를 밀고 있다. 유리 너머, 인도 턱에 박힌 검은 뷰익과 내려앉은 셔터.")]);
        if (s.room === "street") return pack(s, [line("narr", "1972년 6월, 오후 세 시 이십 분. 명동 인도에 방범종이 비에 젖어 운다. 화약 냄새가 셔터 틈으로 샌다.")]);
        return pack(s, [line("narr", "객장의 대리석이 젖은 구두를 비춘다. 인질들은 창구 아래에 앉아 있고, 오발탄은 손목을 움켜쥔 채 무릎을 꿇고 있다.")]);
      }
      if (verb === "use" && s.held === "lighter") return pair(s, "lighter", "bg");
      return pack(s, [P("거긴 빈 곳이다.")]);
    }

    if (id === "door") {
      if (verb === "look") return pack(s, [P("순찰차 문. 밖은 이미 사건 한가운데다.")]);
      if (verb === "open" || verb === "pull" || verb === "use") {
        s.room = "street";
        s.held = null;
        return pack(s, [line("narr", "차문이 열리고 장마가 명동 인도에 쏟아진다. 뷰익의 엔진이 아직 틱틱 식는 중이다.")], { sfx: "click" });
      }
      if (verb === "close") return pack(s, [P("닫아 두면 인질이 더 오래 운다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "windshield") {
      if (verb === "look") return pack(s, [line("narr", "유리에 금이 간 네온이 흐른다. 한일은행 셔터가 삼 분의 이쯤 내려와 있다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "radio") {
      if (verb === "look") return pack(s, [P("당직 주파수. 누군가가 숨어서 듣고 있을 소리.")]);
      if (verb === "use" || verb === "talk" || verb === "pull") {
        return pack(s, [line("narr", "무전기가 지직거린다. 본청 당직이 과잉을 삼가라 중얼거리고 끊긴다."), P("과잉은 인질을 두고 가는 쪽이다.")], { sfx: "talk" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "sangsoon" || id === "kyunghwan" || id === "hojeong") {
      if (verb === "look") return pack(s, [line(id, TEAM[id][2])]);
      if (verb === "talk" || verb === "use") {
        const lines = enterTalk(s, id, "root");
        return pack(s, lines, { sfx: "talk" });
      }
      if (verb === "give") return pack(s, [P("건네려면 먼저 물건을 고른다.")]);
      return pack(s, [line(id, "반장님, 그 동작은 지금 사건이 아닙니다.")]);
    }

    if (id === "shutter") {
      if (verb === "look") {
        return pack(s, [line("narr", "철제 셔터가 내려와 있다. 아래 틈으로 화약 냄새와 객장의 노란 불이 샌다. 틈 안으로 복면의 윤곽이 움직인다.")]);
      }
      if (verb === "pull" || verb === "open") {
        if (f.clerkOut) return pack(s, [line("narr", "한 명을 빼낸 자리다. 안은 여전히 복면 둘과, 여직원을 세운 사내.")]);
        f.sawInside = true;
        f.knowLee = true;
        return pack(s, [line("narr", "틈을 더 당기자 안이 보인다. 복면 셋. 한가운데 사내가 여직원을 앞에 세우고 카빈을 겨눈다."), line("narr", "창구 쪽 양복 사내는 얼굴이 종이처럼 희고, 안주머니를 움켜쥔 채 땀을 쏟고 있다.")], { sfx: "clue" });
      }
      if (verb === "push") return pack(s, [line("kyunghwan", "밀지 마십시오. 셔터는 제가 뜯습니다. 사용으로 저를 지정하십시오.")]);
      if (verb === "talk") {
        if (!has(s, "megaphone")) return pack(s, [P("목소리가 빗소리에 묻힌다. 확성기가 차단선 옆에 있다.")]);
        return pack(s, [P("확성기를 집어 셔터에 사용한다. 말을 섞을 도구가 따로 있다.")]);
      }
      if (verb === "use") return pack(s, [P("맨손으로는 안 열린다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "shell") {
      if (verb === "look") return pack(s, [line("narr", "청원경찰 손등 옆, 젖은 보도 위에 소총 탄피. 밑동에 USA 1968.")]);
      if (verb === "pick") {
        f.shellPicked = true;
        addItem(s, "shell");
        return pack(s, [P("탄피를 주웠다. 아직 따뜻하다."), line("hojeong", "그 각인, 제게 주십시오. 유출 목록과 맞대겠습니다.")], { sfx: "pickup" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "megaphone") {
      if (verb === "look") return pack(s, [P("순찰 확성기. 누군가 차단선에 내려놓고 웅크렸다.")]);
      if (verb === "pick" || verb === "use") {
        f.megaPicked = true;
        addItem(s, "megaphone");
        return pack(s, [P("확성기를 들었다. 셔터에 사용하면 안의 목소리가 들린다.")], { sfx: "pickup" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "officer") {
      if (verb === "look") return pack(s, [line("narr", "청원경찰. 어깨에 탄창 하나 들어갈 구멍. 의식은 있다. 사냥용 산탄이 남긴 상처가 아니다.")]);
      if (verb === "talk" || verb === "pull") {
        const lines = enterTalk(s, "officer", "root");
        return pack(s, lines, { sfx: "talk" });
      }
      if (verb === "give") return pack(s, [P("이 사람에겐 지혈이 먼저다. 의무반이 오고 있다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "manager") {
      if (verb === "look") return pack(s, [line("narr", "박 지점장. 우산도 없이 서류 가방을 끌어안고 있다. 명함의 금박이 비에 벗겨진다.")]);
      if (verb === "talk") return pack(s, enterTalk(s, "manager", "root"), { sfx: "talk" });
      if (verb === "use") return pack(s, [P("지점장을 어떻게 쓴다는 말이냐. 말을 걸어야 한다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "clerk") {
      if (verb === "look") {
        const extra = f.oil ? " 손톱 밑에 총기름." : "";
        return pack(s, [line("narr", "이 대리. 동공이 크고, 안주머니가 각진 무게로 처져 있다. 인질치고는 총을 너무 잘 피한다." + extra)]);
      }
      if (verb === "talk") return pack(s, enterTalk(s, "clerk", "root"), { sfx: "talk" });
      if (verb === "pull" || verb === "open") return pack(s, doMag(s), { sfx: "clue" });
      if (verb === "push") return pack(s, [line("lee", "왜 저를 미십니까. 저는 인질입니다!")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "buick") {
      if (verb === "look") return pack(s, [line("narr", "검은 뷰익. 인도 턱을 들이받고 멈췄다. 앞 유리에 거미줄 금. 도주 차량이다.")]);
      if (verb === "open") return pack(s, [P("어느 쪽을 여나. 차문인가, 트렁크인가.")]);
      if (verb === "push") return pack(s, [line("kyunghwan", "증거 차량입니다. 밀면 타이어 자국이 죽습니다.")]);
      if (verb === "close") return pack(s, [P("이미 길이 막힌 차다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "buickDoor") {
      if (verb === "look") return pack(s, [P("운전석 문. 급히 내리다 덜 닫혔다.")]);
      if (verb === "open" || verb === "pull" || verb === "use") {
        s.buickOpen = true;
        return pack(s, [line("narr", "문이 삐걱 열린다. 대시보드 너머 글로브박스가 반쯤 빠져 있다.")], { sfx: "click" });
      }
      if (verb === "close") {
        s.buickOpen = false;
        return pack(s, [P("문을 닫아 둔다.")], { sfx: "click" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "glove") {
      if (verb === "look") return pack(s, [f.gloveTaken ? P("글로브박스는 비었다.") : line("narr", "반쯤 열린 글로브박스. 성냥갑 하나가 비에 젖어 있다.")]);
      if (verb === "open" || verb === "pick" || verb === "pull") {
        if (f.gloveTaken) return pack(s, [P("이미 비었다.")]);
        f.gloveTaken = true;
        addItem(s, "match");
        return pack(s, [P("성냥갑을 꺼냈다. 상호는 번져서 오늘 단서가 되지 못한다.")], { sfx: "pickup" });
      }
      if (verb === "close") return pack(s, [P("덜 닫힌 채로 두어도 사건은 같다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "trunk") {
      if (verb === "look") return pack(s, [s.trunkOpen ? line("narr", "트렁크는 열려 있다. 안에 빈 나무 상자.") : P("뷰익의 트렁크. 자물쇠는 이미 부러져 있다.")]);
      if (verb === "open" || verb === "pull" || verb === "use") {
        s.trunkOpen = true;
        f.crateSeen = true;
        return pack(s, [line("narr", "트렁크가 들린다. 빈 나무 상자. 스텐실이 미8군이다. 실었던 것은 이미 은행 안에 있다.")], { sfx: "clue" });
      }
      if (verb === "close") {
        s.trunkOpen = false;
        return pack(s, [P("트렁크를 닫는다.")], { sfx: "click" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "crate") {
      if (verb === "look" || verb === "open") {
        f.crateSeen = true;
        return pack(s, [line("narr", "빈 상자. 옆면에 미8군, 그리고 지워진 물품 번호. 무게의 흔적만 나무에 남아 있다.")], { sfx: "clue" });
      }
      if (verb === "pick") return pack(s, [P("상자는 차량과 함께 현장에 둔다.")]);
      if (verb === "close") return pack(s, [P("뚜껑은 이미 없다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "sign") {
      if (verb === "look") return pack(s, [line("narr", "한일은행 명동지점. 금박 글자가 빗물에 어둡다. 방범종은 아직 지치지 않았다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "cordon") {
      if (verb === "look") return pack(s, [P("노란 줄. 구경꾼은 장마가 대신 밀어 냈다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "obal") {
      if (verb === "look") return pack(s, [line("narr", "복면은 반쯤 벗겨졌다. 오른손목이 뒤로 꺾여 있고, 권총은 멀리 차 있다. 숨은 있다.")]);
      if (verb === "talk") return pack(s, enterTalk(s, "obal", "root"), { sfx: "talk" });
      return pack(s, [P("이미 제압된 자다.")]);
    }

    if (id === "coat") {
      if (verb === "look") return pack(s, [line("narr", "진회색 코트. 안주머니가 바스락이는 두께다. 이 대리가 말한 그 옷.")]);
      if (verb === "open" || verb === "pull" || verb === "pick" || verb === "use") {
        if (f.receiptGot) return pack(s, [P("안주머니는 이미 비었다.")]);
        f.receiptGot = true;
        f.coatOpen = true;
        addItem(s, "receipt");
        return pack(s, [line("narr", "안주머니에서 찢긴 영수증이 나온다."), P("청계천 3가, 평화시장 2열 4호. 금호상회."), line("hojeong", "그 종이, 제게 주십시오.")], { sfx: "pickup" });
      }
      return pack(s, [P(NO[verb])]);
    }

    if (id === "woman") {
      if (verb === "look") return pack(s, [line("narr", "여직원. 목덜미에 남의 손자국. 다리는 떨리지만 서 있다.")]);
      if (verb === "talk") return pack(s, enterTalk(s, "woman", "root"), { sfx: "talk" });
      return pack(s, [P("이 사람에겐 담요가 먼저다.")]);
    }

    if (id === "vault") {
      if (verb === "look" || verb === "open") return pack(s, [line("narr", "사설 비상금고는 열려 있다. 현찰은 그대로고, 문서 칸만 헤집어져 있다. 돈보다 장부와 무기 대금을 노린 손이다.")]);
      if (verb === "close") return pack(s, [P("닫으면 감식이 멈춘다. 열어 둔다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "carbine") {
      if (verb === "look") return pack(s, [line("narr", "M1 카빈 두 정. 개머리판의 군용 각인이 줄칼로 지워져 있다. 다 지워지진 않았다.")]);
      if (verb === "pick") return pack(s, [P("증거물은 현장에 둔다. 탄창 하나가 이미 내 수첩에 있다.")]);
      return pack(s, [P(NO[verb])]);
    }

    if (id === "hostages") {
      if (verb === "look" || verb === "talk") return pack(s, [line("narr", "열두 명. 울음은 잦아들었고, 아무도 피를 흘리지 않는다. 오늘은 그 문장으로 충분하다.")]);
      return pack(s, [P("건드리지 않는다.")]);
    }

    return pack(s, [P(NO[verb] || "의미가 없다.")]);
  }

  function onItem(s, id) {
    const verb = s.verb;
    if (!has(s, id)) return pack(s, []);
    if (verb === "look") return pack(s, lookItem(id));
    if (verb === "use" || verb === "give") {
      if (!s.held) {
        if (verb === "use" && id === "notebook") {
          s.phase = "notebook";
          return pack(s, [], { sfx: "click" });
        }
        if (verb === "use" && id === "lighter") return pair(s, "lighter", "bg");
        if (verb === "use" && id === "gun") return pair(s, "gun", "bg");
        s.held = id;
        return pack(s, []);
      }
      if (s.held === id) {
        if (verb === "use" && (id === "notebook" || id === "lighter" || id === "gun")) {
          s.held = null;
          return onItem(Object.assign(s, { held: null, verb: "use" }), id);
        }
        s.held = null;
        return pack(s, []);
      }
      return pair(s, s.held, id);
    }
    return pack(s, [P("주머니 안의 물건을 그렇게 다루진 않는다.")]);
  }

  function onTeam(s, id) {
    const verb = s.verb;
    if (verb === "look") return pack(s, [line(id, TEAM[id][2])]);
    if (verb === "talk") return pack(s, enterTalk(s, id, "root"), { sfx: "talk" });
    if (verb === "use" || verb === "give") {
      if (s.held && s.held !== id) return pair(s, s.held, id);
      if (s.held === id) {
        s.held = null;
        return pack(s, []);
      }
      s.held = id;
      return pack(s, []);
    }
    return pack(s, [line(id, "그 말에는 움직일 수 없습니다.")]);
  }

  function onShot(s, cell) {
    if (s.phase !== "combat") return pack(s, []);
    if (s.reloading) return pack(s, [P("재장전 중이다.")], { sfx: "click" });
    if (s.ammo <= 0) return pack(s, [P("공이 떨어졌다. R키로 재장전.")], { sfx: "click" });
    s.ammo -= 1;
    const w = WAVES[s.combatStep];
    if (s.targets[cell]) {
      delete s.targets[cell];
      if (w.boss) {
        const lines = winCombat(s);
        return pack(s, lines, { sfx: "good" });
      }
      if (Object.keys(s.targets).length === 0) {
        s.combatStep += 1;
        loadWave(s);
        return pack(s, [line("sangsoon", "공범 둘, 무릎 꿇렸다! 한가운데다, 반장님!")], { sfx: "gun", resetTimer: true });
      }
      return pack(s, [line("narr", "한 명이 카빈을 떨어뜨리고 접힌다. 다른 쪽이 남았다.")], { sfx: "gun" });
    }
    if (w.bad && w.bad[cell]) {
      const lines = failCombat(s, w.bad[cell]);
      return pack(s, lines, { sfx: "bad" });
    }
    if (w.soft && w.soft[cell]) {
      return pack(s, [line("narr", "살을 스쳤다. 권총은 아직 오른손에 있다. 6번, 손목이다.")], { sfx: "gun", resetTimer: true });
    }
    return pack(s, [line("narr", "허공에 박힌다. 대리석 가루가 튄다.")], { sfx: "gun" });
  }

  function onTimeout(s) {
    if (s.phase !== "combat") return pack(s, []);
    const hit = damage(s);
    if (hit.down) return pack(s, hit.lines, { sfx: hit.sfx });
    return pack(s, hit.lines, { sfx: hit.sfx, resetTimer: true });
  }

  function dispatch(state, action) {
    const s = state;
    if (!action || !action.type) return pack(s, []);

    if (action.type === "verb") {
      if (busy(s) && s.phase !== "play") return pack(s, []);
      if (s.talk) return pack(s, []);
      s.verb = action.verb;
      s.held = null;
      return pack(s, []);
    }

    if (action.type === "choice") return onChoice(s, action.index);

    if (action.type === "notebook") {
      if (action.close) {
        s.phase = "play";
        return pack(s, []);
      }
      if (s.talk || s.phase === "combat" || s.phase === "qte") return pack(s, []);
      s.phase = "notebook";
      return pack(s, [], { sfx: "click" });
    }

    if (action.type === "combine") {
      const a = action.a;
      const b = action.b;
      if (!a || !b) return pack(s, [P("맞댈 종이를 둘 고른다.")]);
      if (a === b) return pack(s, [P("같은 종이를 두 번 보면 글씨가 늘진 않는다.")]);
      const key = [a, b].sort().join("+");
      if (key === "mag+memo") {
        const lines = doInsider(s);
        s.phase = "play";
        return pack(s, lines, { sfx: "good" });
      }
      return pack(s, [P("이 둘은 아직 한 문장이 되지 않는다.")]);
    }

    if (action.type === "qte") {
      if (s.phase !== "qte") return pack(s, []);
      if (!action.ok) {
        s.phase = "play";
        return pack(s, [line("kyunghwan", "문이 버팁니다. 호흡 맞추고, 한 번 더!")], { sfx: "click" });
      }
      const lines = enterCombat(s);
      return pack(s, lines, { sfx: "shutter", resetTimer: true });
    }

    if (action.type === "shot") return onShot(s, action.cell);
    if (action.type === "timeout") return onTimeout(s);

    if (action.type === "cover") {
      if (s.phase !== "combat") return pack(s, []);
      if (s.cover <= 0) return pack(s, [line("kyunghwan", "엄호는 한 번입니다. 이미 썼습니다.")]);
      if (s.covering) return pack(s, [line("kyunghwan", "이미 어깨를 넣고 있습니다.")]);
      s.covering = true;
      return pack(s, [line("kyunghwan", "다음 한 발은 제가 받겠습니다. 반장님은 손목만 보십시오.")], { sfx: "click" });
    }

    if (action.type === "reload") {
      if (s.phase !== "combat") return pack(s, []);
      if (s.reloading) return pack(s, [P("이미 열고 있다.")]);
      if (s.ammo >= 6) return pack(s, [P("여섯 발이 이미 들어 있다.")]);
      s.reloading = true;
      s.ammo = 0;
      return pack(s, [line("narr", "실린더가 열린다. 1초가 길다.")], { sfx: "reload" });
    }

    if (action.type === "reload-done") {
      if (!s.reloading) return pack(s, []);
      s.reloading = false;
      s.ammo = 6;
      return pack(s, [P("장전.")], { sfx: "reload" });
    }

    if (action.type === "retry") {
      if (!s.checkpoint) return pack(newGame(), []);
      const back = structuredClone(s.checkpoint);
      const lines = enterCombat(back);
      return pack(back, lines, { sfx: "shutter", resetTimer: true });
    }

    if (action.type === "title") {
      return pack(s, []);
    }

    if (s.phase === "combat" || s.phase === "qte" || s.phase === "ending" || s.phase === "gameover" || s.phase === "notebook") {
      return pack(s, []);
    }
    if (s.talk && action.type !== "hotspot") return pack(s, []);
    if (s.talk && (action.type === "hotspot" || action.type === "item" || action.type === "team")) return pack(s, [P("말이 끝나기 전에 손을 움직이지 않는다.")]);

    if (action.type === "hotspot") return onHotspot(s, action.id);
    if (action.type === "item") return onItem(s, action.id);
    if (action.type === "team") return onTeam(s, action.id);

    return pack(s, []);
  }

  function choices(s) {
    if (!s.talk) return [];
    const n = getNode(s, s.talk.tree, s.talk.node);
    return n.choices.map((c, index) => ({ index, label: c.label }));
  }

  return {
    VERBS,
    ITEMS,
    TEAM,
    LAYOUT,
    WAVES,
    newGame,
    dispatch,
    choices,
    hotspots,
    hitTest,
    cluebook,
    sentence,
    sentenceParts,
    thought,
    roomTitle,
    nameOf,
    waveInfo,
    has,
  };
});
