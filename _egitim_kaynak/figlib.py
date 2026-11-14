"""Revit eğitimi şematik çizimleri. Renkler sayfanın CSS değişkenlerinden gelir (açık/koyu tema)."""

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg(name, w, h, body, y0=0):
    return (f'<svg viewBox="0 {y0} {w} {h}" role="img" xmlns="http://www.w3.org/2000/svg">'
            f'<defs><marker id="ah-{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0L10 5L0 10z" class="ar"/></marker></defs>{body}</svg>')


def t(x, y, s, cls="t", anchor="start"):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{esc(s)}</text>'


def box(x, y, w, h, lines, cls="bx"):
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" class="{cls}"/>'
    n = len(lines)
    cy = y + h / 2 - (n - 1) * 8 + 4
    for i, s in enumerate(lines):
        out += t(x + w / 2, cy + i * 16, s, "tb" if i == 0 else "tm", "middle")
    return out


def arrow(name, x1, y1, x2, y2, cls="mu", dash=False):
    d = ' stroke-dasharray="5 4"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"{d} marker-end="url(#ah-{name})"/>'


def line(x1, y1, x2, y2, cls="k1"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"/>'


def rect(x, y, w, h, cls):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="{cls}"/>'


def hdim(x1, x2, y, label, ty=None):
    ty = ty if ty is not None else y - 6
    return (line(x1, y, x2, y, "dm") + line(x1, y - 5, x1, y + 5, "dm") + line(x2, y - 5, x2, y + 5, "dm")
            + t((x1 + x2) / 2, ty, label, "tm", "middle"))


def vdim(x, y1, y2, label, side="left"):
    tx, an = (x - 10, "end") if side == "left" else (x + 10, "start")
    return (line(x, y1, x, y2, "dm") + line(x - 5, y1, x + 5, y1, "dm") + line(x - 5, y2, x + 5, y2, "dm")
            + t(tx, (y1 + y2) / 2 + 4, label, "tm", an))




def poly(pts, cls="k"):
    return '<polyline points="' + " ".join(f"{x},{y}" for x, y in pts) + f'" class="{cls}"/>'


def pgon(pts, cls="gl"):
    return '<polygon points="' + " ".join(f"{x},{y}" for x, y in pts) + f'" class="{cls}"/>'


def circ(x, y, r, cls="k"):
    return f'<circle cx="{x}" cy="{y}" r="{r}" class="{cls}"/>'


def path(d, cls="k", name=None, dash=False):
    m = f' marker-end="url(#ah-{name})"' if name else ""
    ds = ' stroke-dasharray="5 4"' if dash else ""
    return f'<path d="{d}" class="{cls}"{ds}{m}/>'
