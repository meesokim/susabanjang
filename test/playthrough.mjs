import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const L = require("../js/logic.js");

function choose(state, label) {
  const list = L.choices(state);
  const hit = list.find((c) => c.label === label);
  assert.ok(hit, "missing choice: " + label + " in " + list.map((c) => c.label).join(" | "));
  return L.dispatch(state, { type: "choice", index: hit.index });
}

function verb(state, name) {
  return L.dispatch(state, { type: "verb", verb: name }).state;
}

function hot(state, id) {
  return L.dispatch(state, { type: "hotspot", id });
}

function item(state, id) {
  return L.dispatch(state, { type: "item", id });
}

function team(state, id) {
  return L.dispatch(state, { type: "team", id });
}

function fuzz(state) {
  const base = structuredClone(state);
  base.talk = null;
  base.phase = "play";
  for (const [name] of L.VERBS) {
    const stepped = verb(structuredClone(base), name);
    for (const h of L.hotspots(stepped)) {
      L.dispatch(structuredClone(stepped), { type: "hotspot", id: h.id });
    }
    for (const id of stepped.inv) L.dispatch(structuredClone(stepped), { type: "item", id });
    for (const id of Object.keys(L.TEAM)) L.dispatch(structuredClone(stepped), { type: "team", id });
  }
}

let r = { state: L.newGame() };
fuzz(r.state);

r.state = verb(r.state, "talk");
r = hot(r.state, "sangsoon");
assert.ok(r.lines.some((l) => l.text.includes("군용") || l.text.includes("어깨")));
r = choose(r.state, "알겠다.");
assert.equal(r.state.talk, null);

r.state = verb(r.state, "open");
r = hot(r.state, "door");
assert.equal(r.state.room, "street");
fuzz(r.state);

r.state = verb(r.state, "look");
r = hot(r.state, "shutter");
r.state = verb(r.state, "pull");
r = hot(r.state, "shutter");
assert.equal(r.state.flags.sawInside, true);
assert.equal(r.state.flags.knowLee, true);

r.state = verb(r.state, "pick");
r = hot(r.state, "shell");
assert.ok(L.has(r.state, "shell"));
assert.equal(r.state.flags.shellPicked, true);

r.state = verb(r.state, "use");
r = team(r.state, "hojeong");
assert.equal(r.state.held, "hojeong");
r = item(r.state, "shell");
assert.equal(r.state.flags.shellAnalyzed, true);

r.state = verb(r.state, "open");
r = hot(r.state, "trunk");
assert.equal(r.state.flags.crateSeen, true);
r.state = verb(r.state, "open");
r = hot(r.state, "buickDoor");
r.state = verb(r.state, "pick");
r = hot(r.state, "glove");
assert.ok(L.has(r.state, "match"));

r.state = verb(r.state, "talk");
r = hot(r.state, "officer");
assert.equal(r.state.flags.officerTalked, true);
r = choose(r.state, "알겠다.");

r.state = verb(r.state, "pick");
r = hot(r.state, "megaphone");
assert.ok(L.has(r.state, "megaphone"));

// Raid is refused before the clerk is out and the handwriting is proved.
r.state = verb(r.state, "use");
r = team(r.state, "kyunghwan");
r = hot(r.state, "shutter");
assert.notEqual(r.state.phase, "qte");
assert.ok(r.lines.length > 0);

r.state = verb(r.state, "use");
r = item(r.state, "megaphone");
r = hot(r.state, "shutter");
assert.equal(r.state.talk.tree, "nego");
r = choose(r.state, "땀 흘리는 양복부터 내보내라.");
assert.equal(r.state.flags.clerkOut, true);
assert.equal(r.state.talk, null);
fuzz(r.state);

r.state = verb(r.state, "talk");
r = hot(r.state, "manager");
r = choose(r.state, "이 대리의 자필을 주시오.");
assert.ok(L.has(r.state, "memo"));
assert.equal(r.state.flags.memoGot, true);

r.state = verb(r.state, "pull");
r = hot(r.state, "clerk");
assert.ok(L.has(r.state, "mag"));
assert.equal(r.state.flags.magGot, true);

r = L.dispatch(r.state, { type: "notebook" });
assert.equal(r.state.phase, "notebook");
r = L.dispatch(r.state, { type: "combine", a: "shell", b: "memo" });
assert.notEqual(r.state.flags.insider, true);
r = L.dispatch(r.state, { type: "combine", a: "memo", b: "mag" });
assert.equal(r.state.flags.insider, true);
assert.equal(r.state.phase, "play");

r.state = verb(r.state, "use");
r = team(r.state, "kyunghwan");
r = hot(r.state, "shutter");
assert.equal(r.state.phase, "qte");
r = L.dispatch(r.state, { type: "qte", ok: false });
assert.equal(r.state.phase, "play");
r.state = verb(r.state, "talk");
r = team(r.state, "kyunghwan");
r = choose(r.state, "셔터를 맡긴다.");
assert.equal(r.state.phase, "qte");
r = L.dispatch(r.state, { type: "qte", ok: true });
assert.equal(r.state.phase, "combat");
assert.equal(r.state.room, "bank");
assert.equal(r.state.ammo, 6);

// Wrong cell wastes a round. Boss cells are not live yet.
r = L.dispatch(r.state, { type: "shot", cell: 5 });
assert.equal(r.state.ammo, 5);
assert.equal(r.state.phase, "combat");
r = L.dispatch(r.state, { type: "shot", cell: 1 });
r = L.dispatch(r.state, { type: "shot", cell: 3 });
assert.equal(r.state.combatStep, 1);
assert.equal(r.state.phase, "combat");

// Hostage and kill are failures with a retry that still reaches the wrist.
const doomed = L.dispatch(structuredClone(r.state), { type: "shot", cell: 5 });
assert.equal(doomed.state.gameover, "hostage");
const killed = L.dispatch(structuredClone(r.state), { type: "shot", cell: 7 });
assert.equal(killed.state.gameover, "kill");
const again = L.dispatch(doomed.state, { type: "retry" });
assert.equal(again.state.phase, "combat");
assert.equal(again.state.combatStep, 0);

r = L.dispatch(r.state, { type: "shot", cell: 4 });
assert.equal(r.state.gameover, "kill");
r = L.dispatch(r.state, { type: "retry" });
r = L.dispatch(r.state, { type: "shot", cell: 1 });
r = L.dispatch(r.state, { type: "shot", cell: 3 });
r = L.dispatch(r.state, { type: "cover" });
assert.equal(r.state.covering, true);
r = L.dispatch(r.state, { type: "timeout" });
assert.equal(r.state.hp, 2);
assert.equal(r.state.cover, 0);
r = L.dispatch(r.state, { type: "shot", cell: 8 });
assert.equal(r.state.phase, "combat");
r = L.dispatch(r.state, { type: "shot", cell: 6 });
assert.equal(r.state.phase, "play");
assert.equal(r.state.flags.arrested, true);
assert.equal(r.state.room, "bank");
fuzz(r.state);

r.state = verb(r.state, "open");
r = hot(r.state, "coat");
assert.ok(L.has(r.state, "receipt"));
assert.ok(r.lines.some((l) => l.text.includes("금호상회")));

r.state = verb(r.state, "give");
r = item(r.state, "receipt");
r = team(r.state, "hojeong");
assert.equal(r.state.flags.briefed, true);
assert.equal(r.state.talk.tree, "hojeong");
r = choose(r.state, "조서를 마친다.");
assert.equal(r.state.phase, "ending");
assert.equal(r.state.ending, "clear");

// Fresh game can also be finished by the talk-menu path, and a timeout can down the player.
let s = L.newGame();
s = verb(s, "open");
s = hot(s, "door").state;
s = verb(s, "pick");
s = hot(s, "megaphone").state;
s = verb(s, "use");
s = item(s, "megaphone").state;
s = hot(s, "shutter").state;
s = choose(s, "인질은 무사하냐.").state;
s = choose(s, "쓰러지는 남자부터 내보내라.").state;
assert.equal(s.flags.clerkOut, true);
s = verb(s, "talk");
s = hot(s, "manager").state;
s = choose(s, "상황을 말해 보시오.").state;
assert.equal(s.flags.knowLee, true);
s = choose(s, "자필 전표를 주시오.").state;
assert.equal(s.flags.memoGot, true);
s = verb(s, "talk");
s = hot(s, "clerk").state;
s = choose(s, "김상순에게 맡긴다.").state;
assert.equal(s.flags.magGot, true);
s = verb(s, "talk");
s = team(s, "hojeong").state;
s = choose(s, "필적을 맞춰 주게.").state;
assert.equal(s.flags.insider, true);
s = verb(s, "talk");
s = team(s, "kyunghwan").state;
s = choose(s, "셔터를 맡긴다.").state;
s = L.dispatch(s, { type: "qte", ok: true }).state;
s = L.dispatch(s, { type: "timeout" }).state;
assert.equal(s.hp, 1);
s = L.dispatch(s, { type: "timeout" }).state;
assert.equal(s.gameover, "down");
s = L.dispatch(s, { type: "retry" }).state;
s = L.dispatch(s, { type: "shot", cell: 1 }).state;
s = L.dispatch(s, { type: "shot", cell: 3 }).state;
s = L.dispatch(s, { type: "shot", cell: 6 }).state;
assert.equal(s.flags.arrested, true);
s = verb(s, "look");
assert.ok(hot(s, "vault").lines[0].text.includes("금고") || hot(s, "vault").lines[0].text.includes("비상"));
s = verb(s, "talk");
assert.ok(hot(s, "woman").lines.length > 0);

const gif = fs.readFileSync(new URL("../assets/intro.gif", import.meta.url));
assert.equal(gif.slice(0, 6).toString(), "GIF89a");
for (const name of ["intro", "rain", "tense", "end"]) {
  const mid = fs.readFileSync(new URL(`../assets/theme-${name}.mid`, import.meta.url));
  assert.equal(mid.slice(0, 4).toString(), "MThd");
}

console.log("playthrough ok");
