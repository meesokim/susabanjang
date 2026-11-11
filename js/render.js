/* 320×180 scenes. Pixel colors only, scaled up by CSS. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SusaRender = api;
})(typeof self !== "undefined" ? self : this, function () {
  const C = {
    ink: "#100e12",
    sky: "#161c28",
    sky2: "#243044",
    mist: "#3a4c60",
    road: "#1a1e24",
    wet: "#3e5264",
    neon: "#c43834",
    amber: "#e8a848",
    gold: "#d4b878",
    cream: "#f0e6d2",
    coat: "#6e5438",
    coatd: "#3a2c1e",
    skin: "#e0b090",
    skin2: "#c49070",
    pale: "#f2d2b8",
    hair: "#1a1410",
    stone: "#8a8478",
    stone2: "#5c5850",
    shut: "#3a424c",
    shut2: "#6a7480",
    glass: "#8eb4c8",
    buick: "#141820",
    chrome: "#c5d0d8",
    blood: "#8c2430",
    shirt: "#d9d3c6",
    tie: "#7a1e22",
    wool: "#243044",
    green: "#1e3a34",
    wood: "#5a3e28",
  };

  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function outline(ctx, x, y, w, h) {
    R(ctx, x, y, w, 1, C.amber);
    R(ctx, x, y + h - 1, w, 1, C.amber);
    R(ctx, x, y, 1, h, C.amber);
    R(ctx, x + w - 1, y, 1, h, C.amber);
  }

  function rain(ctx, t, n, x0, y0, w, h) {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i * 53 + Math.floor(t * 22)) % w);
      const y = y0 + ((i * 37 + Math.floor(t * 48)) % h);
      R(ctx, x, y, 1, 4, i % 4 === 0 ? "#d0e4f0" : "#7090a4");
    }
  }

  function face(ctx, kind, x, y, talk) {
    const skin = kind === "lee" ? C.pale : kind === "obal" ? "#2a2428" : C.skin;
    R(ctx, x + 8, y + 4, 16, 16, skin);
    R(ctx, x + 8, y + 2, 16, 4, C.hair);
    if (kind === "park") {
      R(ctx, x + 6, y + 2, 20, 5, "#3a342e");
      R(ctx, x + 10, y + 10, 3, 2, C.ink);
      R(ctx, x + 18, y + 10, 3, 2, C.ink);
      R(ctx, x + 12, y + 16, 8, 1, "#a06050");
      if (talk) R(ctx, x + 14, y + 17, 4, 2, "#6a3030");
      R(ctx, x + 20, y + 18, 6, 1, C.cream);
      R(ctx, x + 26, y + 16, 2, 2, C.amber);
    } else if (kind === "sangsoon") {
      R(ctx, x + 7, y + 1, 18, 6, C.ink);
      R(ctx, x + 10, y + 10, 4, 1,5, C.ink);
      R(ctx, x + 18, y + 10, 4, 2, C.ink);
      R(ctx, x + 22, y + 8, 1, 8, C.blood);
      R(ctx, x + 13, y + 17, 6, talk ? 2 : 1, "#6a3030");
    } else if (kind === "kyunghwan") {
      R(ctx, x + 6, y + 2, 22, 6, "#2a241c");
      R(ctx, x + 6, y + 6, 22, 16, C.skin);
      R(ctx, x + 9, y + 12, 4, 2, C.ink);
      R(ctx, x + 18, y + 12, 4, 2, C.ink);
      R(ctx, x + 12, y + 18, 8, talk ? 3 : 1, "#6a3030");
      R(ctx, x + 4, y + 14, 4, 10, C.skin2);
      R(ctx, x + 24, y + 14, 4, 10, C.skin2);
    } else if (kind === "hojeong") {
      R(ctx, x + 8, y + 2, 16, 5, "#241c14");
      R(ctx, x + 8, y + 9, 16, 6, "#d8ecf4");
      R(ctx, x + 15, y + 9, 1, 6, "#406070");
      R(ctx, x + 10, y + 11, 3, 2, C.ink);
      R(ctx, x + 19, y + 11, 3, 2, C.ink);
      R(ctx, x + 14, y + 17, 5, talk ? 2 : 1, "#6a3030");
    } else if (kind === "obal") {
      R(ctx, x + 7, y + 3, 18, 18, "#1c181c");
      R(ctx, x + 10, y + 10, 4, 3, "#f0e6d2");
      R(ctx, x + 18, y + 10, 4, 3, "#f0e6d2");
      R(ctx, x + 11, y + 11, 2, 2, C.ink);
      R(ctx, x + 19, y + 11, 2, 2, C.ink);
    } else if (kind === "manager") {
      R(ctx, x + 8, y + 3, 16, 6, C.skin);
      R(ctx, x + 10, y + 10, 3, 2, C.ink);
      R(ctx, x + 18, y + 10, 3, 2, C.ink);
      R(ctx, x + 22, y + 6, 2, 3, "#9ec8e8");
      R(ctx, x + 13, y + 17, 6, talk ? 2 : 1, "#6a3030");
    } else if (kind === "lee") {
      R(ctx, x + 8, y + 2, 16, 5, "#241810");
      R(ctx, x + 10, y + 10, 3, 2, C.ink);
      R(ctx, x + 18, y + 10, 3, 2, C.ink);
      R(ctx, x + 14, y + 8, 2, 2, "#9ec8e8");
      R(ctx, x + 13, y + 17, 6, talk ? 2 : 1, "#805050");
    } else if (kind === "officer") {
      R(ctx, x + 6, y + 2, 20, 5, "#1e3a5c");
      R(ctx, x + 4, y + 6, 24, 3, "#c8a040");
      R(ctx, x + 10, y + 12, 3, 2, C.ink);
      R(ctx, x + 18, y + 12, 3, 2, C.ink);
      R(ctx, x + 20, y + 16, 4, 3, C.blood);
    } else if (kind === "woman") {
      R(ctx, x + 6, y + 2, 20, 10, "#2a1814");
      R(ctx, x + 10, y + 8, 12, 12, C.skin);
      R(ctx, x + 11, y + 12, 3, 2, C.ink);
      R(ctx, x + 18, y + 12, 3, 2, C.ink);
      R(ctx, x + 14, y + 17, 4, talk ? 2 : 1, "#a05058");
    } else {
      R(ctx, x + 8, y + 6, 16, 16, "#c8a040");
      R(ctx, x + 12, y + 8, 8, 10, "#1e3a5c");
      R(ctx, x + 14, y + 18, 4, 3, C.cream);
    }
    R(ctx, x + 8, y + 20, 16, 10, kind === "kyunghwan" ? "#4a4038" : kind === "hojeong" ? "#3a4550" : kind === "woman" ? "#6a3040" : C.coat);
  }

  function portrait(ctx, who, talking) {
    ctx.clearRect(0, 0, 64, 64);
    R(ctx, 0, 0, 64, 64, "#1a140e");
    const map = { park: "park", sangsoon: "sangsoon", kyunghwan: "kyunghwan", hojeong: "hojeong", obal: "obal", manager: "manager", lee: "lee", officer: "officer", woman: "woman", narr: "narr" };
    face(ctx, map[who] || "narr", 16, 10, talking);
  }

  function body(ctx, x, y, w, h, coat, skin) {
    R(ctx, x + w * 0.3, y, w * 0.4, h * 0.18, skin || C.skin);
    R(ctx, x + w * 0.25, y - 2, w * 0.5, 4, C.hair);
    R(ctx, x, y + h * 0.16, w, h * 0.84, coat);
  }

  function drawCar(ctx, state, t, hover) {
    R(ctx, 0, 0, 320, 180, "#0e1014");
    R(ctx, 70, 8, 170, 78, C.sky);
    R(ctx, 78, 16, 150, 62, "#121820");
    R(ctx, 90, 28, 40, 28, C.stone2);
    R(ctx, 150, 24, 36, 22, C.shut);
    for (let i = 0; i < 5; i++) R(ctx, 152, 26 + i * 4, 32, 1, "#20262e");
    R(ctx, 40, 40, 24, 10, (Math.floor(t * 2) % 2) ? C.neon : "#4a1818");
    rain(ctx, t, 28, 78, 16, 150, 60);
    const ang = Math.sin(t * 1.6);
    R(ctx, 100, 40 + ang * 10, 70, 2, "#d0d8e0");
    R(ctx, 0, 88, 320, 92, "#1a1614");
    R(ctx, 0, 150, 320, 30, "#100e0c");
    R(ctx, 120, 128, 80, 22, "#2a241c");
    R(ctx, 150, 132, 20, 10, C.amber);
    body(ctx, 18, 70, 70, 78, C.coatd, C.skin);
    R(ctx, 30, 78, 18, 8, "#2a241c");
    body(ctx, 206, 78, 58, 70, "#3a4550", C.skin);
    R(ctx, 220, 86, 22, 6, "#d8ecf4");
    body(ctx, 258, 58, 54, 96, "#4a4038", C.skin2);
    R(ctx, 8, 148, 70, 28, "#2a2218");
    R(ctx, 14, 156, 28, 12, C.chrome);
    if (hover) outline(ctx, hover.x, hover.y, hover.w, hover.h);
  }

  function drawStreet(ctx, state, t, hover) {
    const f = state.flags;
    R(ctx, 0, 0, 320, 70, C.sky);
    R(ctx, 0, 50, 320, 30, C.sky2);
    R(ctx, 0, 100, 320, 80, C.road);
    for (let x = 0; x < 320; x += 8) R(ctx, x, 158, 4, 1, C.wet);
    R(ctx, 0, 36, 90, 78, "#2a2826");
    R(ctx, 10, 46, 16, 22, "#141820");
    R(ctx, 34, 50, 14, 18, "#141820");
    R(ctx, 16, 78, 40, 10, (Math.floor(t * 2) % 2) ? C.neon : "#5a2020");
    ctx.fillStyle = C.cream;
    ctx.font = "8px SusaGothic, sans-serif";
    ctx.fillText("명동", 22, 86);
    R(ctx, 200, 16, 120, 120, C.stone);
    R(ctx, 206, 20, 108, 16, "#2a221c");
    ctx.fillStyle = C.gold;
    ctx.font = "11px SusaGothic, sans-serif";
    ctx.fillText("한일은행", 214, 33);
    R(ctx, 214, 42, 96, 100, C.shut);
    for (let y = 46; y < 136; y += 6) R(ctx, 216, y, 92, 2, "#242a32");
    R(ctx, 224, 124, 76, 10, "#c08040");
    R(ctx, 236, 124, 8, 10, C.ink);
    R(ctx, 262, 124, 8, 10, C.ink);
    R(ctx, 8, 108, 118, 28, C.buick);
    R(ctx, 28, 98, 62, 16, "#1c222c");
    R(ctx, 36, 100, 18, 10, C.glass);
    R(ctx, 60, 100, 18, 10, C.glass);
    R(ctx, 12, 122, 10, 8, C.chrome);
    R(ctx, 100, 118, 12, 10, (Math.floor(t * 3) % 2) ? C.amber : "#6a3a18");
    R(ctx, 18, 128, 22, 8, "#0e1014");
    R(ctx, 78, 128, 22, 8, "#0e1014");
    if (state.trunkOpen) {
      R(ctx, 10, 112, 30, 32, "#0c0e12");
      R(ctx, 14, 118, 22, 22, C.wood);
      R(ctx, 16, 126, 18, 2, "#d0d4d8");
    }
    if (state.buickOpen) {
      R(ctx, 86, 112, 34, 34, "#0c0e12");
      R(ctx, 96, 122, 16, 10, "#2a241c");
    }
    body(ctx, 136, 112, 32, 48, C.shirt, C.skin);
    R(ctx, 142, 108, 16, 6, C.skin);
    R(ctx, 140, 148, 12, 8, C.gold);
    if (!f.megaPicked) {
      R(ctx, 128, 154, 16, 8, "#c8a040");
      R(ctx, 132, 150, 6, 6, "#2a241c");
    }
    R(ctx, 176, 136, 46, 10, C.wool);
    R(ctx, 178, 128, 14, 12, C.skin);
    R(ctx, 176, 126, 16, 5, "#1e3a5c");
    R(ctx, 196, 140, 10, 6, C.blood);
    if (!f.shellPicked) R(ctx, 220, 154, 10, 5, C.gold);
    if (f.clerkOut) {
      body(ctx, 196, 108, 28, 52, "#d8d4cc", C.pale);
      R(ctx, 206, 118, 8, 6, "#6a2428");
    }
    R(ctx, 150, 160, 40, 2, "#c8a040");
    R(ctx, 8, 168, 16, 8, C.coat);
    rain(ctx, t, 50, 0, 0, 320, 180);
    if ((Math.floor(t * 2) % 2) === 0) R(ctx, 24, 164, 18, 2, "#802028");
    if (hover) outline(ctx, hover.x, hover.y, hover.w, hover.h);
  }

  function cellBox(n) {
    const col = (n - 1) % 3;
    const row = 2 - Math.floor((n - 1) / 3);
    return { x: col * (320 / 3), y: row * (180 / 3), w: 320 / 3, h: 180 / 3 };
  }

  function drawBank(ctx, state, t, hover) {
    R(ctx, 0, 0, 320, 180, "#2a241c");
    R(ctx, 0, 120, 320, 60, "#4a4034");
    for (let x = 0; x < 320; x += 16) R(ctx, x, 120, 1, 60, "#3a3228");
    R(ctx, 0, 20, 18, 120, "#c08040");
    R(ctx, 180, 40, 130, 36, C.wood);
    R(ctx, 228, 36, 76, 88, "#1a1814");
    R(ctx, 248, 56, 36, 36, "#6a6048");
    R(ctx, 258, 66, 16, 16, "#2a241c");
    R(ctx, 176, 112, 40, 28, C.shirt);
    R(ctx, 188, 108, 16, 10, C.skin);
    body(ctx, 140, 82, 32, 68, "#6a3040", C.skin);
    R(ctx, 36, 100, 70, 40, C.coatd);
    R(ctx, 48, 92, 18, 14, "#1c181c");
    R(ctx, 52, 96, 4, 3, C.cream);
    R(ctx, 62, 96, 4, 3, C.cream);
    R(ctx, 78, 118, 22, 8, C.skin);
    R(ctx, 92, 116, 8, 6, C.blood);
    if (state.flags.coatOpen) R(ctx, 50, 114, 16, 10, C.cream);
    R(ctx, 16, 146, 36, 6, C.wood);
    R(ctx, 18, 142, 28, 4, "#3a3a3a");
    if (state.phase === "combat") drawFight(ctx, state, t);
    rain(ctx, t, 12, 0, 20, 20, 100);
    if (hover && state.phase !== "combat") outline(ctx, hover.x, hover.y, hover.w, hover.h);
  }

  function drawFight(ctx, state, t) {
    const step = state.combatStep || 0;
    ctx.globalAlpha = 0.28 + Math.sin(t * 6) * 0.08;
    Object.keys(state.targets || {}).forEach((k) => {
      const b = cellBox(Number(k));
      R(ctx, b.x, b.y, b.w, b.h, "#c43028");
    });
    ctx.globalAlpha = 1;
    if (step === 0) {
      [1, 3].forEach((n) => {
        if (!state.targets[n]) return;
        const b = cellBox(n);
        body(ctx, b.x + 28, b.y + 10, 36, 46, "#1c181c", C.skin);
        R(ctx, b.x + 36, b.y + 8, 20, 8, "#111");
        R(ctx, b.x + 18, b.y + 28, 22, 4, C.wood);
      });
    } else {
      const woman = cellBox(5);
      const wrist = cellBox(6);
      const head = cellBox(7);
      const chest = cellBox(4);
      body(ctx, woman.x + 30, woman.y + 8, 34, 50, "#6a3040", C.skin);
      R(ctx, chest.x + 40, chest.y + 16, 40, 36, C.coatd);
      R(ctx, head.x + 36, head.y + 16, 22, 18, "#1c181c");
      R(ctx, head.x + 40, head.y + 22, 5, 4, C.cream);
      R(ctx, wrist.x + 16, wrist.y + 20, 46, 10, C.coat);
      R(ctx, wrist.x + 48, wrist.y + 16, 16, 12, C.skin);
      R(ctx, wrist.x + 62, wrist.y + 18, 14, 6, "#2a2a2a");
      R(ctx, wrist.x + 74, wrist.y + 16, 4, 4, C.amber);
    }
    R(ctx, 0, 0, 320, 180, "rgba(0,0,0,0)");
    ctx.strokeStyle = "rgba(255,220,180,0.35)";
    ctx.beginPath();
    ctx.moveTo(320 / 3, 0);
    ctx.lineTo(320 / 3, 180);
    ctx.moveTo((320 / 3) * 2, 0);
    ctx.lineTo((320 / 3) * 2, 180);
    ctx.moveTo(0, 60);
    ctx.lineTo(320, 60);
    ctx.moveTo(0, 120);
    ctx.lineTo(320, 120);
    ctx.stroke();
  }

  function draw(ctx, state, t, hover) {
    if (!state) return;
    if (state.room === "car" && state.phase !== "combat") drawCar(ctx, state, t, hover);
    else if (state.room === "bank" || state.phase === "combat") drawBank(ctx, state, t, hover);
    else drawStreet(ctx, state, t, hover);
  }

  return { draw, portrait, C };
});
