from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
# Fonts: npm i @fontsource/cormorant-garamond @fontsource/montserrat
FS = os.environ.get("FONTSOURCE", "node_modules/@fontsource/")
OUT = os.path.dirname(os.path.abspath(__file__)) + "/"
CORM = TTFont(FS + "cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff")
MONT = TTFont(FS + "montserrat/files/montserrat-latin-500-normal.woff")
OCEAN, GOLD, GOLD_LIGHT, WHITE = "#0f3557", "#b08d52", "#c9a96b", "#f7f4ee"

def run(font, text, size, track, x0=0.0, y=0.0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font["head"].unitsPerEm
    s = size / upm; x = x0; parts = []
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
        d = pen.getCommands()
        if d: parts.append(d)
        x += gs[g].width * s + (track * size if i < len(text) - 1 else 0)
    return " ".join(parts), x - x0

def wordmark(ink, dot, joined=False, tagline=None, tag_ink=None):
    size, track = 100, 0.14
    left = "nhatrang" if joined else "nha trang"
    d1, w1 = run(CORM, left, size, track)
    r = size * 0.052
    cx = w1 + track * size * 0.9 + r
    d2, w2 = run(CORM, "one", size, track, x0=cx + r + track * size * 0.9)
    total = cx + r + track * size * 0.9 + w2
    top, bottom = -size * 0.72, size * 0.24
    body = f'<path d="{d1} {d2}" fill="{ink}"/><circle cx="{cx:.2f}" cy="{-r:.2f}" r="{r:.2f}" fill="{dot}"/>'
    if tagline:
        tsize, ttrack = size * 0.13, 0.55
        dt, wt = run(MONT, tagline, tsize, ttrack)
        tx = (total - wt) / 2
        dt, _ = run(MONT, tagline, tsize, ttrack, x0=tx, y=size * 0.62)
        body += f'<path d="{dt}" fill="{tag_ink or ink}"/>'
        bottom = size * 0.66
    pad = size * 0.06
    vb = f"{-pad:.1f} {top - pad:.1f} {total + 2 * pad:.1f} {bottom - top + 2 * pad:.1f}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="nhatrang.one">{body}</svg>\n'

def icon(ink, dot, bg=None):
    size = 100
    d, w = run(CORM, "n", size, 0)
    r = size * 0.075
    cx = w + size * 0.06 + r
    total = cx + r
    xh = size * 0.45
    box = 150
    ox, oy = (box - total) / 2, box / 2 + xh / 2
    bgr = f'<rect width="{box}" height="{box}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}">{bgr}'
            f'<g transform="translate({ox:.2f} {oy:.2f})"><path d="{d}" fill="{ink}"/>'
            f'<circle cx="{cx:.2f}" cy="{-r:.2f}" r="{r:.2f}" fill="{dot}"/></g></svg>\n')

files = {
  "nhatrang-one.svg": wordmark(OCEAN, GOLD),
  "nhatrang-one-tagline.svg": wordmark(OCEAN, GOLD, tagline="PRIVATE CONCIERGE", tag_ink="#8a8278"),
  "nhatrang-one-white.svg": wordmark(WHITE, GOLD_LIGHT),
  "nhatrang-one-white-tagline.svg": wordmark(WHITE, GOLD_LIGHT, tagline="PRIVATE CONCIERGE", tag_ink="#c9c2b5"),
  "icon.svg": icon(OCEAN, GOLD, "#fbfaf7"),
  "icon-ocean.svg": icon(WHITE, GOLD_LIGHT, OCEAN),
  "_variant-joined.svg": wordmark(OCEAN, GOLD, joined=True, tagline="PRIVATE CONCIERGE", tag_ink="#8a8278"),
}
for k, v in files.items():
    open(OUT + k, "w").write(v)
print("written", list(files))
