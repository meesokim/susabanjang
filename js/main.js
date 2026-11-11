(function () {
  const L = window.SusaLogic;
  const A = window.SusaAudio;
  const R = window.SusaRender;
  const SAVE = "susa-ep1-v1";
  const WHO = {
    park: "박영한",
    sangsoon: "김상순",
    kyunghwan: "조경환",
    hojeong: "서호정",
    obal: "오발탄",
    manager: "박 지점장",
    lee: "이 대리",
    officer: "청원경찰",
    woman: "여직원",
    narr: "현장",
  };

  const $ = (id) => document.getElementById(id);
  const canvas = $("view");
  const ctx = canvas.getContext("2d");
  const pctx = $("portrait").getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let state = null;
  let screen = "boot";
  let hover = null;
  let queue = [];
  let shown = null;
  let music = "";
  let muted = false;
  let waveLeft = 0;
  let waveMax = 1;
  let waveArmed = false;
  let qteOn = false;
  let qteHits = 0;
  let qteLeft = 0;
  let toast = "";
  let toastUntil = 0;
  let reloadToken = 0;
  let selectedClues = [];
  let last = performance.now();

  function show(name) {
    screen = name;
    ["boot", "intro", "title", "help", "game"].forEach((id) => {
      $(id).hidden = id !== name;
    });
    if (name === "title") refreshTitle();
    if (name === "game") fit();
    syncMusic();
  }

  function refreshTitle() {
    let done = false;
    let mid = false;
    try {
      const raw = localStorage.getItem(SAVE);
      if (raw) {
        const data = JSON.parse(raw);
        done = data.ending === "clear";
        mid = data.phase && data.phase !== "ending";
      }
    } catch (e) {
      mid = false;
    }
    $("resume").disabled = !mid;
    $("seal").hidden = !done;
  }

  function syncMusic() {
    let want = "";
    if (screen === "intro") want = "intro";
    else if (screen === "game" && state) {
      if (state.phase === "ending") want = "end";
      else if (state.phase === "combat" || state.phase === "qte" || (state.talk && state.talk.tree === "nego")) want = "tense";
      else want = "rain";
    }
    if (want !== music) {
      music = want;
      if (want) A.play(want, want !== "end");
      else A.stop();
    }
    const wet = screen === "game" && state && (state.room === "car" || state.room === "street") && state.phase !== "combat";
    A.rain(wet);
  }

  function save() {
    if (!state) return;
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch (e) {
      /* private mode */
    }
  }

  function enqueue(lines) {
    lines.filter((l) => l && l.text).forEach((l) => queue.push(l));
    if (!shown) nextLine();
  }

  function nextLine() {
    if (!queue.length) {
      shown = null;
      tryArm();
      paint();
      return;
    }
    const line = queue.shift();
    shown = { who: line.who, text: line.text, i: 0 };
    paintTalk();
  }

  function advance() {
    if (!shown) return;
    if (shown.i < shown.text.length) {
      shown.i = shown.text.length;
      paintTalk();
      return;
    }
    nextLine();
  }

  function tryArm() {
    if (shown || queue.length || !state) return;
    if (state.phase === "qte" && !qteOn) {
      qteOn = true;
      qteHits = 0;
      qteLeft = 2800;
    }
    if (state.phase === "combat" && !waveArmed) {
      const w = L.waveInfo(state);
      if (w) {
        waveMax = w.ms;
        waveLeft = w.ms;
        waveArmed = true;
      }
    }
  }

  function present(result) {
    if (!result) return;
    const was = state.phase;
    state = result.state;
    if (result.sfx) {
      A.sfx(result.sfx);
      if (result.sfx === "gun" || result.sfx === "shutter" || result.sfx === "bad") {
        $("monitor").classList.remove("shake");
        void $("monitor").offsetWidth;
        $("monitor").classList.add("shake");
      }
    }
    if (was === "combat" && state.phase === "combat" && result.lines && result.lines.length) {
      toast = result.lines.map((l) => l.text).join(" ");
      toastUntil = performance.now() + 1400;
    } else if (result.lines && result.lines.length && state.phase !== "gameover" && state.phase !== "ending") {
      enqueue(result.lines);
    }
    if (state.phase === "gameover") {
      waveArmed = false;
      qteOn = false;
      queue = [];
      shown = null;
      $("overText").textContent = (result.lines && result.lines[0] && result.lines[0].text) || "여기서 멈춘다.";
      $("over").hidden = false;
    }
    if (state.phase === "ending") {
      waveArmed = false;
      qteOn = false;
      queue = [];
      shown = null;
      $("endingBody").textContent =
        "인질 열두 명은 살아 있다.\n오발탄은 생포되었고, 대부계 이 대리는 도면을 넘긴 첩자로 남는다.\n\n코트에서 나온 영수증.\n청계천 3가 평화시장 2열 4호, 금호상회.\n군용 카빈이 향한 다음 주소다.\n\n박영한이 젖은 라이터를 덮으며 말한다.\n오늘은 여기까지다. 사람 탈을 쓴 채 무기를 넘기는 손은, 내일 조서로 당긴다.";
      $("ending").hidden = false;
    }
    if (result.resetTimer) waveArmed = false;
    if (state.phase !== "combat") waveArmed = false;
    if (state.phase !== "qte") qteOn = false;
    syncMusic();
    save();
    tryArm();
    paint();
  }

  function paintTalk() {
    const talking = !!(shown && shown.i < shown.text.length);
    if (!shown && (!state || !state.talk)) {
      $("talk").hidden = true;
      return;
    }
    $("talk").hidden = false;
    const who = shown ? shown.who : "park";
    $("who").textContent = WHO[who] || "";
    $("line").textContent = shown ? shown.text.slice(0, shown.i) : "";
    R.portrait(pctx, who, talking);
    const box = $("choices");
    box.innerHTML = "";
    if (!shown && state.talk) {
      L.choices(state).forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c.label;
        b.addEventListener("click", () => present(L.dispatch(state, { type: "choice", index: c.index })));
        box.appendChild(b);
      });
    }
  }

  function renderSentence() {
    const parts = L.sentenceParts(state, hover && hover.id);
    const cell = (value) => (value && value !== "—") ? value : "\u00a0";
    $("slot-who").textContent = cell(parts.who);
    $("slot-verb").textContent = cell(parts.verb);
    $("slot-what").textContent = cell(parts.what);
    $("sentence").textContent = parts.who + "   " + parts.verb + "   " + parts.what;
  }

  function paint() {
    if (!state) return;
    $("room").textContent = L.roomTitle(state);
    renderSentence();
    $("status").hidden = true;
    $("thought").textContent = state.phase === "play" && !state.talk ? L.thought(state) : "";
    $("console").classList.toggle("is-locked", state.phase !== "play");
    document.querySelectorAll("#verbs button").forEach((b) => {
      b.classList.toggle("on", b.dataset.verb === state.verb);
    });
    const team = $("team");
    team.innerHTML = "";
    Object.keys(L.TEAM).forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.held === id ? " on" : "");
      b.innerHTML = "<b></b><small></small>";
      b.querySelector("b").textContent = L.TEAM[id][0];
      b.querySelector("small").textContent = L.TEAM[id][1];
      b.addEventListener("click", () => act({ type: "team", id }));
      team.appendChild(b);
    });
    const inv = $("inv");
    inv.innerHTML = "";
    state.inv.forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.held === id ? " on" : "");
      b.innerHTML = "<b></b><small></small>";
      b.querySelector("b").textContent = L.ITEMS[id][0];
      b.querySelector("small").textContent = "";
      b.addEventListener("click", () => act({ type: "item", id }));
      inv.appendChild(b);
    });
    const combat = state.phase === "combat";
    $("grid").hidden = !combat;
    $("hud").hidden = !combat;
    $("qte").hidden = !(state.phase === "qte" && qteOn);
    $("book").hidden = state.phase !== "notebook";
    if (state.phase !== "gameover") $("over").hidden = true;
    if (state.phase !== "ending") $("ending").hidden = true;
    if (combat) {
      const info = L.waveInfo(state);
      $("banner").textContent = info ? info.banner : "";
      $("vitals").textContent =
        "탄 " + state.ammo + (state.reloading ? " · 재장전" : "") +
        "   부상 " + (2 - state.hp) +
        "   엄호 " + (state.covering ? "대기" : state.cover ? "있음" : "없음");
      $("timeFill").style.width = Math.max(0, (waveLeft / waveMax) * 100) + "%";
      const live = new Set((info && info.live) || []);
      document.querySelectorAll("#grid button").forEach((b) => {
        const n = b.dataset.cell;
        b.classList.toggle("live", live.has(n));
        if (info && info.labels && info.labels[n]) b.textContent = info.labels[n];
        else b.textContent = n;
      });
      $("toast").textContent = performance.now() < toastUntil ? toast : "";
    }
    if (qteOn) {
      $("qteFill").style.width = Math.max(0, (qteLeft / 2800) * 100) + "%";
      $("qteText").textContent = "셔터를 뜯는다. " + qteHits + " / 7";
    }
    if (state.phase === "notebook") paintBook();
    paintTalk();
    fit();
  }

  function paintBook() {
    const box = $("clues");
    box.innerHTML = "";
    const rows = L.cluebook(state);
    if (!rows.length) {
      const p = document.createElement("p");
      p.textContent = "아직 꽂아 둔 종이가 없다.";
      box.appendChild(p);
      return;
    }
    rows.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "clue" + (selectedClues.indexOf(c.id) !== -1 ? " on" : "");
      b.textContent = c.name + " — " + c.text;
      b.addEventListener("click", () => {
        const i = selectedClues.indexOf(c.id);
        if (i >= 0) selectedClues.splice(i, 1);
        else {
          selectedClues.push(c.id);
          if (selectedClues.length > 2) selectedClues.shift();
        }
        paintBook();
      });
      box.appendChild(b);
    });
  }

  function act(action) {
    if (!state) return;
    if (shown || queue.length) {
      advance();
      return;
    }
    if (state.phase !== "play" && action.type !== "choice") return;
    if (state.talk && action.type !== "choice") return;
    present(L.dispatch(state, action));
  }

  function bootGame(loaded) {
    queue = [];
    shown = null;
    hover = null;
    waveArmed = false;
    qteOn = false;
    selectedClues = [];
    toast = "";
    if (loaded) {
      state = loaded;
      show("game");
      paint();
      tryArm();
      return;
    }
    state = L.newGame();
    show("game");
    enqueue([
      { who: "narr", text: "1972년 6월, 장마. 오후 3시 20분. 명동 한일은행 지점." },
      { who: "narr", text: "인도 턱을 들이받은 검은 뷰익. 내려앉은 셔터 틈으로 방범종이 새어 나온다. 순찰차 안, 세 형사가 반장을 본다." },
    ]);
    paint();
  }

  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 320) / r.width,
      y: ((e.clientY - r.top) * 180) / r.height,
    };
  }

  function fit() {
    const host = $("game");
    const mon = $("monitor");
    if (!host || host.hidden || !host.clientHeight) return;
    const cs = getComputedStyle(host);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    mon.style.height = "0px";
    let others = 0;
    for (const el of host.children) {
      if (el === mon || el.hidden) continue;
      const s = getComputedStyle(el);
      others += el.offsetHeight + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
    }
    const monS = getComputedStyle(mon);
    const availH = Math.max(120, host.clientHeight - padY - others - parseFloat(monS.marginTop) - parseFloat(monS.marginBottom));
    const availW = Math.max(280, host.clientWidth - padX);
    let w = Math.min(960, availW);
    let h = Math.round((w * 180) / 320);
    if (h > availH) {
      h = Math.floor(availH);
      w = Math.round((h * 320) / 180);
    }
    mon.style.width = w + "px";
    mon.style.height = h + "px";
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }

  L.VERBS.forEach(([id, label], index) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.verb = id;
    const num = document.createElement("span");
    num.className = "vk";
    num.textContent = String(index + 1);
    const word = document.createElement("span");
    word.className = "vw";
    word.textContent = label;
    b.append(num, word);
    b.addEventListener("click", () => act({ type: "verb", verb: id }));
    $("verbs").appendChild(b);
  });

  $("power").addEventListener("click", () => {
    A.unlock();
    $("opener").src = "assets/intro.gif?t=" + Date.now();
    show("intro");
  });
  $("skip").addEventListener("click", () => show("title"));
  $("opener").addEventListener("click", () => show("title"));
  $("replay").addEventListener("click", () => {
    $("opener").src = "assets/intro.gif?t=" + Date.now();
    show("intro");
  });
  $("how").addEventListener("click", () => show("help"));
  $("helpBack").addEventListener("click", () => show("title"));
  $("begin").addEventListener("click", () => bootGame(null));
  $("resume").addEventListener("click", () => {
    try {
      bootGame(JSON.parse(localStorage.getItem(SAVE)));
    } catch (e) {
      bootGame(null);
    }
  });
  $("mute").addEventListener("click", () => {
    muted = !muted;
    A.mute(muted);
    $("mute").textContent = muted ? "소리 켬" : "소리 끔";
  });
  function noteSaved() {
    save();
    const msg = "조서를 남겨 두었다.";
    if (state && state.phase === "combat") {
      toast = msg;
      toastUntil = performance.now() + 1400;
      $("toast").textContent = msg;
    } else if ($("status")) {
      $("status").hidden = false;
      $("status").textContent = msg;
    }
  }

  $("saveBtn").addEventListener("click", () => noteSaved());
  $("toTitle").addEventListener("click", () => {
    save();
    show("title");
  });
  $("mash").addEventListener("click", (e) => {
    e.preventDefault();
    qtePress();
  });
  $("coverBtn").addEventListener("click", () => {
    if (state && state.phase === "combat") present(L.dispatch(state, { type: "cover" }));
  });
  $("reloadBtn").addEventListener("click", () => beginReload());
  document.querySelectorAll("#grid button").forEach((b) => {
    b.addEventListener("click", () => {
      if (!state || state.phase !== "combat" || shown) return;
      present(L.dispatch(state, { type: "shot", cell: Number(b.dataset.cell) }));
    });
  });
  $("combine").addEventListener("click", () => {
    if (selectedClues.length < 2) return;
    const pair = selectedClues.slice();
    selectedClues = [];
    present(L.dispatch(state, { type: "combine", a: pair[0], b: pair[1] }));
  });
  $("closeBook").addEventListener("click", () => {
    selectedClues = [];
    present(L.dispatch(state, { type: "notebook", close: true }));
  });
  $("retry").addEventListener("click", () => {
    reloadToken++;
    queue = [];
    shown = null;
    waveArmed = false;
    present(L.dispatch(state, { type: "retry" }));
  });
  $("overTitle").addEventListener("click", () => show("title"));
  $("endingTitle").addEventListener("click", () => show("title"));
  $("talk").addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    advance();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!state || state.phase === "combat") {
      hover = null;
      return;
    }
    const p = pointer(e);
    hover = L.hitTest(state, p.x, p.y);
    renderSentence();
  });
  canvas.addEventListener("mouseleave", () => {
    hover = null;
    if (state) renderSentence();
  });
  canvas.addEventListener("click", (e) => {
    if (!state) return;
    if (shown || queue.length) {
      advance();
      return;
    }
    if (state.phase !== "play" || state.talk) return;
    const p = pointer(e);
    const h = L.hitTest(state, p.x, p.y);
    present(L.dispatch(state, { type: "hotspot", id: h ? h.id : "bg" }));
  });
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (!state || state.phase !== "play") return;
    if (shown || queue.length) {
      advance();
      return;
    }
    if (state.talk) return;
    const p = pointer(e);
    const h = L.hitTest(state, p.x, p.y);
    L.dispatch(state, { type: "verb", verb: "look" });
    present(L.dispatch(state, { type: "hotspot", id: h ? h.id : "bg" }));
  });

  function qtePress() {
    if (!qteOn || !state || state.phase !== "qte") return;
    qteHits += 1;
    A.sfx("click");
    if (qteHits >= 7) {
      qteOn = false;
      present(L.dispatch(state, { type: "qte", ok: true }));
    } else paint();
  }

  function beginReload() {
    if (!state || state.phase !== "combat") return;
    const token = ++reloadToken;
    present(L.dispatch(state, { type: "reload" }));
    setTimeout(() => {
      if (token !== reloadToken || !state || state.phase !== "combat") return;
      present(L.dispatch(state, { type: "reload-done" }));
    }, 1200);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") e.preventDefault();
    if (screen === "intro" && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
      show("title");
      return;
    }
    if (screen !== "game" || !state) return;
    if (shown || queue.length) {
      if (e.key === " " || e.key === "Enter") advance();
      return;
    }
    if (e.key === "Escape") {
      if (state.phase === "notebook") present(L.dispatch(state, { type: "notebook", close: true }));
      return;
    }
    if (state.phase === "qte" && (e.code === "Space" || e.key === " ")) {
      if (!e.repeat) qtePress();
      return;
    }
    if (state.phase === "combat") {
      if (e.key === " " && !e.repeat) present(L.dispatch(state, { type: "cover" }));
      if ((e.key === "r" || e.key === "R") && !e.repeat) beginReload();
      const digit = e.code.startsWith("Numpad") ? e.code.slice(6) : e.key;
      if (/^[1-9]$/.test(digit) && !shown) present(L.dispatch(state, { type: "shot", cell: Number(digit) }));
      return;
    }
    if (e.key === "n" || e.key === "N") {
      if (!state.talk && state.phase === "play") present(L.dispatch(state, { type: "notebook" }));
      return;
    }
    if (e.key === "s" || e.key === "S") {
      noteSaved();
      return;
    }
    const verbDigit = e.code.startsWith("Numpad") ? e.code.slice(6) : e.key;
    if (/^[1-9]$/.test(verbDigit) && !state.talk && state.phase === "play" && !shown) {
      act({ type: "verb", verb: L.VERBS[Number(verbDigit) - 1][0] });
    }
  });

  window.addEventListener("resize", fit);
  fit();

  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    if (shown && shown.i < shown.text.length) {
      const before = shown.i;
      shown.i = Math.min(shown.text.length, shown.i + Math.max(1, Math.round(dt / 18)));
      $("line").textContent = shown.text.slice(0, shown.i);
      if (before < shown.text.length && shown.i >= shown.text.length) paintTalk();
    }
    if (qteOn && state && state.phase === "qte" && !shown && !queue.length) {
      qteLeft -= dt;
      $("qteFill").style.width = Math.max(0, (qteLeft / 2800) * 100) + "%";
      $("qteText").textContent = "셔터를 뜯는다. " + qteHits + " / 7";
      if (qteLeft <= 0) {
        qteOn = false;
        present(L.dispatch(state, { type: "qte", ok: false }));
      }
    }
    if (waveArmed && state && state.phase === "combat" && !shown && !queue.length) {
      waveLeft -= dt;
      $("timeFill").style.width = Math.max(0, (waveLeft / waveMax) * 100) + "%";
      if (waveLeft <= 0) {
        waveArmed = false;
        present(L.dispatch(state, { type: "timeout" }));
      }
    }
    if (state && screen === "game") R.draw(ctx, state, now / 1000, hover);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
