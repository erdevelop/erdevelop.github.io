import re, html, markdown, pathlib, importlib.util

ROOT = pathlib.Path(__file__).parent
FIGS = {}
if (ROOT / "figs.py").exists():
    _sp = importlib.util.spec_from_file_location("figs", ROOT / "figs.py"); _m = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_m); FIGS = _m.F
def fig(m):
    svg, cap = FIGS[m.group(1)]
    return f'<figure class="fig"><div class="sc">{svg}</div><figcaption>{html.escape(cap)}</figcaption></figure>'

DAYS = [
    ("Tuval, bileşenler ve ilk tanım", "~5 saat", "Parametre ve bileşen, kablolar, slider, Series, Loft, düzen ve Bake"),
    ("Listeler ve sayılar: dönen kule", "~5 saat", "Series, Range, Remap, Graph Mapper, liste işlemleri, Longest List"),
    ("Veri ağacı", "~5 saat", "Yollar, Graft, Flatten, Simplify, Flip Matrix, ızgaradan panel"),
    ("Yüzey panelleme ve warp", "~5 saat", "uv, Isotrim, warp analizi ve renk, panel tipi sayısı, Box Morph"),
    ("Attractor ve desenler", "~5 saat", "Ölç-normalle-şekillendir-uygula, perfore panel, Image Sampler, güneş kırıcı"),
    ("Analiz ve Galapagos", "~5 saat", "Tasarım puanları, Data Recorder, tip azaltma, fitness ile optimizasyon"),
    ("Cluster, çıktı ve Python", "~5 saat", "Cluster ve User Object, numaralama, CSV liste, özellikli Bake, Script"),
]

def conv(md_text, day):
    h = markdown.markdown(md_text, extensions=["tables", "sane_lists", "fenced_code"], output_format="html5")
    h = re.sub(r"<(/?)h2>", r"<\1h3>", h)
    h = re.sub(r"<p>@fig:(\w+)</p>", fig, h)
    n = [0]
    def task(m):
        n[0] += 1
        return f'<li class="task"><label><input type="checkbox" data-id="g{day}-{n[0]}"><span>{m.group(1)}</span></label></li>'
    h = re.sub(r"<li>\[ \] (.*?)</li>", task, h, flags=re.S)
    h = re.sub(r"<ul>(\s*<li class=\"task\">)", r'<ul class="tasks">\1', h)
    h = h.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
    h = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', h)
    return h, n[0]

sections, rows, nav = [], [], []
for i, (title, dur, summary) in enumerate(DAYS, 1):
    body, ntask = conv((ROOT / f"gun{i}.md").read_text(encoding="utf-8"), i)
    prev_l = f'<a href="#gun{i-1}">← {i-1}. gün</a>' if i > 1 else '<a href="#genel">← Genel bakış</a>'
    next_l = f'<a href="#gun{i+1}">{i+1}. gün →</a>' if i < len(DAYS) else '<a href="../../Tools.html">Araçlara dön →</a>'
    sections.append(f'''<section class="day" id="gun{i}" data-day="{i}">
  <div class="day-head"><span class="dn">GÜN {i:02d}</span><h2>{html.escape(title)}</h2><span class="meta">{dur} · <span data-prog="{i}">0/{ntask}</span> kontrol</span></div>
  <div class="prose">{body}</div>
  <div class="pn">{prev_l}{next_l}</div>
</section>''')
    rows.append(f'<tr><td><a href="#gun{i}">{i}. gün</a></td><td>{html.escape(title)}</td><td>{html.escape(summary)}</td><td>{dur}</td></tr>')
    nav.append(f'<a href="#gun{i}" data-nav="{i}">{i}</a>')

tpl = (ROOT / "template.html").read_text(encoding="utf-8")
out = tpl.replace("{{ROWS}}", "\n".join(rows)).replace("{{NAV}}", "".join(nav)).replace("{{DAYS}}", "\n".join(sections))
(ROOT / "index.html").write_text(out, encoding="utf-8")
print("ok", len(out))
