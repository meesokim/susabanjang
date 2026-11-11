/* MIDI playback and small synthesized effects. No samples from the television theme. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SusaAudio = api;
})(typeof self !== "undefined" ? self : this, function () {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let rainGain = null;
  let rainSrc = null;
  let current = null;
  let loopTimer = 0;
  let muted = false;

  function ensure() {
    if (ctx) return;
    const AC = typeof AudioContext !== "undefined" ? AudioContext : null;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    const n = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = n;
  }

  function unlock() {
    ensure();
    if (ctx && ctx.state !== "running") ctx.resume();
  }

  function readVar(bytes, i) {
    let v = 0;
    let guard = 0;
    while (i < bytes.length && bytes[i] & 0x80 && guard < 4) {
      v = (v << 7) | (bytes[i] & 127);
      i++;
      guard++;
    }
    v = (v << 7) | (bytes[i] & 127);
    return [v, i + 1];
  }

  function notesFrom(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (bytes.length < 14 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "MThd") return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const division = view.getUint16(12);
    let pos = 14;
    const notes = [];
    let tempo = 500000;
    while (pos + 8 <= bytes.length) {
      if (String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]) !== "MTrk") break;
      const len = view.getUint32(pos + 4);
      let i = pos + 8;
      const end = i + len;
      let tick = 0;
      let status = 0;
      const on = {};
      while (i < end) {
        let delta;
        [delta, i] = readVar(bytes, i);
        tick += delta;
        if (i >= end) break;
        let st = bytes[i];
        if (st < 0x80) st = status;
        else i++;
        status = st;
        const kind = st & 0xf0;
        const ch = st & 0x0f;
        if (st === 0xff) {
          const type = bytes[i++];
          let ln;
          [ln, i] = readVar(bytes, i);
          if (type === 0x51 && ln === 3) tempo = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
          i += ln;
          continue;
        }
        if (kind === 0xc0 || kind === 0xd0) {
          i += 1;
          continue;
        }
        if (kind === 0xf0) {
          let ln;
          [ln, i] = readVar(bytes, i);
          i += ln;
          continue;
        }
        const a = bytes[i++];
        const b = bytes[i++];
        const sec = (tick / division) * (tempo / 1000000);
        if (kind === 0x90 && b > 0) {
          on[ch + ":" + a] = { sec, vel: b };
        } else if (kind === 0x80 || (kind === 0x90 && b === 0)) {
          const key = ch + ":" + a;
          const start = on[key];
          if (start) {
            notes.push({ time: start.sec, dur: Math.max(0.05, sec - start.sec), ch, pitch: a, vel: start.vel });
            delete on[key];
          }
        }
      }
      pos = end;
    }
    return notes;
  }

  function env(at, dur, peak) {
    const g = ctx.createGain();
    const stop = at + Math.max(0.06, dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, stop);
    g.connect(master);
    return { g, stop };
  }

  function tone(at, dur, freq, type, peak) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    const e = env(at, dur, peak);
    o.connect(e.g);
    o.start(at);
    o.stop(e.stop + 0.02);
  }

  function noiseHit(at, dur, peak, freq) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const e = env(at, dur, peak);
    src.connect(filter);
    filter.connect(e.g);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  function midiFreq(p) {
    return 440 * Math.pow(2, (p - 69) / 12);
  }

  function playNotes(notes, loop) {
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.06;
    let end = 0.4;
    notes.forEach((n) => {
      end = Math.max(end, n.time + n.dur);
      const at = t0 + n.time;
      const peak = (n.vel / 127) * (n.ch === 9 ? 0.35 : n.ch === 1 ? 0.28 : 0.2);
      if (n.ch === 9) {
        if (n.pitch <= 40) tone(at, 0.08, 70, "sine", peak);
        else if (n.pitch < 50) noiseHit(at, 0.04, peak * 0.5, 6000);
        else noiseHit(at, 0.09, peak, n.pitch > 60 ? 420 : 240);
        return;
      }
      const type = n.ch === 1 ? "triangle" : "sawtooth";
      tone(at, Math.min(1.6, n.dur), midiFreq(n.pitch), type, peak);
      if (n.ch === 2) tone(at, Math.min(1.4, n.dur), midiFreq(n.pitch) * 1.005, "square", peak * 0.15);
    });
    if (loop) {
      loopTimer = setTimeout(() => {
        if (current) playNotes(notes, true);
      }, Math.max(200, end * 1000 - 80));
    }
  }

  function stop() {
    current = null;
    clearTimeout(loopTimer);
    if (!ctx || !master) return;
    const old = master;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
    old.gain.setValueAtTime(old.gain.value, ctx.currentTime);
    old.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch (e) {
        /* already gone */
      }
    }, 200);
  }

  function play(name, loop) {
    unlock();
    const songs = globalThis.SUSA_SONGS;
    if (!ctx || !songs || !songs[name]) return;
    stop();
    const bin = atob(songs[name]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const notes = notesFrom(bytes);
    current = name;
    playNotes(notes, !!loop);
  }

  function sfx(name) {
    if (!ctx || muted || !name) return;
    const t = ctx.currentTime + 0.01;
    if (name === "click") tone(t, 0.04, 660, "square", 0.08);
    else if (name === "talk") tone(t, 0.03, 520, "square", 0.04);
    else if (name === "pickup") {
      tone(t, 0.06, 520, "square", 0.08);
      tone(t + 0.07, 0.08, 780, "square", 0.08);
    } else if (name === "clue") {
      tone(t, 0.1, 523, "triangle", 0.1);
      tone(t + 0.09, 0.14, 659, "triangle", 0.1);
    } else if (name === "good") {
      [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.09, 0.18, f, "triangle", 0.1));
    } else if (name === "bad") {
      tone(t, 0.3, 196, "sawtooth", 0.12);
      tone(t + 0.12, 0.4, 130, "sawtooth", 0.12);
    } else if (name === "gun") {
      noiseHit(t, 0.12, 0.4, 900);
      tone(t, 0.1, 90, "sine", 0.3);
    } else if (name === "hurt") noiseHit(t, 0.18, 0.3, 300);
    else if (name === "reload") {
      noiseHit(t, 0.05, 0.2, 1400);
      noiseHit(t + 0.12, 0.06, 0.22, 900);
    } else if (name === "shutter") noiseHit(t, 0.35, 0.28, 500);
    else if (name === "zippo") {
      noiseHit(t, 0.08, 0.18, 1800);
      tone(t + 0.05, 0.12, 880, "sine", 0.05);
    }
  }

  function rain(on) {
    ensure();
    if (!ctx) return;
    if (on && !rainSrc) {
      rainSrc = ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      rainGain = ctx.createGain();
      rainGain.gain.value = muted ? 0 : 0.045;
      rainSrc.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(ctx.destination);
      rainSrc.start();
    } else if (!on && rainSrc) {
      try {
        rainSrc.stop();
      } catch (e) {
        /* already stopped */
      }
      rainSrc = null;
    }
  }

  function mute(flag) {
    muted = !!flag;
    if (master) master.gain.value = muted ? 0 : 0.22;
    if (rainGain) rainGain.gain.value = muted ? 0 : 0.045;
  }

  return {
    notesFrom,
    unlock,
    play,
    stop,
    sfx,
    rain,
    mute,
    track() {
      return current;
    },
  };
});
