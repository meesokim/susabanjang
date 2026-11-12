"""Cut character sheets and install room art for 수사반장."""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/home/msx/susabanjang")
ART = ROOT / "game" / "art"
SRC = Path("/home/msx/.grok/sessions/%2Fhome%2Fmsx%2Fherdr-approve-all/01a1cb8c-babf-7e01-bdd9-76f93db49e8c/images")
FONT = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
def key_magenta(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    bg = im.getpixel((2, 2))[:3]
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            dist = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            if dist < 100:
                pix[x, y] = (r, g, b, 0)
            elif dist < 150:
                pix[x, y] = (r, g, b, int(255 * (dist - 100) / 50))
    return im


def components(im: Image.Image, min_area: int = 800):
    im = key_magenta(im)
    w, h = im.size
    pix = im.load()
    seen = bytearray(w * h)

    def idx(x, y):
        return y * w + x

    boxes = []
    for y in range(h):
        for x in range(w):
            if seen[idx(x, y)]:
                continue
            if pix[x, y][3] < 16:
                seen[idx(x, y)] = 1
                continue
            stack = [(x, y)]
            seen[idx(x, y)] = 1
            minx = maxx = x
            miny = maxy = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                if cx < minx:
                    minx = cx
                if cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                if cy > maxy:
                    maxy = cy
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    if seen[idx(nx, ny)]:
                        continue
                    seen[idx(nx, ny)] = 1
                    if pix[nx, ny][3] >= 16:
                        stack.append((nx, ny))
            if count >= min_area:
                boxes.append((minx, miny, maxx + 1, maxy + 1, count))
    boxes.sort(key=lambda b: b[0])
    return im, boxes


def sheet(name: str, names: list[str]) -> None:
    im, boxes = components(Image.open(SRC / name))
    print(name, "components", len(boxes), [(b[0], b[2] - b[0], b[3] - b[1]) for b in boxes])
    if len(boxes) != len(names):
        raise SystemExit(f"{name}: expected {len(names)} figures, got {len(boxes)}")
    for (x0, y0, x1, y1, _), who in zip(boxes, names):
        crop = im.crop((x0, y0, x1, y1))
        write_sheet(who, crop)


def write_sheet(who: str, body: Image.Image) -> None:
    folder = ART / "cast" / who
    folder.mkdir(parents=True, exist_ok=True)
    # Full body, feet on the bottom edge, transparent margin.
    bw, bh = body.size
    side = max(bw, bh) + 8
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(body, ((side - bw) // 2, side - bh - 2), body)
    # Portrait is the head.
    head_h = max(1, int(bh * 0.42))
    head = body.crop((0, 0, bw, head_h))
    pw = max(head.size)
    portrait = Image.new("RGBA", (pw, pw), (0, 0, 0, 0))
    portrait.paste(head, ((pw - head.size[0]) // 2, (pw - head.size[1]) // 2), head)
    for row in range(1, 5):
        for col in range(1, 7):
            img = portrait if row == 1 else canvas
            img.save(folder / f"r{row}c{col}.png")
    print("sheet", who, canvas.size)


def backdrop(src: str, dest: str) -> None:
    im = Image.open(SRC / src).convert("RGB")
    im = im.resize((1280, 800), Image.Resampling.LANCZOS)
    out = ART / "decor" / dest
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out)
    print("decor", dest, im.size)


def icon(name: str, draw_fn) -> None:
    im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(im))
    folder = ART / "items"
    folder.mkdir(parents=True, exist_ok=True)
    im.save(folder / f"{name}.png")


def aim_card(name: str, title: str, mark) -> None:
    im = Image.new("RGB", (480, 300), (18, 22, 32))
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT, 28)
    d.text((24, 16), title, font=font, fill=(232, 220, 180))
    mark(d)
    folder = ART / "aim"
    folder.mkdir(parents=True, exist_ok=True)
    im.save(folder / f"{name}.png")


def write_aim_cards() -> None:
    def figure(d, x, y, coat, mask=False, hair=None):
        d.rectangle((x - 12, y - 8, x - 4, y + 8), fill=(28, 30, 36))
        d.rectangle((x + 4, y - 8, x + 12, y + 8), fill=(28, 30, 36))
        d.polygon([(x - 26, y - 10), (x - 16, y - 78), (x + 16, y - 78), (x + 26, y - 10)], fill=coat)
        d.ellipse((x - 18, y - 112, x + 18, y - 76), fill=(214, 176, 140))
        if hair:
            d.pieslice((x - 20, y - 118, x + 20, y - 86), 180, 360, fill=hair)
            d.rectangle((x - 20, y - 104, x - 12, y - 78), fill=hair)
            d.rectangle((x + 12, y - 104, x + 20, y - 78), fill=hair)
        if mask:
            d.rectangle((x - 18, y - 96, x + 18, y - 84), fill=(16, 16, 20))

    def rifle(d, x0, y0, x1):
        d.rectangle((x0, y0, x1, y0 + 8), fill=(92, 64, 36))
        d.rectangle((x0, y0 - 6, x0 + 28, y0 + 2), fill=(40, 40, 44))

    def mook(d):
        figure(d, 110, 230, (32, 36, 44), mask=True)
        figure(d, 370, 230, (32, 36, 44), mask=True)
        rifle(d, 130, 150, 230)
        rifle(d, 250, 158, 350)

    def hostage(d):
        figure(d, 240, 240, (186, 154, 96), hair=(92, 48, 36))
        d.line((214, 150, 190, 118), fill=(214, 176, 140), width=6)
        d.line((266, 150, 290, 118), fill=(214, 176, 140), width=6)

    def chest(d):
        figure(d, 240, 250, (48, 52, 64))
        d.ellipse((210, 186, 270, 246), outline=(200, 48, 48), width=7)

    def wrist(d):
        d.polygon([(40, 210), (300, 150), (318, 188), (70, 250)], fill=(214, 176, 140))
        d.ellipse((286, 132, 360, 206), fill=(214, 176, 140))
        d.rectangle((330, 118, 430, 142), fill=(28, 28, 32))
        d.rectangle((404, 142, 424, 176), fill=(28, 28, 32))
        d.ellipse((248, 156, 292, 200), outline=(90, 210, 120), width=7)

    aim_card("mook", "아래 양쪽, 공범", mook)
    aim_card("hostage", "한가운데, 여직원", hostage)
    aim_card("chest", "가슴", chest)
    aim_card("wrist", "오른손목", wrist)


def main() -> None:
    if os.environ.get("AIMS_ONLY") == "1":
        write_aim_cards()
        print("aim cards")
        return
    sheet("7.jpg", ["sangsoon", "kyunghwan", "hojeong", "manager", "officer", "lee"])
    sheet("6.jpg", ["obal", "woman", "park"])
    # 4.jpg still shows shop lettering. decor/car.png is the rain-only edit and is not regenerated here.
    backdrop("8.jpg", "street.png")
    backdrop("3.jpg", "bank.png")

    def shell(d):
        d.rounded_rectangle((70, 40, 92, 120), 8, fill=(196, 160, 70))
        d.ellipse((64, 28, 98, 52), fill=(220, 190, 110))

    def mega(d):
        d.rounded_rectangle((68, 96, 98, 150), 8, fill=(48, 36, 28))
        d.polygon([(28, 78), (108, 48), (108, 100), (28, 86)], fill=(72, 78, 86))
        d.polygon([(100, 30), (152, 12), (152, 136), (100, 112)], fill=(196, 154, 64))
        d.polygon([(118, 46), (144, 36), (144, 112), (118, 98)], fill=(28, 24, 20))

    def memo(d):
        d.rectangle((40, 28, 120, 132), fill=(232, 220, 180))
        d.line((52, 70, 108, 48), fill=(20, 20, 20), width=3)
        d.line((52, 90, 100, 90), fill=(20, 20, 20), width=2)

    def mag(d):
        d.rounded_rectangle((58, 30, 102, 130), 4, fill=(40, 44, 48))
        d.rectangle((66, 48, 94, 110), fill=(180, 160, 90))

    def receipt(d):
        d.polygon([(48, 24), (112, 36), (100, 136), (36, 120)], fill=(210, 200, 160))
        d.line((52, 60, 96, 68), fill=(80, 30, 30), width=2)

    def lighter(d):
        d.rounded_rectangle((62, 40, 98, 128), 6, fill=(180, 180, 190))
        d.rectangle((70, 28, 90, 48), fill=(120, 40, 40))

    def notebook(d):
        d.rectangle((40, 28, 120, 132), fill=(20, 22, 28))
        d.rectangle((48, 36, 112, 124), fill=(40, 48, 64))

    def match(d):
        d.rectangle((46, 50, 114, 110), fill=(140, 50, 40))
        d.rectangle((46, 50, 114, 70), fill=(90, 30, 28))

    def gun(d):
        d.rectangle((30, 70, 120, 92), fill=(50, 50, 55))
        d.polygon([(100, 92), (120, 92), (112, 120), (88, 120)], fill=(40, 30, 28))

    for name, fn in (
        ("shell", shell),
        ("megaphone", mega),
        ("memo", memo),
        ("mag", mag),
        ("receipt", receipt),
        ("lighter", lighter),
        ("notebook", notebook),
        ("match", match),
        ("gun", gun),
    ):
        icon(name, fn)

    write_aim_cards()
    print("art ready")


if __name__ == "__main__":
    main()
