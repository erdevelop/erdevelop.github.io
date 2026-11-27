"""Derin Mavi 3D: balık ve resif modellerini Blender ile üretir.

Çalıştırma (Blender 4.x):
  blender -b -P 3d_modeller.py -- <çıktı klasörü>
ya da bpy modülüyle: python 3d_modeller.py <çıktı klasörü>

Çıktı: baliklar.glb, resif.glb ve düzenlemek için derin-mavi-3d.blend
Sonra sitede kullanmadan önce sıkıştırılır (dosyalar ~4 kat küçülür; yükleyici: derin-mavi/3d/yukleyici.js):
  npx @gltf-transform/cli meshopt baliklar.glb baliklar-sikis.glb --quantize-color 12
  node balik_bol.mjs baliklar-sikis.glb ../../derin-mavi/3d/balik   (her tür ayrı dosya: balik/<tür>.glb; oyun yalnızca gerekenleri indirir)
  npx @gltf-transform/cli meshopt resif.glb ../../derin-mavi/3d/resif.glb --quantize-color 12
Renkler köşe rengi (Col) olarak saklanır; doku dosyası yoktur.
Eksenler (Blender): X = balığın boyu (baş +X), Y = yan, Z = yukarı.
"""
import bpy, bmesh, math, random, sys, os
from mathutils import Vector, Matrix, noise

argv = sys.argv
OUT = argv[argv.index('--') + 1] if '--' in argv else (argv[1] if len(argv) > 1 else '.')
os.makedirs(OUT, exist_ok=True)
random.seed(7)

# ---------------------------------------------------------------- yardımcılar
def lin(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def renk(h):
    h = h.lstrip('#')
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))

def karis(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def carp(a, k):
    return tuple(min(1.0, x * k) for x in a)

def yumusak(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0 if e1 != e0 else 1e-6)))
    return t * t * (3 - 2 * t)

MALZ = {}
def malz(ad, rough=0.5, metal=0.0, spec=0.5):
    if ad in MALZ:
        return MALZ[ad]
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    m.use_backface_culling = False
    MALZ[ad] = m
    return m

def obje(ad, verts, faces, cols, mat, duz=False, ebeveyn=None):
    me = bpy.data.meshes.new(ad)
    me.from_pydata(verts, [], faces)
    me.update()
    at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(cols):
        at.data[i].color = (c[0], c[1], c[2], 1.0)
    me.polygons.foreach_set('use_smooth', [not duz] * len(me.polygons))
    me.materials.append(mat)
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    if ebeveyn:
        ob.parent = ebeveyn
    return ob

def bm_obje(ad, bm, mat, colfn, duz=False, ebeveyn=None):
    bm.normal_update()
    verts = [tuple(v.co) for v in bm.verts]
    cols = [colfn(v.co, v.normal) for v in bm.verts]
    bm.verts.index_update()
    faces = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    return obje(ad, verts, faces, cols, mat, duz, ebeveyn)

def bos(ad):
    e = bpy.data.objects.new(ad, None)
    bpy.context.scene.collection.objects.link(e)
    return e

def izgara(ad, P, C, ns, nt, mat, ebeveyn):
    """Parametrik yüzey: P(s,t) -> nokta, C(s,t) -> renk. Yüzgeçler için."""
    verts, cols, faces = [], [], []
    for i in range(ns + 1):
        for j in range(nt + 1):
            s, t = i / ns, j / nt
            verts.append(P(s, t))
            cols.append(C(s, t))
    for i in range(ns):
        for j in range(nt):
            a = i * (nt + 1) + j
            faces.append([a, a + nt + 1, a + nt + 2, a + 1])
    return obje(ad, verts, faces, cols, mat, False, ebeveyn)

# ---------------------------------------------------------------- balıklar
BOY = 0.82  # gövdenin boyu (kuyruk yüzgeci hariç), toplam ~1

def balik(ad, sp):
    kok = bos('balik_' + ad)
    H, Wd, a, b, ped, cz = sp['H'], sp['W'], sp['a'], sp['b'], sp['ped'], sp.get('cz', 0.0)
    tepe = (a / (a + b)) ** a * (b / (a + b)) ** b

    def hh(u):
        p = (u ** a) * ((1 - u) ** b) / tepe
        return H * (p * (1 - ped) + ped * u ** 2)

    def ww(u):
        p = (u ** (a * 0.8)) * ((1 - u) ** (b * 0.9)) / ((a * 0.8 / (a * 0.8 + b * 0.9)) ** (a * 0.8) * (b * 0.9 / (a * 0.8 + b * 0.9)) ** (b * 0.9))
        return Wd * (p * (1 - ped * 0.6) + ped * 0.6 * u ** 2)

    def zc(u):
        return H * cz * math.sin(math.pi * u)

    def xu(u):
        return 0.5 - u * BOY

    ns, nr = sp.get('ns', 140), sp.get('nr', 48)
    verts, cols, faces = [], [], []
    renkF = sp['renk']
    verts.append((0.5 + 0.005, 0, zc(0)))
    cols.append(renkF(0, 0))
    for i in range(1, ns + 1):
        u = i / ns
        for j in range(nr):
            an = 2 * math.pi * j / nr
            ca, sa = math.cos(an), math.sin(an)
            y = ww(u) * math.copysign(abs(ca) ** 0.85, ca)
            z = zc(u) + hh(u) * math.copysign(abs(sa) ** 1.0, sa) * (1.06 if sa < 0 else 1.0)
            verts.append((xu(u), y, z))
            cols.append(renkF(u, sa))
    verts.append((xu(1) - 0.004, 0, zc(1)))
    cols.append(renkF(1, 0))
    son = len(verts) - 1
    for j in range(nr):
        faces.append([0, 1 + (j + 1) % nr, 1 + j])
    for i in range(ns - 1):
        r0, r1 = 1 + i * nr, 1 + (i + 1) * nr
        for j in range(nr):
            j2 = (j + 1) % nr
            faces.append([r0 + j, r0 + j2, r1 + j2, r1 + j])
    rs = 1 + (ns - 1) * nr
    for j in range(nr):
        faces.append([rs + j, rs + (j + 1) % nr, son])
    obje(ad + '_govde', verts, faces, cols, malz('govde_parlak', 0.28, 0.55) if sp.get('parlak') else malz('govde', 0.42, 0.08), ebeveyn=kok)

    # --- yüzgeçler
    yR = sp['yuzgec']

    def kuyruk():
        x0, z0 = xu(1) + 0.01, zc(1)
        Lc, Hc, tip = sp['kL'], sp['kH'], sp['kuyruk']

        def f(s):
            v = 2 * s - 1
            if tip == 'catal':
                return 1 - 0.6 * (1 - abs(v)) ** 1.3
            if tip == 'hilal':
                return 1 - 0.8 * (1 - abs(v)) ** 0.7
            if tip == 'yuvarlak':
                return 0.55 + 0.45 * math.sqrt(max(0, 1 - v * v))
            return 0.92 + 0.08 * abs(v)

        def P(s, t):
            v = 2 * s - 1
            bz = z0 + hh(1) * 0.9 * v
            ez = z0 + Hc * v * (1.15 if tip == 'hilal' else 1)
            ex = x0 - Lc * f(s)
            tt = t ** 0.9
            return (x0 + (ex - x0) * tt, 0, bz + (ez - bz) * (tt ** 0.8))

        def C(s, t):
            return yR('kuyruk', s, t)
        izgara(ad + '_kuyruk', P, C, 24, 10, malz('yuzgec', 0.55), kok)

    def sirt(u1, u2, yuk, alt=False, ad2='sirt', egim=0.35, sekil=None):
        def P(s, t):
            u = u1 + (u2 - u1) * s
            base = (xu(u), 0, zc(u) + (hh(u) * 0.96) * (-1 if alt else 1))
            g = sekil(s) if sekil else math.sin(math.pi * min(1, s * 1.15)) ** 0.6
            h = yuk * g
            return (base[0] - egim * h * t, 0, base[2] + (-h if alt else h) * t)

        def C(s, t):
            return yR(ad2, s, t)
        izgara(ad + '_' + ad2 + ('_a' if alt else ''), P, C, 20, 6, malz('yuzgec', 0.55), kok)

    def gogus(u0, uz, gen, aci=0.5):
        for yan in (-1, 1):
            def P(s, t, yan=yan):
                u = u0
                bx, by, bz = xu(u), ww(u) * 0.85 * yan, zc(u) - hh(u) * 0.25 + (s - 0.5) * hh(u) * 0.45
                d = uz * (0.6 + 0.4 * math.sin(math.pi * s))
                return (bx - d * t, by + yan * d * t * aci * 0.5, bz - d * t * 0.25 + (s - 0.5) * gen * t)

            def C(s, t):
                return yR('gogus', s, t)
            izgara(ad + ('_gogusL' if yan < 0 else '_gogusR'), P, C, 8, 6, malz('yuzgec', 0.55), kok)

    kuyruk()
    for (u1, u2, yk, alt, ad2, eg, sek) in sp['yuzgecler']:
        sirt(u1, u2, yk, alt, ad2, eg, sek)
    gogus(sp.get('gogusU', 0.27), sp.get('gogusL', 0.14), sp.get('gogusG', 0.05), sp.get('gogusA', 0.6))
    for (ua, ya) in sp.get('fincik', []):
        for alt in (False, True):
            sirt(ua, ua + 0.025, ya, alt, 'fincik', 0.6, lambda s: 1 - s)

    # --- gözler
    ug = sp.get('gozU', 0.12)
    gr = sp.get('gozR', 0.035)
    for yan in (-1, 1):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=gr)
        mer = Vector((xu(ug), ww(ug) * 0.78 * yan, zc(ug) + hh(ug) * sp.get('gozZ', 0.28)))
        for v in bm.verts:
            v.co = v.co * Vector((1, 0.6, 1)) + mer
        iris = renk(sp.get('iris', '#C9A24A'))

        def gc(co, n, yan=yan, mer=mer, iris=iris):
            d = (co - mer).normalized()
            k = d.y * yan
            if k > 0.82:
                return (0.005, 0.005, 0.008)
            if k > 0.55:
                return iris
            return carp(iris, 0.35)
        bm_obje(ad + ('_gozL' if yan < 0 else '_gozR'), bm, malz('goz', 0.04, 0.0), gc, ebeveyn=kok)
    return kok

def yuzgecRenk(ana, kenar=None, kenarK=0.82, isin=0.75, uc=None):
    A = renk(ana)
    K = renk(kenar) if kenar else None
    U = renk(uc) if uc else None

    def f(parca, s, t):
        c = A
        if U:
            c = karis(A, U, t)
        r = 0.5 + 0.5 * math.cos(s * math.pi * 2 * 9)
        c = carp(c, 1 - (1 - isin) * r * min(1, t * 3))
        if K and t > kenarK:
            c = K
        return c
    return f

def govdeRenk(ust, orta, alt, ek=None):
    U, O, A = renk(ust), renk(orta), renk(alt)

    def f(u, v):
        c = karis(O, U, yumusak(0.1, 0.95, v)) if v > 0 else karis(O, A, yumusak(0.0, 0.7, -v))
        if 0.2 < u < 0.27:
            c = carp(c, 0.85 + 0.15 * abs(u - 0.235) / 0.035)
        if ek:
            c = ek(u, v, c)
        return c
    return f

TURLER = {}

# palyaço balığı
def palyacoEk(u, v, c):
    W_, S_ = renk('#FAFAF7'), renk('#0B0B0B')
    for (m, w) in ((0.2, 0.06), (0.5, 0.075), (0.84, 0.045)):
        d = abs(u - m - 0.02 * v)
        c = karis(c, S_, 1 - yumusak(w + 0.012, w + 0.02, d))
        c = karis(c, W_, 1 - yumusak(w - 0.004, w + 0.004, d))
    return c
TURLER['palyaco'] = dict(H=0.2, W=0.085, a=0.42, b=0.85, ped=0.24, cz=0.03,
    renk=govdeRenk('#C84A07', '#F2730F', '#FF9C45', palyacoEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#F06A10', '#121212', 0.8, 0.8)(p, s, t),
    kuyruk='yuvarlak', kL=0.2, kH=0.17,
    yuzgecler=[(0.22, 0.48, 0.1, False, 'sirt', 0.3, None), (0.48, 0.82, 0.12, False, 'sirt2', 0.3, None), (0.56, 0.84, 0.1, True, 'anal', 0.3, None)],
    gozU=0.13, gozR=0.032, iris='#E0701A')

# mavi cerrah
def cerrahEk(u, v, c):
    S_ = renk('#05070C')
    mer = 0.32 + 0.38 * math.sin(math.pi * min(1, max(0, (u - 0.1) / 0.75)))
    zarf = yumusak(0.12, 0.18, u) * (1 - yumusak(0.82, 0.88, u))
    c = karis(c, S_, zarf * (1 - yumusak(0.11, 0.15, abs(v - mer))))
    zarf2 = yumusak(0.48, 0.54, u) * (1 - yumusak(0.74, 0.8, u))
    c = karis(c, S_, zarf2 * (1 - yumusak(0.06, 0.1, abs(v - (mer - 0.42)))))
    return c
TURLER['cerrah'] = dict(H=0.27, W=0.058, a=0.5, b=0.72, ped=0.13, cz=0.03,
    renk=govdeRenk('#123A9E', '#1F55DA', '#4A86F2', cerrahEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#F5CF1C', '#111111', 0.9, 0.85) if p in ('kuyruk', 'gogus') else yuzgecRenk('#1D49C2', '#0A0A12', 0.8, 0.8))(p, s, t),
    kuyruk='kesik', kL=0.2, kH=0.22,
    yuzgecler=[(0.18, 0.92, 0.1, False, 'sirt', 0.25, None), (0.44, 0.92, 0.09, True, 'anal', 0.25, None)],
    gozU=0.12, gozR=0.034, iris='#2B2F3A')

# imparator melek balığı
def melekEk(u, v, c):
    k = math.sin((u * 30 + v * 9))
    c = karis(renk('#2C54C9'), renk('#FFD52A'), yumusak(0.0, 0.5, k))
    c = karis(c, renk('#F2C230'), yumusak(0.87, 0.92, u))
    maske = (1 - yumusak(0.15, 0.19, u)) * (1 - yumusak(0.3, 0.38, abs(v - 0.15)))
    c = karis(c, renk('#16245E'), maske)
    return c
TURLER['melek'] = dict(H=0.31, W=0.05, a=0.55, b=0.65, ped=0.15, cz=0.02,
    renk=govdeRenk('#2C54C9', '#2C54C9', '#2C54C9', melekEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#F2C230', '#FFE680', 0.92) if p == 'kuyruk' else yuzgecRenk('#2448B8', '#9FD7FF', 0.86, 0.75))(p, s, t),
    kuyruk='yuvarlak', kL=0.18, kH=0.22,
    yuzgecler=[(0.2, 0.95, 0.15, False, 'sirt', 0.5, lambda s: math.sin(math.pi * min(1, s * 1.05)) ** 0.5 * (0.6 + 0.6 * s)), (0.42, 0.95, 0.13, True, 'anal', 0.5, lambda s: math.sin(math.pi * min(1, s * 1.05)) ** 0.5 * (0.6 + 0.6 * s))],
    gozU=0.11, gozR=0.03, iris='#3A3A40')

# ton balığı
def tonEk(u, v, c):
    w = yumusak(0.4, 0.9, math.sin(u * 70)) * yumusak(-0.15, -0.05, v) * (1 - yumusak(0.3, 0.4, v)) * yumusak(0.22, 0.28, u) * (1 - yumusak(0.82, 0.88, u))
    return carp(c, 1 - 0.18 * w)
TURLER['orkinos'] = dict(H=0.13, W=0.115, a=0.5, b=1.0, ped=0.05, cz=0.0, parlak=True,
    renk=govdeRenk('#0B1C38', '#3D628E', '#DCE2EA', tonEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#F2C21A') if p == 'fincik' else yuzgecRenk('#1A2C48', None, 0.9, 0.85))(p, s, t),
    kuyruk='hilal', kL=0.24, kH=0.3,
    yuzgecler=[(0.3, 0.44, 0.1, False, 'sirt', 0.6, None), (0.52, 0.6, 0.09, False, 'sirt2', 0.8, lambda s: 1 - s * 0.7), (0.53, 0.6, 0.07, True, 'anal', 0.8, lambda s: 1 - s * 0.7)],
    fincik=[(0.68 + i * 0.045, 0.03) for i in range(6)],
    gogusU=0.27, gogusL=0.22, gogusG=0.03, gogusA=0.3, gozU=0.1, gozR=0.03, iris='#9AA4B0')

# sardalya (sürü)
def sardEk(u, v, c):
    w = (1 - yumusak(0.05, 0.09, abs(v - 0.3))) * yumusak(0.3, 0.7, math.sin(u * 60)) * yumusak(0.16, 0.2, u) * (1 - yumusak(0.6, 0.64, u))
    return karis(c, renk('#1C2E3A'), w)
TURLER['sardalya'] = dict(ns=80, nr=28, H=0.1, W=0.062, a=0.5, b=0.9, ped=0.07, cz=0.0, parlak=True,
    renk=govdeRenk('#1F5E72', '#9EB8C6', '#E6ECF0', sardEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#A9C0CC', None, 0.9, 0.9)(p, s, t),
    kuyruk='catal', kL=0.22, kH=0.14,
    yuzgecler=[(0.38, 0.52, 0.07, False, 'sirt', 0.4, None), (0.62, 0.72, 0.04, True, 'anal', 0.4, None)],
    gozU=0.1, gozR=0.03, iris='#B8C2CC')

# fener balığı (derin)
def fenerEk(u, v, c):
    n = noise.noise(Vector((u * 9, v * 5, 0.3)))
    return carp(c, 0.85 + 0.25 * n)
TURLER['fener'] = dict(H=0.27, W=0.2, a=0.32, b=0.95, ped=0.12, cz=-0.05,
    renk=govdeRenk('#22262E', '#3A3E48', '#4A4C52', fenerEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#2A2D35', '#55585F', 0.9, 0.85)(p, s, t),
    kuyruk='yuvarlak', kL=0.18, kH=0.14,
    yuzgecler=[(0.55, 0.75, 0.08, False, 'sirt', 0.3, None), (0.6, 0.78, 0.07, True, 'anal', 0.3, None)],
    gozU=0.12, gozR=0.022, gozZ=0.45, iris='#7E8A5A')

# yelken balığı (açık deniz): ince uzun gövde, kılıç gaga, dev mavi yelken sırt
def yelkenEk(u, v, c):
    w = yumusak(0.55, 0.85, math.sin(u * 55)) * yumusak(-0.2, -0.05, v) * (1 - yumusak(0.25, 0.35, v)) * yumusak(0.25, 0.3, u) * (1 - yumusak(0.85, 0.9, u))
    return karis(c, renk('#9FD4F2'), w * 0.7)
TURLER['yelken'] = dict(H=0.1, W=0.06, a=0.5, b=1.0, ped=0.04, cz=0.0, parlak=True,
    renk=govdeRenk('#0E2A55', '#2F67A8', '#E2E8EE', yelkenEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#1E4FA0', '#0A2048', 0.9, 0.9, '#4F8FE0') if p == 'yelken' else yuzgecRenk('#173A6E', None, 0.9, 0.85))(p, s, t),
    kuyruk='hilal', kL=0.22, kH=0.24,
    yuzgecler=[(0.1, 0.72, 0.34, False, 'yelken', 0.15, lambda s: math.sin(math.pi * min(1, s * 1.05)) ** 0.45 * (1 - 0.35 * s)), (0.62, 0.72, 0.06, True, 'anal', 0.6, lambda s: 1 - s * 0.7)],
    gogusU=0.22, gogusL=0.2, gogusG=0.02, gogusA=0.3, gozU=0.08, gozR=0.022, iris='#8CA0B8')

# uçan balık (açık deniz): kanat gibi çok uzun göğüs yüzgeçleri, çatal kuyruğun alt lobu uzun
def ucanEk(u, v, c):
    return c
TURLER['ucan'] = dict(H=0.13, W=0.075, a=0.45, b=0.9, ped=0.06, cz=0.0, parlak=True,
    renk=govdeRenk('#1C4E86', '#6E9CCB', '#EEF3F7', ucanEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#9BC6EA', '#3E7DB8', 0.85, 0.9) if p == 'gogus' else yuzgecRenk('#6A9CC8', None, 0.9, 0.85))(p, s, t),
    kuyruk='catal', kL=0.2, kH=0.17,
    yuzgecler=[(0.55, 0.66, 0.05, False, 'sirt', 0.5, None), (0.58, 0.68, 0.05, True, 'anal', 0.5, None), (0.45, 0.55, 0.05, True, 'karin', 0.6, None)],
    gogusU=0.25, gogusL=0.5, gogusG=0.16, gogusA=1.4, gozU=0.1, gozR=0.032, iris='#C8D4E0')

# balta balığı (derin): bıçak gibi ince, derin gövdeli, gümüş, karnında ışık organları
def baltaEk(u, v, c):
    org = (1 - yumusak(0.015, 0.03, abs(v + 0.42))) * yumusak(0.2, 0.3, u) * (1 - yumusak(0.65, 0.7, u)) * yumusak(0.2, 0.6, math.sin(u * 80))
    return karis(c, renk('#7FE8FF'), org)
TURLER['balta'] = dict(H=0.3, W=0.028, a=0.34, b=0.6, ped=0.05, cz=-0.08, parlak=True,
    renk=govdeRenk('#3A4450', '#C9D2DA', '#EDF2F6', baltaEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#C6D0D8', None, 0.9, 0.9)(p, s, t),
    kuyruk='catal', kL=0.16, kH=0.12,
    yuzgecler=[(0.45, 0.58, 0.06, False, 'sirt', 0.4, None), (0.6, 0.75, 0.05, True, 'anal', 0.5, None)],
    gozU=0.14, gozR=0.05, gozZ=0.35, iris='#5A6470')

# kurdele balığı (derin): şerit gibi çok uzun gövde, baştan kuyruğa kırmızı sırt yüzgeci, başta kırmızı tepelik
def kurdeleEk(u, v, c):
    benek = yumusak(0.6, 0.85, noise.noise(Vector((u * 40, v * 8, 1.7))))
    return karis(c, renk('#5A6A78'), benek * 0.5)
TURLER['kurdele'] = dict(ns=200, nr=24, H=0.075, W=0.022, a=0.5, b=1.0, ped=0.02, cz=0.0, parlak=True,
    renk=govdeRenk('#8C9AA8', '#D8E0E8', '#EEF2F6', kurdeleEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#E0362F', '#8C1A16', 0.85, 0.85)(p, s, t),
    kuyruk='duz', kL=0.06, kH=0.04,
    yuzgecler=[(0.03, 0.98, 0.04, False, 'sirt', 0.1, lambda s: 0.75 + 0.25 * math.sin(s * 40)), (0.01, 0.07, 0.16, False, 'tepelik', 0.5, lambda s: (1 - s) ** 0.5)],
    gogusU=0.12, gogusL=0.05, gogusG=0.02, gozU=0.04, gozR=0.016, iris='#C0C6CC')

# buz balığı (derin, kış): soluk yarı şeffaf gövde (kanında hemoglobin yok), uzun ördek gagası gibi burun
def buzEk(u, v, c):
    n = noise.noise(Vector((u * 14, v * 6, 2.3)))
    return karis(c, renk('#9DB6C2'), max(0, n) * 0.4)
TURLER['buz'] = dict(H=0.13, W=0.075, a=0.36, b=0.9, ped=0.05, cz=0.0,
    renk=govdeRenk('#8EA3AE', '#DCE8EE', '#F4F8FA', buzEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#E6EEF2', '#A9BCC6', 0.85, 0.85)(p, s, t),
    kuyruk='duz', kL=0.12, kH=0.08,
    yuzgecler=[(0.28, 0.38, 0.1, False, 'sirt', 0.3, None), (0.42, 0.78, 0.06, False, 'sirt2', 0.25, None), (0.45, 0.8, 0.05, True, 'anal', 0.25, None)],
    gogusU=0.25, gogusL=0.18, gogusG=0.1, gogusA=0.9, gozU=0.13, gozR=0.03, gozZ=0.4, iris='#F0F4F6')

# mandarin balığı (resif): turuncu üstüne mavi-yeşil kıvrımlı desen, iri yüzgeçler
def mandarinEk(u, v, c):
    q = math.sin(u * 38 + math.sin(v * 9 + u * 6) * 2.4)
    return karis(c, renk('#1E5BD8'), yumusak(0.2, 0.45, q)) if v > -0.4 else c
TURLER['mandarin'] = dict(ns=100, nr=36, H=0.22, W=0.1, a=0.4, b=0.75, ped=0.14, cz=0.0,
    renk=govdeRenk('#FF7A1A', '#FF8A2A', '#3CC6B8', mandarinEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#1E5BD8', '#FF8A2A', 0.82, 0.8)(p, s, t),
    kuyruk='yuvarlak', kL=0.2, kH=0.15,
    yuzgecler=[(0.25, 0.4, 0.16, False, 'sirt', 0.25, None), (0.45, 0.8, 0.12, False, 'sirt2', 0.2, None), (0.45, 0.8, 0.1, True, 'anal', 0.2, None)],
    gogusU=0.25, gogusL=0.16, gogusG=0.1, gogusA=0.8, gozU=0.12, gozR=0.032, gozZ=0.42, iris='#E0A030')

# papağan balığı (resif): yeşil-turkuaz pullar, pembe kenarlar, gaga gibi kaynaşmış dişler
def papaganEk(u, v, c):
    n = noise.noise(Vector((u * 26, v * 12, 3.1)))
    return karis(c, renk('#F27AB8'), yumusak(0.25, 0.5, n) * 0.6)
TURLER['papagan'] = dict(ns=100, nr=36, H=0.27, W=0.1, a=0.48, b=0.8, ped=0.12, cz=0.0,
    renk=govdeRenk('#1F8F78', '#2FBF9A', '#9AE6F2', papaganEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#2C9FD0', '#F27AB8', 0.8, 0.85)(p, s, t),
    kuyruk='hilal', kL=0.18, kH=0.2,
    yuzgecler=[(0.22, 0.78, 0.07, False, 'sirt', 0.2, None), (0.55, 0.8, 0.06, True, 'anal', 0.3, None)],
    gogusU=0.27, gogusL=0.15, gogusG=0.06, gogusA=0.6, gozU=0.11, gozR=0.03, iris='#F2A0C8')

# lambuka (açık deniz): yeşil-altın, mavi benekler, baştan kuyruğa sırt yüzgeci, dik alın
def lambukaEk(u, v, c):
    n = noise.noise(Vector((u * 30, v * 10, 5.2)))
    return karis(c, renk('#2A7FE0'), yumusak(0.45, 0.6, n) * 0.8)
TURLER['lambuka'] = dict(ns=100, nr=36, H=0.2, W=0.065, a=0.25, b=1.0, ped=0.05, cz=0.02, parlak=True,
    renk=govdeRenk('#1E7F4A', '#38C06A', '#FFD23F', lambukaEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#1F8F5A', '#2A7FE0', 0.85, 0.85)(p, s, t),
    kuyruk='catal', kL=0.26, kH=0.24,
    yuzgecler=[(0.04, 0.88, 0.08, False, 'sirt', 0.15, lambda s: 0.6 + 0.4 * math.sin(math.pi * s)), (0.55, 0.88, 0.06, True, 'anal', 0.2, None)],
    gogusU=0.2, gogusL=0.14, gogusG=0.04, gogusA=0.5, gozU=0.08, gozR=0.026, iris='#C8D44A')

# uskumru (açık deniz): sırtı mavi-yeşil, koyu dalgalı çizgiler, karnı gümüş, kuyruk önünde fincikler
def uskumruEk(u, v, c):
    q = math.sin(u * 60 + v * 18 + math.sin(u * 20) * 2)
    return karis(c, renk('#14303A'), yumusak(0.5, 0.75, q) * yumusak(0.1, 0.3, v) * yumusak(0.15, 0.25, u))
TURLER['uskumru'] = dict(ns=100, nr=36, H=0.14, W=0.08, a=0.48, b=1.0, ped=0.05, cz=0.0, parlak=True,
    renk=govdeRenk('#1E5F70', '#7FB8C8', '#E8F0F4', uskumruEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#6E9CAA', None, 0.9, 0.85)(p, s, t),
    kuyruk='catal', kL=0.2, kH=0.17,
    yuzgecler=[(0.3, 0.42, 0.07, False, 'sirt', 0.5, None), (0.55, 0.64, 0.05, False, 'sirt2', 0.6, None), (0.56, 0.65, 0.05, True, 'anal', 0.6, None)],
    fincik=[(0.7 + i * 0.045, 0.025) for i in range(5)],
    gogusU=0.25, gogusL=0.13, gogusG=0.03, gogusA=0.4, gozU=0.1, gozR=0.03, iris='#C8D2DA')

# engerek balığı (derin): uzun koyu gövde, karnında ışık organları, iri sivri dişler
def engerekEk(u, v, c):
    org = (1 - yumusak(0.02, 0.04, abs(v + 0.55))) * yumusak(0.3, 0.7, math.sin(u * 70)) * yumusak(0.1, 0.15, u) * (1 - yumusak(0.85, 0.9, u))
    return karis(c, renk('#7FE8FF'), org)
TURLER['engerek'] = dict(ns=100, nr=36, H=0.12, W=0.05, a=0.3, b=1.0, ped=0.05, cz=0.0, parlak=True,
    renk=govdeRenk('#141C28', '#2E3D52', '#4A5A70', engerekEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#2A3444', None, 0.9, 0.85)(p, s, t),
    kuyruk='catal', kL=0.14, kH=0.1,
    yuzgecler=[(0.14, 0.22, 0.09, False, 'sirt', 0.4, None), (0.75, 0.85, 0.05, True, 'anal', 0.4, None)],
    gozU=0.08, gozR=0.03, gozZ=0.4, iris='#7FE8FF')

# ışıklı fener balığı (derin): koyu mavi sırt, gümüş yanlar, sıra sıra ışık organı, kocaman göz
def isikliEk(u, v, c):
    org = 0
    for vv in (-0.55, -0.25):
        org = max(org, (1 - yumusak(0.02, 0.045, abs(v - vv))) * yumusak(0.4, 0.8, math.sin(u * 55)) * yumusak(0.12, 0.18, u) * (1 - yumusak(0.85, 0.9, u)))
    return karis(c, renk('#9FF4FF'), org)
TURLER['isikli'] = dict(ns=100, nr=36, H=0.16, W=0.07, a=0.4, b=0.95, ped=0.06, cz=0.0, parlak=True,
    renk=govdeRenk('#1C2840', '#8C9EB8', '#C8D6E6', isikliEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#5A6E8E', None, 0.9, 0.85)(p, s, t),
    kuyruk='catal', kL=0.16, kH=0.12,
    yuzgecler=[(0.4, 0.55, 0.06, False, 'sirt', 0.4, None), (0.6, 0.72, 0.05, True, 'anal', 0.4, None)],
    gozU=0.12, gozR=0.048, gozZ=0.3, iris='#3A5A80')

# ---- küçük sürü türleri (3-5'li gruplar) ve pusu avcısı orfoz: sahnede çok küçük göründükleri için düşük çözünürlük
# flama balığı (Heniochus): beyaz disk gövde, iki geniş eğik siyah bant, sarı arka yüzgeçler, uzun sırt flaması
def flamaEk(u, v, c):
    S_ = renk('#121212')
    for (m, w) in ((0.3, 0.085), (0.66, 0.08)):
        d = abs(u - m + 0.09 * v)
        c = karis(c, S_, 1 - yumusak(w - 0.01, w + 0.01, d))
    c = karis(c, renk('#F2D22E'), yumusak(0.8, 0.88, u) * yumusak(0.0, 0.3, v))
    return karis(c, renk('#2A2A2A'), (1 - yumusak(0.04, 0.07, u)) * 0.8)
TURLER['flama'] = dict(ns=80, nr=28, H=0.32, W=0.045, a=0.45, b=0.62, ped=0.14, cz=0.04,
    renk=govdeRenk('#EDEBE4', '#F7F6F1', '#FFFFFF', flamaEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#F2D22E', None, 0.9, 0.85) if p in ('kuyruk', 'sirt2', 'gogus') else yuzgecRenk('#151515', None, 0.9, 0.85) if p == 'anal' else yuzgecRenk('#F4F2EA', None, 0.9, 0.9, '#FFFFFF'))(p, s, t),
    kuyruk='kesik', kL=0.18, kH=0.16,
    yuzgecler=[(0.2, 0.5, 0.62, False, 'sirt', 0.55, lambda s: 0.22 + 0.78 * math.exp(-((s - 0.12) / 0.09) ** 2)), (0.5, 0.84, 0.12, False, 'sirt2', 0.3, None), (0.5, 0.84, 0.12, True, 'anal', 0.3, None)],
    gogusU=0.26, gogusL=0.12, gogusG=0.05, gozU=0.13, gozR=0.03, iris='#2A2A2A')

# sarpa (Akdeniz): gümüş-gri iğ gövde, boydan boya altın sarısı ince çizgiler
def sarpaEk(u, v, c):
    q = math.sin(v * math.pi * 5.5 + 0.4)
    c = karis(c, renk('#E9C23C'), yumusak(0.55, 0.8, q) * yumusak(0.06, 0.14, u) * (1 - yumusak(0.9, 0.96, u)))
    return karis(c, renk('#1A1A1A'), (1 - yumusak(0.012, 0.022, math.hypot(u - 0.27, (v + 0.05) * 0.2))))
TURLER['sarpa'] = dict(ns=80, nr=28, H=0.16, W=0.07, a=0.45, b=0.9, ped=0.08, cz=0.0, parlak=True,
    renk=govdeRenk('#6F8496', '#B9C6D0', '#EEF2F4', sarpaEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#A9B4BC', None, 0.9, 0.85, '#D9C27A')(p, s, t),
    kuyruk='catal', kL=0.2, kH=0.17,
    yuzgecler=[(0.24, 0.72, 0.07, False, 'sirt', 0.3, None), (0.55, 0.8, 0.05, True, 'anal', 0.3, None)],
    gogusU=0.27, gogusL=0.12, gogusG=0.04, gozU=0.11, gozR=0.03, iris='#D8B848')

# karagöz (Akdeniz): gümüş yassı gövde, başın ardında ve kuyruk sapında siyah bant
def karagozEk(u, v, c):
    S_ = renk('#151515')
    c = karis(c, S_, 1 - yumusak(0.025, 0.04, abs(u - 0.21 - 0.02 * v)))
    c = karis(c, S_, yumusak(0.84, 0.87, u) * (1 - yumusak(0.95, 0.98, u)))
    q = math.sin(v * math.pi * 7)
    return karis(c, renk('#8E9AA6'), yumusak(0.6, 0.9, q) * 0.35)
TURLER['karagoz'] = dict(ns=80, nr=28, H=0.24, W=0.06, a=0.45, b=0.8, ped=0.12, cz=0.02, parlak=True,
    renk=govdeRenk('#7C8A96', '#C9D2D9', '#F2F4F5', karagozEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#B8C0C4', '#E2CE7A', 0.82, 0.85)(p, s, t),
    kuyruk='catal', kL=0.21, kH=0.19,
    yuzgecler=[(0.22, 0.76, 0.09, False, 'sirt', 0.3, None), (0.55, 0.8, 0.07, True, 'anal', 0.3, None)],
    gogusU=0.27, gogusL=0.13, gogusG=0.05, gozU=0.12, gozR=0.034, iris='#C9CFD4')

# banggai kardinal balığı (resif): gümüş gövde, üç siyah dikey bant, arkada beyaz benekler, uzun yüzgeçler
def kardinalEk(u, v, c):
    S_ = renk('#121212')
    for (m, w) in ((0.1, 0.035), (0.36, 0.05), (0.7, 0.16)):
        c = karis(c, S_, 1 - yumusak(w - 0.01, w + 0.008, abs(u - m)))
    n = noise.noise(Vector((u * 40, v * 14, 7.7)))
    return karis(c, renk('#FFFFFF'), yumusak(0.45, 0.55, n) * yumusak(0.5, 0.6, u))
TURLER['kardinal'] = dict(ns=80, nr=28, H=0.25, W=0.055, a=0.42, b=0.8, ped=0.14, cz=0.0,
    renk=govdeRenk('#9DA6AA', '#D8DDDC', '#EEF0EE', kardinalEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#161616', '#F2F2F2', 0.88, 0.9)(p, s, t),
    kuyruk='catal', kL=0.3, kH=0.26,
    yuzgecler=[(0.26, 0.4, 0.24, False, 'sirt', 0.25, None), (0.5, 0.82, 0.26, False, 'sirt2', 0.55, lambda s: 0.3 + 0.7 * math.exp(-((s - 0.2) / 0.18) ** 2)), (0.5, 0.84, 0.24, True, 'anal', 0.55, lambda s: 0.3 + 0.7 * math.exp(-((s - 0.2) / 0.18) ** 2))],
    gogusU=0.27, gogusL=0.12, gogusG=0.05, gozU=0.1, gozR=0.036, iris='#D9C24A')

# orfoz (Akdeniz pusu avcısı): iri kahverengi-zeytin gövde, açık lekeler, sarımsı karın, kenarı açık yüzgeçler, geniş ağız
def orfozEk(u, v, c):
    n = noise.noise(Vector((u * 18, v * 7, 2.3)))
    c = karis(c, renk('#D8C79A'), yumusak(0.3, 0.5, n) * 0.75 * yumusak(-0.2, 0.2, v))
    return karis(c, renk('#3A2A1C'), (1 - yumusak(0.005, 0.012, abs(v + 0.1 - u * 0.4))) * (1 - yumusak(0.0, 0.1, u)) * 0.6)
TURLER['orfoz'] = dict(ns=90, nr=30, H=0.2, W=0.11, a=0.36, b=0.95, ped=0.16, cz=-0.04,
    renk=govdeRenk('#4A3A26', '#7A6040', '#E2C77A', orfozEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#5C4630', '#E8E0C8', 0.88, 0.85)(p, s, t),
    kuyruk='kesik', kL=0.17, kH=0.15,
    yuzgecler=[(0.24, 0.5, 0.08, False, 'sirt', 0.25, lambda s: 0.6 + 0.4 * math.sin(math.pi * s)), (0.5, 0.8, 0.1, False, 'sirt2', 0.3, None), (0.56, 0.8, 0.08, True, 'anal', 0.3, None)],
    gogusU=0.27, gogusL=0.15, gogusG=0.08, gogusA=0.7, gozU=0.09, gozR=0.03, gozZ=0.45, iris='#C9A24A')

# temizlikçi balık (Labroides dimidiatus): ince uzun, önü soluk beyaz-sarı, arkası elektrik mavisi; burundan kuyruğa genişleyen siyah şerit
def temizlikciEk(u, v, c):
    c = karis(c, renk('#2F7FE0'), yumusak(0.35, 0.75, u) * 0.9)
    gen = 0.05 + 0.22 * u
    return karis(c, renk('#0E0E14'), 1 - yumusak(gen - 0.02, gen + 0.02, abs(v + 0.02)))
TURLER['temizlikci'] = dict(ns=80, nr=26, H=0.13, W=0.05, a=0.45, b=0.95, ped=0.08, cz=0.0,
    renk=govdeRenk('#F2EEDD', '#F6F3E8', '#FFFFFF', temizlikciEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#3B8CEB', '#101018', 0.85, 0.9)(p, s, t),
    kuyruk='kesik', kL=0.16, kH=0.13,
    yuzgecler=[(0.26, 0.86, 0.05, False, 'sirt', 0.3, None), (0.56, 0.86, 0.04, True, 'anal', 0.3, None)],
    gogusU=0.25, gogusL=0.1, gogusG=0.03, gozU=0.1, gozR=0.026, iris='#2A2A2A')

# tetik balığı (titan): derin gövde, zeytin-sarı pullu desen, gözün üstünden geçen koyu maske, kısa sert sırt dikeni, uzun simetrik arka yüzgeçler
def tetikEk(u, v, c):
    n = noise.noise(Vector((u * 26, v * 14, 4.4)))
    c = karis(c, renk('#3E4A2A'), yumusak(0.15, 0.45, n) * 0.55 * yumusak(0.12, 0.2, u))
    c = karis(c, renk('#2A2A22'), (1 - yumusak(0.025, 0.045, abs(u - 0.15 + v * 0.05))) * yumusak(-0.1, 0.3, v) * 0.8)
    return karis(c, renk('#E6C25A'), (1 - yumusak(0.0, 0.1, u)) * 0.6)
TURLER['tetik'] = dict(ns=90, nr=30, H=0.34, W=0.08, a=0.34, b=0.82, ped=0.1, cz=0.06,
    renk=govdeRenk('#55602F', '#A99A4C', '#D9C98A', tetikEk),
    yuzgec=lambda p, s, t: (yuzgecRenk('#3A3A2A', None, 0.9, 0.9) if p == 'sirt' else yuzgecRenk('#7C8A3E', '#2A2A20', 0.86, 0.85))(p, s, t),
    kuyruk='catal', kL=0.17, kH=0.2,
    yuzgecler=[(0.3, 0.38, 0.2, False, 'sirt', 0.45, lambda s: 1 - s * 0.85), (0.52, 0.86, 0.15, False, 'sirt2', 0.4, lambda s: 0.5 + 0.5 * math.sin(math.pi * min(1, s * 1.4))), (0.52, 0.86, 0.15, True, 'anal', 0.4, lambda s: 0.5 + 0.5 * math.sin(math.pi * min(1, s * 1.4)))],
    gogusU=0.32, gogusL=0.1, gogusG=0.04, gozU=0.2, gozR=0.03, gozZ=0.42, iris='#C9A24A')

# kılıç balığı (açık deniz): iğ gövde, sırtı koyu bronz-mor, karnı gümüşi; orak gibi yüksek ilk sırt yüzgeci, hilal kuyruk, uzun yassı kılıç
def kilicEk(u, v, c):
    return karis(c, renk('#5A4A5E'), yumusak(0.2, 0.6, v) * 0.35)
TURLER['kilic'] = dict(ns=100, nr=30, H=0.13, W=0.11, a=0.3, b=1.0, ped=0.04, cz=0.0, parlak=True,
    renk=govdeRenk('#2A2230', '#6B5E66', '#D8D2C8', kilicEk),
    yuzgec=lambda p, s, t: yuzgecRenk('#2E2632', None, 0.9, 0.9)(p, s, t),
    kuyruk='hilal', kL=0.22, kH=0.26,
    yuzgecler=[(0.2, 0.32, 0.26, False, 'sirt', 0.5, lambda s: max(0.0, 1 - s * 1.1)), (0.84, 0.88, 0.04, False, 'sirt2', 0.3, None), (0.82, 0.87, 0.04, True, 'anal', 0.3, None)],
    gogusU=0.22, gogusL=0.18, gogusG=0.02, gogusA=0.3, gozU=0.09, gozR=0.03, iris='#3A4A6A')

bpy.ops.wm.read_factory_settings(use_empty=True)
for i, (ad, sp) in enumerate(TURLER.items()):
    k = balik(ad, sp)
    k.location = (0, i * 0.8, 0)

# fener balığının oltası ve dişleri
f = bpy.data.objects['balik_fener']
bm = bmesh.new()
pts = [Vector((0.38 + 0.1 * t, 0, 0.2 + 0.22 * math.sin(t * 2.2))) for t in [i / 10 for i in range(11)]]
for i in range(10):
    a_, b_ = pts[i], pts[i + 1]
    d = b_ - a_
    m = Matrix.Translation((a_ + b_) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=6, radius1=0.006, radius2=0.005, depth=d.length, matrix=m)
bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=0.025, matrix=Matrix.Translation(pts[-1] + Vector((0.015, 0, 0))))
bm_obje('fener_olta', bm, malz('isik', 0.3), lambda co, n: renk('#CFFFF0') if (co - pts[-1]).length < 0.05 else renk('#3A3E48'), ebeveyn=f)
bm = bmesh.new()
for i in range(7):
    x = 0.47 - i * 0.03
    for yan in (-1, 1):
        m = Matrix.Translation((x, yan * 0.07 * (1 - i * 0.08), -0.02)) @ Matrix.Rotation(math.pi, 4, 'X')
        bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.008, radius2=0.0, depth=0.05, matrix=m)
bm_obje('fener_dis', bm, malz('dis', 0.2), lambda co, n: renk('#F2F0E6'), ebeveyn=f)

# yelken balığının kılıç gagası ve buz balığının uzun burnu
for ad_, uz, r0, z0, renk_ in [('yelken', 0.22, 0.012, 0.0, '#14305A'), ('buz', 0.09, 0.022, -0.005, '#C8D8E0'), ('kilic', 0.36, 0.018, 0.005, '#2E2632')]:
    ob = bpy.data.objects['balik_' + ad_]
    bm = bmesh.new()
    m = Matrix.Translation((0.5 + uz / 2 - 0.01, 0, z0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y')
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r0, radius2=0.002, depth=uz, matrix=m)
    bm_obje(ad_ + '_gaga', bm, malz('gaga', 0.35), lambda co, n, r=renk_: renk(r), ebeveyn=ob)

# engerek balığının ağzından taşan iğne dişleri, papağan balığının gagası
ob = bpy.data.objects['balik_engerek']
bm = bmesh.new()
for i, (x, uz) in enumerate([(0.5, 0.07), (0.49, 0.06), (0.47, 0.05), (0.45, 0.045)]):
    for yan in (-1, 1):
        for alt in (False, True):
            m = Matrix.Translation((x, yan * 0.012 * (1 + i * 0.4), (0.025 if alt else -0.025))) @ Matrix.Rotation(0 if alt else math.pi, 4, 'X') @ Matrix.Rotation(0.25 * (1 if alt else -1), 4, 'Y')
            bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.004, radius2=0.0, depth=uz, matrix=m)
bm_obje('engerek_dis', bm, malz('dis', 0.2), lambda co, n: renk('#EEF4F6'), ebeveyn=ob)
ob = bpy.data.objects['balik_papagan']
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.03, radius2=0.012, depth=0.04, matrix=Matrix.Translation((0.505, 0, -0.01)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y'))
bm_obje('papagan_gaga', bm, malz('gaga', 0.35), lambda co, n: renk('#E8E2D2'), ebeveyn=ob)

# dışa aktar
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'baliklar.glb'), export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'baliklar.blend'))

# ---------------------------------------------------------------- resif
bpy.ops.wm.read_factory_settings(use_empty=True)
MALZ.clear()

def gurultu(co, s=1.0, o=4):
    return noise.fractal(co * s, 0.6, 2.0, o)

def kayaRenk(tm='resif'):
    def f(co, n):
        k = 0.5 + 0.5 * noise.noise(co * 0.9)
        c = karis(renk('#5E5A50'), renk('#8C8573'), k)
        if n.z > 0.45:
            g = noise.noise(co * 1.7 + Vector((5, 1, 2)))
            if g > 0.15:
                c = karis(c, renk('#5E8A3E'), min(1, (g - 0.15) * 3))
            elif g < -0.25:
                c = karis(c, renk('#C77A9A'), min(1, (-g - 0.25) * 3))
        cav = noise.noise(co * 2.3 + Vector((9, 9, 9)))
        if cav < -0.3:
            c = carp(c, 0.6)
        return c
    return f

def kaya(ad, olcek, tohum):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
    o = Vector((tohum * 3.1, tohum * 1.7, tohum * 2.3))
    for v in bm.verts:
        d = v.co.normalized()
        r = 1 + 0.32 * gurultu(d * 1.3 + o, 1, 4) + 0.08 * noise.noise(d * 6 + o)
        v.co = d * r
        v.co.x *= olcek[0]; v.co.y *= olcek[1]; v.co.z *= olcek[2]
        if v.co.z < -0.15 * olcek[2]:
            v.co.z = -0.15 * olcek[2] + (v.co.z + 0.15 * olcek[2]) * 0.15
    for v in bm.verts:
        v.co.z += 0.15 * olcek[2]
    return bm_obje(ad, bm, malz('kaya', 0.92), kayaRenk())

for i, sc in enumerate([(1.6, 1.2, 0.9), (1.1, 0.9, 0.7), (2.2, 1.4, 1.1), (0.8, 0.7, 0.55)]):
    kaya('kaya_%d' % i, sc, i + 1)

# mağaralı resif duvarı
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=6, radius=1.0)
for v in bm.verts:
    d = v.co.normalized()
    r = 1 + 0.22 * gurultu(d * 1.6 + Vector((3, 3, 3)), 1, 5) + 0.05 * noise.noise(d * 9)
    p = d * r
    p.x *= 7.5; p.y *= 4.5; p.z *= 5.2
    if p.z < -0.6:
        p.z = -0.6 + (p.z + 0.6) * 0.1
    p.z += 0.6
    p.z *= 1 - 0.25 * max(0, p.x / 7.5)
    v.co = p
tmp = bpy.data.meshes.new('t')
bm.to_mesh(tmp)
bm.free()
duvar = bpy.data.objects.new('duvar', tmp)
bpy.context.scene.collection.objects.link(duvar)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=1.0)
for v in bm.verts:
    d = v.co
    v.co = Vector((d.x * 1.5, d.y * 4.2, d.z * 2.2)) + Vector((1.8, -4.2, 0.4)) + d * 0.12 * noise.noise(d * 3)
tm2 = bpy.data.meshes.new('t2')
bm.to_mesh(tm2)
bm.free()
tunel = bpy.data.objects.new('tunel', tm2)
bpy.context.scene.collection.objects.link(tunel)
md = duvar.modifiers.new('bool', 'BOOLEAN')
md.operation = 'DIFFERENCE'
md.object = tunel
md.solver = 'EXACT'
bpy.context.view_layer.objects.active = duvar
duvar.select_set(True)
bpy.ops.object.modifier_apply(modifier='bool')
bpy.data.objects.remove(tunel)
# renk ve gölge: mağaranın içi karanlık
me = duvar.data
me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
kf = kayaRenk()
for v in me.vertices:
    c = kf(v.co, v.normal)
    p = v.co
    ic = ((p.x - 1.8) / 1.5) ** 2 + ((p.z - 0.4) / 2.2) ** 2
    if ic < 1.25 and p.y > -4.5:
        c = carp(c, max(0.06, 0.6 - (p.y + 4.5) * 0.18))
    if p.z < 0.9:
        c = carp(c, 0.7 + 0.3 * p.z / 0.9 if p.z > 0 else 0.7)
    at.data[v.index].color = (*c, 1)
me.materials.append(malz('kaya', 0.92))

# beyin mercanı
def beyin(ad, rr, ana, oluk):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.0)
    A, O = renk(ana), renk(oluk)
    for v in bm.verts:
        d = v.co.normalized()
        m = math.sin(noise.noise(d * 2.2) * 18)
        r = 1 + 0.045 * m
        v.co = d * r
        v.co.z = max(v.co.z, -0.05) * 0.75
        v.co *= rr
    return bm_obje(ad, bm, malz('mercan', 0.75),
        lambda co, n: karis(O, A, 0.5 + 0.5 * math.sin(noise.noise(co.normalized() * 2.2) * 18)) if co.z > 0.01 else carp(O, 0.6))
beyin('beyin_0', 0.9, '#C9B37A', '#7A6436')
beyin('beyin_1', 0.7, '#9DBA6A', '#55703A')

# dallı (geyik boynuzu) mercan
def dalli(ad, ana, uc, seviye=4, r0=0.09, boy=0.7, yay=0.55, tohum=1):
    rnd = random.Random(tohum)
    bm = bmesh.new()
    def dal(p, d, r, l, n):
        e = p + d * l
        m = Matrix.Translation((p + e) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=n == 0, segments=8, radius1=r, radius2=r * 0.72, depth=l, matrix=m)
        if n > 0:
            for k in range(2 + (1 if rnd.random() < 0.4 else 0)):
                ax = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0)).normalized()
                nd = (Matrix.Rotation(rnd.uniform(0.35, yay), 4, ax) @ d).normalized()
                nd.z = max(nd.z, 0.25)
                dal(e - d * r * 0.3, nd.normalized(), r * 0.72, l * rnd.uniform(0.62, 0.8), n - 1)
    for k in range(3):
        a = k * 2.1 + rnd.random()
        dal(Vector((math.cos(a) * 0.12, math.sin(a) * 0.12, 0)), Vector((math.cos(a) * 0.3, math.sin(a) * 0.3, 1)).normalized(), r0, boy * 0.45, seviye)
    A, U = renk(ana), renk(uc)
    return bm_obje(ad, bm, malz('mercan', 0.7), lambda co, n: karis(A, U, co.z / (boy * 1.4)))
for i, (a, u) in enumerate([('#7E4FB0', '#E2C8FF'), ('#2F6FB8', '#BFE3FF'), ('#C2562A', '#FFD0B0'), ('#9A7A3A', '#F3E2B0')]):
    dalli('dalli_%d' % i, a, u, tohum=i + 3)

# masa mercanı
def masa(ad, ana):
    bm = bmesh.new()
    A = renk(ana)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.08, radius2=0.06, depth=0.6, matrix=Matrix.Translation((0, 0, 0.3)))
    for k, (r, z) in enumerate([(0.95, 0.62), (0.68, 0.82), (0.42, 0.98)]):
        g = bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=r, radius2=r * 0.97, depth=0.05, matrix=Matrix.Translation((0.05 * k, 0, z)))
        for v in g['verts']:
            dd = Vector((v.co.x, v.co.y, 0))
            if dd.length > r * 0.5:
                v.co += dd.normalized() * 0.06 * noise.noise(dd * 4)
                v.co.z -= 0.04 * (dd.length / r) ** 2
    return bm_obje(ad, bm, malz('mercan', 0.7), lambda co, n: carp(A, 1.15) if n.z > 0.5 else carp(A, 0.6))
masa('masa_0', '#E89A8A')
masa('masa_1', '#9AC8C0')

# tüp sünger
def tup(ad, ana, n=4, tohum=1):
    rnd = random.Random(tohum)
    bm = bmesh.new()
    A = renk(ana)
    for k in range(n):
        a = k * 2.4
        h = rnd.uniform(0.6, 1.3)
        r = rnd.uniform(0.09, 0.14)
        p = Vector((math.cos(a) * 0.2, math.sin(a) * 0.2, h / 2))
        m = Matrix.Translation(p) @ Matrix.Rotation(rnd.uniform(-0.15, 0.15), 4, 'X') @ Matrix.Rotation(rnd.uniform(-0.15, 0.15), 4, 'Y')
        g = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=r, radius2=r * 1.1, depth=h, matrix=m)
        g2 = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=r * 0.8, radius2=r * 0.92, depth=h * 0.98, matrix=m)
        bmesh.ops.reverse_faces(bm, faces=list({f for v in g2['verts'] for f in v.link_faces}))
    def c(co, nn):
        k = 0.75 + 0.25 * noise.noise(co * 8)
        return carp(A, k * (0.35 if nn.z < -0.3 or (abs(nn.z) < 0.3 and noise.noise(co * 0.1) > 2) else 1))
    return bm_obje(ad, bm, malz('mercan', 0.8), c)
tup('tup_0', '#8E5BA8', 4, 2)
tup('tup_1', '#D2793C', 5, 5)

# deniz yelpazesi
def yelpaze(ad, ana, tohum=1):
    rnd = random.Random(tohum)
    bm = bmesh.new()
    A = renk(ana)
    def dal(p, a, l, r, n):
        d = Vector((math.cos(a), 0, math.sin(a)))
        e = p + d * l
        m = Matrix.Translation((p + e) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=False, segments=5, radius1=r, radius2=r * 0.8, depth=l, matrix=m)
        if n > 0:
            dal(e, a - rnd.uniform(0.25, 0.42), l * 0.82, r * 0.8, n - 1)
            dal(e, a + rnd.uniform(0.25, 0.42), l * 0.82, r * 0.8, n - 1)
    dal(Vector((0, 0, 0)), math.pi / 2, 0.35, 0.03, 7)
    return bm_obje(ad, bm, malz('mercan', 0.7), lambda co, n: karis(carp(A, 0.6), A, co.z / 1.6))
yelpaze('yelpaze_0', '#B0306A', 4)
yelpaze('yelpaze_1', '#C9482A', 8)

# anemon (dokunaçlar sahnede salınır)
def anemon(ad, ana, uc):
    bm = bmesh.new()
    A, U = renk(ana), renk(uc)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.22, radius2=0.26, depth=0.25, matrix=Matrix.Translation((0, 0, 0.125)))
    rnd = random.Random(11)
    for k in range(70):
        a = rnd.uniform(0, math.tau)
        rr = rnd.uniform(0.02, 0.24)
        p = Vector((math.cos(a) * rr, math.sin(a) * rr, 0.25))
        d = Vector((math.cos(a) * rr * 2.2, math.sin(a) * rr * 2.2, 1)).normalized()
        l = rnd.uniform(0.3, 0.5)
        pts = [p + d * l * t + Vector((0, 0, -0.08 * t * t * rr * 3)) for t in (0, 0.33, 0.66, 1)]
        for i in range(3):
            q, w = pts[i], pts[i + 1]
            dd = w - q
            m = Matrix.Translation((q + w) / 2) @ dd.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            bmesh.ops.create_cone(bm, cap_ends=i == 2, segments=5, radius1=0.022 * (1 - i * 0.25), radius2=0.022 * (1 - (i + 1) * 0.25) + 0.004, depth=dd.length, matrix=m)
    return bm_obje(ad, bm, malz('anemon', 0.55), lambda co, n: karis(A, U, max(0, (co.z - 0.25) / 0.45)) if co.z > 0.25 else carp(A, 0.55))
anemon('anemon_0', '#C05A8A', '#FFD3E6')
anemon('anemon_1', '#5A8A3A', '#E3F6A8')

for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'resif.glb'), export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'resif.blend'))
print('TAMAM', OUT)
