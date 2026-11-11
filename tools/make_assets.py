#!/usr/bin/env python3
"""Original title GIF and original MIDI cues for 수사반장 제1화.

The television opening is not sampled, traced, or transcribed.
These assets are new pictures and a new tune in a 1970s noir register.
"""

import base64
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "assets"
JS = ROOT / "js"
FONT = "/usr/share/fonts/truetype/nanum/NanumMyeongjoBold.ttf"
FONT_G = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"

S = 3
VW, VH = 320, 180
W, H = VW * S, VH * S

INK = (14, 12, 16)
SKY = (18, 24, 36)
SKY2 = (32, 44, 62)
ASPH = (22, 26, 32)
WET = (48, 62, 78)
NEON = (196, 52, 48)
AMBER = (232, 168, 72)
GOLD = (214, 184, 122)
CREAM = (240, 232, 214)
COAT = (86, 64, 42)
COATD = (42, 30, 22)
SKIN = (224, 176, 140)
HAIR = (20, 16, 14)
STONE = (122, 116, 104)
SHUT = (48, 54, 64)
CHROME = (186, 196, 206)
RED = (150, 36, 40)


def rect(d, x, y, w, h, c):
    d.rectangle([x * S, y * S, (x + w) * S - 1, (y + h) * S - 1], fill=c)


def pix(d, x, y, c):
    rect(d, x, y, 1, 1, c)


def frame_image(i, n):
    rng = random.Random(1972)
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)

    for y, c in ((0, SKY), (18, SKY), (40, SKY2), (70, (24, 28, 36))):
        rect(d, 0, y, 320, 18 if y else 40, c)
    rect(d, 0, 108, 320, 72, ASPH)
    for x in range(0, 320, 8):
        rect(d, x, 150, 4, 1, WET)

    # Shops and the bank mass.
    rect(d, 0, 28, 78, 90, (28, 26, 32))
    rect(d, 8, 36, 18, 28, (16, 18, 24))
    rect(d, 32, 40, 14, 22, (20, 24, 32))
    rect(d, 188, 22, 132, 110, (62, 58, 52))
    rect(d, 196, 30, 116, 12, (28, 24, 22))
    rect(d, 204, 48, 100, 62, SHUT)
    for sy in range(50, 106, 6):
        rect(d, 206, sy, 96, 2, (28, 32, 38))
    # Gap of light under the shutter.
    rect(d, 214, 100, 78, 8, (120, 72, 36))
    rect(d, 230, 100, 10, 8, INK)
    rect(d, 258, 100, 8, 8, INK)

    # Neon.
    blink = (i // 8) % 2 == 0
    rect(d, 14, 48, 48, 16, (40, 16, 18) if blink else (24, 12, 12))
    if blink:
        rect(d, 18, 52, 40, 8, NEON)

    # Wet reflection.
    if blink:
        rect(d, 18, 156, 30, 2, (90, 30, 32))

    # Buick, drives across the first half.
    car_x = -40 + int(70 * min(1, i / 28))
    rect(d, car_x, 112, 86, 28, (16, 18, 24))
    rect(d, car_x + 16, 104, 46, 16, (20, 22, 30))
    rect(d, car_x + 22, 106, 14, 10, (70, 90, 110))
    rect(d, car_x + 42, 106, 14, 10, (70, 90, 110))
    rect(d, car_x + 4, 122, 8, 8, CHROME)
    rect(d, car_x + 74, 122, 8, 8, AMBER if (i // 4) % 2 == 0 else (80, 50, 20))

    # Detectives enter after the car settles.
    if i > 24:
        walk = min(34, (i - 24) * 2)
        coats = (
            (150 - walk, 96, 18, 40, COATD),
            (168 - walk, 92, 22, 46, COAT),
            (192 - walk, 98, 16, 38, (54, 58, 64)),
            (208 - walk, 94, 18, 42, (36, 32, 40)),
        )
        for x, y, w, h, c in coats:
            rect(d, x, y, w, h, c)
            rect(d, x + 4, y - 6, 8, 8, SKIN)
            rect(d, x + 3, y - 8, 10, 4, HAIR)

    # Zippo flare.
    if 34 <= i <= 42:
        k = 1 if i % 2 == 0 else 0
        rect(d, 168 - min(34, (i - 24) * 2) + 8, 100, 3, 4, AMBER)
        rect(d, 160, 88, 6 + k, 4, (255, 220, 140))

    # Rain, stable seeds so it streaks instead of boiling.
    for n in range(70):
        rx = rng.randrange(0, 320)
        ry = rng.randrange(0, 180)
        yy = (ry + i * 9 + n) % 180
        rect(d, rx, yy, 1, 4, (150, 170, 190) if n % 3 == 0 else (70, 86, 104))

    # Title plate. Solid panel, so the palette does not posterize a translucent veil.
    if i >= 48:
        rect(d, 36, 28, 248, 124, (8, 6, 10))
        if i >= 52:
            font_b = ImageFont.truetype(FONT, 72)
            font_s = ImageFont.truetype(FONT, 28)
            font_k = ImageFont.truetype(FONT_G, 22)
            title = "수사반장"
            tw = d.textlength(title, font=font_b)
            d.text(((W - tw) / 2, 120), title, font=font_b, fill=CREAM)
            sub = "1970   THE COLD TRUTH"
            sw = d.textlength(sub, font=font_s)
            d.text(((W - sw) / 2, 220), sub, font=font_s, fill=AMBER)
            if i >= 60:
                ep = "제1화   빗줄기 속의 거수"
                ew = d.textlength(ep, font=font_s)
                d.text(((W - ew) / 2, 280), ep, font=font_s, fill=GOLD)
                place = "1972  명동  한일은행"
                pw = d.textlength(place, font=font_k)
                d.text(((W - pw) / 2, 340), place, font=font_k, fill=(210, 198, 170))
    return im


def write_gif():
    n = 80
    frames = [frame_image(i, n) for i in range(n)]
    sample = Image.new("RGB", (W, H * 2))
    sample.paste(frames[30], (0, 0))
    sample.paste(frames[70], (0, H))
    palette_img = sample.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = [fr.quantize(palette=palette_img, dither=Image.Dither.NONE) for fr in frames]
    if pal[0].size != (W, H):
        raise SystemExit(f"bad frame size {pal[0].size}")
    durations = [100] * n
    for k in range(70, 80):
        durations[k] = 180
    out = ASSET / "intro.gif"
    pal[0].save(
        out,
        save_all=True,
        append_images=pal[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )
    print("gif", out, out.stat().st_size)


def vlq(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


class Midi:
    def __init__(self, bpm, text):
        self.bpm = bpm
        self.div = 480
        self.events = []
        self.seq = 0
        self.text_ev(0, text)
        tempo = int(60_000_000 / bpm)
        self.add(0, bytes([0xFF, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255]))

    def add(self, tick, data):
        self.seq += 1
        self.events.append((tick, self.seq, data))

    def text_ev(self, tick, s):
        b = s.encode("ascii", "replace")
        self.add(tick, bytes([0xFF, 0x01, len(b)]) + b)

    def program(self, tick, ch, prog):
        self.add(tick, bytes([0xC0 | ch, prog & 127]))

    def note(self, tick, dur, ch, pitch, vel=80):
        pitch = max(0, min(127, pitch))
        self.add(tick, bytes([0x90 | ch, pitch, vel]))
        self.add(tick + dur, bytes([0x80 | ch, pitch, 0]))

    def dump(self):
        ev = sorted(self.events, key=lambda e: (e[0], e[1]))
        blob = b""
        last = 0
        for tick, _seq, data in ev:
            blob += vlq(tick - last) + data
            last = tick
        blob += vlq(0) + bytes([0xFF, 0x2F, 0x00])
        head = b"MThd" + (6).to_bytes(4, "big") + (0).to_bytes(2, "big") + (1).to_bytes(2, "big") + self.div.to_bytes(2, "big")
        track = b"MTrk" + len(blob).to_bytes(4, "big") + blob
        return head + track


def motif_intro():
    """Original Dm noir cue. Walking bass, sparse bongo, a line of my own."""
    m = Midi(84, "Original noir theme. Not the television theme.")
    q = 480
    m.program(0, 0, 61)  # brass
    m.program(0, 1, 33)  # finger bass
    m.program(0, 2, 56)  # trumpet
    # 8-bar bass: Dm, Dm, Bb, A, Dm, C, Bb, A
    bass = [38, 38, 34, 33, 38, 36, 34, 33]
    for bar, root in enumerate(bass):
        for beat, off in ((0, 0), (2, 7)):
            m.note(bar * q * 4 + beat * q, q * 2 - 20, 1, root + off, 70)
    # Melody, two-bar phrases. Contour is a long arch, not a four-stab fanfare.
    melody = [
        (0, 62, 2), (2, 65, 1), (3, 64, 1),
        (4, 62, 2), (6, 69, 2),
        (8, 67, 1), (9, 65, 1), (10, 64, 2),
        (12, 62, 4),
        (16, 65, 1), (17, 67, 1), (18, 69, 2),
        (20, 67, 1), (21, 65, 1), (22, 64, 1), (23, 62, 1),
        (24, 60, 2), (26, 62, 2),
        (28, 64, 4),
    ]
    for beat, pitch, dur in melody:
        m.note(int(beat * q), dur * q - 30, 2, pitch, 92)
    # Soft brass pads on bar downbeats, a fifth, not a repeated unison stab.
    for bar in range(8):
        root = bass[bar] + 24
        m.note(bar * q * 4, q * 3, 0, root, 46)
        m.note(bar * q * 4, q * 3, 0, root + 7, 40)
    # Bongo: beat 1 and the "and" of 3. Channel 9.
    for bar in range(8):
        base = bar * q * 4
        m.note(base, 80, 9, 60, 70)          # high bongo
        m.note(base + q * 2 + q // 2, 60, 9, 61, 54)  # low bongo
        m.note(base + q * 3, 40, 9, 42, 40)  # closed hat
    return m.dump()


def motif_rain():
    m = Midi(66, "Original rain underscore.")
    q = 480
    m.program(0, 1, 32)
    m.program(0, 2, 71)  # clarinet
    roots = [38, 34, 36, 33]
    for bar, root in enumerate(roots):
        m.note(bar * q * 4, q * 4 - 40, 1, root, 60)
        m.note(bar * q * 4 + q * 2, q, 2, root + 24, 36)
    line = [(0, 62, 4), (4, 65, 2), (6, 64, 2), (8, 60, 4), (12, 57, 4)]
    for beat, pitch, dur in line:
        m.note(beat * q, dur * q - 40, 2, pitch, 48)
    for bar in range(4):
        m.note(bar * q * 4 + q, 50, 9, 42, 28)
    return m.dump()


def motif_tense():
    m = Midi(126, "Original tension pulse.")
    q = 480
    m.program(0, 0, 61)
    m.program(0, 1, 34)
    for bar in range(4):
        for eighth in range(8):
            tick = bar * q * 4 + eighth * (q // 2)
            m.note(tick, q // 2 - 20, 1, 38 if eighth % 2 == 0 else 37, 78)
        # A minor second rub, short, on beat 1 of each bar. Not a fanfare.
        m.note(bar * q * 4, q // 3, 0, 62, 70)
        m.note(bar * q * 4, q // 3, 0, 63, 60)
        m.note(bar * q * 4, 40, 9, 36, 90)
    return m.dump()


def motif_end():
    m = Midi(72, "Original closing horn line.")
    q = 480
    m.program(0, 1, 33)
    m.program(0, 2, 56)
    for bar, root in enumerate([38, 34, 36, 33, 38, 41, 34, 38]):
        m.note(bar * q * 4, q * 4 - 30, 1, root, 64)
    line = [
        (0, 62, 3), (3, 65, 1), (4, 69, 4),
        (8, 67, 2), (10, 65, 2), (12, 64, 3), (15, 62, 1),
        (16, 65, 2), (18, 67, 2), (20, 69, 4),
        (24, 74, 2), (26, 72, 2), (28, 69, 4),
    ]
    for beat, pitch, dur in line:
        m.note(beat * q, dur * q - 40, 2, pitch, 88)
    return m.dump()


def main():
    ASSET.mkdir(parents=True, exist_ok=True)
    write_gif()
    songs = {
        "intro": motif_intro(),
        "rain": motif_rain(),
        "tense": motif_tense(),
        "end": motif_end(),
    }
    for name, data in songs.items():
        path = ASSET / f"theme-{name}.mid"
        path.write_bytes(data)
        print("mid", path, len(data))
    lines = ["window.SUSA_SONGS = {"]
    for name, data in songs.items():
        b64 = base64.b64encode(data).decode("ascii")
        lines.append(f'  {name}: "{b64}",')
    lines.append("};")
    (JS / "songs.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("songs.js")


if __name__ == "__main__":
    main()
