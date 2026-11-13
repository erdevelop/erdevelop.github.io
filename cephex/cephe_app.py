"""
Cephe Metraj (v1.0) - masaüstü arayüz
Girdi : aks aralıkları, kat yükseklikleri, profil bilgileri, çubuk boyu
Çıktı : cephe görünüşü (akslar + ölçü zincirleri), kesim listesi,
        çubuk planı (fire), cam listesi, özet, CSV ve DXF dışa aktarım
Katalog: profil_katalogu.csv (sistem;kod;ad;tur;genislik_mm;kg_m;dosya;blok;yuzey), program klasöründen otomatik yüklenir
Kesit: katalogdaki 'dosya' sütunu ya da 'Kesit...' düğmesiyle DXF'ten (HATCH sınırlı blok) alınır
Ölçüler mm, ağırlıklar kg. Sadece standart Python (tkinter) gerekir.

Ölçü yazımı: "5x1200; 1500; 2x1000"  ->  1200 x5, 1500, 1000 x2
"""
import colorsys
import copy
import csv
import itertools
import datetime
import json
import math
import os
import re
import string
import struct
import sys
import time
import zlib
import tkinter as tk
from collections import Counter
from tkinter import colorchooser, filedialog, messagebox, simpledialog, ttk


# ----------------------------------------------------------------- ÇEKİRDEK
def parse_olculer(metin, ad="Ölçü"):
    out = []
    for tok in re.split(r"[;\s]+", metin.strip()):
        if not tok:
            continue
        tok = tok.replace(",", ".")
        try:
            m = re.fullmatch(r"(\d+)\s*[x*×]\s*(\d+(?:\.\d+)?)", tok, re.I)
            if m:
                out += [float(m.group(2))] * int(m.group(1))
            else:
                out.append(float(tok))
        except ValueError:
            raise ValueError(f"{ad}: '{tok}' anlaşılamadı. Örnek: 5x1200; 1500")
    if not out or any(v <= 0 for v in out):
        raise ValueError(f"{ad}: en az bir pozitif ölçü girin.")
    return out


def _coklu_plan(ad, boylar, ent, testere, uyari):
    """Birden çok stok boyu: ent = [{"boy", "adet" (None=sınırsız), "min", "max"}]. Her parça, boyu stoğa sığan ve
    [min, max] aralığına uyan stoklardan kesilir. Aynı seçenek kümesindeki parçalar birlikte optimize edilir;
    çubuk çubuk, en az kalan (fire) bırakan stok boyu seçilir. Dönüş: [[kalan, [parçalar], çubuk boyu], ...]"""
    for e in ent:
        e["_k"] = None if e.get("adet") in (None, "") else int(e["adet"])
        e["min"] = float(e.get("min") or 0.0)
        e["max"] = float(e["max"]) if e.get("max") not in (None, "") else float("inf")
    grup = {}
    for b in boylar:
        el = tuple(i for i, e in enumerate(ent) if e["boy"] >= b and e["min"] <= b <= e["max"])
        if not el:
            neden = []
            for e in ent:
                if e["boy"] < b:
                    neden.append(f"{e['boy']:g} mm çubuk: parçadan kısa")
                elif e["min"] > b:
                    neden.append(f"{e['boy']:g} mm çubuk: 'parça en az {e['min']:g}' sınırının altında")
                else:
                    neden.append(f"{e['boy']:g} mm çubuk: 'parça en çok {e['max']:g}' sınırının üstünde")
            raise ValueError(
                f"{ad}: {b:g} mm'lik parça için uygun stok boyu yok.\n\n" + "\n".join(neden) +
                "\n\nÇubuk planı sekmesindeki stok listesinde 'Parça en az / en çok' aralıklarını bu parçayı "
                "kapsayacak şekilde düzenleyin (ör. 7650 çubuk için parça en az değerini boş bırakın ya da düşürün).")
        grup.setdefault(el, []).append(b)
    bars, uyarilan = [], set()
    for el in sorted(grup, key=lambda t: (len(t), t)):          # en kısıtlı gruplar önce (sınırlı stoğu onlar kullansın)
        parts = sorted(grup[el], reverse=True)
        if len(el) == 1 and ent[el[0]]["_k"] is None:           # tek, sınırsız stok: klasik First-Fit-Decreasing
            boy = ent[el[0]]["boy"]
            cub = []
            for b in parts:
                gerekli = b + testere
                for c in cub:
                    if c[0] >= gerekli:
                        c[0] -= gerekli
                        c[1].append(b)
                        break
                else:
                    cub.append([boy - gerekli, [b], boy])
            bars += cub
            continue
        while parts:
            en = None
            for idx in el:
                e = ent[idx]
                if e["_k"] is not None and e["_k"] <= 0:
                    continue
                kalan, al = e["boy"], []
                for q, b in enumerate(parts):
                    if b + testere <= kalan or (not al and b <= kalan):
                        kalan -= b + testere
                        al.append(q)
                if en is None or (kalan, e["boy"]) < (en[0], en[1]):
                    en = (kalan, e["boy"], idx, al)
            if en is None:                                       # sınırlı stok tükendi: en uzun stoktan fazladan çubuk
                idx = max(el, key=lambda i: ent[i]["boy"])
                if idx not in uyarilan:
                    uyarilan.add(idx)
                    uyari.append(f"{ad}: {ent[idx]['boy']:g} mm stok adedi yetersiz; fazladan çubuk eklendi.")
                ent[idx]["_k"] = None
                continue
            kalan, boy, idx, al = en
            bars.append([kalan, [parts[q] for q in al], boy])
            al_k = set(al)
            parts = [b for q, b in enumerate(parts) if q not in al_k]
            if ent[idx]["_k"] is not None:
                ent[idx]["_k"] -= 1
    return bars


def stok_sec(stoklar, tur):
    """Türe özel (dikey/yatay) stok girişi varsa yalnız onlar; yoksa 'tum' girişleri kullanılır."""
    L = list(stoklar or [])
    ozel = [e for e in L if e.get("profil", "tum") == tur]
    return ozel or [e for e in L if e.get("profil", "tum") == "tum"]


def _tek_plan(ad, boylar, cubuk_boyu, testere, stoklar, uyari):
    ent = [dict(e) for e in (stoklar or {}).get(ad) or []]
    if ent:
        return _coklu_plan(ad, boylar, ent, testere, uyari)
    cubuklar = []
    for b in boylar:
        if b > cubuk_boyu:
            raise ValueError(
                f"{ad}: {b:g} mm'lik parça {cubuk_boyu:g} mm çubuğa sığmıyor. "
                "Kat yüksekliğini/aks aralığını küçültün veya çubuk boyunu artırın."
            )
        gerekli = b + testere
        for c in cubuklar:
            if c[0] >= gerekli:
                c[0] -= gerekli
                c[1].append(b)
                break
        else:
            cubuklar.append([cubuk_boyu - gerekli, [b], cubuk_boyu])
    return cubuklar


def kesim_plani(kesimler, cubuk_boyu, testere, stoklar=None, uyari=None):
    """Profil bazında kesim planı. Dönüş: {ad: [[kalan, [kesimler], çubuk boyu], ...]}.
    stoklar: {ad: [{"boy", "adet", "min", "max"}]} verilirse birden çok stok boyu kullanılır; yoksa tek boy (FFD)."""
    plan = {}
    uyari = uyari if uyari is not None else []
    for ad in sorted({k[0] for k in kesimler}):
        boylar = sorted((b for a, b in kesimler if a == ad), reverse=True)
        try:
            plan[ad] = _tek_plan(ad, boylar, cubuk_boyu, testere, stoklar, uyari)
        except ValueError as e_:
            # stok/çubuk yetmiyor: proje yine de açılsın; uyarı verilir, parçalar tek tek (çubuk = parça boyu) listelenir
            uyari.append(str(e_).split("\n")[0] + " — bu profil için çubuk planı yapılamadı, parçalar tek tek gösteriliyor "
                         "(stok listesini 'Çubuk planı' sekmesinde düzeltin).")
            plan[ad] = [[0.0, [b], b] for b in boylar]
    return plan


PANEL_TIPLERI = {          # bölge dolgusu tipleri: kal (mm), kg_m2 ve çizim renkleri (dolgu, çizgi)
    "cam": {"ad": "Cam"},
    "spandrel": {"ad": "Spandrel", "renk": ("#d8cfbd", "#a89f8a")},
    "sandvic": {"ad": "Sandviç panel", "kal": 50.0, "kg_m2": 12.0, "renk": ("#e3dccb", "#a39b83")},
    "levha": {"ad": "Levha", "kal": 3.0, "kg_m2": 8.1, "renk": ("#cfd3d8", "#8d96a0")},
    "bos": {"ad": "Boş", "bos": True},
}


def panel_id(ad):
    """Panel adından (Cam, Sandviç panel ...) tip kimliği."""
    a = _norm(str(ad))
    for k, v in PANEL_TIPLERI.items():
        if k == a or _norm(v["ad"]) == a:
            return k
    return "cam"


def panel_tipleri_oku(yol):
    """panel_tipleri.csv (isteğe bağlı): tip;ad;kalinlik_mm;kg_m2 - varsayılan panel tiplerini günceller/genişletir."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return
    okuyucu = csv.reader(sat, delimiter=max(";,\t", key=sat[0].count))
    bas = [_norm(h) for h in next(okuyucu)]
    for r in okuyucu:
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        k = _norm(d.get("tip", ""))
        if not k or k in ("cam", "bos"):
            continue
        e = PANEL_TIPLERI.setdefault(k, {"ad": d.get("ad") or k, "renk": ("#dcd8cf", "#9a948a")})
        if d.get("ad"):
            e["ad"] = d["ad"]
        if d.get("kalinlik_mm"):
            e["kal"] = _say(d["kalinlik_mm"], "kalinlik_mm")
        if d.get("kg_m2"):
            e["kg_m2"] = _say(d["kg_m2"], "kg_m2")


def _zonalar(rows, ek, tip):
    """Kat eksenleri, ek yatay hatlar ve bölgeler (cam/spandrel)."""
    cy = [0.0]
    for r in rows:
        cy.append(cy[-1] + r)
    cizgiler, bolgeler, hat_id = [], [], []
    for j in range(len(rows)):
        cizgiler.append((cy[j], False))
        hat_id.append((j, 0))                          # (kat, sıra): 0 = kat tabanındaki hat, q>=1 = q. ek yatay
        for q, h in enumerate(ek[j]):
            cizgiler.append((cy[j] + h, True))
            hat_id.append((j, q + 1))
        ys = [cy[j]] + [cy[j] + h for h in ek[j]] + [cy[j + 1]]
        for z in range(len(ys) - 1):
            bolgeler.append({"y0": ys[z], "y1": ys[z + 1], "tip": tip[j][z], "kat": j, "k": z})
    cizgiler.append((cy[-1], False))
    hat_id.append((len(rows), 0))
    return cy, cizgiler, bolgeler, hat_id


def _prim_anahtar(prims):
    """Detay çiziminin geometrik parmak izi: koordinatlar 0.05 mm'ye yuvarlanır, yazı (etiket) öğeleri sayılmaz.
    Aynı görünen kesitler (yalnız etiket yeri ya da küsurat/çizim sırası farkı olanlar) aynı grupta toplanır."""
    def yv(x):
        if isinstance(x, float):
            return round(x * 20) / 20 + 0.0
        if isinstance(x, (list, tuple)):
            return tuple(yv(i) for i in x)
        if isinstance(x, dict):
            return tuple(sorted((str(k), yv(v)) for k, v in x.items()))
        return x
    return hash(frozenset(yv(p) for p in prims if p and p[0] != "text"))   # sıra ve tekrar farkı sayılmaz


def dikey_kesim_noktalari(rows, gecis, orta):
    """Düşeyin kesildiği yükseklikler (alttan, mm). Varsayılan: her kat hattı. 'gecis' kat hatlarında kesilmez;
    'orta' işaretli (ince birleşim) katın iki hattı da geçer, kesim o katın tam ortasında yapılır."""
    n = len(rows)
    cum = [0.0]
    for r in rows:
        cum.append(cum[-1] + r)
    orta = {j for j in (orta or ()) if 0 <= j < n}
    kes = []
    for b in range(1, n):
        if b in (gecis or ()) or b in orta or (b - 1) in orta:
            continue
        kes.append(cum[b])
    for j in orta:
        kes.append(cum[j] + rows[j] / 2)
    return sorted(kes), cum


def dikey_boylari(a0, a1, kes, alt, ust, dilat, ilk_kat, son_kat):
    """a0..a1 aralığındaki (bir düşey 'koşu') parçalar: [(başlangıç, bitiş, boy)]. Koşunun uçları ilk/son kattaysa
    alt/üst uzantı eklenir, diğer uçlar ve araya giren kesimler dilatasyonun yarısı kadar kısalır."""
    pts = [a0] + [c for c in kes if a0 + 1e-6 < c < a1 - 1e-6] + [a1]
    out = []
    for k in range(len(pts) - 1):
        lo, hi = pts[k], pts[k + 1]
        boy = hi - lo + (alt if (k == 0 and ilk_kat) else -dilat / 2) + (ust if (k == len(pts) - 2 and son_kat) else -dilat / 2)
        out.append((lo, hi, round(boy, 1)))
    return out


def dikey_parcalar(rows, alt, ust, dilat, gecis, orta=()):
    """Düşey profil parçaları (dik_yok yokken): [(başlangıç, bitiş, boy mm)]; yükseklikler alttan mm."""
    kes, cum = dikey_kesim_noktalari(rows, gecis, orta)
    return dikey_boylari(0.0, cum[-1], kes, alt, ust, dilat, True, True)


def detay_kontrol(det, tur, ciz_tol=0.6, cak_alan=2.0, adim=0.5):
    """Kesit detayı kontrolü. Dönüş: uyarı metinleri.
    1) Aks hizası: parçaların orta ekseni (düşey detayda x, yatay detayda y) referans aksından geçmeli; aksın iki yanına
       simetrik konan çiftler (ör. üst/alt conta) sorun sayılmaz.
    2) Üst üste binme: iki parçanın malzemesi cak_alan mm²'den fazla çakışırsa bildirilir."""
    out = []
    try:
        pcs = [p for p in detay_parca_listesi(det) if p["idx"]]
        rx, ry = det["ref"]
    except (KeyError, TypeError, ValueError):
        return out
    yan = 0 if tur == "dikey" else 1                 # aksa dik (yanal) koordinat: dikeyde x, yatayda y
    ref = (rx, ry)[yan]
    mrk = []
    for p in pcs:
        b = p["bbox"]
        mrk.append((b[yan] + b[yan + 2]) / 2 - ref)
    for i, p in enumerate(pcs):
        m = mrk[i]
        if abs(m) <= ciz_tol:
            continue
        if any(j != i and pcs[j]["kod"] == p["kod"] and abs(mrk[j] + m) <= ciz_tol for j in range(len(pcs))):
            continue                                 # aksın öbür yanında simetriği var
        out.append(f"{p['kod']}: aks hizasında değil ({m:+.1f} mm)")
    for i in range(len(pcs)):
        for j in range(i + 1, len(pcs)):
            a, b = pcs[i]["bbox"], pcs[j]["bbox"]
            x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
            if x1 - x0 <= adim or y1 - y0 <= adim or (x1 - x0) * (y1 - y0) < cak_alan:
                continue
            say, nx, ny = 0, max(1, int((x1 - x0) / adim)), max(1, int((y1 - y0) / adim))
            for ix in range(nx):
                for iy in range(ny):
                    pt = (x0 + (ix + 0.5) * (x1 - x0) / nx, y0 + (iy + 0.5) * (y1 - y0) / ny)
                    ok = []
                    for p in (pcs[i], pcs[j]):
                        ok.append(any(_nokta_malzeme(pt, [(lp) for lp in det["prims"][k][1]], det["prims"][k][2])
                                      for k in p["idx"]))
                    if ok[0] and ok[1]:
                        say += 1
            alan = say * ((x1 - x0) / nx) * ((y1 - y0) / ny)
            if alan >= cak_alan:
                out.append(f"{pcs[i]['kod']} ile {pcs[j]['kod']} üst üste biniyor (~{alan:.0f} mm²)")
    return out


def _cam_gruplari(cols, bolgeler, cizgiler, hat_id, yalanci, hucre):
    """Cam/panel hücrelerini gruplar. Yalancı hat (profilsiz, camın devam ettiği aks/hat) iki yanındaki hücreleri
    birleştirir. Dönüş: [{"i0","i1","z0","z1","tip","hucreler"}] (z: bölge sırası, alttan yukarı)."""
    nz, nc = len(bolgeler), len(cols)
    par = list(range(nz * nc))

    def bul(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a

    def birles(a, b):
        ra, rb = bul(a), bul(b)
        if ra != rb:
            par[max(ra, rb)] = min(ra, rb)

    for k_ in (yalanci or ()):
        if k_[0] == "d":
            i = k_[1]
            if 1 <= i <= nc - 1:
                for z in range(nz):
                    birles(z * nc + i - 1, z * nc + i)
        else:
            if (k_[1], k_[2]) not in hat_id:
                continue
            y = cizgiler[hat_id.index((k_[1], k_[2]))][0]
            alt = [z for z, b in enumerate(bolgeler) if abs(b["y1"] - y) < 1e-6]
            ust = [z for z, b in enumerate(bolgeler) if abs(b["y0"] - y) < 1e-6]
            if alt and ust:
                for i in range(nc):
                    birles(alt[0] * nc + i, ust[0] * nc + i)
    gr = {}
    for z in range(nz):
        for i in range(nc):
            gr.setdefault(bul(z * nc + i), []).append((z, i))
    out = []
    for hucreler in gr.values():
        z0, i0 = hucreler[0]
        zz = [h[0] for h in hucreler]
        ii = [h[1] for h in hucreler]
        zn = bolgeler[z0]
        out.append({"i0": min(ii), "i1": max(ii), "z0": min(zz), "z1": max(zz), "hucreler": hucreler,
                    "tip": hucre.get((zn["kat"], zn["k"], i0), zn["tip"])})
    out.sort(key=lambda g: (g["z0"], g["i0"]))
    return out


def ovr_kaydir(model, op, a=0, b=0):
    """Aks/kat/bölge ekleme-silmede hücre ve profil işaretlerinin (boş, tip, çıkarılan parça) indislerini kaydırır.
    model["hucre"] {(kat, bölge, aks): tip}, model["dik_yok"] {(aks, kat)}, model["yat_yok"] {(kat, hat, aralık)},
    model["dik_tip"] {(aks, kat): tip}, model["yat_tip"] {(kat, hat, aralık): tip},
    model["parca_cikar"] {("d", aks, kat) | ("y", kat, hat, aralık): {parça kodları}}."""
    if op == "col_ekle":                       # a: eklenen aralığın indisi
        fh = lambda j, k, i: (j, k, i + (i >= a))
        fd = lambda i, j: (i + (i >= a + 1), j)
        fy = lambda j, q, i: (j, q, i + (i >= a))
    elif op == "col_sil":                      # a: silinen aralık
        fh = lambda j, k, i: None if i == a else (j, k, i - (i > a))
        fd = lambda i, j: None if i == a + 1 else (i - (i > a + 1), j)
        fy = lambda j, q, i: None if i == a else (j, q, i - (i > a))
    elif op == "row_ekle":                     # a: eklenen katın indisi
        fh = lambda j, k, i: (j + (j >= a), k, i)
        fd = lambda i, j: (i, j + (j >= a))
        fy = lambda j, q, i: (j + (j >= a), q, i)
    elif op == "row_sil":
        fh = lambda j, k, i: None if j == a else (j - (j > a), k, i)
        fd = lambda i, j: None if j == a else (i, j - (j > a))
        fy = lambda j, q, i: None if j == a else (j - (j > a), q, i)
    elif op == "zone_bol":                     # a: kat, b: bölünen bölge
        fh = None
        fd = lambda i, j: (i, j)
        fy = lambda j, q, i: (j, q + (j == a and q >= b + 1), i)
    elif op == "zone_birlestir":               # a: kat, b: birleştirilen üst bölge (ek yatay q=b kalkar)
        fh = lambda j, k, i: None if (j == a and k == b) else (j, k - (j == a and k > b), i)
        fd = lambda i, j: (i, j)
        fy = lambda j, q, i: None if (j == a and q == b) else (j, q - (j == a and q > b), i)
    else:
        return
    hu = dict(model.get("hucre") or {})
    nh = {}
    if fh is None:                             # zone_bol: bölünen bölgenin hücre tipi iki bölgeye de geçer
        for (j, k, i), v in hu.items():
            if j == a and k > b:
                nh[(j, k + 1, i)] = v
            else:
                nh[(j, k, i)] = v
                if j == a and k == b:
                    nh[(j, k + 1, i)] = v
    else:
        for (j, k, i), v in hu.items():
            r_ = fh(j, k, i)
            if r_ is not None:
                nh[r_] = v

    def kume(ad, fn):
        out = set()
        for key in (model.get(ad) or ()):
            r_ = fn(*key)
            if r_ is not None:
                out.add(r_)
        return out

    def sozluk(ad, fn):
        out = {}
        for key, v in (model.get(ad) or {}).items():
            r_ = fn(*key)
            if r_ is not None:
                out[r_] = v
        return out

    model["hucre"] = nh
    model["dik_yok"], model["yat_yok"] = kume("dik_yok", fd), kume("yat_yok", fy)
    yl = set()
    for key in (model.get("yalanci") or ()):
        r_ = fd(key[1], -1) if key[0] == "d" else fy(key[1], key[2], -1)
        if r_ is not None:
            yl.add(("d", r_[0]) if key[0] == "d" else ("y", r_[0], r_[1]))
    model["yalanci"] = yl
    dg = set()
    for key in (model.get("dik_gecis") or ()):
        r_ = fy(key[1], key[2], -1)
        if r_ is not None:
            dg.add(("y", r_[0], r_[1]))
    model["dik_gecis"] = dg
    do_ = set()
    for key in (model.get("dik_orta") or ()):
        r_ = fy(key[1], key[2], -1)
        if r_ is not None:
            do_.add(("y", r_[0], r_[1]))
    model["dik_orta"] = do_

    def anahtar_kaydir(k):
        """('d', i, ...) ya da ('y', j, q, ...) anahtarının indislerini kaydırır; silinen aks/hat için None."""
        if k[0] == "d":
            r_ = fd(k[1], -1)
            return None if r_ is None else ("d", r_[0]) + tuple(k[2:])
        r_ = fy(k[1], k[2], -1)
        return None if r_ is None else ("y", r_[0], r_[1]) + tuple(k[3:])
    for ad_m in ("kayma", "zincir_hat"):
        yeni_m = {}
        for k_, v_ in (model.get(ad_m) or {}).items():
            k2 = anahtar_kaydir(k_)
            if k2 is not None:
                yeni_m[k2] = v_
        model[ad_m] = yeni_m
    model["dik_tip"], model["yat_tip"] = sozluk("dik_tip", fd), sozluk("yat_tip", fy)
    pc = {}
    for key, v in (model.get("parca_cikar") or {}).items():
        r_ = fd(*key[1:]) if key[0] == "d" else fy(*key[1:])
        if r_ is not None:
            pc[(key[0],) + r_] = v
    model["parca_cikar"] = pc
    th = {}
    for (j_, q_), v_ in (model.get("takoz_hat") or {}).items():     # hat başına cam takozu: yalnız kat/ek hat değişimleri taşır
        if op.startswith("col"):
            th[(j_, q_)] = v_
            continue
        r_ = fy(j_, q_, 0)
        if r_ is not None:
            th[(r_[0], r_[1])] = v_
    model["takoz_hat"] = th
    if op != "zone_bol" or True:
        model["parca_grup"] = {k_: v_ for k_, v_ in (model.get("parca_grup") or {}).items() if k_[2] is None}


CAM_KG_MM = 2.5      # düz cam: kg/m² her mm kalınlık için
PVB_KG_MM = 1.07     # PVB: kg/m² her mm için


def cam_coz(metin, pvb=0.76, ilk_ic=False):
    """'6+6+16+8' -> katman listesi (DIŞTAN İÇE; ilk_ic=True ise girilen sıra içten dışa).
    Boşluk: ortadaki (ilk/son olmayan) sayı >= 12 ya da 'h' ekli ('9h'); 'c' eki camdır ('14c').
    Ardışık iki cam arasına PVB eklenir (lamine). Dönüş:
    {"katman": [(tür, mm)], "kalinlik": mm, "kg_m2": kg/m², "ad": düzenli metin}"""
    ham = [t.strip().lower().replace(",", ".") for t in str(metin).replace("×", "x").split("+")]
    ham = [t for t in ham if t]
    if not ham:
        raise ValueError("Cam yapısı boş (örn. 6+6+16+8).")
    ogeler = []
    for i, t in enumerate(ham):
        tur = None
        if t[-1] in "hc":
            tur = "hava" if t[-1] == "h" else "cam"
            t = t[:-1]
        try:
            v = float(t)
        except ValueError:
            raise ValueError(f"Cam yapısında anlaşılmayan değer: '{ham[i]}'")
        if v <= 0:
            raise ValueError("Cam yapısında kalınlıklar sıfırdan büyük olmalı.")
        if tur is None:
            tur = "hava" if (0 < i < len(ham) - 1 and v >= 12) else "cam"
        ogeler.append((tur, v))
    if ogeler[0][0] == "hava" or ogeler[-1][0] == "hava":
        raise ValueError("Cam yapısı boşlukla başlayıp bitemez.")
    if any(a[0] == "hava" and b[0] == "hava" for a, b in zip(ogeler, ogeler[1:])):
        raise ValueError("Art arda iki boşluk olamaz.")
    if pvb <= 0:
        raise ValueError("PVB kalınlığı sıfırdan büyük olmalı.")
    kat = []
    for i, (tur, v) in enumerate(ogeler):
        if i and tur == "cam" and ogeler[i - 1][0] == "cam":
            kat.append(("pvb", pvb))
        kat.append((tur, v))
    if ilk_ic:
        kat = kat[::-1]
    kal = sum(v for _, v in kat)
    kg = sum((CAM_KG_MM if t == "cam" else PVB_KG_MM if t == "pvb" else 0.0) * v for t, v in kat)
    return {"katman": kat, "kalinlik": kal, "kg_m2": kg, "ad": "+".join(f"{v:g}" for t, v in ogeler)}


ALU_YOGUNLUK = 2.7       # g/cm³


def dxf_parcalar(yol, ana_blok=""):
    """Detay DXF'indeki yardımcı parçalar (INSERT blokları). Her blok, detay çizimindeki
    kesit sayısı kadar (adet) boyuna hat boyunca devam eder.
    sinif: alu (PROFİL katmanı) | conta (epdm) | izolator (pvc) | diger
    Dönüş: [{"blok", "adet", "alan", "sinif", "kgm"}]"""
    model, bloklar, taban = _dxf_varliklar_yol(yol)
    kes, _hata = dxf_bloklar(yol)
    sayac = Counter()

    def say(ents, derin):
        for e in ents:
            if e["tur"] != "INSERT":
                continue
            ad = ""
            for k, v in e["kod"]:
                if k == "2":
                    ad = v.strip()
                    break
            if ad in bloklar and derin < 6:
                sayac[ad] += 1
                say(bloklar[ad], derin + 1)
    say(model, 0)
    out = []
    for ad, adet in sorted(sayac.items()):
        n = _norm(ad)
        if ad not in kes or n == _norm(ana_blok) or "spacer" in n:
            continue
        katlar = [_norm(dict(e["kod"]).get("8", "")) for e in bloklar[ad] if e["tur"] == "HATCH"]
        k0 = katlar[0] if katlar else ""
        if any("acilim" in k_ for k_ in katlar) or re.match(r"^\d+(?:[.,]\d+)?\s*\+\s*\d", ad):
            continue                 # 'Açılım aksesuarı' katmanı ya da '8+16+8' gibi cam bloğu: parça değil
        sinif = ("conta" if "epdm" in k0 else "izolator" if "pvc" in k0
                 else "alu" if "profil" in k0 else "")
        if re.match(r"^02\.\d\d", ad):
            sinif = "izolator"       # 02.xx.xx = ısı bariyeri (ISI_BARIYERI klasörü), katman ne olursa olsun
        if not sinif:      # katman ipucu yok: 01.xx.xx conta, 02.xx.xx izolatör, diğerleri alüminyum varsayılır
            sinif = {"01": "conta", "02": "izolator"}.get(ad[:2], "alu") \
                if re.match(r"\d\d\.\d\d", ad) else "alu"
        alan = kes[ad]["alan"]
        out.append({"blok": ad, "adet": adet, "alan": alan, "sinif": sinif,
                    "kgm": alan * ALU_YOGUNLUK / 1000 if sinif == "alu" else None})
    return out


def parca_katalog_oku(yol):
    """İsteğe bağlı parca_katalogu.csv: blok;ad;sinif;kg_m  (sinif: alu|conta|izolator|diger).
    Burada verilen değerler DXF'ten türetilenin yerine geçer."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return {}
    ayrac = max(";,\t", key=sat[0].count)
    okuyucu = csv.reader(sat, delimiter=ayrac)
    bas = [_norm(h) for h in next(okuyucu)]
    out = {}
    for r in okuyucu:
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        if not d.get("blok"):
            continue
        kg = d.get("kg_m") or d.get("kg/m") or ""
        out[_norm(d["blok"])] = {"ad": d.get("ad", ""), "sinif": _norm(d.get("sinif", "")),
                                 "kg": _say(kg, "kg_m") if kg else None}
    return out


def cam_tablosu_oku(yol):
    """cam_tablosu.csv (üretici cam tablosu): cam_mm;alternatif;yatay_ic_fitil;dis_fitil;orta_fitil;
    pvc;adaptor;dikey_ic_fitil;takoz;vida. 'alternatif' dolu satırlar otomatik seçilmez.
    Birden fazla parça '+' ile ayrılır (örn. 02.01.07+02.01.09)."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return []
    ayrac = max(";,\t", key=sat[0].count)
    okuyucu = csv.reader(sat, delimiter=ayrac)
    bas = [_norm(h) for h in next(okuyucu)]
    out = []
    for i, r in enumerate(okuyucu, start=2):
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        try:
            d["mm"] = _say(d["cam_mm"], "cam_mm")
        except KeyError:
            raise ValueError("Cam tablosunda cam_mm sütunu olmalı.")
        except ValueError as e:
            raise ValueError(f"Cam tablosu satır {i}: {e}")
        out.append(d)
    return out


# ısı bariyeri (PVC profil) seçimi: tablo dışı cam kalınlıklarında ara mesafeye göre
BARIYER_PENCERE = (4.1, 10.2)   # cam kalınlığı - bariyer ara mesafesi toplamı: ASAŞ E50 cam tablosundan (18-38 mm) çıkarıldı
BARIYER_HEDEF_BOSLUK = 9.3     # otomatik seçimde hedef boşluk (cam - bariyer toplamı): 32 mm camda 02.01.14 standardı
BARIYER_OTO = "(cama göre otomatik)"
ZINCIR_OTO, ZINCIR_YOK = "(otomatik)", "(yok)"
BARIYER_AZAMI_ADET = 2          # üst üste en fazla kaç bariyer


def bariyer_oku(yol):
    """bariyer_katalogu.csv: kod;ara_mesafe_mm;... (ara mesafe: bariyerin iki alüminyum parça arasında bıraktığı boy).
    Dönüş: [{"kod", "ara"}] ara mesafeye göre sıralı."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return []
    ayrac = max(";,\t", key=sat[0].count)
    okuyucu = csv.reader(sat, delimiter=ayrac)
    bas = [_norm(h) for h in next(okuyucu)]
    if "kod" not in bas or "ara_mesafe_mm" not in bas:
        raise ValueError("Bariyer kataloğunda kod ve ara_mesafe_mm sütunları olmalı.")
    out = []
    for i, r in enumerate(okuyucu, start=2):
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        if not d["kod"]:
            continue
        try:
            ara = _say(d["ara_mesafe_mm"], "ara_mesafe_mm")
        except ValueError as e:
            raise ValueError(f"Bariyer kataloğu satır {i}: {e}")
        if ara <= 0:
            raise ValueError(f"Bariyer kataloğu satır {i}: ara mesafe pozitif olmalı.")
        b = {"kod": d["kod"], "ara": ara, "prims": None}
        if d.get("dosya") and d.get("blok"):
            yp = os.path.join(os.path.dirname(os.path.abspath(yol)), d["dosya"])
            if os.path.exists(yp):
                try:
                    b.update(_bariyer_kesiti(yp, d["blok"]))
                except (ValueError, OSError):
                    pass            # kesit okunamazsa seçim yine çalışır, yalnızca çizim eski haliyle kalır
        out.append(b)
    return sorted(out, key=lambda b: b["ara"])


_BARIYER_KESIT_ONBELLEK = {}

# Yerleşik ısı bariyeri verisi (ASAŞ E50 kataloğu + aksesuar DXF'i): bariyer_katalogu.csv bulunamazsa kullanılır
BARIYER_VARSAYILAN = [("02.01.01", 7.9), ("02.01.02", 8.9), ("02.01.04", 10.9), ("02.01.05", 13.9), ("02.01.07", 11.9),
                      ("02.01.08", 12.9), ("02.01.09", 15.9), ("02.01.13", 11.3), ("02.01.14", 22.7)]
_BARIYER_DXF_GZ = (
    "H4sIAACL1moC/+1d244kt5F9r6/wD3SDZPD6OJpprwc7qzGsAYx9MrReAytAkABDL8Zi/33JzKwsXiKYwcyuqp5RDQyrO5uXJDMY"
    "jIhzGBSnH17ef/n4+fuTOn336fP7f//hJOYfTj7+pE5CPQsZ/3dyIv4u4/89x8fzfyA9gksRcfrTuy/v/3QyJyu8lhJOEIvMP8tY"
    "V5ze/f3Df7388ttPv/1rav786E8//vb3/0EaT7+dny6PVXwu039PP3z+9PFDeq0/pH/xBeX5p7D8NP+i8l/g/IsRJ7f8RaWen9wz"
    "hPVf7M2lF4FnJ5wU1nmphAzSnnR6DSPWfzI46U+xNenC81pfG21ORsa31sVDe3Kwvq86/zR37wwYAxCECUJpOXcP54c2vkWc0DiP"
    "sajQVmtrRYDgpYxvGks/2/NDLb32oRqefbZB+QBKei+ckHpuPxuIFbHTZnixJZ2Gp5S5FDZK2Wl4TmQPrQdyeEX3ShiTuldZT1Kb"
    "2GAannn2lw+h47TOw6uLlu0jlQbb95dBqyCr2TPPZq3ibJrdqfm8Thr9NHtw6dNZH9wkHD6bKKFBT7NnM4kJxl6EQzSjy7t3UQyn"
    "jycvvQuINdLoABtdW7RsH7DZo9rXF+FTKliO8EU5u3x94eMfG+HzUYxr4YtSZkIrfCboVvggSjQlfFn3LlgFmhYO1c50T/jm4eWV"
    "gpRn4VaXStLFh5V0CBVfZpKOfCTKGTepDrDZwzhrgZSO2NPau/dg/Ny9vLyTE/GTzMNrik5P67L0+FyScyWqSja4ZXx5+9rF1s2k"
    "ty+Dlk6FaYA+l37nQXYGiIh/fKovfRmt/SKfzbeWWNmOgErp1dLD5QW9Dda06tHI6QvmY9EAaXgSctXvrOyIZ7Okps7XNQXxzbyl"
    "l/f0+hcBjKqIs76RWrN6RFZAp4dWQQap1zG4TByMR9ZAEqdyAp10blrg+Y7qlNWqox+x8TU6ndT+Hfnod4BJILLVMSSw2p8F3FIC"
    "EYuClEDEUJnkY7VUjJeNhkSNq6fMuopaIZpYqHU1b6CQ7wDRkpoGmO+q00N6gPgCyPqPelcuA8SXWOh+v2KEWQ91rXmEq02wbmSd"
    "V8ca1qjopZbTy+oNYZvKbbze/FbnjYh6vcVgR1qK7zPb75NwdIwrkVVNasLC0mK1Vc7v1pStTe8QwDTmgRBx6RDaQy5DUPVbyrTz"
    "68sjUGnrk0jJoj2kzmDrfkfrHmk9jLSu5tbzOouZ/iQxQ1fmsxtNtcaSiat3UkNg8q/jHSVK0L5v0/c8MkBHJrtSBui8NXUu8r9I"
    "f+gIP96mqN5YQL4WkL+iC6rbCrMRvA3ApK7TIjJ9MO/vEl+iulyis/toKyGoLNxJWEYEQyLrCZULOSDw0oa5bd+Oq5T3FNyoLNuo"
    "YiT4xrINoAM1MoWNDF/LyDfboSgG2obxttsvImd5Vd2luShgQNZi+lOc5rAsxnnLJPS4IJq5LBudixvixy3bYltsSCtcmsEcTGQ7"
    "l0hRhnHRe018wlhWUdssaRQV0TFrowsYXBZsuwT/omFm1lewa5jOZ4UnNyW6nvHrRb8Z4mLSejFSwCfz1CsLwkVHMVqJRqw14wsb"
    "mf9m54+k7fzZtVHFX9XyFPKnTpxSLFKe/u2fP/73T//45bf3v/786z/lu/cf4+NzhNEgRVRZRM1F3r1/9yH+tMikFOr8wxLTFKdP"
    "f/3z50//+enj9y9rsFSngqf/TXX/9peXd++/fP7LD9kUwvTn/+tHVP/jx59++dunn375x/qnP//6879+Tg+CyCOfa9BUw/JqhDS0"
    "n1inGZTBRy8QrIOoHY0fimBS/kYbRGq68tbYoXDiQGSQLlqpzPhWcYlrqVV0SqyC6JoaqYbidAMhNyo+wJgtA8t0c+NfVKilLdrM"
    "AUx750g0iiqKRKPaGfcOxiJD1CwgZVupM+DHAjUjIRdKbJCy7awbCEMBkJFQBrXMhqaMHVmgFEgbWegoIKaT3ykbsJHlMy6CGfTL"
    "M39b4zOHtd9xrPM/woZuissyznnXy+V7rHzvkzBtnzBlWq7sYGUY8QbpktDvaZ1pvhfX9866bhfRDVK0eU+VyvLdILKg35oP5fWA"
    "U8L2MNjuwiqkalusq2UCSGPLnxAzmVzTtOVOG+GG3TrT3Banl+8/fPdpBuBRMF5tg/GqAeN9Zjratw7G+w0wvhMufg0w3m+YsvNG"
    "lPwiv4HFL9tb7c4hWHwV6gd3NSze4cYzjmWgWHkfLLG4GT3QfheLj0aJyMFg6GDxqoSf/Ctg8WX3/gxlI0iaxn3mPlSncb8Ab78P"
    "xaOypzOkUxqtGtkzKg2qCuRFoxSiYptk77KIfLTBQj17KShPBryK7lVcS56WDWgmuid6Z1cJReIvDoVPzloHibc5DhmbqAPYTmlF"
    "IgmxezYSD7uQ+HJOwurDoFB8TkQxzr4GEg+I8D/hTArkS0usbE883TrATDeKVTdm8mnBG3uOfK0x2qQdZyTUZE81uI58brh4i7NN"
    "ru+nXQucwOItsgQ2ofiikhXat5Y3yPMU5kIoQcoaSo6q0PgGa520Jq0g2WC8JcD4PteL6gAPt+Jg/Fa8FQPjK7ac9dcB4/2Wy5yJ"
    "oN8C45egW21dZfa4W5Rw4Sh7B1a3i8xrYWc0Pt8EnAs1XWN+SI+Qj8Z7VES2IvmecM7piDkTjacaxmTvgsYbDuzQfb0xNB6N4X8L"
    "aDyg6qIPVQGqLPit+x2tYyibH2l9ASezOpDcyFui8dgaxdF4bGRbaDygrR9D47E23z4aj0jdNhqfV1JB3RSNRwQDR+MRuZB8gddJ"
    "S9wWjefAP5Sm2KEoBtqG8bbfOhq/xahbtsUeR20Ijcd8TI+j8X0nE7UBeq/JQ+M97vkH9LX7aPxiPxFofBhA44WLHkDwANLNrlj8"
    "nM9SeacUSG+jC/ltovGhj8b7Bo23r4zG+w00fvnEJBjGDGFS/kYbRqLBeG48cSA0SBflg/HMQN1AzI2KDzAma8XiuQEwItiCYq8U"
    "FA98KB4OQ/Hc0BA1B08Kh1JQWJkdphkJuBAyMwTEWz4Qzw5jUEtsaMbYUQVKdyBRhY7y4SPxeNkR1I7tkxe+Nhu36zjVV0Died4q"
    "3/MkzNohJJ7nCdIl+Ug814M7iMQj3Ywh8SwXiCzIR+JZDgnbu2C7CtdB4kfYNbTVTi34AW4N19TeRuL1NhKvGyT+Q2Y2fvfWkXgp"
    "Sihe3haJj92XexGJxMeSxQ6nOAeTw31PxQf+qXi/51S855+K9zuQeH9fJN6zkXi7B4m3fCTe7jkUb/cfinfsQ/Gmk5GBfSjeoEh8"
    "H9Qo6zjhWt9DCSRjAmhv2xCl89DGKJV0nRPBbCTe7ELiywPPsPo7OdUgsStqqgFM9nQRrJxO98f96RzKyjIBaNMZIepv4SybPWfi"
    "81pRiI1sQNAZ76wENCGjoULiQZs5yJwD8WCEDB3x5APxdhcQbweAeL8HiPd3BuI9H4j3u07F+4FT8WHXqfislosGhTsog16OCSFi"
    "U5BCiFgq2+fiUevqhufiY//FJ/QdJB4pyzgXX47w0sPhc/F4w49z8Q8kfhOJf5yLf5yLfyDxbIEXCeerI1eTpV6rHm+MnfelQrjT"
    "JpYGpnX+0AT3Cufir4nEP87F3+5cPLKdb5+LR22A4+fiUasIPxePGkVsJP6Fi8QH+exsNGFTv0Iv2I2Nr6SiVautc8okWOpbROJf"
    "+kj8hwaJ/+6VkXhUGgaQeGYIk3I3Ro7FB/6xeM8/Fu+PIvGejcRbPhJvj56Kt/xT8QZF4gcOxRs+Em8OI/HcyBA1B0MHvO0AEm8H"
    "kHh/FIn3fCTeDxyJD4ePxLODCpTuGDgSz/bvO2X5oB3bJf8ajsRfA4h/HIn/WoF49pF4NhD/LRyJJ+xv/pF4pqW9DcSbbSDe1EC8"
    "UherUYn7APGKD8RDeWpL12YofWarAVulTKHmCYg31UPSJ4K+FZvlp49Fx5F4qSoo/rZIfNl93NdpNFRKxOXbQuKRSoPtd5H4WKeE"
    "4m+LxFfd96D4sAeKD3woPuyB4sN9ofjAh+L9Dije3xeK93wo3u+C4v29oXjPh+LDLig+VOnpjyUHjy1hJ5I74snPTx92QfFhAIpH"
    "dA0Diy9rxa3kxlg8qv9xLB7V/5tYPNUBJoTIZscQwmqHvqkIIiYFKYKIpcIA4uHOQDwMAPGwC4iHawHx8ADiH0D840j8A4h/APGP"
    "I/GPI/FfOxAPe4B4uA4QD3wgHg4A8dFGvIThpM3CcH/w7V1oxbayaOnCuFBtqEBMZnazAUWt3O5AoWMIq0X7SjQvgDpLs9i4ry7X"
    "gMEu8YaiknetrowlTUPuid7QZMtrUwxMd4bQvfzRtRGA7bMGRSUpkfEIg3wTPWf9C8Wbm+bysSRQtsNUR+MbmJBaNL4hNyz3anhB"
    "YxLgNfa9wCLm5+y7VoKo6dAv8k1I11I9U84ksfKATYGJTXuwcQcz3i5EcKXCc/xeLi5wr0RaN98iBUZBlwKjVE2BwcAMFgUmaTuM"
    "ArMsWQrmLqAdJ9WWprr8VW0jURKs29AblIwqBhKlBQytYqooMk5kKH5oQaHCoG8lDCQfCg7yoZhIEhX2GSFEcWGdAYSGLsonRHHx"
    "kgHog4rTjjCiAp8R5Y8yojyfEeUPM6I8nxEVDjOiwsAtIWGAEYUKzRAlihuEHgknU4tsjBLFDe9S6mOEEgUDlCg4TImCByXqjeQm"
    "eVCiHrlJbkCJgqOUKHglSpTbpkS5hhKV3RKi7JunRMkStGsurJNB2uulJpF8RpSssm+xGFHivowowWZEhT25SQI/N0nYkZskFKQQ"
    "oWWtdqRLxl3DCZHgGuGYL5+vGFHpmnog8f6AGvjN7X70zZp1UcbNnVT7qzkatY3mSJ7L8/NN4cib0qEcniLRoAG1cTqUvS8dyvLp"
    "UHYXHcremw5l+XQoR1wS0mcH5LWSQWIPcVEGr2do1hNJRHG7uFBugAsV9lChwp3TkgR+WpKwKy1JGEhLguxyHCqUuCMVqrUlaCqU"
    "3EOFQqyqWzKh5AATSu5iQslrMaHkgwn1YEI9mFCPy0EeTKgHE+rBhPramVByDxNKXocJJflMKNlnQilhrTMUHyM8mFBvgwkFe5hQ"
    "8LpMKFBjVCjNp0LpXVQouDMVCq5JhXo3kA1IBadlUFapsNBPQnw3F5Rx3jsfrPw2qVD9e3lUcy+Peu17eVBF3GpXGn6WfPYL5ukP"
    "sV8Em/0S+OmAwtF0QMzY+ECYGw/LjVBfuDFnIrw5RH2xfOqLPUx9sXzqiyOu5eHzOJix0ZEoJyEvQ7yXwE8FFAZSAaHLa4z3wo3l"
    "UYpjhPciB3gv8jDvRT54L487eR68l98P70Ue5b1IJu8FsQrf3coq/HoJ8nCUIK/5BHl9lCAPbIL8FgnKb5OgfEOCeskk5f2bJ0Gp"
    "+17QpNgXNKk9aaHkfUlQkp8WSuxJCyX4aaHEjrRQomJBzc27EtTvkKB8zgVBZk+5tDjJpCd59245tEVdsLIjLZTnp4Xye9JC+fum"
    "hfL8tFCummjLCRa6QjjkOVuwypATZ0wjHQllaRDERAkyNVI00YdI6XB8IpTbRYQqJ2VNmpRVssGZlueinZI1YqSiGg2mQYycB9kZ"
    "YPNRyGCh35UXyldXNN32dhw/cEWT38WF8iN5oVplw8kLVWpIfXbEXJkkr10ESZ5KLk8ihDZHh2fqaEdBsrNCiV1ZocRAVii5iwol"
    "qyuabnxDkxq4oUntYUOpOyeGUgN0KLWLDqWuRYdSDzrUHelQGr3laPj6kqHW/Y7WHzc0PRJDcelQiNRt06HySjBbKTejQyGCgdOh"
    "ELmQAwKfsKXb0qHYNzShtygNK4rHDU13p0OpPXQodR06lOLTodSBxFDxvw861JugQ+k9dCh918RQhs+GMrvYUPrObCh9TTbUHwcS"
    "Q3nwLnpvBqJKn+fAuGcnjZVBJuaJ+zbvRotz1MW9Xhrc6/3vDvfSR3Evw8e9zFHcSx9IDAXiVsJAUuPUwcRQin1RnjqaF0ry80IJ"
    "fl4ocTQvFBMwGcA+qDjtCDnO8/NCoTHvIXac47Pj3GF2HDtET83CEN3LD9yV50cyQ2FiM5YZSvAzQ4mBzFDyMENODVyWpw4y5NQA"
    "Q04dZsipb4ghx4sb8mOAj8vyEIYc0s0YQ44VjCILXuGyPH2o4NfGkFNHGXLqlTJDhW1SVKhJUXG7u0RF1JsnRZn7XpZn+KmhzB5W"
    "lL4vK0rzWVGwhxUFfFYU7GBFwX0vywP2ZXnEUc4+aYI4oUS0n1ukwGTklayo25Ki8u4nM7zLmBvPDlVVunFyKFlKHFiaE4UUZXCi"
    "Kr4L+Fsnh0I+So+RUn9rHiOlvC3v1ul5qiXVy86D0jV2LG+KEwW77sqDMkOUufVdecBnRcEuVhQMsKL0LlaUvmOCKDNwV57ZQ4ky"
    "d6ZEmQFKlNlFiTLXokSZByXqkSHqkSHqQYl6ZIh6ZIh6ZIj62ilRZg8lylyHEmX4lChzhBJlH5Sot0GJcnsoUe6ulCjPp0T5XZQo"
    "d2dKlLsiJSqawixKlPJxz2ruytPJq5MKtLEBov+tvklKFJguCwZ0zYLBsIxvnBLljlKiPJ8S5Y9SotwRSpS9lTCQlChzkBJl+NnC"
    "zFFOlOZzooDPiYKjnChg35XHRT6IMO0IJYoLQ1AR7yFKFBcVoIoOUaLYAXpqFkYzYLHC5SOBb0poxhhRwGdEwQAjSh9mRJmBu/LM"
    "QUaUGWBEmcOMKPPIGfa4K++RM+z3kzPMHGVEmddhRKVw5QYjKhYpGFEq+b6L4Rh/lvdnRHVjMaXFHVbqcRWgIUMxVSBGi9DGRp0l"
    "aRtF91asPGtxDsVkkeOwnvcWTSwm/7IpLYRCIzRkMMZXsRhogel+MKZ+zcXVWrx5ZBDwLE1yW1SUTiGVCL0hQVjstbKWtIqOx1Rv"
    "b6AlI/UCMsjUT/3b6q2n8G/zDSVWlJY7m16vHZ/Sho7HVEOZ4zEl2NCJxxSG1Sp37UeZDxMjw0tfF4vGxGVh2WzE8k5KBct+KqJx"
    "tr5GNMdawHxiCdSTED/8xNcDqYuHrpO1PHcYhV5yI0SlFl/Ge+u1EzDPQkmtd0HNaXTiu2phlJdBgJEizkg9wpzFoJ06jzBqxuha"
    "RF8uRPvS0oxEkCUjsckl1Wck4kuz7F+HzjoNz+ryLVzc8FgdtLVkjcrCmVRB93DWBPndlGIhjfjncKmlFQCdjitPRQRqAc7LXERa"
    "0cSsPK12/FZzrriifznFEue7CZqyc5au7hziPThiDjExtHGOzlII02BoKbRqSeZkn/UqBFp51eEmllK4cBNLKexxE3EhyfsHH92+"
    "jhiaZrprIcmzl3k7r7OyFiD0RKmin9hEt0H7drdwnr7VtE2eNndvMXXaFJVY0QrAzXmIdmEsmGINGIewEyGVbVLSQbtbxLEqknmG"
    "7xYGWwL4btF+6jplR4aaG2jlQ6cQLskLK1N1zhdXlpk6OxdXlhGCYPTSebWiZEUwVsKyVjdSiVrcePu+L/qlUjUzZ6GqZIwbzeaX"
    "w1lSeEuLRqPTKf2Pi8bGBoOL3kD7zV7HkLx6fzZcyVPhFUSvtSlmPsslNqWEW1C/xlSp+CxZQOp8b0FlXglL8xFLSvrCRywp6R0+"
    "YtG7X249iG9cfLqFrINZ0G3RanCY61SOzp0p6QNkP41KXNuulFjRhZ/IeNNUbJCIhTQjZlcRak76THcSDb+pjF0ohGwoUQpiy1+e"
    "KD+tm0hTEFX7jrNPLyX2N4yzs91eW0fKE2p4brbuj7XuidYX968mXymMl0gxEEtKWWzANlEHb4Ojow7I2NpY3uTbIt8FtsYGWOv1"
    "zA3yeAT+zsj3ENj3yNcC3d6ymp54TTyNtwGk0C2gHrJCW1YiSUBsWKgNp0Z2Tq/h3w2RiieJj81vjM03Y2uZiRQJMdQsRIRgAz0X"
    "BF3O2OD2aIsnvrp42qPrnvjKDm9fPrfBF0IdXxiJ8z55lqGOhwz0MtBYDLPZmbBizR7J4/tp1NkUSzRSo+5lu7tz3q5nazDPPRAN"
    "Y0ZSGS0z/nxlcFOWCMtdSFKiR5KSIhp92kE0AaWX7swrif5n7Cc6rOBFiB7kFUlS4/SmaXQ0o2WCJApGCw5MHGK0IF8H/ZIkpswO"
    "Rgo0CoQ6DjSphRsYHAnxUWoQKdvhtbDjbSORM3LOGj+fprawo1hk2TZi0iG3sGNK4sQtSpJb2AEeqmg7CyRRgxtvGQidUEU9Y74N"
    "hLFAxkBMgiraLLPByUIiBAKLEKD6g1JAXHed9LxxVYfh02wXmyo62QU0y4Lyk8WJNFVQOovvu618F5TvTpIla0uVpLNwnTvSUdvq"
    "KWNE8FyynrPV9aKoPyLOJEJl0UNejUC9Gt58nPviOhkD/sKA6U8Vlah4r1wR2nqn7NNlvRDtdexv8q+IJd1pn2cyo2aivZWZSLDg"
    "8f1AoepsIcF3KCIkT0FhX0iC9Vt8DfKvLTWApsGzuRPU4ACzXFAaPJfHsM100ttMJ10znWzGdLJfF9MpnS9rSUJS3obpNLFL6wMP"
    "IaxUi5qoVp9wmor2OFDGY8NLC/wWHKj5ndvuEaLFZXhRM8a31qBcuo5Byf74FoJ0VUva2xCi1gEmXkD+1g0fav7SEinZE06vsdEp"
    "9OstZ/I5dChg0aEuwtl8khplXEfXfGg8CGP3cqPCWe2rpNrOr+QI8M633Kh0VWXDjerdX9kepln6jz5LtDWjRxIVLMaNmg6ITHOS"
    "7CkjfUhHILTqc6OmvGxzpCm5khZsbCbVdrfhRl2WbN6/tks+HXzNKpE2qvPXCHWCAqqHppbEUlb0O8C4UXqhvcRacKllzxlnSmRB"
    "6JobFTcg30TVnYwSwOJGKQEO6d9IqRpu1FI2qQXfn0K8h7YWLYaxrFrF0NoNclRK0Tb14J79KgZOe4WRo6zHyFGAkaNGxbDsP1F6"
    "O1uHq+e7R446h4fKWile0LCjjLOvTY6aDlkt3QtEuTZFJVa0Q46SC4W7GF6cRtuSo+Jc6YYc5bWGofs6ib3DIWsA3zvaT01TVCbi"
    "aysfaSC3oKik81PL+qvWlMTyLzIWOFKJWt94+62y6dCjYJm9tlJNj3KxU9diYOs/bz2LErXgnLjSJ2yJ/q6Cy9tI+80Ox5C3els2"
    "N5W31pSoKVHyvCU3BgrNiFLrIUGWVfXalKjphODSPSbtmBXdFqWZRhfZKIYXjnKiOu3WnKj1vUVlH4seRSqdyFyCRnktkwDDxgGY"
    "nlbuqVEyxXEqGmN6DCxy1XmEGLlqMc363Kq0tSyht+wf6JbdALohN8hgEN8TFI9YtSicspdw5h63AykCiUZ4v912W0UieZo4bfsj"
    "bXuibYRgZdcc6pmvu1Ddrk6wWmk8vh2ZRL4IbI1sgyI0VTnCrppPh6LNSjSJ2ia/am0RJUfRjTztaQVIqcM4Vgv3rqykxE1IVj3J"
    "QOhSm6LxtE0r1MvN7lfnWGEEr3VsO5TFE1tbPO1Qc09sPYe23mrbHtcKzgn4iiidQXaHyb6oJW6+TF3r4lnXScdYvwg76+xQbrCz"
    "ollkh7fnQnVqt6TudeXTwCN1rU4yYlU0HK9LsKaxVjpjvARrOrbTHo5X3jASwiiiftYup4PaskR4kcnxUkqEaCaHoJyLnUyyrnxU"
    "LqBEOhNgg3pj/C7b53fZBrizV+V3zV8G/YpMflcnoIre44R7QUx+Vy+4ORKmJLQwUpTJ7+rGDEeif+SctZEKJsGrF4nrla3jCkyC"
    "Vy8uhuU0wovyCF69IFWnaDULTM5SJ2Q0EP2hiiKBHB7DqxOXGQixkEWbdTY4W0jAA7nyEVcgLIJXL/jQiSNgym6T4dULGFBFka2d"
    "R/gqfHfqyBOb70V702zXmO3nUgVrA5rH/KJ9C8qF3OoH5331nMWuF9j37si/Iq4uj/vVm5An3tQxmV+068N3Y/guCVGyFVkuByx3"
    "ESjzdYAC1rXWycKI3c1jhHUMbNSwtLcyLDmMsIumrPkEPHpYh1dDUzjqokziWIfkQttHDaOCySLrEE7IKahLsjhkHfJHxSGLv/zw"
    "8j7+EP//y8fP359UfPTl45ePLz/kf335/MfT/wNMkhg2TT4BAA=="
)


def bariyer_varsayilan():
    """Yerleşik bariyer listesi (kesitleriyle birlikte)."""
    import base64, gzip
    metin = gzip.decompress(base64.b64decode("".join(_BARIYER_DXF_GZ.split()))).decode("utf-8")
    s = metin.split("\n")
    cift = [(s[i].strip(), s[i + 1]) for i in range(0, len(s) - 1, 2)]
    _, bloklar, taban = _dxf_varliklar(cift)
    out = []
    for kod, ara in BARIYER_VARSAYILAN:
        b = {"kod": kod, "ara": ara, "prims": None}
        try:
            b.update(_bariyer_blok_prims(bloklar, taban, kod))
        except (ValueError, KeyError):
            pass
        out.append(b)
    return sorted(out, key=lambda b: b["ara"])



def _bariyer_kesiti(yol, blok):
    """Bariyer bloğunun çizim öğeleri. Dönüş: {"prims", "bbox", "uzun": 0|1 (boyuna eksen: 0=x, 1=y)}"""
    anahtar = (os.path.abspath(yol), os.path.getmtime(yol))
    if anahtar not in _BARIYER_KESIT_ONBELLEK:
        _BARIYER_KESIT_ONBELLEK[anahtar] = _dxf_duzlestir(yol)
    _, bloklar, taban = _BARIYER_KESIT_ONBELLEK[anahtar]
    if blok not in bloklar:
        raise ValueError(f"{blok} bloğu yok")
    return _bariyer_blok_prims(bloklar, taban, blok)


def _bariyer_blok_prims(bloklar, taban, blok):
    prims, sayac = [], {}
    for e in bloklar[blok]:
        _varlik_prim(e, _I, bloklar, taban, prims, sayac)
    bb = _prim_bbox(prims)
    if not bb:
        raise ValueError("boş blok")
    return {"prims": prims, "bbox": bb, "uzun": 0 if (bb[2] - bb[0]) >= (bb[3] - bb[1]) else 1}


def bariyer_sec(bariyerler, kalinlik, pencere=BARIYER_PENCERE, azami=BARIYER_AZAMI_ADET):
    """Toplam cam kalınlığına göre bariyer(ler)i seçer. Önce tek bariyer (pencereye giren en uzun), yetmezse
    üst üste iki (toplamı pencereye giren en uzun). Pencere dışında kalırsa en yakın çözüm + uyarı.
    Dönüş: ([kod, ...] alttan yukarı, boşluk mm, uyarı | None)"""
    import itertools
    lo, hi = pencere
    adaylar = []
    for n in range(1, azami + 1):
        for kom in itertools.combinations_with_replacement(bariyerler, n):
            adaylar.append((n, sum(b["ara"] for b in kom), kom))
    for n in range(1, azami + 1):
        uygun = [(top, kom) for k, top, kom in adaylar if k == n and lo - 1e-9 <= kalinlik - top <= hi + 1e-9]
        if uygun:
            # pencere içinde, boşluğu standart (32 mm cam + 02.01.14) boşluğuna en yakın olan seçilir: köprü fitili
            # (01.05.xx) cam konumunda sabit olduğundan boşluk küçüldükçe izolatör fitile girer
            top, kom = min(uygun, key=lambda x: (abs(kalinlik - x[0] - BARIYER_HEDEF_BOSLUK), -x[0]))
            return [b["kod"] for b in sorted(kom, key=lambda b: -b["ara"])], kalinlik - top, None
    orta = (lo + hi) / 2
    n, top, kom = min(adaylar, key=lambda a: (abs(kalinlik - a[1] - orta), a[0]))
    bosluk = kalinlik - top
    return ([b["kod"] for b in sorted(kom, key=lambda b: -b["ara"])], bosluk,
            f"Isı bariyeri: {kalinlik:.2f} mm cam için uygun kombinasyon yok; en yakın seçimde boşluk "
            f"{bosluk:.1f} mm ({lo:g}–{hi:g} mm aralığı dışında).")


# ---- sistem başına "katalog kuralları": toplam cam kalınlığına göre sabit ısı bariyeri seçimi
def cam_kurallari(sistem):
    """Ayar dosyasındaki sistem kuralları: [{"min","max","bariyer","not"}], min'e göre sıralı."""
    kay = sistem_kaydi(sistem) if sistem else None
    out = []
    for k in (kay or {}).get("cam_kurallari") or []:
        try:
            out.append({"min": float(k["min"]), "max": float(k["max"]),
                        "bariyer": str(k.get("bariyer", "")).strip(), "not": str(k.get("not", ""))})
        except (KeyError, ValueError, TypeError):
            continue
    return sorted(out, key=lambda k: (k["min"], k["max"]))


def cam_kurallari_yaz(sistem, liste):
    kay = sistem_kaydi(sistem, olustur=True)
    if kay is None:
        return False
    kay["cam_kurallari"] = [dict(k) for k in liste]
    ayar_kaydet()
    return True


def kural_bariyer(kurallar, kalinlik):
    """Toplam cam kalınlığına uyan ilk kural (bariyeri tanımlı olan) | None."""
    for k in kurallar or []:
        if k.get("bariyer") and k["min"] - 0.01 <= kalinlik <= k["max"] + 0.01:
            return k
    return None


def bariyer_coz(bariyerler, metin):
    """'02.01.05+02.01.07' -> (kataloğa göre yazılmış kodlar, kataloğda olmayan kodlar)"""
    kat = {k_: v_["kod"] for k_, v_ in _FITIL_EK.items()}
    kat.update({_norm(b["kod"]): b["kod"] for b in bariyerler or []})
    kodlar, eksik = [], []
    for t in str(metin).split("+"):
        t = t.strip()
        if not t:
            continue
        (kodlar if _norm(t) in kat else eksik).append(kat.get(_norm(t), t))
    return kodlar, eksik


def bariyer_toplam(bariyerler, kodlar):
    kat = {k_: v_["ara"] for k_, v_ in _FITIL_EK.items()}
    kat.update({_norm(b["kod"]): b["ara"] for b in bariyerler or []})
    return sum(kat.get(_norm(k), 0.0) for k in kodlar)


def bariyer_kombinasyonlari(bariyerler, azami=BARIYER_AZAMI_ADET):
    """Eldeki bariyerlerden tek ve çift kombinasyonlar: [(metin, toplam ara mm)] toplama göre sıralı."""
    tek = sorted(bariyerler or [], key=lambda b: b["ara"])
    out = [(b["kod"], b["ara"]) for b in tek]
    if azami >= 2:
        for i, a in enumerate(tek):
            for b in tek[i:]:
                out.append((f"{a['kod']}+{b['kod']}", a["ara"] + b["ara"]))
    return sorted(out, key=lambda x: (x[1], x[0]))


def kalinlik_tablosu(bariyerler, kurallar, kalinliklar):
    """Her toplam cam kalınlığı için sonuç: [(kalınlık, kaynak 'kural'|'otomatik', bariyer metni, boşluk mm, not)]"""
    out = []
    for kal in kalinliklar:
        k = kural_bariyer(kurallar, kal)
        if k:
            kodlar, eksik = bariyer_coz(bariyerler, k["bariyer"])
            if kodlar and not eksik:
                top = bariyer_toplam(bariyerler, kodlar)
                bos = kal - top
                nt = "" if BARIYER_PENCERE[0] - 1e-9 <= bos <= BARIYER_PENCERE[1] + 1e-9 else "boşluk aralık dışı"
                out.append((kal, "kural", "+".join(kodlar), bos, nt or k.get("not", "")))
                continue
        if bariyerler:
            kodlar, bos, uy = bariyer_sec(bariyerler, kal)
            out.append((kal, "otomatik", "+".join(kodlar), bos, "aralık dışı" if uy else ""))
        else:
            out.append((kal, "otomatik", "", 0.0, "bariyer kataloğu yok"))
    return out


def cam_tablosu_bul(tablo, kalinlik):
    """Toplam cam kalınlığına (PVB dahil) uygun satır: kalınlığı karşılayan ilk (en küçük) satır.
    Dönüş: (satır | None, uyarı | None)"""
    asil = sorted((r for r in tablo or [] if not r.get("alternatif")), key=lambda r: r["mm"])
    if not asil:
        return None, None
    if asil[0].get("oto"):
        return asil[0], None            # kütüphaneden otomatik kurulan sistem: tek satır, bariyer hesapla seçilir
    for r in asil:
        if kalinlik <= r["mm"] + 0.01:
            u = None
            if r["mm"] - kalinlik > 2.0:
                u = (f"Cam {kalinlik:.2f} mm: tabloda tam karşılığı yok, {r['mm']:g} mm satırı "
                     f"kullanıldı.")
            return r, u
    return None, (f"Cam {kalinlik:.2f} mm tablodaki en kalın cam ({asil[-1]['mm']:g} mm) değerini aşıyor.")


def cam_secim_parcalari(r):
    """Tablo satırından hat başına parçalar: {"dikey": [(kod, adet, sinif)], "yatay": [...]}"""
    def pvc():
        sayac = {}
        for k in r.get("pvc", "").split("+"):
            if k.strip() and not (_FITIL_EK.get(_norm(k.strip())) or {}).get("fitil"):     # fitil şablondan sayılır
                sayac[k.strip()] = sayac.get(k.strip(), 0) + 1
        return [(k, n, "izolator") for k, n in sayac.items()]
    if r.get("oto"):
        return {"dikey": pvc(), "yatay": pvc()}
    ortak = [(r["dis_fitil"], 2, "conta"), (r["orta_fitil"], 1, "conta")]
    return {"dikey": [(r["dikey_ic_fitil"], 2, "conta")] + ortak + pvc(),
            "yatay": [(r["yatay_ic_fitil"], 2, "conta")] + ortak + pvc()}


def yatay_tipleri_oku(yol):
    """yatay_tipleri.csv: tip;ekle;cikar;silikon_derz_en_mm;silikon_derz_der_mm;silikon_taraf;kartus_ml;sablon;ayna
    Şablon detaydaki yatay parçalarına göre tip farkı: ekle='KOD:adet|KOD:adet' (hat başına adet), cikar='KOD|KOD'
    (bu tipte olmayan şablon parçaları). Silikon sütunları doluysa hat uzunluğu x taraf kadar yapısal silikon ve
    kartuş (derz en x derin ve kartuş hacmine göre) metraja eklenir. Dosya yoksa tek tip: Standart."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return list(YATAY_TIP_VARSAYILAN)
    ayrac = max(";,\t", key=sat[0].count)
    okuyucu = csv.reader(sat, delimiter=ayrac)
    bas = [_norm(h) for h in next(okuyucu)]
    out = []
    for i, r in enumerate(okuyucu, start=2):
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        if not d.get("tip"):
            continue
        try:
            ekle = []
            for tok in [t for t in d.get("ekle", "").split("|") if t.strip()]:
                kod, _, ad_ = tok.partition(":")
                ekle.append((kod.strip(), float(ad_.replace(",", ".")) if ad_.strip() else 1.0))
            cikar = [_norm(t) for t in d.get("cikar", "").split("|") if t.strip()]
            en = _say(d["silikon_derz_en_mm"], "silikon_derz_en_mm") if d.get("silikon_derz_en_mm") else 0.0
            der = _say(d["silikon_derz_der_mm"], "silikon_derz_der_mm") if d.get("silikon_derz_der_mm") else 0.0
            taraf = _say(d["silikon_taraf"], "silikon_taraf") if d.get("silikon_taraf") else 2.0
            kart = _say(d["kartus_ml"], "kartus_ml") if d.get("kartus_ml") else 310.0
        except ValueError as e:
            raise ValueError(f"yatay_tipleri.csv satır {i}: {e}")
        sab = None
        if d.get("sablon"):
            f_, _, b_ = d["sablon"].partition("|")
            f_ = f_.strip()
            sab = ((f_ if os.path.isabs(f_) else os.path.join(os.path.dirname(os.path.abspath(yol)), f_)), b_.strip(),
                   d.get("ayna", "").strip() in ("1", "evet", "true"))
        out.append({"tip": d["tip"], "ekle": ekle, "cikar": cikar, "sablon": sab,
                    "silikon": (en, der, taraf, kart) if en > 0 and der > 0 else None})
    return out or list(YATAY_TIP_VARSAYILAN)


YATAY_TIP_VARSAYILAN = [{"tip": "Standart", "ekle": [], "cikar": [], "sablon": None, "silikon": None}]


def yatay_tip_atama(n_hat, tipler, eski=None):
    """Her yatay hat için tip adı. eski listedeki geçerli adlar korunur; boşluklar: uç hatlar 1. tip (kapaklı),
    aradakiler 2. tip (silikonlu), tek tip varsa hepsi o."""
    adlar = [t["tip"] for t in tipler]
    uc = adlar[0]
    ara = adlar[1] if len(adlar) > 1 else adlar[0]
    out = []
    for i in range(n_hat):
        v = eski[i] if eski and i < len(eski) and eski[i] in adlar else None
        out.append(v or (uc if i in (0, n_hat - 1) else ara))
    return out


def parca_ozet(parca, dikey_m, yatay_m, katalog=None, secim=None, ekstra=None, cikar=None, kodlar=None, boy_ov=None):
    """parca: {"dikey": [...], "yatay": [...]} -> (satırlar, ağırlık özeti)
    secim: cam tablosu satırı; verilirse conta/izolatör DXF yerine tablodan alınır.
    satır: (Parça, Hat, Sınıf, Adet/hat, Toplam m, kg/m, kg)"""
    katalog = katalog or {}
    SN = {"alu": "Alüminyum", "conta": "Conta", "izolator": "İzolatör", "diger": "Diğer"}
    sat, topl = [], {"alu": 0.0, "conta": 0.0, "izolator": 0.0}
    metre = {"conta": 0.0, "izolator": 0.0}
    tab = cam_secim_parcalari(secim) if secim else {}
    for tur, m in (("dikey", dikey_m), ("yatay", yatay_m)):
        liste = []
        for pr in (parca or {}).get(tur) or []:
            sinif, kgm, ad = pr["sinif"], pr["kgm"], pr["blok"]
            if secim and (sinif == "izolator" or (sinif == "conta" and not secim.get("oto"))):
                continue                      # tablodan gelecek (otomatik sistemde yalnızca bariyer)
            liste.append((pr["blok"], pr["adet"], sinif, kgm))
        for kod, adet, sinif in tab.get(tur, []):
            liste.append((kod, adet, sinif, None))
        taban_kg = {_norm(pr["blok"]): pr["kgm"] for pr in (parca or {}).get(tur) or []}
        for ex in [e for e in (ekstra or []) if e[0] == tur]:
            kod, adet_, m_ = ex[1], ex[2], ex[3]
            kg_ = ex[4] if len(ex) > 4 and ex[4] is not None else taban_kg.get(_norm(kod))
            liste.append((kod, adet_, (ex[5] if len(ex) > 5 and ex[5] else None) or (katalog.get(_norm(kod)) or {}).get("sinif") or "alu", kg_, m_))
        for it in liste:
            kod, adet, sinif, kgm = it[:4]
            ad = kod
            kt = katalog.get(_norm(kod))
            if kodlar is not None and kod not in [x[0] for x in kodlar.setdefault(tur, [])]:
                kodlar[tur].append((kod, (kt or {}).get("ad") or "", sinif))
            if kt:
                sinif = kt["sinif"] or sinif
                ad = (kod + " " + kt["ad"]).strip() if kt["ad"] and kt["ad"] != kod else kod
                if kt["kg"] is not None:
                    kgm = kt["kg"]
            if len(it) > 4:
                m_h = it[4]
            elif _norm(kod) in ((boy_ov or {}).get(tur) or {}):
                m_h = boy_ov[tur][_norm(kod)]               # sürekli parça: kesim boylarının toplamı
            else:
                m_h = max(0.0, m - ((cikar or {}).get(tur) or {}).get(_norm(kod), 0.0))
            tm = adet * m_h
            if tm <= 1e-9 and _norm(kod) in ((cikar or {}).get(tur) or {}) and len(it) < 5:
                continue                       # tüm uzunluğundan çıkarılmış parça listede gösterilmez
            kg = tm * kgm if kgm is not None else None
            if kg is not None and sinif in topl:
                topl[sinif] += kg
            if sinif in metre:
                metre[sinif] += tm
            sat.append((ad, tur.capitalize(), SN.get(sinif, sinif), adet, round(tm, 2),
                        "" if kgm is None else f"{kgm:.3f}", "" if kg is None else round(kg, 2)))
    return sat, {"yard_alu_kg": topl["alu"], "conta_m": metre["conta"], "izolator_m": metre["izolator"],
                 "conta_kg": topl["conta"], "izolator_kg": topl["izolator"]}


def kural_oku(yol):
    """cam_kurallari.csv: sistem;cam_min;cam_max;dikey_dosya;dikey_blok;yatay_dosya;yatay_blok
    Toplam cam kalınlığı (mm, PVB dahil) cam_min..cam_max aralığındaysa o detay DXF'leri seçilir.
    Dosya yolları CSV'nin klasörüne göre; sistem boşsa her sistemde geçerli."""
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254")
    sat = [x for x in metin.splitlines() if x.strip()]
    if len(sat) < 2:
        return []
    ayrac = max(";,\t", key=sat[0].count)
    okuyucu = csv.reader(sat, delimiter=ayrac)
    bas = [_norm(h) for h in next(okuyucu)]
    klasor = os.path.dirname(os.path.abspath(yol))
    out = []
    for i, r in enumerate(okuyucu, start=2):
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas)}
        try:
            k = {"sistem": _norm(d.get("sistem", "")),
                 "min": _say(d["cam_min"], "cam_min"), "max": _say(d["cam_max"], "cam_max")}
        except KeyError:
            raise ValueError("Kural tablosunda cam_min / cam_max sütunları olmalı.")
        except ValueError as e:
            raise ValueError(f"Kural tablosu satır {i}: {e}")
        for tur in ("dikey", "yatay"):
            f = d.get(f"{tur}_dosya", "")
            k[tur] = ((f if os.path.isabs(f) else os.path.join(klasor, f)), d.get(f"{tur}_blok", "")) if f else None
        out.append(k)
    return out


def kural_bul(kurallar, sistem, kalinlik):
    sn = _norm(sistem or "")
    for k in kurallar or []:
        if (not k["sistem"] or k["sistem"] == sn) and k["min"] - 0.01 <= kalinlik <= k["max"] + 0.01:
            return k
    return None


def cam_secim_metni(s):
    """Cam tablosu seçimini özetleyen satırlar (arayüz ve PDF)."""
    r = s.get("cam_secim")
    out = []
    if r and r.get("oto"):
        pass
    elif r:
        out.append(f"Cam tablosu: {r['mm']:g} mm satırı | iç fitil {r['dikey_ic_fitil']}/{r['yatay_ic_fitil']}"
                   f" (dikey/yatay), dış {r['dis_fitil']}, orta {r['orta_fitil']}, PVC {r['pvc']}")
        ek = f"takoz {r['takoz']} ({s['agirlik']['takoz'][1]} adet), vida {r['vida']}"
        if r.get("adaptor"):
            ek = f"adaptör {r['adaptor']}, " + ek
        out.append(ek)
    if s.get("bariyer_not"):
        out.append(s["bariyer_not"])
    if s.get("cam_secim_uyari"):
        out.append("UYARI: " + s["cam_secim_uyari"])
    return out


def cam_uyarilari(detay, yapi):
    """Girilen cam kalınlığı, detay DXF'inin çizildiği cam kalınlığından farklıysa uyarı metni listesi."""
    if not yapi:
        return []
    fark = {}
    for tur in ("dikey", "yatay"):
        d = (detay or {}).get(tur)
        g = _cam_geo(d, tur) if d else None
        if g and abs(g[4] - yapi["kalinlik"]) > 0.5:
            fark[tur] = g[4]
    if not fark:
        return []
    kal0 = "/".join(f"{v:.0f}" for v in fark.values())
    if DETAY_OLCEK:
        return [f"Detay DXF'i {kal0} mm cam için çizilmiş (girilen {yapi['kalinlik']:.2f} mm): kapak mesafesi "
                f"ve izolatör boyu buna göre ölçeklendi, ancak izolatör/conta kesit şekilleri aynı. "
                f"Kesin çizim için bu kalınlığa ait detayı kural tablosuna ekleyin."]
    return [f"Detay DXF'i {kal0} mm cam için çizilmiş (girilen {yapi['kalinlik']:.2f} mm). Hiçbir parça ölçeklenmedi: "
            f"kapak, baskı ve fitiller şekli bozulmadan cam farkı kadar ötelendi; kalan boşluk ya da binmeleri kesitte "
            f"görürsünüz. Gerekirse parçayı elle oturtun (Shift+sürükle) ya da bu kalınlığa ait detayı kural tablosuna ekleyin."]


def kesit_atalet(k):
    """Kesit özellikleri (mm biriminde, DXF eksenlerine göre): alan, ağırlık merkezi,
    Ixx = ∫y²dA, Iyy = ∫x²dA (ağırlık merkezinden, mm⁴) ve en uzak lifteki mukavemet momentleri
    Wx, Wy (mm³). İç (delik) konturlar derinliğe göre çıkarılır."""
    A = Sx = Sy = Ix0 = Iy0 = 0.0
    for lp, d in zip(k["donguler"], k["derin"]):
        sg = 1 if d % 2 == 0 else -1
        n = len(lp)
        a2 = sxx = syy = ixx = iyy = 0.0
        for i in range(n):
            x0, y0 = lp[i]
            x1, y1 = lp[(i + 1) % n]
            c = x0 * y1 - x1 * y0
            a2 += c
            sxx += (x0 + x1) * c
            syy += (y0 + y1) * c
            ixx += (y0 * y0 + y0 * y1 + y1 * y1) * c
            iyy += (x0 * x0 + x0 * x1 + x1 * x1) * c
        if a2 < 0:
            a2, sxx, syy, ixx, iyy = -a2, -sxx, -syy, -ixx, -iyy
        A += sg * a2 / 2
        Sx += sg * sxx / 6
        Sy += sg * syy / 6
        Ix0 += sg * ixx / 12
        Iy0 += sg * iyy / 12
    xc, yc = Sx / A, Sy / A
    Ixx, Iyy = Ix0 - A * yc * yc, Iy0 - A * xc * xc
    ys = [p[1] for lp in k["donguler"] for p in lp]
    xs = [p[0] for lp in k["donguler"] for p in lp]
    return {"alan": A, "Ixx": Ixx, "Iyy": Iyy,
            "Wx": Ixx / max(max(ys) - yc, yc - min(ys)),
            "Wy": Iyy / max(max(xs) - xc, xc - min(xs))}


# ---- statik ön hesap (birimler: kg, cm, kgf/cm²; statik hesap raporlarıyla aynı) ----
G_YER = 9.80665            # kgf -> N
E_ALU_NMM2 = 70000.0       # N/mm²
E_ALU = E_ALU_NMM2 * 10.1972     # kg/cm²
KOMB_G, KOMB_W = 1.35, 1.50      # Eurocode: 1.35G + 1.50W
GAMA_M = 1.1
F0_VARSAYILAN = 1600.0     # kg/cm² (6060 T66 karakteristik gerilme)
SEHIM_DIKEY_EK_CM = 0.5    # dikey: L/300 + 0.5 cm
SEHIM_YATAY_ZAYIF_MAX = 0.3    # yatay zayıf eksen: L/500 ya da 0.3 cm (küçük olan)


# arazi kategorisi (TS EN 1991-1-4): z0 (m), zmin (m)
ARAZI = {"0": ("0 – Deniz / açık su", 0.003, 1.0), "I": ("I – Düz açık arazi", 0.01, 1.0),
         "II": ("II – Seyrek engelli arazi", 0.05, 2.0), "III": ("III – Banliyö / orman", 0.3, 5.0),
         "IV": ("IV – Şehir merkezi", 1.0, 10.0)}
# cephe bölgesi: net basınç katsayısı |cpe| + |cpi| (cpi ≈ 0.3, yaklaşık ön değerler)
RUZGAR_BOLGE = {"orta": ("Orta alan (cp ≈ 1.10)", 1.10), "kenar": ("Kenar bölgesi A (cp ≈ 1.50)", 1.50),
                "kose": ("Köşe / yerel (cp ≈ 1.70)", 1.70)}
# dikey profil mesnet şemaları: (M katsayısı wL², sehim katsayısı wL⁴/EI, en büyük mesnet tepkisi wL, ad)
MESNET = {"basit": (1 / 8, 5 / 384, 0.5, "Basit mesnetli (her kat)"),
          "surekli2": (1 / 8, 0.0054, 1.25, "2 açıklıklı sürekli (ortada ankraj)"),
          "surekli3": (0.10, 0.0069, 1.10, "3+ açıklıklı sürekli"),
          "konsol": (0.5, 0.125, 1.0, "Konsol (tek ucu ankrajlı)")}


def ruzgar_basinci(z, arazi="III", vb=28.0, cp=1.10):
    """Eurocode 1 (EN 1991-1-4) yöntemiyle yaklaşık tepe hız basıncı ve cephe tasarım basıncı.
    z: bina yüksekliği (m); arazi: ARAZI anahtarı; vb: temel rüzgar hızı (m/s); cp: net basınç katsayısı.
    Dönüş: {"qp": kN/m², "w": kN/m² (qp·cp), "cr", "Iv", "vm"}"""
    import math
    _ad, z0, zmin = ARAZI.get(arazi, ARAZI["III"])
    zz = max(float(z), zmin)
    kr = 0.19 * (z0 / 0.05) ** 0.07
    cr = kr * math.log(zz / z0)
    vm = cr * vb
    Iv = 1.0 / math.log(zz / z0)
    qp = (1 + 7 * Iv) * 0.5 * 1.25 * vm * vm / 1000.0          # kN/m² (ρ = 1.25 kg/m³)
    return {"qp": qp, "w": qp * cp, "cr": cr, "Iv": Iv, "vm": vm, "z": zz}


def on_analiz(s):
    """Girilen rüzgar yüküne (kN/m²) göre yaklaşık statik ön hesap; basit mesnetli kiriş, düzgün yayılı yük.
    Gerilme: 1.35G+1.50W (Eurocode), σ_RD = f0/γm; sehim: G+W (servis). Birimler statik hesap
    raporlarındaki gibi: kg, cm, kg/cm², kgcm.
    Dönüş: None (rüzgar girilmediyse ya da kesit yoksa) ya da bölümler sözlüğü."""
    p = s.get("p") or {}
    kn = p.get("ruzgar_kn") or 0.0
    kes = s.get("kesit") or {}
    if kn <= 0 or not (kes.get("dikey") or kes.get("yatay")):
        return None
    f0 = p.get("f0") or F0_VARSAYILAN
    y_ = s.get("cam_yapi")
    Gk = p.get("cam_kg") or (y_["kg_m2"] if y_ else 0.0)            # kg/m²
    W_kgm2 = kn * 1000.0 / G_YER                                       # kg/m²
    q = W_kgm2 / 1e4                                                   # kg/cm²
    cols, rows = s["cols"], s["rows"]
    bol = [z["y1"] - z["y0"] for z in s["bolgeler"]]
    cam_h = [z["y1"] - z["y0"] for z in s["bolgeler"] if z["tip"] == "cam"] or bol
    sig_rd = f0 / GAMA_M
    n = len(cols)
    a = {"kn": kn, "kgm2": W_kgm2, "f0": f0, "sig_rd": sig_rd, "G": Gk, "kesim": {}, "satir": [],
         "not": [f"Rüzgar {kn:g} kN/m² = {W_kgm2:.1f} kg/m²; kombinasyon {KOMB_G:g}G+{KOMB_W:g}W (Eurocode); "
                 f"f0 = {f0:g} kg/cm², γm = {GAMA_M:g}, σ_RD = {sig_rd:.1f} kg/cm²; E = {E_ALU_NMM2:g} N/mm².",
                 "Basit mesnetli kiriş, düzgün yayılı yük; yalnızca genel bilgi amaçlıdır, nihai kontrol statik hesapla yapılmalıdır."]}
    if kes.get("dikey"):
        at = kesit_atalet(kes["dikey"])
        I, Wx, A = (p.get("dik_ix") or at["Ixx"] / 1e4, p.get("dik_wx") or at["Wx"] / 1e3,
                    p.get("dik_a") or at["alan"] / 100.0)
        kaynak_d = "girilen" if any(p.get(k) for k in ("dik_ix", "dik_wx", "dik_a")) else "DXF kesiti"
        tw = max(((cols[i - 1] if i > 0 else 0) + (cols[i] if i < n else 0)) / 2 for i in range(n + 1)) / 10
        sema = p.get("dik_mesnet") if p.get("dik_mesnet") in MESNET else "basit"
        mc, dc, rc, sema_ad = MESNET[sema]
        L = (p.get("ankraj_mm") or max(rows)) / 10               # ankraj (mesnet) aralığı, cm
        w = q * tw                                               # kg/cm
        Mw = mc * w * L * L
        M = KOMB_W * Mw
        Ng = Gk * (tw / 100) * (L / 100)                         # kg (cam ağırlığı)
        N = KOMB_G * Ng
        sig = M / Wx + N / A
        d = dc * w * L ** 4 / (E_ALU * I)
        dl = (L / 150) if sema == "konsol" else (L / 300 + SEHIM_DIKEY_EK_CM)
        a["dikey"] = {"sema": sema, "sema_ad": sema_ad, "rc": rc, "dc": dc, "mc": mc, "w": w, "L": L, "tw": tw, "M3": M, "N": N, "Wx": Wx, "A": A, "I": I, "sig": sig, "sig_rd": sig_rd,
                      "ok_g": sig <= sig_rd, "d": d, "dl": dl, "ok_d": d <= dl, "kaynak": kaynak_d,
                      "Ireq": dc * w * L ** 4 / (E_ALU * dl),
                      "Rw": rc * w * L, "Rg": Ng}
    if kes.get("yatay"):
        at = kesit_atalet(kes["yatay"])
        If, Wf = p.get("yat_i3") or at["Iyy"] / 1e4, p.get("yat_w3") or at["Wy"] / 1e3   # kuvvetli (rüzgar)
        Iz, Wz = p.get("yat_i2") or at["Ixx"] / 1e4, p.get("yat_w2") or at["Wx"] / 1e3   # zayıf (cam ağırlığı)
        A = p.get("yat_a") or at["alan"] / 100.0
        kaynak_y = "girilen" if any(p.get(k) for k in ("yat_i3", "yat_w3", "yat_i2", "yat_w2", "yat_a")) \
            else "DXF kesiti"
        tr = max(((bol[k - 1] if k > 0 else 0) + (bol[k] if k < len(bol) else 0)) / 2
                 for k in range(len(bol) + 1)) / 10
        L = (max(cols) - s["vw"]) / 10
        w = q * tr
        Mw = w * L * L / 8
        M3 = KOMB_W * Mw
        bay_m = max(cols) / 1000.0
        Pt = Gk * bay_m * (max(cam_h) / 1000.0) / 2                # kg, her cam takozu
        M2 = KOMB_G * Pt * L / 4                                    # takozlar L/4'te
        sig = M3 / Wf + M2 / Wz
        d_k = 5 * w * L ** 4 / (384 * E_ALU * If)
        dl_k = L / 200
        d_z = 11 * Pt * L ** 3 / (768 * E_ALU * Iz)
        dl_z = min(L / 500, SEHIM_YATAY_ZAYIF_MAX)
        a["yatay"] = {"w": w, "L": L, "tr": tr, "M3": M3, "M2": M2, "Wx": Wf, "Wy": Wz, "A": A, "sig": sig,
                      "sig_rd": sig_rd, "ok_g": sig <= sig_rd, "kaynak": kaynak_y, "d_k": d_k, "dl_k": dl_k,
                      "d_z": d_z, "dl_z": dl_z, "ok_d": d_k <= dl_k and d_z <= dl_z,
                      "If": If, "Iz": Iz, "Ireq": 5 * w * L ** 4 / (384 * E_ALU * dl_k)}
        a["takoz"] = {"Gk": Gk, "bay": bay_m, "H": max(cam_h) / 1000.0, "P": Pt}
    return a


def statik_bolumleri(a):
    """[(başlık, [(büyüklük, değer, birim)])]: rüzgar yüküne göre genel (ön) değerlendirme, kg/cm² birimlerinde."""
    if not a:
        return []
    ok = lambda b: "OK" if b else "YETERSİZ"
    r = [("Rüzgar yükü W", f"{a['kn']:.2f} kN/m²  ({a['kgm2']:.0f} kg/m²)", ""),
         ("Cam ağırlığı G", f"{a['G']:.1f}", "kg/m²"),
         ("İzin verilen gerilme σ_RD = f0 / γm", f"{a['sig_rd']:.0f}", "kg/cm²")]
    d, y = a.get("dikey"), a.get("yatay")
    if d:
        r += [("Dikey profil mesnet şeması", d.get("sema_ad", "Basit mesnetli"), ""),
              (f"Dikey profil (L = {d['L']:.0f} cm): gerilme", f"{d['sig']:.0f}", "kg/cm²"),
              ("   gerilme kontrolü", ok(d["ok_g"]), ""),
              ("Dikey profil: sehim / sınır" + (" (L/150)" if d.get("sema") == "konsol" else " (L/300 + 0.5)"),
               f"{d['d']:.2f} / {d['dl']:.2f}", "cm"),
              ("   sehim kontrolü", ok(d["ok_d"]), "")]
        if not d["ok_d"]:
            r.append(("   gereken Jxx / mevcut", f"{d['Ireq']:.0f} / {d['I']:.0f}", "cm⁴"))
    if y:
        r += [(f"Yatay profil (L = {y['L']:.0f} cm): gerilme", f"{y['sig']:.0f}", "kg/cm²"),
              ("   gerilme kontrolü", ok(y["ok_g"]), ""),
              ("Yatay profil: sehim / sınır (L/200)", f"{y['d_k']:.2f} / {y['dl_k']:.2f}", "cm"),
              ("Yatay profil: cam ağırlığı sehimi / sınır", f"{y['d_z']:.2f} / {y['dl_z']:.2f}", "cm"),
              ("   sehim kontrolü", ok(y["ok_d"]), "")]
    return [("Rüzgar yüküne göre genel değerlendirme", r)]


def analiz_satirlari(a):
    """Arayüz için kısa özet satırları."""
    if not a:
        return []
    out = []
    ok = lambda b: "OK" if b else "YETERSİZ"
    d, y = a.get("dikey"), a.get("yatay")
    if d:
        out.append(f"Dikey: σ {d['sig']:.0f} / {d['sig_rd']:.0f} kg/cm² {ok(d['ok_g'])}; "
                   f"sehim {d['d']:.2f} / {d['dl']:.2f} cm {ok(d['ok_d'])}")
        if not d["ok_d"]:
            out.append(f"   gereken Jxx ≥ {d['Ireq']:.0f} cm⁴ (mevcut {d['I']:.0f}): takviye gerekir")
    if y:
        out.append(f"Yatay: σ {y['sig']:.0f} / {y['sig_rd']:.0f} kg/cm² {ok(y['ok_g'])}; sehim "
                   f"{y['d_k']:.2f} / {y['dl_k']:.2f} cm (kuvvetli), {y['d_z']:.2f} / {y['dl_z']:.2f} cm (zayıf)"
                   f" {ok(y['ok_d'])}")
    return out


MAL_KOLON = (("Kalem", 190, "sol"), ("Kod / ölçü", 150, "sol"), ("Birim", 50, "sol"),
             ("Miktar", 80, "sag"), ("Ağırlık (kg)", 90, "sag"))


def malzeme_listesi(s):
    """Parça gruplarına göre malzeme listesi.
    Dönüş: [(grup başlığı, [(kalem, kod/ölçü, birim, miktar, kg)], (toplam satırı))]"""
    p = s["p"]
    g = []

    def f(v, nd=2):
        return "" if v in ("", None) else (f"{v:.{nd}f}" if isinstance(v, float) else str(v))
    kgm = {p["dikey_ad"]: p["dikey_kg"], p["yatay_ad"]: p["yatay_kg"]}
    r1 = [(r[0], f"{r[1]:g} mm", "adet", r[2], f(r[4])) for r in s["kesim"]]
    fire_ = {ad: fr for ad, _n, fr in s["ozet"]["cubuk_ozet"]}
    ek_ = float(p.get("siparis_ek") or 0.0)
    if ek_ > 0:                                   # sipariş eki: çubuk adedi yukarı yuvarlanarak artırılır
        r1 += [(ad, f"{boy:g} mm çubuk (net {n}, +%{ek_:g} sipariş eki; fire %{fire_.get(ad, 0.0):.1f})", "çubuk",
                math.ceil(n * (1 + ek_ / 100) - 1e-9), f(kg * math.ceil(n * (1 + ek_ / 100) - 1e-9) / n if n else kg))
               for ad, boy, n, kg in s["cubuk_stok"]]
    else:
        r1 += [(ad, f"{boy:g} mm çubuk (profil fire %{fire_.get(ad, 0.0):.1f})", "çubuk", n, f(kg))
               for ad, boy, n, kg in s["cubuk_stok"]]
    g.append(("1. Alüminyum profil (ana)", r1,
              ("Teorik kesim ağırlığı", "", "kg", "", f(s["ozet"]["ana_kg"]))))
    gruplar = {"Alüminyum": [], "Diğer": [], "Conta": [], "İzolatör": []}
    for r in s.get("parca") or []:
        gruplar.setdefault(r[2], []).append(r)

    def parca_grup(baslik, anahtarlar, birim_kg=True):
        rows = [r for k in anahtarlar for r in gruplar.get(k, [])]
        if not rows:
            return
        satir = [(r[0], r[1], "m", f(r[4]), f(r[6]) if r[6] != "" else "") for r in rows]
        top_m = sum(r[4] for r in rows)
        top_kg = sum(r[6] for r in rows if r[6] != "")
        g.append((baslik, satir, ("Toplam", "", "m", f(top_m), f(top_kg) if top_kg else "")))
    parca_grup("2. Alüminyum - yardımcı (baskı plakası, kapak)", ("Alüminyum", "Diğer"))
    parca_grup("3. Conta (EPDM)", ("Conta",))
    parca_grup("4. İzolatör (PVC)", ("İzolatör",))
    sil = gruplar.get("Silikon", [])
    if len(sil) >= 2:
        g.append(("4b. Silikon", [(r[0], r[1], "m", f(r[4]), "") for r in sil[:-1]] +
                  [(sil[-1][0], sil[-1][1], "adet", str(sil[-1][3]), "")], ("", "", "", "", "")))
    if s.get("parca_kesim"):
        rp = [(r[0], f"{r[1]:g} mm", "adet", r[2], f(r[4])) for r in s["parca_kesim"]]
        rp += [(ad, f"{boy:g} mm çubuk", "çubuk", n, f(kg)) for ad, boy, n, kg in s.get("parca_cubuk_stok") or []]
        g.append(("2b. Sürekli parça kesim listesi (kapak, baskı ...)", rp, ("", "", "", "", "")))
    y = s.get("cam_yapi")
    cam = [r for r in s["cam"] if r[0] == "Cam"]
    if cam:
        ad = (y["ad"] + " mm") if y else "Cam"
        kg2 = y["kg_m2"] if y else 0.0
        rows = [(ad, r[1], "adet", r[2], f(r[3] * kg2) if y else "") for r in cam]
        g.append(("5. Cam", rows, ("Toplam", f"{sum(r[3] for r in cam):.2f} m²", "adet",
                                   sum(r[2] for r in cam), f(s["ozet"]["cam_kg"]) if y else "")))
    sp = [r for r in s["cam"] if r[0] != "Cam"]
    if sp:
        sy = s.get("spandrel_yapi")
        satir_p, top_m2, top_kg, top_ad = [], 0.0, 0.0, 0
        for r in sp:
            tk_ = panel_id(r[0])
            pt = PANEL_TIPLERI[tk_]
            if tk_ == "spandrel":
                ad_s = ("Spandrel " + sy["ad"] + " mm") if sy else "Spandrel"
                kg2 = sy["kg_m2"] if sy else None
            else:
                ad_s = r[0] + (f" {pt['kal']:g} mm" if pt.get("kal") else "")
                kg2 = pt.get("kg_m2")
            kg_r = r[3] * kg2 if kg2 else None
            top_m2 += r[3]
            top_ad += r[2]
            top_kg += kg_r or 0.0
            satir_p.append((ad_s, r[1], "adet", r[2], f(kg_r) if kg_r else ""))
        g.append(("6. Spandrel / panel", satir_p, ("Toplam", f"{top_m2:.2f} m²", "adet", top_ad, f(top_kg) if top_kg else "")))
    sec = s.get("cam_secim")
    if sec:
        ak = []
        tl_ = (s.get("agirlik") or {}).get("takoz_list")
        if tl_:
            for kod_t, n_t in tl_:
                ak.append(("Cam takozu", kod_t, "adet", n_t, ""))
        elif sec.get("takoz") and (s.get("agirlik") or {}).get("takoz"):
            ak.append(("Cam takozu", sec["takoz"], "adet", s["agirlik"]["takoz"][1], ""))
        if sec.get("adaptor"):
            ak.append(("Adaptör profil", sec["adaptor"], "m", "projeye göre", ""))
        if sec.get("vida"):
            ak.append(("Vida", sec["vida"], "adet", "statik hesaba göre", ""))
        if ak:
            g.append(("7. Aksesuar (cam tablosundan)", ak, ("", "", "", "", "")))
    ek = s.get("ek_malzeme") or []
    if ek:
        satir_e, top_kg_e = [], 0.0
        for e_ in ek:
            kg_e = e_["miktar"] * e_["kg"] if e_.get("kg") else None
            top_kg_e += kg_e or 0.0
            satir_e.append((e_["ad"] or e_["kod"], e_["kod"], e_["birim"], f"{e_['miktar']:g}",
                            f(kg_e) if kg_e else ""))
        g.append(("8. Ek malzeme (elle eklenen)", satir_e, ("Toplam", "", "", "", f(top_kg_e) if top_kg_e else "")))
    return g


def hesapla(cols, rows, p, ek=None, tip=None, parca=None, parca_kat=None, cam_tablo=None, bariyerler=None,
            ytip=None, ytipler=None, hucre=None, dik_yok=None, yat_yok=None,
            dtip=None, dtipler=None, dik_tip=None, yat_tip=None, parca_cikar=None, parca_grup=None,
            takoz_hat=None, yalanci=None):
    """ek[j]: j. katın içine alttan ölçülen ek yatay profil yükseklikleri,
    tip[j]: o katın bölgeleri (alttan yukarı) için 'cam' | 'spandrel'."""
    vw, hw = p["dikey_g"], p["yatay_g"]
    if min(cols) <= vw or min(rows) <= hw:
        raise ValueError("Bir aks aralığı/kat yüksekliği profil genişliğinden küçük.")
    ek = [sorted(e) for e in ek] if ek else [[] for _ in rows]
    if len(ek) != len(rows):
        raise ValueError("Ek yatay listesi kat sayısıyla uyuşmuyor.")
    tip = [list(t) for t in tip] if tip else [["cam"] * (len(e) + 1) for e in ek]
    for j, r in enumerate(rows):
        e = ek[j]
        if any(h <= 0 or h >= r for h in e) or any(b <= a for a, b in zip(e, e[1:])):
            raise ValueError(f"Kat {aks_adi(j)}-{aks_adi(j + 1)}: ek yatay ölçüleri "
                             f"0 ile {r:g} arasında ve birbirinden farklı olmalı.")
        if len(tip[j]) != len(e) + 1 or any(t not in PANEL_TIPLERI for t in tip[j]):
            raise ValueError(f"Kat {aks_adi(j)}-{aks_adi(j + 1)}: bölge tipleri ek yatay sayısıyla uyuşmuyor.")
    cy, cizgiler, bolgeler, hat_id = _zonalar(rows, ek, tip)
    # hücre bazlı tip ve 'boş' profil işaretleri (geçersiz indisler atılır)
    hucre = {(j, k, i): t for (j, k, i), t in (hucre or {}).items()
             if j < len(rows) and k < len(ek[j]) + 1 and i < len(cols) and t in PANEL_TIPLERI}
    dik_yok = {(i, j) for i, j in (dik_yok or ()) if i <= len(cols) and j < len(rows)}
    gecerli_hat = set(hat_id)
    yat_yok = {(j, q, i) for j, q, i in (yat_yok or ()) if (j, q) in gecerli_hat and i < len(cols)}
    # yalancı hat: profilsiz, iki yanındaki cam birleşik. ("d", aks) iç aksları, ("y", kat, hat) iç yatay hatları
    yalanci = {k_ for k_ in (yalanci or ())
               if (k_[0] == "d" and 1 <= k_[1] <= len(cols) - 1)
               or (k_[0] == "y" and (k_[1], k_[2]) in gecerli_hat and 0 < hat_id.index((k_[1], k_[2])) < len(hat_id) - 1)}
    dik_yok_ham, yat_yok_ham = set(dik_yok), set(yat_yok)
    # yalancı hatta profil durur (yalnız gaga kertilir): profil kesimden ve ağırlıktan düşmez, sadece cam birleşir
    cam_gr = _cam_gruplari(cols, bolgeler, cizgiler, hat_id, yalanci, hucre)
    cx_ = [0.0]
    for c_ in cols:
        cx_.append(cx_[-1] + c_)

    alt, ust = p["dikey_alt"], p["dikey_ust"]
    n = len(rows)
    dilat = float(p.get("dilatasyon", 0.0) or 0.0)
    gecis = {int(k_[1]) for k_ in (p.get("dik_gecis") or ()) if 0 < int(k_[1]) < n}
    orta = {int(k_[1]) for k_ in (p.get("dik_orta") or ()) if 0 <= int(k_[1]) < n}
    kesimler = []
    # Dikey kayıtlar: dikey her kat hattında kesilir (birleşim + dilatasyon boşluğu); 'düşey geçsin' işaretli hatta
    # kesilmez; 'kat ortasında birleşsin' işaretli ince katta kesim katın ortasında yapılır. alt/üst uçlar ilk/son parçaya eklenir.
    kes_n, cum_n = dikey_kesim_noktalari(rows, gecis, orta)
    for i in range(len(cols) + 1):
        j = 0
        while j < n:
            if (i, j) in dik_yok:
                j += 1
                continue
            j0 = j
            while j + 1 < n and (i, j + 1) not in dik_yok:
                j += 1
            for _lo, _hi, boy in dikey_boylari(cum_n[j0], cum_n[j + 1], kes_n, alt, ust, dilat, j0 == 0, j == n - 1):
                if boy <= 0:
                    raise ValueError("Dikey profil boyu sıfır ya da negatif (alt/üst uzantı ve dilatasyonu kontrol edin).")
                kesimler.append((p["dikey_ad"], boy))
            j += 1
    # Yatay kayıtlar: her yatay hatta (kat eksenleri + ek hatlar), her aks boşluğunda bir adet
    hat_uz = []                                   # her hattın kalan (boş işaretlenmemiş) toplam boyu, mm
    for (_y, _ek), hid in zip(cizgiler, hat_id):
        uz = 0.0
        for i, c in enumerate(cols):
            if (hid[0], hid[1], i) in yat_yok:
                continue
            kesimler.append((p["yatay_ad"], round(c - vw, 1)))
            uz += c - vw
        hat_uz.append(uz)

    cam = Counter()
    takoz_say = Counter()                    # (kat, hat sırası) -> hattın üstündeki cam sayısı (takoz hattın üstündeki camın altına konur)
    cam_wh = []
    for g_ in cam_gr:
        z0_, z1_ = bolgeler[g_["z0"]], bolgeler[g_["z1"]]
        tp_ = g_["tip"]
        if PANEL_TIPLERI[tp_].get("bos"):
            continue                         # boş bölge / hücre: dolgu yok
        w = (cx_[g_["i1"] + 1] - cx_[g_["i0"]]) - 2 * float(_CAM_UI.get("aks_d") or CAM_AKS_VARSAYILAN)
        h = (z1_["y1"] - z0_["y0"]) - 2 * float(_CAM_UI.get("aks_y") or CAM_AKS_VARSAYILAN)
        if w <= 0 or h <= 0:
            raise ValueError("Cam–aks mesafesi sonrası cam/panel ölçüsü sıfırın altına düşüyor "
                             "(bölge yüksekliğini kontrol edin).")
        cam[(tp_, round(w, 1), round(h, 1))] += 1
        if tp_ == "cam":
            takoz_say[(z0_["kat"], z0_["k"])] += 1
            cam_wh.append((w, h))

    stok_map = {}
    for ad_ in {k[0] for k in kesimler}:
        tur_ = "dikey" if ad_ == p["dikey_ad"] else "yatay"
        lst_ = stok_sec(p.get("stoklar"), tur_)
        if lst_:
            stok_map[ad_] = lst_
    cubuk_uyari = []
    kisa_ = sorted({b_ for ad_, b_ in kesimler if ad_ == p["dikey_ad"] and b_ < 600})
    if kisa_:
        cubuk_uyari.append("Kısa düşey parça var (" + ", ".join(f"{b_:g}" for b_ in kisa_) + " mm): bu ölçüler kat değil ek yatay "
                           "ise ek yatay olarak girin; ya da kat hattı menüsünden 'Düşey bu hattan geçsin' seçin.")
    plan = kesim_plani(kesimler, p["cubuk"], p["testere"], stok_map, cubuk_uyari)
    kgm = {p["dikey_ad"]: p["dikey_kg"], p["yatay_ad"]: p["yatay_kg"]}
    cam_yapi = None
    if p.get("cam_yapi"):
        cam_yapi = cam_coz(p["cam_yapi"], p.get("pvb", 0.76), p.get("ilk_ic", False))
    sp_yapi = None
    if p.get("spandrel_yapi"):
        sp_yapi = cam_coz(p["spandrel_yapi"], p.get("pvb", 0.76), p.get("ilk_ic", False))

    kesim_sat = []
    for (ad, boy), adet in sorted(Counter(kesimler).items()):
        tb = boy * adet / 1000
        kesim_sat.append((ad, boy, adet, round(tb, 2), round(tb * kgm[ad], 2)))

    cubuk_sat, cubuk_ozet, siparis_kg, cubuk_stok = [], [], 0.0, []
    for ad, cubuklar in plan.items():
        grup = Counter((c[2], tuple(c[1]), round(c[0], 1)) for c in cubuklar)
        for (boy_, kes, kalan), adet in sorted(grup.items(), key=lambda x: (-x[0][0], -x[1])):
            cubuk_sat.append((ad, boy_, adet, " + ".join(f"{b:g}" for b in kes), kalan))
        kullanilan = sum(sum(c[1]) for c in cubuklar)
        stok = sum(c[2] for c in cubuklar)
        cubuk_ozet.append((ad, len(cubuklar), 100 * (1 - kullanilan / stok)))
        siparis_kg += stok / 1000 * kgm[ad]
        for boy_, n_ in sorted(Counter(c[2] for c in cubuklar).items(), reverse=True):
            cubuk_stok.append((ad, boy_, n_, boy_ * n_ / 1000 * kgm[ad]))

    cam_sat = []
    for (tp, w, h), adet in sorted(cam.items()):
        cam_sat.append((PANEL_TIPLERI[tp]["ad"], f"{w:g} x {h:g}", adet, round(adet * w * h / 1e6, 2)))
    cam_m2 = sum(x[3] for x in cam_sat if x[0] == "Cam")
    sp_m2 = sum(x[3] for x in cam_sat if x[0] != "Cam")
    cam_adet = sum(x[2] for x in cam_sat if x[0] == "Cam")
    sp_adet = sum(x[2] for x in cam_sat if x[0] != "Cam")
    cam_kg = cam_m2 * cam_yapi["kg_m2"] if cam_yapi else 0.0
    ana_kg = sum(r[4] for r in kesim_sat)
    dikey_m = sum(r[3] for r in kesim_sat if r[0] == p["dikey_ad"])
    yatay_m = sum(r[3] for r in kesim_sat if r[0] == p["yatay_ad"])
    secim, secim_uyari = (cam_tablosu_bul(cam_tablo, cam_yapi["kalinlik"])
                          if (cam_tablo and cam_yapi) else (None, None))
    bariyer_not = None
    if not secim and cam_tablo and bariyerler and cam_yapi:
        asil = sorted((r for r in cam_tablo if not r.get("alternatif")), key=lambda r: r["mm"])
        if asil and cam_yapi["kalinlik"] > asil[-1]["mm"] + 0.01:
            secim = asil[-1]
            secim_uyari = (f"Cam {cam_yapi['kalinlik']:.2f} mm tablodaki en kalın cam ({asil[-1]['mm']:g} mm) değerini "
                           f"aşıyor; fitil ve takoz {asil[-1]['mm']:g} mm satırından alındı, bariyer hesapla seçildi.")
    sabit_k = None
    if secim and cam_yapi and bariyerler:
        sabit_k = kural_bariyer(secim.get("sabit"), cam_yapi["kalinlik"])
        if sabit_k and bariyer_coz(bariyerler, sabit_k["bariyer"])[1]:
            sabit_k = None                         # kuraldaki bariyer kataloğda yok: otomatik seçime düş
    if secim and (secim_uyari or secim.get("oto") or sabit_k) and bariyerler and cam_yapi:
        # tabloda bu kalınlık yok (ya da otomatik sistem ya da katalog kuralı var): bariyeri belirle
        kaynak = "cama göre otomatik seçildi"
        if secim.get("elle"):                     # arayüzden elle seçilen bariyer kombinasyonu
            kodlar = [k_.strip() for k_ in secim["elle"].split("+") if k_.strip()]
            top_ = sum(b_["ara"] for k_ in kodlar for b_ in list(bariyerler) + list(_FITIL_EK.values())
                       if _norm(b_["kod"]) == _norm(k_))
            bosluk, buy = cam_yapi["kalinlik"] - top_, None
            kaynak = "elle seçildi"
            if not (BARIYER_PENCERE[0] - 1e-9 <= bosluk <= BARIYER_PENCERE[1] + 1e-9):
                buy = (f"Elle seçilen bariyerle boşluk {bosluk:.1f} mm "
                       f"({BARIYER_PENCERE[0]:g}–{BARIYER_PENCERE[1]:g} mm aralığı dışında).")
        elif sabit_k:                             # sistem kuralı (Katalog kuralları sekmesi)
            kodlar = bariyer_coz(bariyerler, sabit_k["bariyer"])[0]
            bosluk, buy = cam_yapi["kalinlik"] - bariyer_toplam(bariyerler, kodlar), None
            kaynak = f"katalog kuralından seçildi ({sabit_k['min']:g}–{sabit_k['max']:g} mm)"
            if not (BARIYER_PENCERE[0] - 1e-9 <= bosluk <= BARIYER_PENCERE[1] + 1e-9):
                buy = (f"Kuralın bariyeriyle boşluk {bosluk:.1f} mm "
                       f"({BARIYER_PENCERE[0]:g}–{BARIYER_PENCERE[1]:g} mm aralığı dışında).")
        else:
            kodlar, bosluk, buy = bariyer_sec(bariyerler, cam_yapi["kalinlik"])
        secim = dict(secim, pvc="+".join(kodlar))
        bariyer_not = f"Isı bariyeri {kaynak}: {' + '.join(kodlar)} (boşluk {bosluk:.1f} mm)"
        if buy:
            bariyer_not += " | " + buy
    takoz_not = None
    if secim and cam_yapi:
        te = secim.get("takoz_elle") or ZINCIR_OTO
        if te == ZINCIR_YOK:
            secim = dict(secim, takoz="")
            takoz_not = "Cam takozu: yok (elle)"
        elif te != ZINCIR_OTO:
            secim = dict(secim, takoz=te)
            takoz_not = f"Cam takozu: {te} (elle seçildi)"
        elif secim.get("takoz_kural"):
            if cam_wh:
                pk = cam_yapi["kg_m2"] * (max(w_ for w_, _ in cam_wh) / 1000.0) * (max(h_ for _, h_ in cam_wh) / 1000.0)
            else:
                pk = cam_yapi["kg_m2"] * ((max(cols) - vw) / 1000.0) * ((max(rows) - hw) / 1000.0)
            kod_t = takoz_sec(secim["takoz_kural"], pk)
            if kod_t:
                secim = dict(secim, takoz=kod_t)
                takoz_not = f"Cam takozu: {kod_t} (en büyük cam paneli ≈ {pk:.0f} kg, kurala göre)"
            else:
                takoz_not = f"Cam takozu: en büyük panel ≈ {pk:.0f} kg için kural yok (tablodaki: {secim.get('takoz') or '-'})"
    # yatay hat tipleri (kapaklı / silikonlu ...): şablondan fark parçaları ve silikon
    ytipler = ytipler or YATAY_TIP_VARSAYILAN
    ytip = yatay_tip_atama(len(cizgiler), ytipler, ytip)
    tip_say = {t["tip"]: t for t in ytipler}
    dtipler = dtipler or YATAY_TIP_VARSAYILAN
    dtip = dtip if dtip in {t["tip"] for t in dtipler} else dtipler[0]["tip"]
    dtip_say = {t["tip"]: t for t in dtipler}
    yat_tip = {k: v for k, v in (yat_tip or {}).items() if k[:2] in gecerli_hat and k[2] < len(cols) and v in tip_say}
    dik_tip = {k: v for k, v in (dik_tip or {}).items() if k[0] <= len(cols) and k[1] < len(rows) and v in dtip_say}
    parca_cikar = {k: set(v) for k, v in (parca_cikar or {}).items() if v}
    # segment (dikme parçası / yatay parça) bazında tip, silikon ve çıkarılan parçalar
    cikar_m = {"dikey": {}, "yatay": {}}
    ekle_ac = {}                                      # (tür, kod, adet, ...) -> metre
    sil_m = Counter()                                 # (tür, tip) -> metre
    tip_hat = Counter()
    tip_dik = Counter()
    segler = []
    for h_, hid in enumerate(hat_id):
        for i, c in enumerate(cols):
            if (hid[0], hid[1], i) in yat_yok:
                continue
            ad_s = yat_tip.get((hid[0], hid[1], i), ytip[h_])
            segler.append(("yatay", (c - vw) / 1000, ad_s, parca_cikar.get(("y", hid[0], hid[1], i), ())))
            tip_hat[ad_s] += (c - vw) / 1000
    for i in range(len(cols) + 1):                    # düşey: gerçek kesim parçaları (dilatasyon/geçiş/orta) kata bağlanır
        j = 0
        while j < n:
            if (i, j) in dik_yok:
                j += 1
                continue
            j0 = j
            while j + 1 < n and (i, j + 1) not in dik_yok:
                j += 1
            for lo_, _hi, boy_ in dikey_boylari(cum_n[j0], cum_n[j + 1], kes_n, alt, ust, dilat, j0 == 0, j == n - 1):
                jj = next((q for q in range(j0, j + 1) if cum_n[q] - 1e-6 <= lo_ < cum_n[q + 1] - 1e-6), j0)
                ad_s = dik_tip.get((i, jj), dtip)
                segler.append(("dikey", boy_ / 1000, ad_s, parca_cikar.get(("d", i, jj), ())))
                tip_dik[ad_s] += boy_ / 1000
            j += 1
    for tur_s, L_, ad_s, kal_ in segler:
        t_ = (tip_say if tur_s == "yatay" else dtip_say)[ad_s]
        rem = {_norm(x) for x in kal_}
        t_cik = {_norm(x) for x in t_["cikar"]}
        for k_ in t_cik | (rem - {_norm("silikon")}):
            cikar_m[tur_s][k_] = cikar_m[tur_s].get(k_, 0.0) + L_
        for e_ in t_["ekle"]:
            if _norm(e_[0]) in rem:
                continue
            kk = (tur_s, e_[0], e_[1]) + tuple(e_[2:])
            ekle_ac[kk] = ekle_ac.get(kk, 0.0) + L_
        if t_["silikon"] and _norm("silikon") not in rem:
            sil_m[(tur_s, ad_s)] += L_
    # sürekli parçalar (kapak/baskı ...): her N aksta bir (yatay) / N katta bir (dikey) kesilen tek parça boyları
    parca_grup = {k: (int(v[0]), float(v[1])) for k, v in (parca_grup or {}).items() if int(v[0]) >= 0}
    p_boy, p_cizim, ov_m = [], [], {"dikey": {}, "yatay": {}}
    if parca_grup:
        tab_ = cam_secim_parcalari(secim) if secim else {}
        taban_k = {t_: {_norm(pr["blok"]): pr["blok"] for pr in (parca or {}).get(t_) or []} for t_ in ("dikey", "yatay")}
        for t_ in taban_k:
            for kod_, _a, _s in tab_.get(t_, []):
                taban_k[t_].setdefault(_norm(kod_), kod_)

        def var_mi(t_, k_, tipad, rem):
            tt = (tip_say if t_ == "yatay" else dtip_say)[tipad]
            if k_ in rem or k_ in {_norm(x) for x in tt["cikar"]}:
                return False
            return k_ in taban_k[t_] or k_ in {_norm(e_[0]) for e_ in tt["ekle"]}

        def kesimle(t_, k_, kod_ad, dizi, n_, ds_, tek, idx, scope):
            """dizi: ardışık parça boyları (mm); idx: aralık/kat indisleri; scope: hat kimliği | aks"""
            tops = 0.0
            if n_ <= 0:
                tops = sum(tek)
            else:
                for g0 in range(0, len(dizi), n_):
                    L_ = sum(dizi[g0:g0 + n_]) - ds_
                    if L_ > 0:
                        p_boy.append((t_, kod_ad, round(L_, 1)))
                        p_cizim.append((t_, kod_ad, scope, idx[g0], idx[min(g0 + n_, len(dizi)) - 1], round(L_, 1)))
                        tops += L_
            ov_m[t_][k_] = ov_m[t_].get(k_, 0.0) + tops / 1000

        for (t_, k_) in sorted({(a_[0], a_[1]) for a_ in parca_grup}):
            kod_ad = taban_k[t_].get(k_) or next((e_[0] for tt in (ytipler if t_ == "yatay" else dtipler)
                                                  for e_ in tt["ekle"] if _norm(e_[0]) == k_), k_)
            if t_ == "yatay":
                for h_, hid in enumerate(hat_id):
                    kr_ = parca_grup.get((t_, k_, hid)) or parca_grup.get((t_, k_, None)) or (0, 0.0)
                    runs, cur = [], []
                    for i, c in enumerate(cols):
                        ok = (hid[0], hid[1], i) not in yat_yok and var_mi(
                            t_, k_, yat_tip.get((hid[0], hid[1], i), ytip[h_]),
                            {_norm(x) for x in parca_cikar.get(("y", hid[0], hid[1], i), ())})
                        if ok:
                            cur.append(i)
                        elif cur:
                            runs.append(cur)
                            cur = []
                    if cur:
                        runs.append(cur)
                    for ix_ in runs:
                        kesimle(t_, k_, kod_ad, [cols[i] for i in ix_], kr_[0], kr_[1], [cols[i] - vw for i in ix_], ix_, hid)
            else:
                for i in range(len(cols) + 1):
                    kr_ = parca_grup.get((t_, k_, i)) or parca_grup.get((t_, k_, None)) or (0, 0.0)
                    runs, cur = [], []
                    for j, r in enumerate(rows):
                        ok = (i, j) not in dik_yok and var_mi(
                            t_, k_, dik_tip.get((i, j), dtip), {_norm(x) for x in parca_cikar.get(("d", i, j), ())})
                        if ok:
                            cur.append(j)
                        elif cur:
                            runs.append(cur)
                            cur = []
                    if cur:
                        runs.append(cur)
                    for ix_ in runs:
                        bl_ = [rows[j] + (alt if j == 0 else 0.0) + (ust if j == n - 1 else 0.0) for j in ix_]
                        kesimle(t_, k_, kod_ad, bl_, kr_[0], kr_[1], bl_, ix_, i)
    # aks / hat başına elle seçilen katman zinciri: genel zincirden farkı kadar izolatör/conta miktarı eklenir ya da düşülür
    zh_ = p.get("zincir_hat") or {}
    if zh_:
        def pvc_say(z_):
            say_ = Counter()
            for k_ in (z_ or "").split("+"):
                if k_.strip() and not (_FITIL_EK.get(_norm(k_.strip())) or {}).get("fitil"):
                    say_[k_.strip()] += 1
            return say_
        g0_ = pvc_say((secim or {}).get("pvc", ""))
        uz_ = []                                                     # (tür, zincir, uzunluk m, parça değişimi)
        for hk_, zv_ in zh_.items():
            zc_, deg_z_, _yn = zk_coz(zv_)
            if not zc_ and not deg_z_:
                continue
            if not secim:
                zc_ = ""
            if hk_[0] == "d" and len(hk_) == 2:
                L_ = 0.0
                j = 0
                while j < n:
                    if (hk_[1], j) in dik_yok:
                        j += 1
                        continue
                    j0 = j
                    while j + 1 < n and (hk_[1], j + 1) not in dik_yok:
                        j += 1
                    L_ += sum(b_ for _l, _h, b_ in dikey_boylari(cum_n[j0], cum_n[j + 1], kes_n, alt, ust, dilat,
                                                                  j0 == 0, j == n - 1)) / 1000
                    j += 1
                uz_.append(("dikey", zc_, L_, deg_z_))
            elif hk_[0] == "y" and len(hk_) == 3 and (hk_[1], hk_[2]) in hat_id:
                L_ = sum((c - vw) / 1000 for i_, c in enumerate(cols) if (hk_[1], hk_[2], i_) not in yat_yok)
                uz_.append(("yatay", zc_, L_, deg_z_))
        for tur_z, zc_, L_, deg_z_ in uz_:
            for o_, y_ in deg_z_.items():                         # bu aks/hatta özel parça değişimi (örn. 01.05.01>01.05.02)
                if _norm(o_) != _norm(y_):
                    cikar_m[tur_z][_norm(o_)] = cikar_m[tur_z].get(_norm(o_), 0.0) + L_
                    kk_ = (tur_z, y_, 1.0, None, "conta" if str(y_).startswith("01.") else "")
                    ekle_ac[kk_] = ekle_ac.get(kk_, 0.0) + L_
            if not zc_:
                continue
            g1_ = pvc_say(zc_)
            for kod_ in set(g0_) | set(g1_):
                fark_ = g1_[kod_] - g0_[kod_]
                if fark_ > 0:
                    kk_ = (tur_z, kod_, fark_, None, "izolator")
                    ekle_ac[kk_] = ekle_ac.get(kk_, 0.0) + L_
                elif fark_ < 0:
                    cikar_m[tur_z][_norm(kod_)] = cikar_m[tur_z].get(_norm(kod_), 0.0) + L_ * (-fark_) / max(g0_[kod_], 1)
    ekstra = []
    for k, m_ in ekle_ac.items():
        if _norm(k[1]) in ov_m[k[0]]:
            m_ = ov_m[k[0]][_norm(k[1])]
        ekstra.append((k[0], k[1], k[2], m_) + tuple(k[3:]))
    cikar_m = {k: v for k, v in cikar_m.items() if v}
    silikon = {}                                      # tür -> (metre, kartuş)
    kartus = 0.0
    sil_ilk = None
    for (tur_s, ad_s), L_ in sil_m.items():
        en, der, taraf, kart_ml = (tip_say if tur_s == "yatay" else dtip_say)[ad_s]["silikon"]
        m_ = L_ * taraf
        m0, k0 = silikon.get(tur_s, (0.0, 0.0))
        silikon[tur_s] = (m0 + m_, k0 + m_ * 1000 * en * der / (kart_ml * 1000))
        kartus += m_ * 1000 * en * der / (kart_ml * 1000)
        sil_ilk = sil_ilk or (en, der, taraf, kart_ml)
    silikon_m = sum(v[0] for v in silikon.values())
    parca_kodlar = {}
    parca_sat, pag = parca_ozet(parca, dikey_m, yatay_m, parca_kat, secim,
                                ekstra=ekstra, cikar=cikar_m or None, kodlar=parca_kodlar, boy_ov=ov_m)
    # sürekli parça kesim listesi ve çubuk planı
    parca_kesim, parca_cubuk, parca_cubuk_stok = [], [], []
    if p_boy:
        kg_p = {}
        for t_ in ("dikey", "yatay"):
            for pr in (parca or {}).get(t_) or []:
                kg_p[_norm(pr["blok"])] = pr["kgm"]
        for kod_, kt_ in (parca_kat or {}).items():
            if kt_.get("kg") is not None:
                kg_p[kod_] = kt_["kg"]
        ad_tur = {}
        liste_p = []
        for t_, kod_ad, L_ in p_boy:
            ad_k = f"{kod_ad} ({t_})"
            ad_tur[ad_k] = (t_, _norm(kod_ad))
            liste_p.append((ad_k, L_))
        for (ad_k, boy_), adet_ in sorted(Counter(liste_p).items()):
            tb = boy_ * adet_ / 1000
            kg_ = kg_p.get(ad_tur[ad_k][1])
            parca_kesim.append((ad_k, boy_, adet_, round(tb, 2), "" if kg_ is None else round(tb * kg_, 2)))
        for ad_k in sorted(ad_tur):
            tur_ = ad_tur[ad_k][0]
            lst_ = stok_sec(p.get("stoklar"), tur_)
            try:
                pl_ = kesim_plani([x for x in liste_p if x[0] == ad_k], p["cubuk"], p["testere"],
                                  {ad_k: lst_} if lst_ else None, cubuk_uyari)
            except ValueError as e_:
                cubuk_uyari.append(str(e_))
                continue
            kg_ = kg_p.get(ad_tur[ad_k][1])
            for cub_ in pl_.get(ad_k, []):
                pass
            grup_ = Counter((c_[2], tuple(c_[1]), round(c_[0], 1)) for c_ in pl_.get(ad_k, []))
            for (boy_, kes_, kalan_), adet_ in sorted(grup_.items(), key=lambda x: (-x[0][0], -x[1])):
                parca_cubuk.append((ad_k, boy_, adet_, " + ".join(f"{b:g}" for b in kes_), kalan_))
            for boy_, n_ in sorted(Counter(c_[2] for c_ in pl_.get(ad_k, [])).items(), reverse=True):
                parca_cubuk_stok.append((ad_k, boy_, n_, "" if kg_ is None else boy_ * n_ / 1000 * kg_))
    for tur_s, tl_ in (("yatay", ytipler), ("dikey", dtipler)):       # tüm tiplerin ek parçaları da seçilebilir
        for t_ in tl_:
            for e_ in t_["ekle"]:
                if e_[0] not in [x[0] for x in parca_kodlar.setdefault(tur_s, [])]:
                    parca_kodlar[tur_s].append((e_[0], ((parca_kat or {}).get(_norm(e_[0])) or {}).get("ad") or "", "alu"))
    if silikon_m > 0:
        sil = sil_ilk
        for tur_s in ("dikey", "yatay"):
            if tur_s in silikon:
                parca_sat.append((f"Yapısal silikon ({sil[0]:g}x{sil[1]:g} mm derz)", tur_s.capitalize(), "Silikon",
                                  f"{sil[2]:g} taraf", round(silikon[tur_s][0], 2), "", ""))
        parca_sat.append((f"Silikon kartuşu ({sil[3]:g} ml)", "Yatay+Dikey", "Silikon", math.ceil(kartus - 1e-9),
                          "", "", ""))
        pag["silikon_m"], pag["silikon_kartus"] = silikon_m, math.ceil(kartus - 1e-9)
    th_ = {tuple(k_): v_ for k_, v_ in (takoz_hat or {}).items()}
    gk_ = (secim.get("takoz") if secim else "") or ""
    takoz_list = Counter()
    for hid_t, n_t in takoz_say.items():        # hat başına takoz: hatta özel seçim yoksa genel (ağırlık kuralı / elle)
        kod_t = th_.get(hid_t)
        if kod_t == ZINCIR_YOK:
            continue
        if not kod_t or kod_t in (ZINCIR_OTO, "(genel)"):
            kod_t = gk_
        if kod_t:
            takoz_list[kod_t] += 2 * n_t         # cam başına 2 takoz
    if takoz_list:
        pag["takoz"] = (", ".join(sorted(takoz_list)), sum(takoz_list.values()))
        pag["takoz_list"] = sorted(takoz_list.items())
    pag.update({"ana_kg": ana_kg, "cam_kg": cam_kg,
                "alu_toplam_kg": ana_kg + pag["yard_alu_kg"]})

    return {
        "cols": cols, "rows": rows, "vw": vw, "hw": hw,
        "cy": cy, "cizgiler": cizgiler, "bolgeler": bolgeler, "hat_id": hat_id,
        "hucre": hucre, "dik_yok": dik_yok, "yat_yok": yat_yok, "dik_yok_ham": dik_yok_ham, "yat_yok_ham": yat_yok_ham,
        "yalanci": yalanci, "cam_gruplari": cam_gr, "ek": ek, "tip": tip, "ytip": ytip, "ytipler": ytipler,
        "parca_kodlar": parca_kodlar, "parca_kesim": parca_kesim, "parca_cubuk": parca_cubuk,
        "parca_cubuk_stok": parca_cubuk_stok, "parca_boy_cizim": p_cizim, "parca_grup": parca_grup, "dtip": dtip, "dtipler": dtipler, "dik_tip": dik_tip, "yat_tip": yat_tip, "parca_cikar": parca_cikar,
        "dikey_alt": alt, "dikey_ust": ust, "p": dict(p),
        "kesim": kesim_sat, "cubuk": cubuk_sat, "cubuk_stok": cubuk_stok, "cubuk_uyari": cubuk_uyari, "cam": cam_sat, "cam_yapi": cam_yapi, "spandrel_yapi": sp_yapi, "parca": parca_sat, "agirlik": pag,
        "cam_secim": secim, "cam_secim_uyari": secim_uyari, "bariyer_not": bariyer_not, "takoz_not": takoz_not,
        "ozet": {
            "olcu": (sum(cols), sum(rows)),
            "aks": len(cols) + 1, "kat": len(rows),
            "modul": len(cols) * len(bolgeler),
            "ek_hat": sum(len(e) for e in ek),
            "cubuk_ozet": cubuk_ozet, "cam_adet": cam_adet, "cam_m2": cam_m2,
            "sp_adet": sp_adet, "sp_m2": sp_m2, "siparis_kg": siparis_kg,
            "cam_kg": cam_kg, "ana_kg": ana_kg,
            "dikey_m": sum(r[3] for r in kesim_sat if r[0] == p["dikey_ad"]),
            "yatay_m": sum(r[3] for r in kesim_sat if r[0] == p["yatay_ad"]),
        },
    }


def balon_seviye(pos, r, bosluk=2.0):
    """Aks balonlarının üst üste binmemesi için kademe (0,1,2...). pos: merkez konumları (herhangi sırada);
    dönüş: aynı sırada kademe listesi. Aynı kademedeki iki balon en az 2r+bosluk uzakta olur."""
    sira = sorted(range(len(pos)), key=lambda i: pos[i])
    son, out = [], [0] * len(pos)
    for i in sira:
        for k, sp in enumerate(son):
            if abs(pos[i] - sp) >= 2 * r + bosluk:
                son[k] = pos[i]
                out[i] = k
                break
        else:
            son.append(pos[i])
            out[i] = len(son) - 1
    return out


def olcu_listesi_oku(metin):
    """Yapıştırılan liste -> [float]. Satır başında sıra numarası olabilir ("1. 1310.3", "2) 1247", "3 - 1231,2");
    her satırda son sayı alınır. Tek satırda ; , ya da boşlukla ayrılmış sayılar da kabul edilir."""
    sat = [x for x in re.split(r"[\r\n]+", metin.strip()) if x.strip()]
    out = []
    if len(sat) == 1:
        for tok in re.split(r"[;\s]+", sat[0].strip()):
            if tok:
                out.append(tok)
    else:
        for x in sat:
            m = re.findall(r"\d+(?:[.,]\d+)?", x)
            if not m:
                raise ValueError(f"Satırda sayı yok: '{x.strip()}'")
            out.append(m[-1])
    vals = []
    for t in out:
        try:
            vals.append(float(t.rstrip(",;").replace(",", ".")))
        except ValueError:
            raise ValueError(f"Sayı değil: '{t}'")
    if not vals or any(v <= 0 for v in vals):
        raise ValueError("Pozitif sayılardan oluşan bir liste girin.")
    return vals


def sikistir(vals):
    """[1200, 1200, 1500] -> '2x1200; 1500'"""
    out, i = [], 0
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and vals[j + 1] == vals[i]:
            j += 1
        n = j - i + 1
        out.append(f"{n}x{vals[i]:g}" if n > 1 else f"{vals[i]:g}")
        i = j + 1
    return "; ".join(out)


def aks_adi(i):
    return string.ascii_uppercase[i] if i < 26 else f"K{i}"


def hat_adi(h):
    """Yatay hat adı: kat hattı 'B', ek yatay 'B+1' (B hattından 1. ek yatay)."""
    return aks_adi(h[0]) + (f"+{h[1]}" if h[1] else "")


_TR = str.maketrans("ıİşŞğĞüÜöÖçÇ", "iIsSgGuUoOcC")
_BASLIK = {
    "sistem": "sistem", "kod": "kod", "ad": "ad", "profil": "ad",
    "tur": "tur", "tip": "tur",
    "genislik": "g", "genislik_mm": "g", "genislik (mm)": "g",
    "kg_m": "kg", "kg/m": "kg", "kgm": "kg", "agirlik": "kg", "agirlik_kg_m": "kg",
    "dosya": "dosya", "kesit": "dosya", "dxf": "dosya",
    "blok": "blok", "yuzey": "yuzey", "yuzey_ekseni": "yuzey",
    "sablon": "sablon", "montaj": "sablon",
}


def _norm(s):
    return s.strip().translate(_TR).lower()


def _say(v, ad):
    try:
        return float(v.replace(",", "."))
    except ValueError:
        raise ValueError(f"{ad} sayı değil ('{v}')")


def uygulama_klasoru():
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def sistem_klasorleri(kok=None):
    """Program klasöründeki sistemler/<SİSTEM>/sistem.csv dosyalarını bulur. Dönüş: {sistem_adı: csv_yolu}."""
    kok = kok or os.path.join(uygulama_klasoru(), "sistemler")
    out = {}
    if os.path.isdir(kok):
        for ad in sorted(os.listdir(kok)):
            if ad.startswith(("_", ".")):
                continue
            for dn in ("sistem.csv", "profil_katalogu.csv"):
                yp = os.path.join(kok, ad, dn)
                if os.path.isfile(yp):
                    out[ad] = yp
                    break
            else:
                if kutuphane_klasoru(os.path.join(kok, ad)):      # yalnızca ayarlar.csv + kütüphane klasörü
                    out[ad] = os.path.join(kok, ad, "ayarlar.csv")
    for ad in _ayar_db()["sistemler"]:                            # cephe_ayar.json'daki sistemler (klasör gerekmez)
        if not any(_norm(a) == _norm(ad) for a in out):
            out[ad] = os.path.join(kok, ad, "ayarlar.csv")
    return out


_KUT_KLASORLERI = {"dikme": "dikey", "dikey": "dikey", "dusey": "dikey", "yatay": "yatay"}


def kutuphane_klasoru(sistem_klasor):
    """ayarlar.csv içindeki 'kutuphane;<yol>' (mutlak ya da sistem klasörüne göre göreli) ya da None."""
    yol = sistem_ayar(sistem_klasor, ham=True).get("kutuphane", "").strip().strip('"')
    if not yol:
        return None
    yol = yol if os.path.isabs(yol) or re.match(r"^[A-Za-z]:[\\/]", yol) else os.path.join(sistem_klasor, yol)
    return yol if os.path.isdir(yol) else None


def _alt_klasor(kok, ad):
    """kok altında büyük/küçük harf ve Türkçe karakter farkına bakmadan ad (veya takma adları) klasörü."""
    for d in sorted(os.listdir(kok)):
        if os.path.isdir(os.path.join(kok, d)) and _norm(d) == _norm(ad):
            return os.path.join(kok, d)
    return None


def dxf_blok_bul(yol, ad):
    """DXF içinde dosya adına (boşluk/_/- farkı gözetmeden) karşılık gelen kesit bloğunun adı; kesitli tek blok
    varsa o; blok yok, model alanında doğrudan çizim varsa (WBLOCK dosyası) dosya adı. Yoksa None."""
    def sade(x):
        return re.sub(r"[\s_\-]", "", _norm(x))
    _m, bloklar, _t = _dxf_duzlestir(yol)
    adlar = [a for a in bloklar if not a.startswith(("*", "$")) and _blok_donguler(bloklar[a])]
    for a in adlar:
        if sade(a) == sade(ad):
            return a
    return adlar[0] if len(adlar) == 1 else None


def _kod_goster(stem):
    """E50M09 -> E50 M 09 (harf/rakam geçişlerinde boşluk), sayısal kodlar (02.01.01) aynen."""
    if re.fullmatch(r"[A-Za-z]+\d+[A-Za-z]\d+", stem):
        return re.sub(r"^([A-Za-z]+\d+)([A-Za-z])(\d+)$", r"\1 \2 \3", stem)
    return stem


def kutuphane_profilleri(sistem_klasor, uyari=None):
    """Kütüphane klasöründeki DIKME/ ve YATAY/ alt klasörlerindeki her .dxf bir profildir (tek blok, adı dosya adı).
    Dönüş: katalog girdileri listesi. Bloğu bulunamayan dosyalar için uyari listesine mesaj eklenir."""
    kut = kutuphane_klasoru(sistem_klasor)
    if not kut:
        return []
    out = []
    sistem = os.path.basename(os.path.abspath(sistem_klasor))
    for kl, tur in _KUT_KLASORLERI.items():
        alt = _alt_klasor(kut, kl)
        if not alt:
            continue
        for f in sorted(os.listdir(alt)):
            if not f.lower().endswith(".dxf"):
                continue
            yol = os.path.join(alt, f)
            stem = os.path.splitext(f)[0]
            try:
                blok = dxf_blok_bul(yol, stem)
            except (ValueError, OSError) as e:
                blok, hata = None, str(e)
            else:
                hata = "blok bulunamadı (dosya adıyla aynı adlı tek blok olmalı)"
            if not blok:
                if uyari is not None:
                    uyari.append(f"{kl}/{f}: {hata}")
                continue
            out.append({"sistem": sistem, "kod": stem, "ad": _kod_goster(stem), "tur": tur, "g": None, "kg": None,
                        "dosya": yol, "dosya_yol": yol, "blok": blok, "yuzey": "auto",
                        "sablon_yol": "", "sablon_blok": ""})
    return out


def katalog_oku(yol, uyari=None):
    """Sistem kataloğu: sistem.csv (varsa) + ayarlar.csv'deki 'kutuphane' klasöründen taranan DIKME/YATAY profilleri.
    yol, sistem.csv ya da (yalnızca kütüphane kullanılıyorsa) ayarlar.csv olabilir."""
    klasor = os.path.dirname(os.path.abspath(yol))
    out = [] if os.path.basename(yol).lower() == "ayarlar.csv" else _katalog_csv_oku(yol)
    mevcut = {_norm(k["blok"]) for k in out if k.get("blok")} | {_norm(k["kod"]) for k in out if k.get("kod")}
    for k in kutuphane_profilleri(klasor, uyari):
        if _norm(k["blok"]) in mevcut or _norm(k["kod"]) in mevcut:
            continue                        # sistem.csv'deki satır önceliklidir
        out.append(k)
    if not out:
        raise ValueError("Katalogda profil yok (sistem.csv boş ve kütüphane klasöründe DIKME/YATAY .dxf bulunamadı).")
    return out


def _sade(x):
    return re.sub(r"[\s_\-]", "", _norm(x))


def _ust_insertler(yol):
    """DXF model alanındaki en üst düzey INSERT blok adları."""
    model, _bl, _t = _dxf_varliklar(_dxf_cift(yol))
    out = []
    for e in model:
        if e["tur"] == "INSERT":
            for k, v in e["kod"]:
                if k == "2":
                    out.append(v.strip())
                    break
    return out


def kutuphane_bariyerleri(kut):
    """Kütüphanenin ISI_BARIYERI klasöründeki her .dxf bir ısı bariyeridir. Ara mesafe (iki alüminyum parça
    arasında bıraktığı boy) bloğun boyundan hesaplanır: ara = boy - BARIYER_UC. Dönüş: ara mesafeye göre sıralı liste."""
    alt = _alt_klasor(kut, "ISI_BARIYERI")
    out = []
    if not alt:
        return out
    for f in sorted(os.listdir(alt)):
        if not f.lower().endswith(".dxf"):
            continue
        yol = os.path.join(alt, f)
        kod = os.path.splitext(f)[0]
        try:
            bl = dxf_blok_bul(yol, kod)
            if not bl:
                continue
            b = _bariyer_kesiti(yol, bl)
        except (ValueError, OSError):
            continue
        bb = b["bbox"]
        boy = (bb[2] - bb[0]) if b["uzun"] == 0 else (bb[3] - bb[1])
        if boy - BARIYER_UC <= 0.5:
            continue
        b.update({"kod": kod, "ara": round(boy - BARIYER_UC, 2)})
        out.append(b)
    return sorted(out, key=lambda b: b["ara"])


_FITIL_EK = {}      # norm kod -> katman parçası (zincirin ek halkaları: FITIL silikon altlık, ADAPTOR ...)
_TAKOZ_KOD = []     # CAM_TAKOZU klasöründeki parça kodları


def katman_bindirme(klasor):
    """Klasörün bindirme payı: cephe_ayar.json 'genel' > 'katman_bindirme' {"ADAPTOR": 1.5} ile değiştirilebilir."""
    ov = (_ayar_db().get("genel") or {}).get("katman_bindirme") or {}
    for k, v in ov.items():
        if _norm(k) == _norm(klasor):
            try:
                return float(v)
            except (TypeError, ValueError):
                break
    return KATMAN_BINDIRME.get(klasor, 0.0)


def fitil_ekleri_yukle(kut):
    """Isı bariyeri zincirine eklenebilen diğer klasörler: FITIL ("izu" grubuna giren, varsayılan 01.07...: silikon
    altlık) ve ADAPTOR. Ara mesafe: boy - klasörün bindirme payı. CAM_TAKOZU kodları da okunur."""
    _FITIL_EK.clear()
    _TAKOZ_KOD.clear()
    if not kut:
        return
    for klasor, kisa in (("FITIL", True), ("ADAPTOR", False)):
        alt = _alt_klasor(kut, klasor)
        if not alt:
            continue
        for f in sorted(os.listdir(alt)):
            kod, uz = os.path.splitext(f)
            if uz.lower() != ".dxf":
                continue
            if klasor == "FITIL" and _grup_bul(_norm(kod), VARSAYILAN_GRUP) != "izu":
                continue
            try:
                yol = os.path.join(alt, f)
                bl = dxf_blok_bul(yol, kod)
                if not bl:
                    continue
                b = dict(_bariyer_kesiti(yol, bl))
            except (ValueError, OSError):
                continue
            bb = b["bbox"]
            gen, yuk = bb[2] - bb[0], bb[3] - bb[1]
            b["uzun"] = (0 if gen <= yuk else 1) if kisa else (0 if gen >= yuk else 1)   # fitil: kısa kenar, adaptör: uzun kenar
            boy = gen if b["uzun"] == 0 else yuk
            bin_ = katman_bindirme(klasor)
            if boy - bin_ <= 0.5:
                continue
            b.update({"kod": kod, "ara": round(boy - bin_, 2), "fitil": klasor == "FITIL", "klasor": klasor,
                      "bindirme": bin_})
            _FITIL_EK[_norm(kod)] = b
    alt = _alt_klasor(kut, "CAM_TAKOZU")
    if alt:
        _TAKOZ_KOD.extend(sorted(os.path.splitext(f)[0] for f in os.listdir(alt) if f.lower().endswith(".dxf")))


def takoz_kurallari(sistem):
    """Sistem kaydındaki cam takozu kuralları: [{"min","max","kod"}] (panel cam ağırlığı kg), min'e göre sıralı."""
    kay = sistem_kaydi(sistem) if sistem else None
    out = []
    for k in (kay or {}).get("takoz_kurallari") or []:
        try:
            out.append({"min": float(k["min"]), "max": float(k["max"]), "kod": str(k.get("kod", "")).strip()})
        except (KeyError, ValueError, TypeError):
            continue
    return sorted(out, key=lambda k: (k["min"], k["max"]))


def takoz_kurallari_yaz(sistem, liste):
    kay = sistem_kaydi(sistem, olustur=True)
    if kay is None:
        return False
    kay["takoz_kurallari"] = [dict(k) for k in liste]
    ayar_kaydet()
    return True


def takoz_sec(kurallar, panel_kg):
    """Panel cam ağırlığına uyan ilk kuralın takoz kodu | None."""
    for k in kurallar or []:
        if k["kod"] and k["min"] - 1e-9 <= panel_kg <= k["max"] + 1e-9:
            return k["kod"]
    return None


def kutuphane_sablonlari(kut, profiller, uyari=None):
    """Kütüphanenin SISTEM klasöründeki örnek sistem DXF'leri. Dosya adında DUSEY/DIKEY geçen düşey, YATAY geçen
    yatay şablondur; ana profil, içindeki DIKME/YATAY kütüphane profilinin INSERT'idir.
    Dönüş: {"dikey": [(yol, ana_blok, tip_adı)], "yatay": [...]} (KAPAKLI adlı olan başa alınır)."""
    alt = _alt_klasor(kut, "SISTEM")
    out = {"dikey": [], "yatay": []}
    if not alt:
        return out
    adlar = {t: {_sade(k["kod"]): k["kod"] for k in profiller if k["tur"] == t} for t in out}
    for f in sorted(os.listdir(alt)):
        ad = os.path.splitext(f)[0]
        if not f.lower().endswith(".dxf"):
            continue
        n = _norm(ad)
        tur = "yatay" if "yatay" in n else "dikey" if ("dusey" in n or "dikey" in n) else None
        if not tur:
            continue
        yol = os.path.join(alt, f)
        try:
            ins = _ust_insertler(yol)
        except (ValueError, OSError) as e:
            if uyari is not None:
                uyari.append(f"SISTEM/{f}: {e}")
            continue
        ana = next((i for i in ins if _sade(i) in adlar[tur]), None)
        if not ana:
            if uyari is not None:
                uyari.append(f"SISTEM/{f}: içinde {tur} ana profil bloğu (DIKME/YATAY kütüphanesindeki) bulunamadı")
            continue
        tip = re.sub(r"(?i)(^|_)(sistem|dusey|d\u00fc\u015fey|dikey|yatay)(?=_|$)", "", ad).strip("_ ")
        tip = re.sub(r"^[A-Za-z]+\d+_?", "", tip).strip("_ ") or ad
        out[tur].append((yol, ana, tip.upper()))
    for t in out:
        out[t].sort(key=lambda x: (0 if "KAPAK" in x[2] else 1, x[0]))
    return out


SILIKON_VARSAYILAN = (12.0, 6.0, 2.0, 310.0)    # derz eni, derinliği (mm), taraf sayısı, kartuş hacmi (ml)


def otomatik_sistem(sistem_klasor, uyari=None):
    """Yalnızca kütüphane klasöründen (DIKME, YATAY, ISI_BARIYERI, SISTEM) sistemi kurar; CSV gerekmez.
    Dönüş: {"kurallar", "yatay_tipleri", "bariyerler", "cam_tablo"}"""
    kut = kutuphane_klasoru(sistem_klasor)
    if not kut:
        return None
    prof = kutuphane_profilleri(sistem_klasor)
    sab = kutuphane_sablonlari(kut, prof, uyari)
    kural = {"sistem": "", "min": 0.0, "max": 999.0,
             "dikey": (sab["dikey"][0][0], sab["dikey"][0][1]) if sab["dikey"] else None,
             "yatay": (sab["yatay"][0][0], sab["yatay"][0][1]) if sab["yatay"] else None}
    _TAMAMLA.clear()
    if kural["dikey"]:
        for yol_y, _a, _t in sab["yatay"]:
            _TAMAMLA[os.path.abspath(yol_y)] = os.path.abspath(kural["dikey"][0])
    tipler = []
    for i, (yol, ana, tip) in enumerate(sab["yatay"]):
        sil = SILIKON_VARSAYILAN if "SILIKON" in _norm(tip).upper() or "silikon" in _norm(tip) else None
        tipler.append({"tip": tip.title() if tip else f"Tip {i + 1}", "ekle": [], "cikar": [],
                       "sablon": None if i == 0 else (yol, ana, False), "silikon": sil})
    dtipler = []
    for i, (yol, ana, tip) in enumerate(sab["dikey"]):
        sil = SILIKON_VARSAYILAN if "silikon" in _norm(tip) else None
        dtipler.append({"tip": tip.title() if tip else f"Tip {i + 1}", "ekle": [], "cikar": [],
                        "sablon": None if i == 0 else (yol, ana, False), "silikon": sil})
    bar = kutuphane_bariyerleri(kut)
    cam_satir = None
    if kural["dikey"] and bar:
        try:
            kodlar = {_sade(b["kod"]): b["kod"] for b in bar}
            parca = dxf_parcalar(kural["dikey"][0], kural["dikey"][1])
            pvc = [p_["blok"] for p_ in parca if _sade(p_["blok"]) in kodlar for _ in range(p_["adet"])]
            (_o), det, _k = sablon_orijin(kural["dikey"][0], kural["dikey"][1], "dikey")
            g = _cam_geo(det, "dikey") if det.get("ref") else None
            mm = g[4] if g else float(sistem_ayar(os.path.dirname(os.path.abspath(kural["dikey"][0]))).get(
                "sablon_cam_kalinlik", 32))
            cam_satir = {"cam_mm": str(mm), "mm": mm, "alternatif": "", "yatay_ic_fitil": "", "dis_fitil": "",
                         "orta_fitil": "", "pvc": "+".join(pvc), "adaptor": "", "dikey_ic_fitil": "", "takoz": "",
                         "vida": "", "oto": True, "elle": ""}
        except (ValueError, OSError, KeyError, IndexError) as e:
            if uyari is not None:
                uyari.append(f"Otomatik cam/bariyer satırı kurulamadı: {e}")
    return {"kurallar": [kural] if (kural["dikey"] or kural["yatay"]) else [],
            "yatay_tipleri": tipler or list(YATAY_TIP_VARSAYILAN),
            "dikey_tipleri": dtipler or list(YATAY_TIP_VARSAYILAN),
            "bariyerler": bar, "cam_tablo": [cam_satir] if cam_satir else []}


def _katalog_csv_oku(yol):
    """Profil kataloğu CSV'si.
    Sistem klasörü kuralı (sistemler/<SİSTEM>/sistem.csv): en az  kod;ad;tur;blok  yeterlidir.
      sistem boşsa klasör adı, dosya boşsa profiller.dxf, sablon boşsa cam_kurallari.csv'deki şablon kullanılır.
    Tam sütun listesi: sistem;kod;ad;tur;genislik_mm;kg_m;dosya;blok;yuzey;sablon
      - sablon (isteğe bağlı): "detay.dxf|ANA_BLOK". Profil kütüphanesinden (yalnızca profil kesitleri içeren DXF)
        seçilen profilin kesit/plandaki montaj detayı (fitil, izolatör, baskı plakası, kapak) bu şablon detaydaki
        ana profilin yerine yeni profil konarak oluşturulur.
      - zorunlu: ad, tur (dikey|yatay)
      - genislik_mm ve kg_m: 'dosya' (DXF kesit) verilmişse boş bırakılabilir
      - dosya: DXF yolu (CSV'nin klasörüne göre), blok: DXF içindeki profil bloğu
      - yuzey: auto | x | y  (görünen yüzey genişliği hangi kesit ölçüsü)
    Ayraç ; , veya sekme olabilir."""
    ham = open(yol, "rb").read()
    metin = None
    for enc in ("utf-8-sig", "cp1254"):
        try:
            metin = ham.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if metin is None:
        raise ValueError("Dosya kodlaması okunamadı. Excel'de 'CSV UTF-8' olarak kaydedin.")
    satirlar = [s for s in metin.splitlines() if s.strip()]
    if len(satirlar) < 2:
        raise ValueError("Katalog boş ya da yalnızca başlık satırı var.")
    ayrac = max(";,\t", key=satirlar[0].count)
    okuyucu = csv.reader(satirlar, delimiter=ayrac)
    bas = [_BASLIK.get(_norm(h)) for h in next(okuyucu)]
    for k, ad in (("ad", "ad"), ("tur", "tur")):
        if k not in bas:
            raise ValueError(f"Katalogda '{ad}' sütunu bulunamadı.")
    if "dosya" not in bas and "blok" not in bas:
        for k, ad in (("g", "genislik_mm"), ("kg", "kg_m")):
            if k not in bas:
                raise ValueError(
                    f"Katalogda '{ad}' sütunu bulunamadı (ya da 'dosya' sütunu ekleyin).")
    klasor = os.path.dirname(os.path.abspath(yol))
    out = []
    for i, r in enumerate(okuyucu, start=2):
        d = {b: (r[j].strip() if j < len(r) else "") for j, b in enumerate(bas) if b}
        try:
            tur = _norm(d["tur"])
            if tur not in ("dikey", "yatay"):
                raise ValueError("tur 'dikey' veya 'yatay' olmalı")
            if not d["ad"]:
                raise ValueError("ad boş")
            dosya = d.get("dosya", "")
            if not dosya and d.get("blok") and os.path.isfile(os.path.join(klasor, "profiller.dxf")):
                dosya = "profiller.dxf"                     # sistem klasörü kuralı: profil blokları profiller.dxf'te
            g = _say(d["g"], "genislik_mm") if d.get("g") else None
            kg = _say(d["kg"], "kg_m") if d.get("kg") else None
            if not dosya and (g is None or kg is None):
                if d.get("blok"):
                    raise ValueError(f"profil blokları için '{os.path.basename(klasor)}' klasöründe profiller.dxf yok "
                                     "(profil bloklarını profiller.dxf içine koyun)")
                raise ValueError("genislik_mm ve kg_m ya da dosya gerekli")
            if (g is not None and g <= 0) or (kg is not None and kg <= 0):
                raise ValueError("genişlik ve kg/m pozitif olmalı")
            yuzey = _norm(d.get("yuzey", "")) or "auto"
            if yuzey not in ("auto", "x", "y"):
                raise ValueError("yuzey 'auto', 'x' veya 'y' olmalı")
        except ValueError as e:
            raise ValueError(f"Katalog {i}. satır: {e}")
        dosya_yol = ""
        if dosya:
            dosya_yol = dosya if os.path.isabs(dosya) else os.path.join(klasor, dosya)
        sablon_yol, sablon_blok = "", ""
        if d.get("sablon"):
            sd, _, sb = d["sablon"].partition("|")
            sablon_yol = sd.strip() if os.path.isabs(sd.strip()) else os.path.join(klasor, sd.strip())
            sablon_blok = sb.strip()
        out.append({"sistem": d.get("sistem", "") or os.path.basename(klasor), "kod": d.get("kod", ""),
                    "ad": d["ad"], "tur": tur, "g": g, "kg": kg,
                    "dosya": dosya, "dosya_yol": dosya_yol,
                    "blok": d.get("blok", ""), "yuzey": yuzey,
                    "sablon_yol": sablon_yol, "sablon_blok": sablon_blok})
    return out


# ---------------------------------------------------- DXF KESİT OKUYUCU
ALUMINYUM = 2.7   # g/cm³


def _ascii(metin):
    return metin.encode("ascii", "ignore").decode("ascii").strip()


def _dxf_cift(yol):
    ham = open(yol, "rb").read()
    if ham[:22].lower().startswith(b"autocad binary dxf"):
        raise ValueError("İkili (binary) DXF desteklenmiyor. ASCII DXF olarak kaydedin.")
    try:
        metin = ham.decode("utf-8")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254", errors="replace")
    s = metin.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if s and s[-1] == "":
        s.pop()
    return [(s[i].strip(), s[i + 1]) for i in range(0, len(s) - 1, 2)]


def _dxf_varliklar(cift):
    """_dxf_varliklar_ham + kullanıcının parça değişimleri (ayar 'degisim'): şablondaki INSERT blok adları
    değiştirilir ve yeni parçanın kesiti kütüphaneden bloklara eklenir."""
    model, bloklar, taban = _dxf_varliklar_ham(cift)
    if not (_DEGISIM and _KUT_KOK) and not _YON:
        return model, bloklar, taban
    for e in model:
        if e["tur"] != "INSERT":
            continue
        for i, (k, v) in enumerate(e["kod"]):
            if k == "2":
                yon = _YON.get(_sade(v.strip()))            # yön: şablondaki orijinal parça koduna bağlı
                if yon and re.match(r"^02\.\d\d", v.strip()):
                    yon = None                  # ısı bariyeri yönü yerleştirme sırasında uygulanır (_bariyer_yerlestir)
                yeni = _DEGISIM.get(_sade(v.strip())) if _KUT_KOK else None
                if yeni:
                    ad = _degisim_blok_ekle(yeni, bloklar, taban)
                    if ad:
                        _parca_oturt(model, e, v.strip(), ad, bloklar, taban)     # yeni parçanın duruşunu öğren/ayarla
                        e["ilk_ad"] = v.strip()                                    # grup/yuva kuralları özgün koda göre
                        e["kod"][i] = (k, ad)
                if yon:
                    ad_ = next((v2.strip() for k2, v2 in e["kod"] if k2 == "2"), "")
                    _yon_uygula(e, yon, _blok_merkez(bloklar, taban, ad_)
                                if (genel_ayar("yon_merkez") or any(ch.isdigit() for ch in yon)) else None,
                                taban.get(ad_, (0.0, 0.0)))
                break
    return model, bloklar, taban


# ---- parça yerleşimi: şablonlardan öğrenilen duruş + otomatik oturtma
_YERLESIM_DB = {}
_YERLESIM_SAY = {}        # {kütüphane: {sade(kod): {(rot,sx,sy): şablonda görülme sayısı}}}
_OTURT_ONB = {}


def _ins_ayar(kod, **kv):
    """INSERT grup kodlarını (10, 20, 41, 42, 50) ayarlar / ekler."""
    for kk, val in kv.items():
        kk = str(kk).lstrip("g")
        idx = next((i for i, (k, _v) in enumerate(kod) if k == kk), None)
        if idx is None:
            kod.append((kk, repr(float(val))))
        else:
            kod[idx] = (kk, repr(float(val)))


def yerlesim_ogren(kut):
    """Kütüphanenin SISTEM şablonlarında her parçanın (rot, sx, sy) duruşları: {sade(kod): [(rot, sx, sy)]}
    (sık görülen önce). Şablon dosyaları değişince yeniden öğrenilir."""
    if not kut or not os.path.isdir(kut):
        return {}
    dosyalar = []
    for d in os.listdir(kut):
        if d.lower() == "sistem" and os.path.isdir(os.path.join(kut, d)):
            dosyalar += [os.path.join(kut, d, f) for f in sorted(os.listdir(os.path.join(kut, d)))
                         if f.lower().endswith(".dxf")]
    imza = tuple((f, os.path.getmtime(f)) for f in dosyalar)
    eski = _YERLESIM_DB.get(kut)
    if eski and eski[0] == imza:
        return eski[1]
    sayac = {}
    for f in dosyalar:
        try:
            model, bloklar, _t = _dxf_varliklar_ham(_dxf_cift(f))
        except (OSError, ValueError, KeyError, IndexError):
            continue
        for e in model:
            if e["tur"] != "INSERT":
                continue
            d = {}
            for k, v in e["kod"]:
                d.setdefault(k, v)
            ad = d.get("2", "").strip()
            if ad not in bloklar or not re.match(r"^(\d\d\.\d\d|R\d)", ad):
                continue
            try:
                sx_, sy_ = float(d.get("41", 1)), float(d.get("42", d.get("41", 1)))
                rot_ = round(float(d.get("50", 0)) / 90.0) * 90 % 360          # 90°'ye yuvarla (89.99° gibi artıklar ayrı duruş sayılmasın)
                o = (float(rot_), 1.0 if sx_ >= 0 else -1.0, 1.0 if sy_ >= 0 else -1.0)     # ölçek değil, yalnız ayna işareti
            except ValueError:
                continue
            c_ = sayac.setdefault(_sade(ad), {})
            c_[o] = c_.get(o, 0) + 1
    db = {k: [o for o, _n in sorted(v.items(), key=lambda t: -t[1])] for k, v in sayac.items()}
    _YERLESIM_SAY[kut] = {k: dict(v) for k, v in sayac.items()}
    _YERLESIM_DB[kut] = (imza, db)
    return db


def _nokta_konturlarda(pt, loops):
    """Nokta konturlar kümesinin (çift-tek kuralı: delikler hariç) içinde mi?
    Not: eskiden bu fonksiyon `_icinde` adındaydı ve dosyanın ilerisindeki aynı adlı fonksiyon onu eziyordu;
    çakışma ölçümü hata verip oturtma sessizce iptal oluyordu (parça yanlış yerde kalıyordu)."""
    x, y = pt
    n = 0
    for lp in loops:
        ic = False
        j = len(lp) - 1
        for i in range(len(lp)):
            xi, yi = lp[i][0], lp[i][1]
            xj, yj = lp[j][0], lp[j][1]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
                ic = not ic
            j = i
        n += ic
    return n % 2 == 1


def _dolgular(prims):
    """[(bbox, [kontur])]: dolgu (hatch) şekilleri"""
    out = []
    for p in prims:
        if p[0] == "fill" and p[1]:
            pts = [q for lp in p[1] for q in lp]
            if pts:
                out.append(((min(q[0] for q in pts), min(q[1] for q in pts),
                             max(q[0] for q in pts), max(q[1] for q in pts)), p[1]))
    return out


def _yogun_noktalar(loops, ornek):
    """Konturların köşeleri + kenar orta/çeyrek noktaları (ince çakışmaları kaçırmamak için), en çok ~ornek nokta."""
    pts = []
    for lp in loops:
        m = len(lp)
        for i in range(m):
            a, b = lp[i], lp[(i + 1) % m]
            pts.append((a[0], a[1]))
            if abs(b[0] - a[0]) + abs(b[1] - a[1]) > 1.5:
                pts.append(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
                pts.append((a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75))
    return pts[::max(1, len(pts) // ornek)]


def _bbox_aralik(b1, b2):
    """İki dikdörtgen arasındaki en kısa uzaklık (kesişiyorsa 0)."""
    gx = max(b1[0] - b2[2], b2[0] - b1[2], 0.0)
    gy = max(b1[1] - b2[3], b2[1] - b1[3], 0.0)
    return (gx * gx + gy * gy) ** 0.5


def _carpisma(adayD, komsuD, ornek=200):
    """Aday dolguların (yoğunlaştırılmış) noktalarından komşu dolgular içine düşenlerin sayısı (+ tersi)."""
    ceza = 0
    for (b1, l1) in adayD:
        for (b2, l2) in komsuD:
            if b1[0] > b2[2] or b2[0] > b1[2] or b1[1] > b2[3] or b2[1] > b1[3]:
                continue
            a1 = _yogun_noktalar(l1, ornek)
            a2 = _yogun_noktalar(l2, ornek)
            ceza += sum(1 for q in a1 if b2[0] <= q[0] <= b2[2] and b2[1] <= q[1] <= b2[3] and _nokta_konturlarda(q, l2))
            ceza += sum(1 for q in a2 if b1[0] <= q[0] <= b1[2] and b1[1] <= q[1] <= b1[3] and _nokta_konturlarda(q, l1))
    return ceza


def _parca_oturt(model, e, eski_ad, yeni_ad, bloklar, taban):
    """Şablondaki bir parça başka bir parçayla değiştirilince: yeni parçanın duruşu (dönüş/ayna) önce
    şablonlarda öğrenilmiş duruştan, yoksa 8 olası duruşun denenip komşu parçalarla en az çakışanından seçilir;
    konum eski parçanın profile bakan yüzüne oturtulur. Aynı aile (01.03.xx → 01.03.yy) parçalar eski duruşu korur."""
    def aile(a_):
        m_ = re.match(r"^(\d\d\.\d\d|[A-Za-z]+\d+[A-Za-z]?)", a_.strip())
        return _norm(m_.group(1)) if m_ else _norm(a_)[:5]
    ayni_aile = aile(eski_ad) == aile(yeni_ad)
    if not _KUT_KOK:
        return
    imza = (eski_ad, yeni_ad, _KUT_KOK, tuple((dict(x["kod"]).get("2"), dict(x["kod"]).get("10"), dict(x["kod"]).get("20"),
                                              dict(x["kod"]).get("50"), dict(x["kod"]).get("41"))
                                             for x in model if x["tur"] == "INSERT"))
    if imza in _OTURT_ONB:
        sonuc = _OTURT_ONB[imza]
        if sonuc:
            _ins_ayar(e["kod"], **sonuc)
        return
    sonuc = None
    try:
        yb = _yerel_bbox([e], bloklar, taban)
        if yb:
            komsu = []
            for x in model:
                if x is e or x["tur"] != "INSERT":
                    continue
                cik, say = [], {}
                _varlik_prim(x, _I, bloklar, taban, cik, say, 0)
                komsu += cik
            komsuD = _dolgular(komsu)
            d0 = {}
            for k, v in e["kod"]:
                d0.setdefault(k, v)
            ix, iy = float(d0.get("10", 0)), float(d0.get("20", 0))
            mevcut = (round(float(d0.get("50", 0)) % 360) % 360, float(d0.get("41", 1)), float(d0.get("42", 1)))
            ogr = yerlesim_ogren(_KUT_KOK).get(_sade(yeni_ad))
            adaylar = [(float(r), sx, 1.0) for r in (0, 90, 180, 270) for sx in (1.0, -1.0)]
            for o_ in (ogr or []):                    # şablonlarda öğrenilen duruşlar da aday (ve tercihli)
                if o_ not in adaylar:
                    adaylar.append(o_)
            cx, cy = (yb[0] + yb[2]) / 2, (yb[1] + yb[3]) / 2
            ax = 0 if abs(cx) >= abs(cy) else 1
            yuz = (ax + 2) if (cx if ax == 0 else cy) < 0 else ax        # profile bakan kenar
            en_iyi = None
            kb = [b_ for b_, _l in komsuD]
            g0 = min((_bbox_aralik(yb, k_) for k_ in kb), default=0.0)       # eski parçanın komşulara uzaklığı
            say_ = _YERLESIM_SAY.get(_KUT_KOK, {}).get(_sade(yeni_ad), {})
            for sira, (r, sx, sy) in enumerate(adaylar):
                kod = list(e["kod"])
                for i, (k, v) in enumerate(kod):
                    if k == "2":
                        kod[i] = (k, yeni_ad)
                _ins_ayar(kod, g41=sx, g42=sy, g50=r, g10=ix, g20=iy)
                xb = _yerel_bbox([{"tur": "INSERT", "kod": kod}], bloklar, taban)
                if not xb:
                    continue
                en_ = (xb[2] - xb[0], xb[3] - xb[1])
                dax = yb[yuz] - xb[yuz]
                dc = ((yb[1 - ax] + yb[3 - ax]) - (xb[1 - ax] + xb[3 - ax])) / 2
                konumlar = [(dax, dc) if ax == 0 else (dc, dax)]                       # A) profile bakan kenara oturt
                konumlar.append((((yb[0] + yb[2]) - (xb[0] + xb[2])) / 2,              # B) merkezleri çakıştır
                                 ((yb[1] + yb[3]) - (xb[1] + xb[3])) / 2))
                if (r, sx, sy) == mevcut:
                    konumlar.append((0.0, 0.0))                                        # C) şablondaki yerinde bırak
                for kk_, (dx, dy) in enumerate(konumlar):
                    kod2 = list(kod)
                    _ins_ayar(kod2, g10=ix + dx, g20=iy + dy)
                    e2 = {"tur": "INSERT", "kod": kod2}
                    cik, say = [], {}
                    _varlik_prim(e2, _I, bloklar, taban, cik, say, 0)
                    ceza = 0 if ayni_aile else _carpisma(_dolgular(cik), komsuD)
                    nb = (xb[0] + dx, xb[1] + dy, xb[2] + dx, xb[3] + dy)
                    # komşu parçalara olan boşluk eski parçadakine yakın olmalı (havada kalma / içine girme)
                    g1 = min((_bbox_aralik(nb, k_) for k_ in kb), default=0.0)
                    ceza += 0.6 * abs(g1 - g0)
                    # eski parçanın kapladığı en-boy ile uyum: uzun kenarı aynı yönde olan duruş tercih edilir
                    ceza += 4.0 * (abs(en_[0] - (yb[2] - yb[0])) + abs(en_[1] - (yb[3] - yb[1]))) / 10.0
                    if (r, sx, sy) in say_:                       # şablonlarda görülen duruş: sık görüldükçe daha tercihli
                        ceza -= 2.0 + min(3.0, 1.0 * math.log2(1 + say_[(r, sx, sy)]))
                    elif ogr and (r, sx, sy) in ogr:
                        ceza -= 2.0
                    ceza += 0 if (r, sx, sy) == mevcut else (5.0 if ayni_aile else 0.5)   # eşitlikte eski duruş
                    ceza += 0.01 * (abs(dx) + abs(dy)) + (0.15 if kk_ == 1 else 0.0)       # gereksiz kaydırma / merkez yerleşimi hafif cezalı
                    if en_iyi is None or ceza < en_iyi[0]:
                        en_iyi = (ceza, {"g41": sx, "g42": sy, "g50": r, "g10": ix + dx, "g20": iy + dy})
            if en_iyi:
                sonuc = en_iyi[1]
                if ayni_aile and (sonuc["g50"], sonuc["g41"], sonuc["g42"]) == mevcut \
                        and max(abs(sonuc["g10"] - ix), abs(sonuc["g20"] - iy)) < 3.0:
                    sonuc = None                     # aynı aile, aynı duruş, yerinde: şablondaki yerleşim aynen kalır
    except (ValueError, KeyError, IndexError, TypeError, ZeroDivisionError):
        sonuc = None
    _OTURT_ONB[imza] = sonuc
    if sonuc:
        _ins_ayar(e["kod"], **sonuc)


def zk_coz(v):
    """Hat değeri 'zincir[@@deg:ORJ>YENI;..][@@yon:ORJ=xy;..]' -> (zincir, {orj: yeni parça}, {orj: yön}).
    Yalnız o aks/hatta geçerli parça değişimi ve yönü, zincirle birlikte tek değerde saklanır."""
    p = (v or "").split("@@")
    deg, yon = {}, {}
    for x in p[1:]:
        if x.startswith("deg:"):
            for t in x[4:].split(";"):
                if ">" in t:
                    a_, b_ = t.split(">", 1)
                    deg[a_] = b_
        elif x.startswith("yon:"):
            for t in x[4:].split(";"):
                if "=" in t:
                    a_, b_ = t.split("=", 1)
                    yon[a_] = b_
    return p[0], deg, yon


def zk_yaz(zincir, deg, yon):
    s_ = zincir or ""
    if deg:
        s_ += "@@deg:" + ";".join(f"{a_}>{b_}" for a_, b_ in sorted(deg.items()))
    if yon:
        s_ += "@@yon:" + ";".join(f"{a_}={b_}" for a_, b_ in sorted(yon.items()))
    return s_


def yon_donustur(mevcut, eylem):
    """Yön metnine eylem uygular (x | y | 180 | 90 | sifirla); geçersizse None."""
    now = {ch for ch in (mevcut or "") if ch in "xy"}
    rot = int("".join(ch for ch in (mevcut or "") if ch.isdigit()) or 0) % 4
    if eylem in ("sifirla", "0", "normal"):
        now, rot = set(), 0
    elif eylem in ("x", "y"):
        now ^= {eylem}
    elif eylem in ("180", "xy", "yx"):
        now ^= {"x", "y"}
    elif eylem in ("90", "r90", "r"):
        rot = (rot + 1) % 4
    else:
        return None
    return "".join(sorted(now)) + (str(rot) if rot else "")


class _parca_gecici:
    """Bir aks/hat için parça değişimi ve yönünü geçici olarak _DEGISIM/_YON üzerine uygular."""
    def __init__(self, deg, yon):
        self.deg, self.yon = deg or {}, yon or {}

    def __enter__(self):
        self.eski = (dict(_DEGISIM), dict(_YON))
        for a_, b_ in self.deg.items():
            _YON.pop(_sade(a_), None)
            if _sade(a_) == _sade(b_):
                _DEGISIM.pop(_sade(a_), None)
            else:
                _DEGISIM[_sade(a_)] = b_
        for a_, v_ in self.yon.items():
            if v_:
                _YON[_sade(a_)] = v_
            else:
                _YON.pop(_sade(a_), None)
        return self

    def __exit__(self, *a):
        _DEGISIM.clear()
        _DEGISIM.update(self.eski[0])
        _YON.clear()
        _YON.update(self.eski[1])
        return False


def _yon_yaz(kay, orijinal, eylem):
    """Parçanın yönünü değiştirir (x: sağ-sol, y: iç-dış, 180: ikisi birden, sifirla). Ayarı kaydeder; metin döner."""
    yd = kay.setdefault("yon", {})
    anahtar = next((k for k in yd if _sade(k) == _sade(orijinal)), orijinal)
    mevcut = yd.get(anahtar, "")
    now = {ch for ch in mevcut if ch in "xy"}
    rot = int("".join(ch for ch in mevcut if ch.isdigit()) or 0) % 4
    if eylem in ("sifirla", "0", "normal"):
        now, rot = set(), 0
    elif eylem in ("x", "y"):
        now ^= {eylem}
    elif eylem in ("180", "xy", "yx"):
        now ^= {"x", "y"}
    elif eylem in ("90", "r90", "r"):
        rot = (rot + 1) % 4
    else:
        return "Kullanım: parca yon <kod> x (sağ-sol) | y (iç-dış) | 90 | 180 | sifirla"
    yd.pop(anahtar, None)
    if now or rot:
        yd[orijinal] = "".join(sorted(now)) + (str(rot) if rot else "")
    ayar_kaydet()
    return f"{orijinal}: yön {yon_adi(yd.get(orijinal, ''))}"


def yon_adi(v):
    """Yön ayar metninin okunur hali: x, y, xy, + dönüş adedi (rakam × 90°)."""
    if not v:
        return "normal"
    parca = []
    if "x" in v and "y" in v:
        parca.append("180° döndürülmüş")
    elif "x" in v:
        parca.append("sağ-sol çevrik")
    elif "y" in v:
        parca.append("iç-dış çevrik")
    n = int("".join(ch for ch in v if ch.isdigit()) or 0) % 4
    if n:
        parca.append(f"{90 * n}° döndürülmüş")
    return ", ".join(parca) or "normal"


_KAYMA = {}    # {"tur|blok|ornek": [dx, dy]}: parçanın elle (mıknatısla) oturtulduğu konum farkı, mm (seçili sistem)
_YON = {}      # {sade(orijinal parça kodu): "x" | "y" | "xy"}: parçanın blok eksenlerinde çevrilmesi (seçili sistem)


def _blok_merkez(bloklar, taban, ad):
    """Bloğun kendi koordinatlarındaki sınır kutusu merkezi (parça yerinde çevrilsin diye)."""
    cikti, sayac = [], {}
    for e2 in bloklar.get(ad, []):
        _varlik_prim(e2, _I, bloklar, taban, cikti, sayac, 1)
    b = _prim_bbox([p for p in cikti if p[0] != "text"])
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) if b else (0.0, 0.0)


def _yon_uygula(e, bayrak, merkez=None, taban=(0.0, 0.0)):
    """INSERT'i çevirir: x = sağ-sol (yanal) ayna, y = iç-dış (derinlik) ayna; "xy" = 180°.
    merkez None: bloğun base point'i sabit kalır (INSERT noktası); verilirse parçanın o noktası sabit kalır."""
    if merkez is None:
        merkez = taban
    kod = e["kod"]
    d = {}
    for k, v in kod:
        d.setdefault(k, v)
    sx, sy = float(d.get("41", 1)), float(d.get("42", 1))
    r = math.radians(float(d.get("50", 0)))
    ix, iy = float(d.get("10", 0)), float(d.get("20", 0))
    fx = -1.0 if "x" in bayrak else 1.0
    fy = -1.0 if "y" in bayrak else 1.0
    a, b = math.cos(r) * sx, math.sin(r) * sx
    c_, d_ = -math.sin(r) * sy, math.cos(r) * sy
    nrot = int("".join(ch for ch in bayrak if ch.isdigit()) or 0) % 4         # 90°'lik dönüş adedi
    if nrot:
        th = math.radians(90.0 * nrot)
        ct, st = round(math.cos(th)), round(math.sin(th))
        # A2 = A · Q(th) · diag(fx, fy)   (blok yerel çerçevesinde önce ayna, sonra döndürme; merkez sabit)
        q = [[ct * fx, -st * fy], [st * fx, ct * fy]]
        a2 = [[a * q[0][0] + c_ * q[1][0], a * q[0][1] + c_ * q[1][1]],
              [b * q[0][0] + d_ * q[1][0], b * q[0][1] + d_ * q[1][1]]]
        dm = (merkez[0] - taban[0], merkez[1] - taban[1])
        nx = ix + (a - a2[0][0]) * dm[0] + (c_ - a2[0][1]) * dm[1]
        ny = iy + (b - a2[1][0]) * dm[0] + (d_ - a2[1][1]) * dm[1]
        c1 = math.hypot(a2[0][0], a2[1][0])
        det = a2[0][0] * a2[1][1] - a2[0][1] * a2[1][0]
        sx2 = c1 if c1 else 1.0
        sy2 = det / sx2
        rot2 = math.degrees(math.atan2(a2[1][0], a2[0][0])) % 360.0
        for kk, val in (("10", nx), ("20", ny), ("41", sx2), ("42", sy2), ("50", rot2)):
            idx = next((i for i, (k, _v) in enumerate(kod) if k == kk), None)
            if idx is None:
                kod.append((kk, repr(val)))
            else:
                kod[idx] = (kk, repr(val))
        return
    lx = merkez[0] - fx * merkez[0] + (fx - 1) * taban[0]       # merkezin sabit kalması için kayma
    ly = merkez[1] - fy * merkez[1] + (fy - 1) * taban[1]
    yeni = {"10": ix + a * lx + c_ * ly, "20": iy + b * lx + d_ * ly, "41": sx * fx, "42": sy * fy}
    for kk, val in yeni.items():
        idx = next((i for i, (k, _v) in enumerate(kod) if k == kk), None)
        if idx is None:
            kod.append((kk, repr(val)))
        else:
            kod[idx] = (kk, repr(val))


_TAMAMLA = {}      # {yatay şablon yolu: düşey şablon yolu}: yatayda eksik olan dış fitiller düşeyden tamamlanır


def _dxf_varliklar_yol(yol):
    """_dxf_varliklar(_dxf_cift(yol)); yatay şablonlarda düşey şablondaki dış fitiller (01.xx, 'dis' grubu)
    yatayda yoksa, düşey şablon -90° döndürülerek yataydaki yerlerine eklenir (dış fitil iki hatta da aynıdır)."""
    model, bloklar, taban = _dxf_varliklar(_dxf_cift(yol))
    dik = _TAMAMLA.get(os.path.abspath(yol))
    if not dik or not os.path.isfile(dik):
        return model, bloklar, taban
    dm, db, dt = _dxf_varliklar(_dxf_cift(dik))
    kurallar = grup_kurallari_oku(os.path.join(os.path.dirname(os.path.abspath(dik)), "grup_kurallari.csv"))

    def adi(e):
        return next((v.strip() for k, v in e["kod"] if k == "2"), "")
    var = {_sade(adi(e)) for e in model if e["tur"] == "INSERT"}
    try:
        ham = _dxf_varliklar_ham(_dxf_cift(dik))[0]      # parça değişimlerinden önceki adlar (grup, yuvaya göre belirlenir)
    except (OSError, ValueError, KeyError, IndexError):
        ham = []
    if len(ham) != len(dm):
        ham = dm
    for e, e0 in zip(dm, ham):
        ad = adi(e) if e["tur"] == "INSERT" else ""
        ad0 = adi(e0) if e0["tur"] == "INSERT" else ad
        if not ad or _sade(ad) in var or not re.match(r"^01\.", ad0) or _grup_bul(_norm(ad0), kurallar) != "dis" \
                or ad not in db:
            continue
        d = dict(e["kod"])
        x, y = float(d.get("10", 0)), float(d.get("20", 0))
        rot = (float(d.get("50", 0)) - 90.0) % 360.0          # düşey -> yatay: (x, y) -> (y, -x), açı -90°
        kod = [("0", "INSERT"), ("8", d.get("8", "0")), ("2", ad), ("10", repr(y)), ("20", repr(-x)), ("30", "0"),
               ("41", d.get("41", "1")), ("42", d.get("42", "1")), ("50", repr(rot))]
        model.append({"tur": "INSERT", "kod": kod[1:], "ilk_ad": ad0})
        if ad not in bloklar:
            bloklar[ad] = db[ad]
            taban[ad] = dt.get(ad, (0.0, 0.0))
    return model, bloklar, taban


def _dxf_insbase(cift):
    """DXF başlığındaki $INSBASE (dosyanın blok olarak eklenirken kullanılan base point'i). Yoksa (0, 0)."""
    x = y = 0.0
    bul = False
    for k, v in cift:
        if bul:
            try:
                if k == "10":
                    x = float(v)
                elif k == "20":
                    y = float(v)
                    break
            except ValueError:
                break
        elif k == "9" and v.strip().upper() == "$INSBASE":
            bul = True
        elif k == "0" and v.strip().upper() == "SECTION" and x == y == 0.0 and bul:
            break
    return (x, y)


def _degisim_blok_ekle(kod, bloklar, taban):
    """Kütüphanedeki <kod>.dxf parçasını bloklar/taban sözlüklerine ekler; blok adını döndürür (yoksa None)."""
    yol = kutuphane_parca_bul(_KUT_KOK, kod)
    if not yol:
        return None
    stem = os.path.splitext(os.path.basename(yol))[0]
    if stem in bloklar:
        return stem
    cift_ = _dxf_cift(yol)
    m2, b2, t2 = _dxf_varliklar_ham(cift_)
    if stem not in b2:
        b2 = dict(b2)
        t2 = dict(t2)
        b2[stem] = list(m2)
        t2[stem] = _dxf_insbase(cift_)        # parçanın DWG'deki base point'i
    for a, ents in b2.items():
        bloklar.setdefault(a, ents)
        taban.setdefault(a, t2.get(a, (0.0, 0.0)))
    return stem


def _dxf_varliklar_ham(cift):
    """ENTITIES ve BLOCKS: (model_varlıkları, {blok: [varlık]}, {blok: taban_noktası})"""
    model, bloklar, taban = [], {}, {}
    bolum, ad, ent = None, None, None
    KATMAN_RENK.update(_katman_renkleri(cift))
    for k, v in cift:
        if k == "0":
            if ent is not None and ent["tur"] != "SECTION":
                if bolum == "ENTITIES":
                    model.append(ent)
                elif bolum == "BLOCKS" and ad and ent["tur"] not in ("BLOCK", "ENDBLK"):
                    bloklar[ad].append(ent)
            t = v.strip()
            if t == "ENDSEC":
                bolum, ent = None, None
                continue
            ent = {"tur": t, "kod": []}
            if t == "ENDBLK":
                ad = None
        elif ent is not None:
            ent["kod"].append((k, v))
            if ent["tur"] == "SECTION" and k == "2":
                bolum = v.strip()
            elif ent["tur"] == "BLOCK" and bolum == "BLOCKS":
                if k == "2" and ad is None:
                    ad = v.strip()
                    bloklar.setdefault(ad, [])
                    taban[ad] = [0.0, 0.0]
                elif k in ("10", "20") and ad is not None:
                    taban[ad][0 if k == "10" else 1] = float(v)
    return model, bloklar, taban


_I = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def _uygula(M, p):
    a, b, c, d, e, f = M
    return (a * p[0] + c * p[1] + e, b * p[0] + d * p[1] + f)


def _birlestir(P, C):
    """Önce C sonra P uygulanan dönüşüm."""
    a1, b1, c1, d1, e1, f1 = P
    a2, b2, c2, d2, e2, f2 = C
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def _insert_matrisi(d, base):
    sx, sy = float(d.get("41", 1)), float(d.get("42", 1))
    r = math.radians(float(d.get("50", 0)))
    ix, iy = float(d.get("10", 0)), float(d.get("20", 0))
    a, b = math.cos(r) * sx, math.sin(r) * sx
    c, dd = -math.sin(r) * sy, math.cos(r) * sy
    return (a, b, c, dd, ix - a * base[0] - c * base[1], iy - b * base[0] - dd * base[1])


def _model_matrisleri(model, taban):
    """Modelde ilk INSERT'ün dönüşümü: {blok_adı: matris}"""
    out = {}
    for e in model:
        if e["tur"] != "INSERT":
            continue
        d = {}
        for k, v in e["kod"]:
            d.setdefault(k, v)
        ad = d.get("2", "").strip()
        if ad and ad not in out:
            out[ad] = _insert_matrisi(d, taban.get(ad, (0.0, 0.0)))
    return out


def _bulge_noktalar(p, q, b, adim=3.0):
    """p'den q'ya bulge'lu segment; p dahil, q hariç noktalar."""
    x1, y1, x2, y2 = p[0], p[1], q[0], q[1]
    d = math.hypot(x2 - x1, y2 - y1)
    if b == 0 or d == 0:
        return [(x1, y1)]
    teta = 4 * math.atan(b)
    h = (d / 2) / math.tan(teta / 2)
    nx, ny = -(y2 - y1) / d, (x2 - x1) / d
    cx, cy = (x1 + x2) / 2 + nx * h, (y1 + y2) / 2 + ny * h
    r = math.hypot(x1 - cx, y1 - cy)
    a0 = math.atan2(y1 - cy, x1 - cx)
    n = max(2, int(abs(teta) / math.radians(adim)))
    return [(cx + r * math.cos(a0 + teta * k / n), cy + r * math.sin(a0 + teta * k / n))
            for k in range(n)]


def _yay_noktalar(cx, cy, r, a0, a1, ccw, adim=3.0):
    """HATCH yay kenarı. ccw=0 ise açılar saat yönünde ölçülür (DXF kuralı)."""
    if not ccw:
        a0, a1 = -a0, -a1
    a0, a1 = math.radians(a0), math.radians(a1)
    if ccw:
        while a1 <= a0:
            a1 += 2 * math.pi
    else:
        while a1 >= a0:
            a1 -= 2 * math.pi
    n = max(2, int(abs(a1 - a0) / math.radians(adim)))
    return [(cx + r * math.cos(a0 + (a1 - a0) * k / n),
             cy + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def _zincir(segler, tol=0.05):
    """Kenar parçalarını uç uca ekleyip kapalı kontur yapar; bağlanmazsa hata verir.
    İlk kenarın iki yönü de denenir, en iyi kapanan seçilir."""
    if not segler:
        return []
    en_iyi, hata = None, None
    for ters in (False, True):
        out = list(segler[0][::-1] if ters else segler[0])
        bosluk_max = 0.0
        for s in segler[1:]:
            if math.dist(out[-1], s[-1]) < math.dist(out[-1], s[0]):
                s = s[::-1]
            bosluk_max = max(bosluk_max, math.dist(out[-1], s[0]))
            out += s[1:]
        kapan = math.dist(out[-1], out[0])
        puan = max(bosluk_max, kapan)
        if en_iyi is None or puan < en_iyi[0]:
            en_iyi = (puan, out, bosluk_max, kapan)
    puan, out, bosluk, kapan = en_iyi
    if bosluk > tol:
        raise ValueError(f"kontur kenarları birleşmiyor (boşluk {bosluk:.2f} mm)")
    if kapan > max(tol, 0.5):          # çizimdeki küçük kapanma hatası tolere edilir
        raise ValueError("kontur kapalı değil")
    out.pop()
    return out


def _hatch_donguler(kod):
    i = 0
    while i < len(kod) and kod[i][0] != "91":
        i += 1
    if i >= len(kod):
        return []
    n = int(kod[i][1])
    i += 1
    donguler = []
    for _ in range(n):
        while i < len(kod) and kod[i][0] != "92":
            i += 1
        if i >= len(kod):
            break
        bayrak = int(kod[i][1])
        i += 1
        if bayrak & 2:                                   # polyline yolu
            bulge_var = int(kod[i][1])
            i += 2                                       # 72, 73
            nv = int(kod[i][1])
            i += 1
            pts = []
            for _ in range(nv):
                x, y = float(kod[i][1]), float(kod[i + 1][1])
                i += 2
                bl = 0.0
                if bulge_var and i < len(kod) and kod[i][0] == "42":
                    bl = float(kod[i][1])
                    i += 1
                pts.append((x, y, bl))
            out = []
            for j in range(len(pts)):
                out += _bulge_noktalar(pts[j], pts[(j + 1) % len(pts)], pts[j][2])
            donguler.append(out)
        else:                                            # kenar yolu
            ne = int(kod[i][1])
            i += 1
            segler = []
            for _ in range(ne):
                t = int(kod[i][1])
                i += 1
                if t == 1:
                    v = [float(kod[i + j][1]) for j in range(4)]
                    i += 4
                    segler.append([(v[0], v[1]), (v[2], v[3])])
                elif t == 2:
                    v = [float(kod[i + j][1]) for j in range(5)]
                    ccw = int(kod[i + 5][1])
                    i += 6
                    segler.append(_yay_noktalar(v[0], v[1], v[2], v[3], v[4], ccw))
                else:
                    raise ValueError("HATCH sınırında spline/elips kenar var (desteklenmiyor)")
            donguler.append(_zincir(segler))
        while i < len(kod) and kod[i][0] not in ("92", "75"):
            i += 1
    return donguler


def _alan(pts):
    n = len(pts)
    return sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1]
               for i in range(n)) / 2


def _icinde(nokta, pts):
    x, y = nokta
    ic = False
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            ic = not ic
    return ic


def _kontur_icinde(lp, m):
    """lp konturu m'nin içinde mi? Köşelerin çoğunluğuna bakar (değen konturlarda doğru çalışır)."""
    xs1, ys1 = [p[0] for p in lp], [p[1] for p in lp]
    xs2, ys2 = [p[0] for p in m], [p[1] for p in m]
    tol = 0.01
    if (min(xs1) < min(xs2) - tol or max(xs1) > max(xs2) + tol
            or min(ys1) < min(ys2) - tol or max(ys1) > max(ys2) + tol):
        return False          # sınırlayıcı kutu dışına taşıyorsa iç içe olamaz (yan yana/değen parçalar)
    ornek = lp[::max(1, len(lp) // 12)]
    return sum(1 for p in ornek if _icinde(p, m)) * 2 > len(ornek)


def _derinlikler(donguler):
    return [sum(1 for j, m in enumerate(donguler) if j != i and _kontur_icinde(l, m))
            for i, l in enumerate(donguler)]


def _kopya_dongu_ele(donguler):
    """Aynı konturun üst üste çizilmiş kopyalarını (kutu ≤0,1 mm, alan farkı ≤%2) eler; alan çift sayılmasın."""
    ozet, son = [], []
    for l in donguler:
        xs, ys = [q[0] for q in l], [q[1] for q in l]
        o = (min(xs), max(xs), min(ys), max(ys), abs(_alan(l)))
        if any(max(abs(o[i] - e[i]) for i in range(4)) <= 0.1 and abs(o[4] - e[4]) <= 0.02 * max(e[4], 1e-9)
               for e in ozet):
            continue
        ozet.append(o)
        son.append(l)
    return son


def _kesit_olustur(ad, donguler):
    donguler = _kopya_dongu_ele(donguler)
    derin = _derinlikler(donguler)
    alan = sum(abs(_alan(l)) * (1 if d % 2 == 0 else -1) for l, d in zip(donguler, derin))
    xs = [p[0] for l in donguler for p in l]
    ys = [p[1] for l in donguler for p in l]
    return {"ad": ad, "donguler": donguler, "derin": derin, "alan": alan,
            "xmin": min(xs), "xmax": max(xs), "ymin": min(ys), "ymax": max(ys),
            "w": max(xs) - min(xs), "h": max(ys) - min(ys)}


def _lwpoly_dongu(kod):
    """Kapalı LWPOLYLINE'ı (bulge'lu) nokta döngüsüne çevirir; açık/geçersizse None."""
    d, pts, cur = {}, [], None
    for k, v in kod:
        d.setdefault(k, v)
        if k == "10":
            cur = [float(v), 0.0, 0.0]
            pts.append(cur)
        elif k == "20" and cur is not None:
            cur[1] = float(v)
        elif k == "42" and cur is not None:
            cur[2] = float(v)
    if len(pts) < 3 or not (int(d.get("70", "0")) & 1):
        return None
    out = []
    for j in range(len(pts)):
        out += _bulge_noktalar(pts[j], pts[(j + 1) % len(pts)], pts[j][2], 2.0)
    return out


def _blok_donguler(ents):
    """Blok kesit döngüleri: HATCH varsa onlar; yoksa kapalı LWPOLYLINE'lar (Reynaers tarzı çizim)."""
    dong = []
    for e in ents:
        if e["tur"] == "HATCH":
            dong += _hatch_donguler(e["kod"])
    if dong:
        return dong
    for e in ents:
        if e["tur"] == "LWPOLYLINE":
            lp = _lwpoly_dongu(e["kod"])
            if lp:
                dong.append(lp)
    return dong


def dxf_bloklar(yol, ayna=False):
    """DXF'teki dolgulu (HATCH) bloklar. Kesitler, çizimdeki INSERT yönüne çevrilmiş
    (katalog çizimindeki konum/yön) koordinatlarda döner.
    Dönüş: ({blok: kesit}, {blok: hata_mesajı})"""
    model, bloklar, taban = _dxf_varliklar_yol(yol)
    mats = _model_matrisleri(model, taban)
    kesitler, hatalar = {}, {}
    for ad, ents in bloklar.items():
        if ad.startswith("*"):
            continue
        try:
            dong = _blok_donguler(ents)
            if not dong:
                continue
            M = mats.get(ad)
            if M:
                dong = [[_uygula(M, p) for p in lp] for lp in dong]
            if ayna:
                dong = [[(-x, y) for x, y in lp] for lp in dong]
            kesitler[ad] = _kesit_olustur(ad, dong)
        except (ValueError, IndexError, KeyError) as e:
            hatalar[ad] = str(e)
    return kesitler, hatalar


def kesit_yukle(yol, blok=None):
    """DXF'ten profil kesiti. blok verilmezse en büyük alanlı blok seçilir."""
    kesitler, hatalar = dxf_bloklar(yol)
    if not kesitler and not hatalar:              # blok yok, model alanında tek parça (WBLOCK dosyası)
        try:
            _h, _b, _t, ad_ = _ham_kesit(yol, os.path.splitext(os.path.basename(yol))[0])
            kesitler = {ad_: _h}
        except ValueError:
            pass
    if blok:
        for ad in kesitler:
            if ad.lower() == blok.lower():
                return kesitler[ad]
        if blok in hatalar:
            raise ValueError(f"'{blok}' bloğu okunamadı: {hatalar[blok]}")
        raise ValueError(f"'{blok}' bloğu DXF'te yok. Bulunanlar: {', '.join(kesitler) or '-'}")
    if not kesitler:
        raise ValueError("DXF'te dolgulu (HATCH) profil bloğu bulunamadı.")
    return max(kesitler.values(), key=lambda k: k["alan"])


def kesit_kgm(k, yogunluk=ALUMINYUM):
    return k["alan"] * yogunluk / 1000          # mm² x g/cm³ -> kg/m


def kesit_derinlik(kes, tur, sablonlu):
    """Profilin cama dik (derinlik) ölçüsü. Şablonlu kesitte dikey=Y, yatay=X ekseni; değilse uzun kenar."""
    w = kes["xmax"] - kes["xmin"]
    h = kes["ymax"] - kes["ymin"]
    if sablonlu:
        return h if tur == "dikey" else w
    return max(w, h)


def kesit_yuzey(k, eksen="auto"):
    if eksen == "x":
        return k["w"]
    if eksen == "y":
        return k["h"]
    return min(k["w"], k["h"])


# ------------------------------------------------ TÜM DETAYIN OKUNMASI
def _rdp(pts, tol):
    n = len(pts)
    if n < 3:
        return list(pts)
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        x1, y1 = pts[i]
        x2, y2 = pts[j]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        dmax, kk = 0.0, -1
        for m in range(i + 1, j):
            px, py = pts[m]
            dd = abs(dy * (px - x1) - dx * (py - y1)) / L if L > 0 else math.hypot(px - x1, py - y1)
            if dd > dmax:
                dmax, kk = dd, m
        if dmax > tol and kk > 0:
            keep[kk] = True
            stack.append((i, kk))
            stack.append((kk, j))
    return [p for p, k in zip(pts, keep) if k]


def _sadelestir(pts, kapali, tol=0.02):
    """Gösterim/DXF için fazla köşeleri atar (sapma <= tol mm); alan hesabında kullanılmaz."""
    if len(pts) < 4:
        return pts
    if not kapali:
        return _rdp(pts, tol)
    f = max(range(len(pts)), key=lambda i: math.dist(pts[0], pts[i]))
    a = _rdp(pts[:f + 1], tol)
    b = _rdp(pts[f:] + [pts[0]], tol)
    return a[:-1] + b[:-1]


def _aci_hex(n):
    """AutoCAD renk indeksi (ACI) -> '#rrggbb'. 7 (beyaz/siyah) açık zeminde koyu çizilir."""
    sabit = {1: (255, 0, 0), 2: (255, 255, 0), 3: (0, 255, 0), 4: (0, 255, 255), 5: (0, 0, 255), 6: (255, 0, 255),
             7: (31, 35, 40), 8: (128, 128, 128), 9: (192, 192, 192),
             250: (51, 51, 51), 251: (91, 91, 91), 252: (132, 132, 132), 253: (173, 173, 173),
             254: (214, 214, 214), 255: (255, 255, 255)}
    n = abs(int(n))
    if n in sabit:
        r, g, b = sabit[n]
    elif 10 <= n <= 249:
        import colorsys
        h = ((n - 10) // 10) * 15 / 360.0
        k = (n - 10) % 10
        sat = 1.0 if k % 2 == 0 else 0.5
        val = (1.0, 0.65, 0.5, 0.3, 0.15)[k // 2]
        r, g, b = (int(round(v * 255)) for v in colorsys.hsv_to_rgb(h, sat, val))
    else:
        r, g, b = 31, 35, 40
    return f"#{r:02x}{g:02x}{b:02x}"


KATMAN_RENK = {}      # {normlanmış katman adı: '#rrggbb'}: yüklenen DXF'lerin LAYER tablosundan


def _katman_renkleri(cift):
    """DXF LAYER tablosundaki katman renkleri (true color varsa o, yoksa ACI). {normlanmış ad: hex}"""
    out, ent = {}, None

    def bitir():
        if ent and ent.get("t") == "LAYER" and "2" in ent:
            hx = None
            if ent.get("420"):
                try:
                    n = int(ent["420"])
                    hx = f"#{(n >> 16) & 255:02x}{(n >> 8) & 255:02x}{n & 255:02x}"
                except ValueError:
                    hx = None
            if hx is None and ent.get("62"):
                try:
                    hx = _aci_hex(int(ent["62"]))
                except ValueError:
                    hx = None
            if hx:
                out[_norm(ent["2"])] = hx

    for k, v in cift:
        if k == "0":
            bitir()
            t = v.strip()
            ent = {"t": t} if t == "LAYER" else None
            if t == "ENDSEC" and out:
                break
        elif ent is not None:
            ent.setdefault(k, v.strip())
    bitir()
    return out


def katman_renk(kat, varsayilan):
    """Katmanın çizim rengi: kullanıcı seçimi > bloktaki (DXF katman) rengi > varsayılan."""
    if not kat:
        return varsayilan
    ov = (genel_ayar("renk") or {}).get(kat)
    if ov:
        return ov
    if genel_ayar("blok_renk") and kat in KATMAN_RENK:
        return KATMAN_RENK[kat]
    return varsayilan


def cam_renk(tp):
    """Cam bandı türünün (dolgu, çizgi) rengi; dolgu kullanıcı seçimiyle değişebilir."""
    dolgu, cizgi = CAM_RENK.get(tp) or CAM_RENK["cam"]
    return (genel_ayar("renk") or {}).get("cam:" + tp) or dolgu, cizgi


_KONTUR = [""]      # içinde bulunulan bloğun kontur (çizgi) katmanı


def _blok_kontur_katmani(ents):
    for e in ents:
        if e["tur"] in ("LWPOLYLINE", "POLYLINE", "REGION", "LINE", "ARC", "CIRCLE"):
            k = _norm(next((v for kk, v in e["kod"] if kk == "8"), "0"))
            if k not in ("0", "defpoints") and not k.startswith("d-tarama"):
                return k
    return ""


def _hatch_renk(katman, desen):
    k = _norm(katman)
    if "epdm" in k:
        return "#4a5258"
    if "pvc" in k:
        return "#cdbf9f"
    if "atr" in k or "spacer" in k:
        return "#bcd3e2"
    if "acilim" in k:
        return "#c6ccd1"
    return "#8d99a3"


def _varlik_prim(ent, M, bloklar, taban, cikti, sayac, derinlik=0):
    """Bir DXF varlığını çizim öğelerine çevirir:
    ("fill", [kontur], [derinlik], renk, katman) | ("poly", [nokta], kapali, katman) |
    ("text", x, y, yükseklik, açı, metin, hiza)"""
    t = ent["tur"]
    kod = ent["kod"]
    d = {}
    for k, v in kod:
        d.setdefault(k, v)
    kat = _norm(d.get("8", "0"))
    try:
        if t == "LINE":
            cikti.append(("poly", [_uygula(M, (float(d["10"]), float(d["20"]))),
                                   _uygula(M, (float(d["11"]), float(d["21"])))], False, kat))
        elif t == "LWPOLYLINE":
            pts, cur = [], None
            for k, v in kod:
                if k == "10":
                    cur = [float(v), 0.0, 0.0]
                    pts.append(cur)
                elif k == "20" and cur is not None:
                    cur[1] = float(v)
                elif k == "42" and cur is not None:
                    cur[2] = float(v)
            if len(pts) < 2:
                return
            kapali = bool(int(d.get("70", "0")) & 1)
            n = len(pts)
            out = []
            for j in range(n if kapali else n - 1):
                out += _bulge_noktalar(pts[j], pts[(j + 1) % n], pts[j][2])
            if not kapali:
                out.append((pts[-1][0], pts[-1][1]))
            out = _sadelestir(out, kapali)
            cikti.append(("poly", [_uygula(M, p) for p in out], kapali, kat))
        elif t == "ARC":
            pts = _yay_noktalar(float(d["10"]), float(d["20"]), float(d["40"]),
                                float(d["50"]), float(d["51"]), 1)
            cikti.append(("poly", [_uygula(M, p) for p in _sadelestir(pts, False)], False, kat))
        elif t == "CIRCLE":
            cx_, cy_, r_ = float(d["10"]), float(d["20"]), float(d["40"])
            pts = [(cx_ + r_ * math.cos(2 * math.pi * i / 72),
                    cy_ + r_ * math.sin(2 * math.pi * i / 72)) for i in range(72)]
            cikti.append(("poly", [_uygula(M, p) for p in pts], True, kat))
        elif t == "HATCH":
            dong = [[_uygula(M, p) for p in _sadelestir(lp, True)] for lp in _hatch_donguler(kod)]
            if dong:
                derin = _derinlikler(dong)
                cikti.append(("fill", dong, derin, _hatch_renk(d.get("8", "0"), d.get("2", "")),
                              kat + ("|" + _KONTUR[0] if _KONTUR[0] else "")))
        elif t in ("TEXT", "MTEXT"):
            if t == "MTEXT":
                sayac["MTEXT"] = sayac.get("MTEXT", 0) + 1
                return
            h = int(d.get("72", "0"))
            v_ = int(d.get("73", "0"))
            if (h or v_) and "11" in d:
                x, y = float(d["11"]), float(d["21"])
            else:
                x, y = float(d["10"]), float(d["20"])
            a, b = M[0], M[1]
            yatay = {1: "", 4: "", 2: "e"}.get(h, "w")
            dikey = {0: "s", 1: "s", 2: "", 3: "n"}.get(v_, "s")
            anchor = (dikey + yatay) or "center"
            cikti.append(("text", *_uygula(M, (x, y)), float(d.get("40", 2.5)) * math.hypot(a, b),
                          float(d.get("50", 0)) + math.degrees(math.atan2(b, a)),
                          d.get("1", ""), anchor))
        elif t == "INSERT":
            ad = d.get("2", "").strip()
            if ad not in bloklar or derinlik > 6:
                sayac["INSERT(?)"] = sayac.get("INSERT(?)", 0) + 1
                return
            Mt = _birlestir(M, _insert_matrisi(d, taban.get(ad, (0.0, 0.0))))
            onceki = _KONTUR[0]
            _KONTUR[0] = _blok_kontur_katmani(bloklar[ad]) or onceki
            try:
                for e2 in bloklar[ad]:
                    _varlik_prim(e2, Mt, bloklar, taban, cikti, sayac, derinlik + 1)
            finally:
                _KONTUR[0] = onceki
        elif t not in ("SEQEND", "VERTEX", "ATTRIB", "ATTDEF"):
            sayac[t] = sayac.get(t, 0) + 1
    except ValueError as e:
        if t == "HATCH":
            sayac["HATCH(spline/elips)"] = sayac.get("HATCH(spline/elips)", 0) + 1
        else:
            raise e


def _prim_bbox(prims):
    xs, ys = [], []
    for p in prims:
        if p[0] == "fill":
            for lp in p[1]:
                xs += [q[0] for q in lp]
                ys += [q[1] for q in lp]
        elif p[0] == "poly":
            xs += [q[0] for q in p[1]]
            ys += [q[1] for q in p[1]]
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))


def _cam_cizgi_kutular(prims, grup, tur, min_uzun=25.0):
    """Cam, blok dışı uzun paralel çizgilerle çizilmişse (dolgu/spacer yok) her iki camın sınır kutusunu bulur.
    dikey: cam kenarı boyuna x ekseninde uzanan yatay çizgiler; yatay: düşey çizgiler.
    Dönüş: [kutu_1, kutu_2] (profil aksının iki yanı) ya da []."""
    yatay = (tur == "dikey")
    cs = []
    for p in prims:
        if p[0] != "poly" or p[2] or len(p[1]) != 2 or grup.get(id(p), ""):
            continue
        (x1, y1), (x2, y2) = p[1]
        if yatay and abs(y1 - y2) < 1e-6 and abs(x1 - x2) >= min_uzun:
            cs.append((min(x1, x2), max(x1, x2), y1))
        elif not yatay and abs(x1 - x2) < 1e-6 and abs(y1 - y2) >= min_uzun:
            cs.append((min(y1, y2), max(y1, y2), x1))
    if len(cs) < 6:
        return []
    # uzun çizgilerin ortak orta noktası: tüm cam çizgileri aynı kalınlık bandında iki öbek oluşturur
    ort = sorted((a + b) / 2 for a, b, _ in cs)
    ara = max(range(len(ort) - 1), key=lambda i: ort[i + 1] - ort[i]) if len(ort) > 1 else 0
    kes = (ort[ara] + ort[ara + 1]) / 2
    kutular = []
    for grp in ([c for c in cs if (c[0] + c[1]) / 2 < kes], [c for c in cs if (c[0] + c[1]) / 2 >= kes]):
        if len(grp) < 3:
            return []
        a0, a1 = min(c[0] for c in grp), max(c[1] for c in grp)
        t0, t1 = min(c[2] for c in grp), max(c[2] for c in grp)
        kutular.append((a0, t0, a1, t1) if yatay else (t0, a0, t1, a1))
    return kutular


class Grup(str):
    """Parça grubu adı ("izo" | "dis" | "izu" | "prof" | ""); .blok: parçanın DXF blok adı (normlanmış)."""
    blok = ""
    kod = ""        # etikette görünecek parça kodu (blok adı)
    ornek = 0       # aynı bloktan birden çok varsa hangi INSERT'e ait olduğu

    def __new__(cls, ad, blok="", kod="", ornek=0):
        o = str.__new__(cls, ad)
        o.blok, o.kod, o.ornek = blok, kod, ornek
        return o


VARSAYILAN_GRUP = [("02.", "izo"), ("01.11", "dis"), ("01.05", "dis"), ("r50 p", "dis"), ("01.07", "izu")]


def grup_kurallari_oku(yol):
    """Sistem klasöründeki isteğe bağlı grup_kurallari.csv: onek;grup (grup: izo | dis | izu). Blok adı bu önekle
    başlıyorsa parça o gruba girer (izo: cam kalınlığıyla boyu değişen izolatör, dis: dışa kayan parça,
    izu: izolatör ucuna oturan parça - ör. silikon altlık fitili; izolatörün yeni ucu kadar kayar).
    Dosya yoksa E50 kuralları geçerlidir."""
    if not os.path.isfile(yol):
        return VARSAYILAN_GRUP
    ham = open(yol, "rb").read()
    try:
        metin = ham.decode("utf-8-sig")
    except UnicodeDecodeError:
        metin = ham.decode("cp1254", errors="replace")
    out = []
    for i, ln in enumerate(metin.splitlines()):
        pr = [x.strip() for x in ln.split(";")]
        if len(pr) < 2 or not pr[0] or (i == 0 and _norm(pr[0]) == "onek"):
            continue
        out.append((_norm(pr[0]), _norm(pr[1])))
    for onek, g in VARSAYILAN_GRUP:           # dosyada olmayan varsayılan kurallar eklenir
        if g == "izu" and not any(o_ == _norm(onek) for o_, _ in out):
            out.append((_norm(onek), g))
    return out


def _grup_bul(n_, kurallar):
    for onek, g in kurallar:
        if n_.startswith(_norm(onek)):
            return g
    return ""


def detay_yukle(yol, ana_blok="", tur="", ayna=False):
    """DXF'teki tüm çizimi (INSERT'ler dahil) çizim öğelerine çevirir.
    Dönüş: {"prims", "bbox", "spacer": [bbox], "desteklenmeyen": {tür: adet}, "ref": None}"""
    model, bloklar, taban = _dxf_varliklar_yol(yol)
    cikti, sayac, spacer, sp_prim, grup = [], {}, [], [], {}
    n_ins = 0
    kurallar = grup_kurallari_oku(os.path.join(os.path.dirname(os.path.abspath(yol)), "grup_kurallari.csv"))
    for e in model:
        tmp = []
        _varlik_prim(e, _I, bloklar, taban, tmp, sayac)
        g_ = ""
        if e["tur"] == "INSERT":
            ad = ""
            for k, v in e["kod"]:
                if k == "2":
                    ad = v.strip()
                    break
            n_ = _norm(ad)
            g_ = "prof" if (ana_blok and n_ == _norm(ana_blok)) else _grup_bul(_norm(e.get("ilk_ad") or ad), kurallar)
            n_ins += 1
            gr_ = Grup(g_, n_, ad, n_ins)
            for p_ in tmp:
                grup[id(p_)] = gr_
            if "spacer" in _norm(ad):
                bb = _prim_bbox(tmp)
                if bb:
                    spacer.append(bb)
                sp_prim += tmp
                continue
        cikti += tmp
    # gömülü cam: 'Açılım aksesuarı' katmanındaki dolgular camdır; kenar contası (ATR) ve
    # spacer de cam yapısına bağlı olduğundan çıkarılır, cam paketi kullanıcının girdisine göre çizilir
    cam_h = [_prim_bbox([p]) for p in cikti if p[0] == "fill" and "acilim" in p[4]]
    cam_h = [b for b in cam_h if b]
    if cam_h:
        cikti = [p for p in cikti
                 if not (p[0] == "fill" and ("acilim" in p[4] or p[4].startswith("atr")))]

        def cam_ici(p):       # cam konturunun üstüne binen çizgiler (gömülü cam çerçevesi)
            if p[0] != "poly":
                return False
            b = _prim_bbox([p])
            return bool(b) and any(b[0] >= h[0] - 0.6 and b[1] >= h[1] - 0.6
                                   and b[2] <= h[2] + 0.6 and b[3] <= h[3] + 0.6 for h in cam_h)
        cikti = [p for p in cikti if not cam_ici(p)]
    else:
        cikti += sp_prim
        if tur and not spacer:
            cam_h = _cam_cizgi_kutular(cikti, grup, tur)
            if cam_h:       # çizgiyle çizilmiş cam (Reynaers tarzı): cam bölgesindeki çizimler cam paketine aittir
                def cam_ici2(p):
                    if p[0] != "poly":
                        return False
                    b = _prim_bbox([p])
                    return bool(b) and any(b[0] >= h[0] - 0.6 and b[1] >= h[1] - 0.6
                                           and b[2] <= h[2] + 0.6 and b[3] <= h[3] + 0.6 for h in cam_h)
                cikti = [p for p in cikti if not cam_ici2(p)]
    if ayna:                   # x -> -x (şablon, sistemin ortak yönüne çevrilir)
        def ay(p):
            if p[0] == "fill":
                return ("fill", [[(-x, y) for x, y in lp] for lp in p[1]]) + tuple(p[2:])
            if p[0] == "poly":
                return ("poly", [(-x, y) for x, y in p[1]]) + tuple(p[2:])
            return (p[0], -p[1]) + tuple(p[2:])
        yeni_c, yeni_g = [], {}
        for p0 in cikti:
            p1 = ay(p0)
            yeni_c.append(p1)
            yeni_g[id(p1)] = grup.get(id(p0), "")
        cikti, grup = yeni_c, yeni_g
        cam_h = [(-b[2], b[1], -b[0], b[3]) for b in cam_h]
        spacer = [(-b[2], b[1], -b[0], b[3]) for b in spacer]
    bb = _prim_bbox(cikti)
    if bb is None:
        raise ValueError("DXF'te çizilebilir öğe bulunamadı.")
    return {"prims": cikti, "bbox": bb, "spacer": spacer, "cam_hatch": cam_h,
            "grup": [grup.get(id(p), "") for p in cikti],
            "desteklenmeyen": sayac, "ref": None}


def _ters_matris(M):
    a, b, c, d, e, f = M
    det = a * d - b * c
    if abs(det) < 1e-12:
        raise ValueError("Dönüşüm matrisi tersinir değil")
    ia, ib, ic, id_ = d / det, -b / det, -c / det, a / det
    return (ia, ib, ic, id_, -(ia * e + ic * f), -(ib * e + id_ * f))


def _dxf_duzlestir(yol):
    """_dxf_varliklar gibi; ancak dosyada INSERT/blok yoksa model alanındaki çizim, dosya adıyla bir bloğa
    sarılır (WBLOCK ile kaydedilmiş tek parça dosyaları). Başlangıç noktası (0,0)."""
    model, bloklar, taban = _dxf_varliklar_yol(yol)
    stem = os.path.splitext(os.path.basename(yol))[0]
    cizim = [e for e in model if e["tur"] in ("HATCH", "LWPOLYLINE", "LINE", "POLYLINE", "CIRCLE", "ARC")]
    if cizim and not any(e["tur"] == "INSERT" for e in model) and stem not in bloklar:
        bloklar, taban = dict(bloklar), dict(taban)
        bloklar[stem] = list(model)
        taban[stem] = (0.0, 0.0)
    return model, bloklar, taban


def _ham_kesit(yol, blok):
    """Profil kütüphanesinden bloğun kesiti, bloğun kendi koordinatlarında (INSERT çevirisi uygulanmadan).
    Blok koordinatları baz noktasına göre alınır. Dönüş: (kesit, bloklar, taban, gerçek blok adı)."""
    model, bloklar, taban = _dxf_duzlestir(yol)
    ad = next((a for a in bloklar if a.lower() == blok.lower() and not a.startswith("*")), None)
    if not ad:
        raise ValueError(f"'{blok}' bloğu {os.path.basename(yol)} içinde yok.")
    dong = _blok_donguler(bloklar[ad])
    if not dong:
        raise ValueError(f"'{blok}' bloğunda dolgu (HATCH) ya da kapalı polyline yok.")
    bx, by = taban.get(ad, (0.0, 0.0))
    dong = [[(x - bx, y - by) for x, y in lp] for lp in dong]
    return _kesit_olustur(ad, dong), bloklar, taban, ad


CAM_AKS_VARSAYILAN = 9.5
_CAM_UI = {"aks_d": CAM_AKS_VARSAYILAN, "aks_y": CAM_AKS_VARSAYILAN, "oturma": None}   # sağ panel cam alanları


def sablon_orijin(sablon_yol, sablon_blok, tur, ayna=False):
    """Sistemin ortak başlangıç noktasının şablon detaydaki yeri: profil aksı (enine orta) ile camın profile
    oturduğu hat (cam iç yüz düzlemi) kesişimi. Profil blokları bu noktaya göre çizilir.
    Dönüş: ((ox, oy), şablon detayı, şablon ana profil kesiti)."""
    det = detay_yukle(sablon_yol, ana_blok=sablon_blok, tur=tur, ayna=ayna)
    ks, hata = dxf_bloklar(sablon_yol, ayna)
    skes = next((k for a, k in ks.items() if a.lower() == sablon_blok.lower()), None)
    if not skes:
        raise ValueError(f"'{sablon_blok}' ana profil bloğu şablon detayda (HATCH olarak) yok.")
    rx, ry = (skes["xmin"] + skes["xmax"]) / 2, (skes["ymin"] + skes["ymax"]) / 2
    det["ref"] = (rx, ry)
    det["pbox"] = (skes["xmin"], skes["ymin"], skes["xmax"], skes["ymax"])
    if not det.get("cam_hatch") and not det.get("spacer"):
        # şablonda cam çizilmemiş (cam parametrik çizilir). Oturma hattı: ana profilin cam tarafındaki yüzünden
        # 'sablon_oturma' (varsayılan 6,4 mm, profilin cam yüzünün oturma hattının ötesine taşan kısmı) içeride.
        # Cam tarafı: şablondaki diğer parçaların (baskı plakası, kapak) uzandığı taraftır.
        ay = sistem_ayar(os.path.dirname(os.path.abspath(sablon_yol)))
        sayi_ = lambda k_, v_: float(ay.get(k_, str(v_)).replace(",", "."))
        pay, kal = sayi_("sablon_oturma", 6.4), sayi_("sablon_cam_kalinlik", 32)
        if _CAM_UI["oturma"] is not None:
            pay = _CAM_UI["oturma"]                    # sağ paneldeki 'Cam oturma payı' sistem ayarından önceliklidir
        bx0, by0, bx1, by1 = det["bbox"]
        e0, uz = (_CAM_UI["aks_d"] if tur == "dikey" else _CAM_UI["aks_y"]), 41.6    # cam ucu aksa mesafe; sentetik bant boyu
        if tur == "dikey":
            yon = -1 if (skes["ymin"] - by0 >= by1 - skes["ymax"]) else 1
            ti = (skes["ymin"] + pay) if yon < 0 else (skes["ymax"] - pay)
            t0, t1 = sorted((ti, ti + yon * kal))
            det["cam_hatch"] = [(rx - e0 - uz, t0, rx - e0, t1), (rx + e0, t0, rx + e0 + uz, t1)]
        else:
            yon = 1 if (bx1 - skes["xmax"] >= skes["xmin"] - bx0) else -1
            ti = (skes["xmax"] - pay) if yon > 0 else (skes["xmin"] + pay)
            t0, t1 = sorted((ti, ti + yon * kal))
            det["cam_hatch"] = [(t0, ry - e0 - uz, t1, ry - e0), (t0, ry + e0, t1, ry + e0 + uz)]
        det["cam_sentetik"] = True
    g = _cam_geo(det, tur)
    if not g:
        raise ValueError("Şablon detayda cam konumu bulunamadı (cam dolgusu/spacer gerekli).")
    ti = g[2]
    if sistem_ayar(os.path.dirname(os.path.abspath(sablon_yol))).get("profil_orijin") in ("yuz", "face"):
        # kütüphane profillerinin (0,0) noktası profilin cam tarafındaki yüzünde (aksta): yerleşim noktası o yüzdür
        if tur == "dikey":
            yuz = skes["ymin"] if g[3] < 0 else skes["ymax"]
            return (rx, yuz), det, skes
        yuz = skes["xmin"] if g[3] < 0 else skes["xmax"]
        return (yuz, ry), det, skes
    return ((rx, ti) if tur == "dikey" else (ti, ry)), det, skes


_DEGISIM = {}      # {sade(orijinal parça kodu): yeni parça kodu}: kullanıcının parça değişimleri (seçili sistem)
_KUT_KOK = None    # seçili sistemin kütüphane klasörü


def kutuphane_parca_bul(kut, kod):
    """Kütüphanenin herhangi bir alt klasöründe <kod>.dxf dosyası. Dönüş: yol | None"""
    for d in sorted(os.listdir(kut)):
        alt = os.path.join(kut, d)
        if not os.path.isdir(alt):
            continue
        for f in os.listdir(alt):
            if f.lower().endswith(".dxf") and _sade(os.path.splitext(f)[0]) == _sade(kod):
                return os.path.join(alt, f)
    return None


def degisim_kur(kut, degisim, yon=None, kayma=None):
    """Seçili sistemin parça değişimlerini, yön (ayna) ve elle oturtma (kayma) ayarlarını etkinleştirir (boş ise kapatır)."""
    global _KUT_KOK
    _DEGISIM.clear()
    _YON.clear()
    _KAYMA.clear()
    for a, b in (kayma or {}).items():
        try:
            _KAYMA[str(a)] = (float(b[0]), float(b[1]))
        except (TypeError, ValueError, IndexError):
            pass
    for a, b in (yon or {}).items():
        if b:
            _YON[_sade(a)] = b
    _KUT_KOK = kut
    for a, b in (degisim or {}).items():
        _DEGISIM[_sade(a)] = b


# ---- program ayarları: cephe_ayar.json (sistemler, kütüphane yolları, parça değişimleri)
AYAR_DOSYASI = "cephe_ayar.json"
_AYAR_DB = None
AYAR_TAKMA = {"oturma": "sablon_oturma", "cam": "sablon_cam_kalinlik", "orijin": "profil_orijin",
              "hizala": "hizala", "kutuphane": "kutuphane"}
AYAR_ACIKLAMA = {
    "kutuphane": "kütüphane klasörü (DIKME, YATAY, ISI_BARIYERI, SISTEM... alt klasörleri olan)",
    "sablon_oturma": "camın profile oturma payı, mm (şablonda cam çizili değilse; varsayılan 6.4)",
    "sablon_cam_kalinlik": "şablonda çizili cam toplam kalınlığı, mm (şablonda cam yoksa; varsayılan 32)",
    "profil_orijin": "yuz (kütüphane profili: eksen × cam tarafı yüzü) | boş",
    "hizala": "1 = profili şablon eksenine ortala (CW60 tipi sistemler)",
}


def _csv_ayar(yol):
    out = {}
    if os.path.isfile(yol):
        ham = open(yol, "rb").read()
        try:
            metin = ham.decode("utf-8-sig")
        except UnicodeDecodeError:
            metin = ham.decode("cp1254", errors="replace")
        for ln in metin.splitlines():
            pr = [x.strip() for x in ln.split(";")]
            if len(pr) >= 2 and pr[0] and _norm(pr[0]) != "anahtar":
                out[_norm(pr[0])] = pr[1]
    return out


def _ayar_db():
    """Ayar dosyasını bir kez yükler; eski sistemler/<S>/ayarlar.csv (kutuphane içeren) kayıtlarını içe aktarır."""
    global _AYAR_DB
    if _AYAR_DB is not None:
        return _AYAR_DB
    db = {"sistemler": {}, "silinen": []}
    yol = os.path.join(uygulama_klasoru(), AYAR_DOSYASI)
    if os.path.isfile(yol):
        try:
            with open(yol, encoding="utf-8") as f:
                db.update(json.load(f))
        except (OSError, ValueError):
            pass
    db.setdefault("sistemler", {})
    db.setdefault("silinen", [])
    kok = os.path.join(uygulama_klasoru(), "sistemler")
    degisti = False
    if os.path.isdir(kok):
        for ad in sorted(os.listdir(kok)):
            c = _csv_ayar(os.path.join(kok, ad, "ayarlar.csv"))
            if c.get("kutuphane") and ad not in db["sistemler"] and ad not in db["silinen"]:
                db["sistemler"][ad] = c
                degisti = True
    _AYAR_DB = db
    if degisti:
        ayar_kaydet()
    return db


def ayar_kaydet():
    if _AYAR_DB is None:
        return
    try:
        with open(os.path.join(uygulama_klasoru(), AYAR_DOSYASI), "w", encoding="utf-8") as f:
            json.dump(_AYAR_DB, f, ensure_ascii=False, indent=1)
    except OSError:
        pass


GENEL_VARSAYILAN = {"yon_merkez": False, "blok_renk": True, "renk": {}, "cephe_ayna": False, "kesit_ayna": False, "teker_ters": False, "parca_kod": True, "parca_olcu": True, "pdf_ac": True, "tema": "acik"}


TEMALAR = {
    "acik": {"arka": "#f4f5f3", "alan": "#ffffff", "yazi": "#1f2d3a", "soluk": "#7a858e", "dugme": "#e4e7ea",
             "dugme_ust": "#d5dadf", "sec": "#cfe3f1", "sec_yazi": "#1f2d3a", "cizgi": "#c3c9ce",
             "baslik": "#e9ecef", "kural": "#e6f0e3"},
    "koyu": {"arka": "#1b2026", "alan": "#252b32", "yazi": "#dde3e8", "soluk": "#8d98a3", "dugme": "#323a43",
             "dugme_ust": "#3e4853", "sec": "#2f5f7f", "sec_yazi": "#ffffff", "cizgi": "#434c56",
             "baslik": "#2d343c", "kural": "#2c4630"},
}


def koyu_renk(r, c):
    """Açık tema renginin koyu tema karşılığı: açıklık tersine çevrilir, doygun (vurgu) renkler parlak kalır."""
    if not c:
        return c
    try:
        R, G, B = (v / 65535.0 for v in r.winfo_rgb(c))
    except tk.TclError:
        return c
    h, l, sa = colorsys.rgb_to_hls(R, G, B)
    if sa > 0.4 and 0.3 < l < 0.75:
        l2 = max(l, 0.5)
    else:
        l2 = 0.10 + 0.82 * (1.0 - l)
    R, G, B = colorsys.hls_to_rgb(h, l2, sa)
    return "#%02x%02x%02x" % (round(R * 255), round(G * 255), round(B * 255))


class TemaCanvas:
    """Canvas'a çizerken renkleri koyu temaya çevirir (çizim kodu açık renklerle yazılmıştır); PDF'e dokunmaz."""

    def __init__(self, cv):
        self._cv = cv
        self._onb = {}

    def _renk(self, c):
        if c not in self._onb:
            self._onb[c] = koyu_renk(self._cv, c)
        return self._onb[c]

    def __getattr__(self, ad):
        a = getattr(self._cv, ad)
        if ad.startswith("create_"):
            def f(*args, **kw):
                for k in ("fill", "outline", "activefill"):
                    if kw.get(k):
                        kw[k] = self._renk(kw[k])
                return a(*args, **kw)
            return f
        return a


def dosya_ac(yol):
    """Dosyayı sistemin varsayılan uygulamasıyla açar. Başarılıysa True."""
    try:
        if sys.platform.startswith("win"):
            os.startfile(yol)
        elif sys.platform == "darwin":
            import subprocess
            subprocess.Popen(["open", yol])
        else:
            import subprocess
            subprocess.Popen(["xdg-open", yol])
        return True
    except Exception:
        return False


def genel_ayar(anahtar):
    """cephe_ayar.json 'genel' bölümü: teker_ters (fare tekerleği yönü), parca_kod, parca_olcu (detay etiketleri)."""
    return _ayar_db().setdefault("genel", {}).get(anahtar, GENEL_VARSAYILAN.get(anahtar))


def genel_ayar_yaz(anahtar, deger):
    _ayar_db().setdefault("genel", {})[anahtar] = bool(deger)
    ayar_kaydet()


def renk_yaz(anahtar, hx):
    """Katman (ya da 'cam:<tür>') için renk seçimini kaydeder; hx None ise varsayılana döner."""
    d = _ayar_db().setdefault("genel", {}).setdefault("renk", {})
    if hx:
        d[anahtar] = hx
    else:
        d.pop(anahtar, None)
    ayar_kaydet()


def sistem_kaydi(ad, olustur=False):
    """Ayar dosyasındaki sistem kaydı (büyük/küçük harf gözetmez). Dönüş: dict | None"""
    db = _ayar_db()["sistemler"]
    for k in db:
        if _norm(k) == _norm(ad):
            return db[k]
    if olustur:
        db[ad] = {}
        return db[ad]
    return None


def sistem_parcalari(sistem):
    """Seçili sistemin şablonlarındaki parçalar (değişimler dahil).
    Dönüş: [{"tur", "kod" (şimdiki), "orijinal", "klasor", "adet", "alt": [aynı klasördeki diğer kodlar]}]"""
    kay = sistem_kaydi(sistem)
    kut = kutuphane_klasoru(os.path.join(uygulama_klasoru(), "sistemler", sistem)) if kay else None
    if not kut:
        return []
    eski = dict(_DEGISIM)
    _DEGISIM.clear()                      # orijinal şablon parçaları
    try:
        prof = kutuphane_profilleri(os.path.join(uygulama_klasoru(), "sistemler", sistem))
        sab = kutuphane_sablonlari(kut, prof)
        out, gorulen = [], set()
        for tur in ("dikey", "yatay"):
            if not sab[tur]:
                continue
            for yol, ana, _tip in sab[tur]:          # tüm tip şablonları (kapaklı, silikon...)
                for pr in _sablon_parca_adaylari(yol, ana, kut):
                    if (tur, _sade(pr["blok"])) in gorulen:
                        continue
                    gorulen.add((tur, _sade(pr["blok"])))
                    bar = bool(re.match(r"^02\.\d\d", pr["blok"]))     # bariyer: yalnızca yön ayarı (kod otomatik)
                    out += _sp_kayit(tur, pr, kut, eski, bar)
        return out
    finally:
        _DEGISIM.update(eski)


def _sablon_parca_adaylari(yol, ana, kut):
    """Şablondaki parçalar: dxf_parcalar + kesit alanı olmayan ama kütüphanede dosyası bulunan INSERT blokları
    (ör. 01.07.16.ES). Dönüş: [{"blok", "adet"}...]"""
    out = [dict(pr) for pr in dxf_parcalar(yol, ana)]
    var = {_sade(x["blok"]) for x in out}
    model, bloklar, _taban = _dxf_varliklar_yol(yol)
    sayac = Counter()

    def say(ents, derin):
        for e in ents:
            if e["tur"] != "INSERT":
                continue
            ad = next((v.strip() for k, v in e["kod"] if k == "2"), "")
            if ad in bloklar and derin < 6:
                sayac[ad] += 1
                say(bloklar[ad], derin + 1)
    say(model, 0)
    for ad, adet in sorted(sayac.items()):
        if _sade(ad) in var or _norm(ad) == _norm(ana) or not re.match(r"^\d\d\.\d\d", ad):
            continue
        if kutuphane_parca_bul(kut, ad):
            out.append({"blok": ad, "adet": adet})
    return out


def _sp_kayit(tur, pr, kut, eski, bar):
    dosya = kutuphane_parca_bul(kut, pr["blok"])
    klasor = os.path.basename(os.path.dirname(dosya)) if dosya else "?"
    alt = []
    if dosya:
        alt = sorted((os.path.splitext(f)[0] for f in os.listdir(os.path.dirname(dosya))
                      if f.lower().endswith(".dxf") and os.path.splitext(f)[0] != pr["blok"]),
                     key=lambda a_: (a_[:5] != pr["blok"][:5], a_))     # önce aynı ailedekiler (01.03.xx)
    return [{"tur": tur, "orijinal": pr["blok"], "kod": eski.get(_sade(pr["blok"]), pr["blok"]),
             "klasor": klasor, "adet": pr["adet"], "alt": alt, "bariyer": bar}]


def _yerel_bbox(ents, bloklar, taban):
    cikti, sayac = [], {}
    for e in ents:
        _varlik_prim(e, _I, bloklar, taban, cikti, sayac, 1)
    b = _prim_bbox([p for p in cikti if p[0] != "text"])
    return [round(v, 1) for v in b] if b else None


def sistem_denetimi(sistem):
    """Sistem/kütüphane denetimi: şablon varlığı (dikey/yatay), şablondaki blokların kütüphanede karşılığı,
    adedi 0 / dosyası eksik parçalar ve şablon-kütüphane geometri farkı. Dönüş: (satırlar, sorun_sayısı)."""
    sat, sorun = [], 0
    yol_ = os.path.join(uygulama_klasoru(), "sistemler", sistem)
    kut = kutuphane_klasoru(yol_) if os.path.isdir(yol_) else None
    if not kut:
        return [f"[HATA] {sistem}: kütüphane klasörü bulunamadı (sistemler/{sistem}/ altında kütüphane yok)."], 1
    sat.append(f"Sistem: {sistem}   Kütüphane: {kut}")
    try:
        prof = kutuphane_profilleri(yol_)
        sab = kutuphane_sablonlari(kut, prof)
    except Exception as e:
        return sat + [f"[HATA] Şablonlar okunamadı: {e}"], sorun + 1
    for tur in ("dikey", "yatay"):
        if not sab.get(tur):
            sat.append(f"[EKSİK] {tur} şablonu yok: bu yönde detay üretilemez.")
            sorun += 1
        else:
            sat.append(f"[OK] {tur}: {len(sab[tur])} şablon ({', '.join(os.path.basename(x[0]) for x in sab[tur][:4])})")
    try:
        pl = sistem_parcalari(sistem)
    except Exception as e:
        pl, sorun = [], sorun + 1
        sat.append(f"[HATA] Parça listesi okunamadı: {e}")
    eksik = [x for x in pl if x["klasor"] == "?"]
    for x in eksik:
        sat.append(f"[EKSİK] {x['tur']}: {x['orijinal']} — kütüphanede DXF dosyası yok")
    sorun += len(eksik)
    kodlar = Counter(_sade(x["orijinal"]) for x in pl)
    for k, n in kodlar.items():
        if n > 1 and sum(1 for x in pl if _sade(x["orijinal"]) == k and x["klasor"] != "?" and
                         len({y["klasor"] for y in pl if _sade(y["orijinal"]) == k}) > 1):
            sat.append(f"[UYARI] {k}: farklı klasörlerde birden fazla tanım olabilir")
    if pl:
        sat.append(f"[OK] {len(pl)} parça kaydı, {len(pl) - len(eksik)} tanesinin dosyası kütüphanede.")
    sk = sablon_kontrol(sistem)
    for l_ in sk[:-1]:
        sat.append("[FARK] " + l_)
        sorun += 1
    sat.append("[OK] " + sk[-1] if len(sk) == 1 else sk[-1])
    return sat, sorun


def sablon_kontrol(sistem):
    """Şablon DXF'lerindeki blok tanımlarını kütüphanedeki parça dosyalarıyla karşılaştırır
    (base point / geometri farkı). Dönüş: metin satırları listesi."""
    kay = sistem_kaydi(sistem)
    kut = kutuphane_klasoru(os.path.join(uygulama_klasoru(), "sistemler", sistem)) if kay else None
    if not kut:
        return ["Kütüphane klasörü bulunamadı."]
    prof = kutuphane_profilleri(os.path.join(uygulama_klasoru(), "sistemler", sistem))
    sab = kutuphane_sablonlari(kut, prof)
    out, ok, goruldu = [], 0, set()
    for tur in ("dikey", "yatay"):
        for yol, _ana, _tip in sab.get(tur, []):
            if yol in goruldu:
                continue
            goruldu.add(yol)
            m, b, t = _dxf_varliklar_ham(_dxf_cift(yol))
            for e in m:
                if e["tur"] != "INSERT":
                    continue
                ad = next((v.strip() for k, v in e["kod"] if k == "2"), "")
                ky = kutuphane_parca_bul(kut, ad)
                if not ad or ad not in b or not ky:
                    continue
                cift = _dxf_cift(ky)
                m2, b2, t2 = _dxf_varliklar_ham(cift)
                if ad in b2:
                    lb = _yerel_bbox(b2[ad], b2, t2)
                else:
                    lb = _yerel_bbox(m2, b2, t2)
                sb = _yerel_bbox(b[ad], b, t)
                if (ad, tur) in {(x[0], x[1]) for x in out}:
                    continue
                dönük = bool(sb and lb and abs((sb[2] - sb[0]) - (lb[3] - lb[1])) < 0.2
                             and abs((sb[3] - sb[1]) - (lb[2] - lb[0])) < 0.2
                             and abs((sb[2] - sb[0]) - (lb[2] - lb[0])) > 0.2)     # 90° döndürülmüş kopya: sorun değil
                if sb and lb and not dönük and any(abs(x - y) > 0.2 for x, y in zip(sb, lb)):
                    out.append((ad, tur, f"{os.path.basename(yol)}: şablondaki blok x[{sb[0]:g}..{sb[2]:g}] y[{sb[1]:g}..{sb[3]:g}]"
                                f"  ≠  kütüphane x[{lb[0]:g}..{lb[2]:g}] y[{lb[1]:g}..{lb[3]:g}]"))
                else:
                    ok += 1
    sat = [f"{a} ({t}): {m}" for a, t, m in out]
    sat.append(f"{ok} parça şablonla kütüphane arasında uyumlu." if not out else
               f"{len(out)} parçada fark var (base point değişmiş olabilir): şablon DWG'sinde bloğu yeniden tanımlayıp "
               f"parçayı yeniden yerleştirin.")
    return sat


KOMUT_YARDIM = """Komutlar:
  ayar                          seçili sistemin ayarlarını göster
  ayar <anahtar> <değer>        ayar değiştir (kutuphane, oturma, cam, orijin, hizala)
  ayar sil <anahtar>            ayarı varsayılana döndür
  sistem                        sistemleri listele
  sistem yeni <ad> <kütüphane>  yeni sistem ekle (kütüphane klasörü yolu)
  sistem sil <ad>               sistemi listeden kaldır (dosyalar silinmez)
  kontrol                       şablon bloklarını kütüphane dosyalarıyla karşılaştır (base point farkı)
  parca                         şablondaki parçaları listele
  parca <şimdiki> <yeni>        parçayı kütüphanedeki başka bir parçayla değiştir
  parca sifirla [kod|hepsi]     değişimi geri al
  parca yerlesim                şablonlardan öğrenilen parça duruşlarını listele
  parca yon <kod> x|y|90|180|sifirla   parçayı çevir: x sağ-sol, y iç-dış, 90 döndür (her seferde +90°), 180
  dusey kat=90,323,3600 alt=25 ust=35 dilatasyon=20 gecis=B,C orta=E   düşey profil boyunu tek satırda kur (argümansız: mevcut komutu ver)
  yardim"""


def ayar_komut(sistem, satir):
    """Komut satırını çalıştırır. Dönüş: (çıktı metni, yenileme: "" | "hafif" | "tam" | "sistem")
    hafif: profil detayları yeniden üretilir; tam: kütüphane yeniden okunur; sistem: sistem listesi değişti."""
    t = satir.strip()
    if not t:
        return "", ""
    ilk, _, geri = t.partition(" ")
    ilk, geri = _norm(ilk), geri.strip()
    if ilk in ("yardim", "?", "help"):
        return KOMUT_YARDIM, ""
    kay = sistem_kaydi(sistem) if sistem else None
    if ilk == "sistem":
        a, _, r = geri.partition(" ")
        a, r = _norm(a), r.strip()
        db = _ayar_db()
        if not a:
            return "Sistemler: " + (", ".join(sorted(db["sistemler"])) or "(yok)"), ""
        if a == "yeni":
            ad, _, yol = r.partition(" ")
            yol = yol.strip().strip('"')
            if not ad or not yol:
                return "Kullanım: sistem yeni <ad> <kütüphane klasörü yolu>", ""
            if sistem_kaydi(ad):
                return f"'{ad}' zaten var.", ""
            db["sistemler"][ad] = {"kutuphane": yol}
            if ad in db["silinen"]:
                db["silinen"].remove(ad)
            ayar_kaydet()
            uy = "" if os.path.isdir(yol) else "  (UYARI: bu klasör bu bilgisayarda bulunamadı)"
            return f"'{ad}' eklendi.{uy}", "sistem"
        if a == "sil":
            gercek = next((k for k in db["sistemler"] if _norm(k) == _norm(r)), None)
            if not gercek:
                return f"'{r}' diye sistem yok.", ""
            del db["sistemler"][gercek]
            db["silinen"].append(gercek)
            ayar_kaydet()
            return f"'{gercek}' listeden kaldırıldı.", "sistem"
        return "Kullanım: sistem | sistem yeni <ad> <yol> | sistem sil <ad>", ""
    if kay is None:
        return "Bu sistem ayar dosyasında kayıtlı değil (katalog CSV'li sistem). Komutlar için kütüphane sistemi seçin.", ""
    if ilk == "kontrol":
        return "\n".join(sablon_kontrol(sistem)), ""
    if ilk == "ayar":
        if not geri:
            sat = [f"Sistem: {sistem}"]
            for k, ac in AYAR_ACIKLAMA.items():
                v = kay.get(k)
                sat.append(f"  {k} = {v if v not in (None, '') else '(varsayılan)'}   — {ac}")
            dg = kay.get("degisim") or {}
            sat.append("  parça değişimleri: " + (", ".join(f"{a}→{b}" for a, b in dg.items()) or "(yok)"))
            return "\n".join(sat), ""
        a, _, r = geri.partition(" ")
        if _norm(a) == "sil":
            k = AYAR_TAKMA.get(_norm(r), _norm(r))
            if k not in AYAR_ACIKLAMA:
                return f"Bilinmeyen ayar: {r}", ""
            kay.pop(k, None)
            ayar_kaydet()
            return f"{k} varsayılana döndü.", "tam"
        k = AYAR_TAKMA.get(_norm(a), _norm(a))
        if k not in AYAR_ACIKLAMA:
            return f"Bilinmeyen ayar: {a}  (kutuphane, oturma, cam, orijin, hizala)", ""
        v = r.strip().strip('"')
        if not v:
            return f"Kullanım: ayar {a} <değer>", ""
        if k in ("sablon_oturma", "sablon_cam_kalinlik"):
            try:
                if float(v.replace(",", ".")) <= 0:
                    raise ValueError
            except ValueError:
                return f"{a}: pozitif sayı girin.", ""
            v = v.replace(",", ".")
        if k == "profil_orijin" and _norm(v) not in ("yuz", "face", "-", "yok"):
            return "orijin: yuz ya da yok", ""
        if k == "profil_orijin" and _norm(v) in ("-", "yok"):
            v = ""
        kay[k] = v
        ayar_kaydet()
        uy = ""
        if k == "kutuphane" and not os.path.isdir(v):
            uy = "  (UYARI: bu klasör bu bilgisayarda bulunamadı)"
        return f"{k} = {v}{uy}", "tam"
    if ilk == "parca":
        kut = kutuphane_klasoru(os.path.join(uygulama_klasoru(), "sistemler", sistem))
        if not kut:
            return "Kütüphane klasörü bulunamadı: önce 'ayar kutuphane <yol>'.", ""
        pl = sistem_parcalari(sistem)
        a, _, r = geri.partition(" ")
        if not geri:
            sat = ["Şablondaki parçalar (değiştirmek için: parca <şimdiki> <yeni>):"]
            for p_ in (x for x in pl if not x["bariyer"]):
                dg = f"  (orijinal {p_['orijinal']})" if _sade(p_["kod"]) != _sade(p_["orijinal"]) else ""
                sat.append(f"  {p_['tur']:6s} {p_['kod']:10s} x{p_['adet']}  [{p_['klasor']}]{dg}")
            return "\n".join(sat), ""
        dg = kay.setdefault("degisim", {})
        if _norm(a) in ("yerlesim", "durus"):
            db = yerlesim_ogren(kut)
            sat = ["Şablonlardan öğrenilen parça duruşları (dönüş°, ayna x, ayna y):"]
            for k_, v_ in sorted(db.items()):
                sat.append(f"  {k_:12s} " + "  ".join(f"({int(r)}°,{sx:g},{sy:g})" for r, sx, sy in v_))
            return "\n".join(sat), ""
        if _norm(a) == "yon":
            kod_, _, eylem = r.partition(" ")
            ey_ = _norm(eylem.strip()) or "180"
            if _norm(kod_) in ("bariyer", "izolator"):       # şablondaki tüm ısı bariyeri (02.xx) blokları
                bl = list({_sade(x["orijinal"]): x for x in pl if x["bariyer"]}.values())
                if not bl:
                    return "Şablonda ısı bariyeri bloğu yok.", ""
                return "; ".join(_yon_yaz(kay, x["orijinal"], ey_) for x in bl), "hafif"
            p_ = next((x for x in pl if _sade(x["kod"]) == _sade(kod_) or _sade(x["orijinal"]) == _sade(kod_)), None)
            if not p_:
                fe_ = next((v_ for v_ in _FITIL_EK.values() if v_.get("klasor") and _sade(v_["kod"]) == _sade(kod_)), None)
                if fe_:                      # izolatör zincirine eklenen fitil / adaptör: yön zincirde uygulanır
                    return _yon_yaz(kay, fe_["kod"], ey_), "hafif"
                return f"Şablonda '{kod_}' parçası yok. Kullanım: parca yon <kod> x|y|90|180|sifirla", ""
            return _yon_yaz(kay, p_["orijinal"], ey_), "hafif"
        if _norm(a) == "sifirla":
            if not r or _norm(r) == "hepsi":
                dg.clear()
            else:
                for k in [k for k, v in dg.items() if _sade(k) == _sade(r) or _sade(v) == _sade(r)]:
                    del dg[k]
            ayar_kaydet()
            return "Parça değişimi geri alındı.", "hafif"
        yeni = r.strip()
        if not yeni:
            return "Kullanım: parca <şimdiki> <yeni>", ""
        p_ = next((x for x in pl if not x["bariyer"]
                   and (_sade(x["kod"]) == _sade(a) or _sade(x["orijinal"]) == _sade(a))), None)
        if not p_:
            return f"Şablonda '{a}' parçası yok. (parca) ile listeye bakın.", ""
        yol = kutuphane_parca_bul(kut, yeni)
        if not yol:
            return f"Kütüphanede '{yeni}' parçası bulunamadı.", ""
        yeni = os.path.splitext(os.path.basename(yol))[0]
        uy = ""
        if os.path.basename(os.path.dirname(yol)) != p_["klasor"]:
            uy = f"  (UYARI: farklı klasör: {os.path.basename(os.path.dirname(yol))}, orijinal {p_['klasor']})"
        for k in [k for k in dg if _sade(k) == _sade(p_["orijinal"])]:
            del dg[k]
        if _sade(yeni) != _sade(p_["orijinal"]):
            dg[p_["orijinal"]] = yeni
        yd_ = kay.get("yon") or {}
        for k in [k for k in yd_ if _sade(k) == _sade(p_["orijinal"])]:
            del yd_[k]                       # yeni parça otomatik oturtulur; eski elle yön ayarı sıfırlanır
        ayar_kaydet()
        return f"{p_['orijinal']} → {yeni} (şablondaki tüm yerlerde){uy}", "hafif"
    return f"Bilinmeyen komut: {ilk}. 'yardim' yazın.", ""


_EK_AYAR = {}      # seçili sistem klasörünün ayarlar.csv'si: kütüphane SISTEM şablonlarında da geçerli


def sistem_ayar(klasor, ham=False):
    """Sistem klasöründeki isteğe bağlı ayarlar.csv (anahtar;deger). Şimdilik: hizala;1"""
    yol = os.path.join(klasor, "ayarlar.csv")
    out = {}
    kut_sistem = (not os.path.isfile(yol)) and _norm(os.path.basename(os.path.abspath(klasor))) == "sistem"
    if kut_sistem:        # kütüphanenin SISTEM klasörü: ayarlar.csv bir üst klasörde olabilir; yüz-başlangıç kuralı varsayılan
        yol = os.path.join(os.path.dirname(os.path.abspath(klasor)), "ayarlar.csv")
        out["profil_orijin"] = "yuz"
    if os.path.isfile(yol):
        ham = open(yol, "rb").read()
        try:
            metin = ham.decode("utf-8-sig")
        except UnicodeDecodeError:
            metin = ham.decode("cp1254", errors="replace")
        for ln in metin.splitlines():
            pr = [x.strip() for x in ln.split(";")]
            if len(pr) >= 2 and pr[0]:
                out[_norm(pr[0])] = pr[1] if ham else _norm(pr[1])
    kay = sistem_kaydi(os.path.basename(os.path.abspath(klasor)))
    for k_, v_ in (kay or {}).items():          # cephe_ayar.json kaydı csv'nin üstüne yazar
        if isinstance(v_, str) and v_ != "":
            out[_norm(k_)] = v_
    if kut_sistem:
        out.update(_EK_AYAR)
    return out


def profil_sablonlu(kut_yol, kut_blok, sablon_yol, sablon_blok, tur, ayna=False):
    """Profil kütüphanesindeki bir profili şablon detayın montajıyla birleştirir.
    Kural: kütüphanedeki profil bloğunun (0,0) noktası, profil aksı ile camın profile oturduğu hattın kesişimidir
    ve blok, şablon çizimiyle aynı yönde çizilmiştir. Bu yüzden profil, şablonun aynı noktasına (sablon_orijin)
    konur; şablondaki ana profil çıkarılır, fitil/izolatör/baskı plakası/kapak şablondan kalır.
    Dönüş: (kesit, detay, parçalar) - hepsi şablonun koordinat çerçevesinde."""
    h, lbloklar, ltaban, ad = _ham_kesit(kut_yol, kut_blok)
    (ox, oy), det, skes = sablon_orijin(sablon_yol, sablon_blok, tur, ayna)
    # yön denetimi: şablondaki ana profilin uzun ekseni ile kütüphane bloğununki aynı eksende değilse
    # (blok, şablondaki INSERT döndürmesi uygulanmadan, kendi yönünde çizilmiştir) blok 90° saat yönünün tersine döndürülür
    don = (h["w"] > h["h"] * 1.05) != (skes["w"] > skes["h"] * 1.05) and abs(h["w"] - h["h"]) > 1.0
    # Kısa/kareye yakın profillerde (ör. 34x50) uzun-eksen tahmini yanılır. Blok başlangıcı güvenilirse
    # (hizala yok) hangi ekseninin başlangıca göre simetrik (enine eksen) olduğuna bakılır.
    if not sistem_ayar(os.path.dirname(os.path.abspath(kut_yol))).get("hizala") in ("1", "evet", "true"):
        sx = abs(h["xmin"] + h["xmax"]) < 2.0
        sy = abs(h["ymin"] + h["ymax"]) < 2.0
        if sx != sy:
            enine_beklenen_x = (tur == "dikey")          # şablon çerçevesinde enine eksen: dikeyde X, yatayda Y
            don = (sx != enine_beklenen_x)
    if don:
        if tur == "dikey":       # (x,y) -> (-y,x): +90°; derinlik +y'den +x'e... (dikey şablon INSERT'i 90°)
            h = _kesit_olustur(ad, [[(-y, x) for x, y in lp] for lp in h["donguler"]])
        else:                    # yatay: -90°, (x,y) -> (y,-x): derinlik +y'den +x'e (profil cam yüzünden uzağa)
            h = _kesit_olustur(ad, [[(y, -x) for x, y in lp] for lp in h["donguler"]])
    if sistem_ayar(os.path.dirname(os.path.abspath(kut_yol))).get("hizala") in ("1", "evet", "true"):
        # blok başlangıç noktası güvenilmez: profil enine eksende şablondaki profilin ortasına, derinlikte cam tarafındaki
        # yüzü şablondaki profilin cam tarafındaki yüzüne hizalanır
        g_ = _cam_geo(det, tur)
        yon_ = g_[3] if g_ else -1
        if tur == "dikey":
            ox += (skes["xmin"] + skes["xmax"]) / 2 - (h["xmin"] + h["xmax"]) / 2 - ox
            oy += (skes["ymin"] - h["ymin"] - oy) if yon_ < 0 else (skes["ymax"] - h["ymax"] - oy)
        else:
            oy += (skes["ymin"] + skes["ymax"]) / 2 - (h["ymin"] + h["ymax"]) / 2 - oy
            ox += (skes["xmin"] - h["xmin"] - ox) if yon_ < 0 else (skes["xmax"] - h["xmax"] - ox)
    kes = _kesit_olustur(ad, [[(x + ox, y + oy) for x, y in lp] for lp in h["donguler"]])
    yeni, sayac = [], {}
    ins = {"tur": "INSERT", "kod": [("2", ad), ("10", repr(ox)), ("20", repr(oy)), ("30", "0")]
           + ([("50", "90" if tur == "dikey" else "270")] if don else [])}
    _varlik_prim(ins, _I, lbloklar, ltaban, yeni, sayac)
    tol = 1.0           # profil dışına taşan yardımcı çizgiler (eksen/ölçü çizgileri) ve yazılar alınmaz
    yeni = [q for q in yeni if q[0] == "fill" or (q[0] == "poly" and (lambda b_: b_ and b_[0] >= kes["xmin"] - tol
            and b_[1] >= kes["ymin"] - tol and b_[2] <= kes["xmax"] + tol and b_[3] <= kes["ymax"] + tol)(_prim_bbox([q])))]
    # şablon profilin içine düşen model çizgileri (vida kanalı/eksen işaretleri) eski profile aittir: çıkar

    def eski_icinde(q):
        b_ = _prim_bbox([q])
        return bool(b_) and b_[0] >= skes["xmin"] - 0.3 and b_[1] >= skes["ymin"] - 0.3 \
            and b_[2] <= skes["xmax"] + 0.3 and b_[3] <= skes["ymax"] + 0.3
    kalan = [(q, g) for q, g in zip(det["prims"], det["grup"])
             if g != "prof" and not (q[0] == "poly" and eski_icinde(q))]
    prims = [q for q, _ in kalan] + yeni
    det["prims"] = prims
    det["grup"] = [g for _, g in kalan] + [Grup("prof", _norm(ad), ad, 9999)] * len(yeni)
    det["bbox"] = _prim_bbox(prims) or det["bbox"]
    # ref: enine konum profil aksı (başlangıç noktası), derinlikte profilin ortası
    det["ref"] = (ox, (kes["ymin"] + kes["ymax"]) / 2) if tur == "dikey" else ((kes["xmin"] + kes["xmax"]) / 2, oy)
    det["pbox"] = (kes["xmin"], kes["ymin"], kes["xmax"], kes["ymax"])
    return kes, det, dxf_parcalar(sablon_yol, sablon_blok)


CAM_YEDEK_KALINLIK = 24.0   # spacer bulunamazsa cam bandı kalınlığı (mm)


def _cam_ofsetleri(d, tur):
    """Cam bandı ofsetleri. Önce spacer bloklarından (profil merkezine en yakın yüzler),
    spacer yoksa profil kenarına yapışık, CAM_YEDEK_KALINLIK kalınlığında bant."""
    if not d.get("ref"):
        return None
    rx, ry = d["ref"]
    sp = d.get("spacer") or []
    if tur == "dikey":
        sol = [b for b in sp if (b[0] + b[2]) / 2 < rx]
        sag = [b for b in sp if (b[0] + b[2]) / 2 > rx]
        if sol and sag:
            return (rx - max(b[2] for b in sol), min(b[0] for b in sag) - rx,
                    min(b[1] for b in sp), max(b[3] for b in sp))
    else:
        alt = [b for b in sp if (b[1] + b[3]) / 2 < ry]
        ust = [b for b in sp if (b[1] + b[3]) / 2 > ry]
        if alt and ust:
            return (ry - max(b[3] for b in alt), min(b[1] for b in ust) - ry,
                    min(b[0] for b in sp), max(b[2] for b in sp))
    pb = d.get("pbox")
    if not pb:
        return None
    bx0, by0, bx1, by1 = d["bbox"]
    if tur == "dikey":
        yar = (pb[2] - pb[0]) / 2
        if pb[1] - by0 >= by1 - pb[3]:        # detay aşağıya doğru daha çok uzanıyor: cam aşağıda
            return (yar, yar, pb[1] - CAM_YEDEK_KALINLIK, pb[1])
        return (yar, yar, pb[3], pb[3] + CAM_YEDEK_KALINLIK)
    yar = (pb[3] - pb[1]) / 2
    if bx1 - pb[2] >= pb[0] - bx0:            # detay sağa doğru daha çok uzanıyor: cam sağda
        return (yar, yar, pb[2], pb[2] + CAM_YEDEK_KALINLIK)
    return (yar, yar, pb[0] - CAM_YEDEK_KALINLIK, pb[0])


CAM_RENK = {            # tür: (dolgu, çizgi)
    "cam": ("#d7e8f2", "#7fa3b8"), "pvb": ("#4f7f99", "#4f7f99"),
    "hava": ("#f6fafc", "#9ab4c3"), "aralik": ("#8f9aa2", "#6b767e"),
    "spandrel": ("#d8cfbd", "#a89f8a"),
    "sandvic": ("#e3dccb", "#a39b83"), "levha": ("#cfd3d8", "#8d96a0"),
}
KENAR_CONTA = 10.0      # boşluk uçlarındaki kenar sızdırmazlık/ara parça genişliği (mm)


def _cam_geo(d, tur):
    """Camın detaydaki konumu. Dönüş: (kenar_1, kenar_2, ti, yon, kal0)
    kenar_1/2: cam uçlarının profil merkezine uzaklığı (dikey: sol/sağ, yatay: alt/üst),
    ti: iç yüz koordinatı (kalınlık ekseninde), yon: dışa doğru yön (+1/-1), kal0: detaydaki gömülü cam kalınlığı."""
    if not d.get("ref"):
        return None
    rx, ry = d["ref"]
    H = d.get("cam_hatch") or []
    if H:
        if tur == "dikey":     # plan: boyuna eksen x, kalınlık ekseni y
            a = [b for b in H if (b[0] + b[2]) / 2 < rx]
            b_ = [b for b in H if (b[0] + b[2]) / 2 > rx]
            if a and b_:
                t0, t1 = min(b[1] for b in H), max(b[3] for b in H)
                yon = -1 if (t0 + t1) / 2 < ry else 1
                e_ = float(_CAM_UI.get("aks_d") or CAM_AKS_VARSAYILAN)      # cam ucu–aks mesafesi girdisi (DXF'teki cam çizimi değil)
                return (e_, e_, t1 if yon < 0 else t0, yon, t1 - t0)
        else:                  # kesit: boyuna eksen y, kalınlık ekseni x
            a = [b for b in H if (b[1] + b[3]) / 2 < ry]
            b_ = [b for b in H if (b[1] + b[3]) / 2 > ry]
            if a and b_:
                t0, t1 = min(b[0] for b in H), max(b[2] for b in H)
                yon = -1 if (t0 + t1) / 2 < rx else 1
                e_ = float(_CAM_UI.get("aks_y") or CAM_AKS_VARSAYILAN)
                return (e_, e_, t1 if yon < 0 else t0, yon, t1 - t0)
    g = _cam_ofsetleri(d, tur)
    if not g:
        return None
    o1, o2, b0, b1 = g
    c = rx if tur == "yatay" else ry
    yon = -1 if (b0 + b1) / 2 < c else 1
    return (o1, o2, b1 if yon < 0 else b0, yon, b1 - b0)


def tasi_kenarlar(det, own_idx):
    """Parçanın (own_idx: dolgu indisleri) ve diğer tüm parçaların eksene paralel kenarlarının koordinatları (mm):
    (own_x, own_y, oth_x, oth_y). x: dikey kenarların x'i, y: yatay kenarların y'si. Mıknatıs bu kenarlara yapışır."""
    own = set(own_idx)

    def kenar(idxs):
        xs, ys = set(), set()
        for i in idxs:
            for lp in det["prims"][i][1]:
                n = len(lp)
                for k in range(n):
                    (x1, y1), (x2, y2) = lp[k], lp[(k + 1) % n]
                    if abs(x1 - x2) < 0.02 and abs(y1 - y2) >= 0.8:
                        xs.add(round((x1 + x2) / 2, 2))
                    elif abs(y1 - y2) < 0.02 and abs(x1 - x2) >= 0.8:
                        ys.add(round((y1 + y2) / 2, 2))
        return xs, ys
    fill = [i for i, p_ in enumerate(det["prims"]) if p_[0] == "fill"]
    ox, oy = kenar([i for i in fill if i in own])
    nx, ny = kenar([i for i in fill if i not in own])
    return ox, oy, nx, ny


def tasi_yapis(own, oth, d, tol):
    """Ham kayma d (mm) için en yakın paralel kenar çifti: (kayma, hedef koordinat) | None."""
    en = None
    for o in own:
        for n in oth:
            c = n - o
            e = abs(c - d)
            if e <= tol and (en is None or e < en[0]):
                en = (e, c, n)
    return (en[1], en[2]) if en else None


def kayma_yaz(sistem, anahtar, deger):
    """Sistem kaydına parçanın elle oturtma farkını yazar (deger None: siler). Kayıt yoksa False."""
    kay = sistem_kaydi(sistem) if sistem else None
    if kay is None:
        return False
    kd = kay.setdefault("kayma", {})
    if deger is None:
        kd.pop(anahtar, None)
    else:
        kd[anahtar] = [round(deger[0], 3), round(deger[1], 3)]
    ayar_kaydet()
    return True


def kayma_uygula(d, kural):
    """Elle (mıknatısla) oturtulan parçaların konum farkını uygular. kural: {(blok, örnek): (dx, dy)} (mm);
    örnek: zincir parçaları için 5000. Dönüş: yeni detay (değişiklik yoksa aynı)."""
    if not kural or not d or not d.get("grup"):
        return d
    yeni_p, degisti = [], False
    for p, g in zip(d["prims"], d["grup"]):
        orn = getattr(g, "ornek", 0)
        dl = kural.get((_norm(getattr(g, "blok", "")), 5000 if 5000 <= orn < 9000 else orn))
        if not dl or (abs(dl[0]) < 1e-9 and abs(dl[1]) < 1e-9):
            yeni_p.append(p)
            continue
        degisti = True
        ox, oy = dl
        if p[0] == "fill":
            yeni_p.append(("fill", [[(x + ox, y + oy) for x, y in lp] for lp in p[1]], p[2], p[3], p[4]))
        elif p[0] == "poly":
            yeni_p.append(("poly", [(x + ox, y + oy) for x, y in p[1]], p[2], p[3]))
        else:
            yeni_p.append(("text", p[1] + ox, p[2] + oy) + tuple(p[3:]))
    if not degisti:
        return d
    nd = dict(d)
    nd["prims"] = yeni_p
    nd["bbox"] = _prim_bbox(yeni_p) or d["bbox"]
    return nd


def kayma_kurali(kayma, anahtar):
    """model['kayma'] içinden bir aksın/hattın kuralı: anahtar ('d', i) | ('y', j, q) -> {(blok, örnek): (dx, dy)}."""
    n = len(anahtar)
    tur = "dikey" if anahtar and anahtar[0] == "d" else "yatay"
    out = {}
    for k, v in _KAYMA.items():                    # sistemin öğrendiği konumlar (yeni projede de geçerli)
        a = str(k).split("|")
        if len(a) == 3 and a[0] == tur:
            try:
                out[(a[1], int(a[2]))] = (float(v[0]), float(v[1]))
            except (ValueError, TypeError, IndexError):
                pass
    out.update({(k[n], k[n + 1]): v for k, v in (kayma or {}).items() if tuple(k[:n]) == tuple(anahtar)})
    return out


def ogrenilen_anahtar(tur, blok, ornek):
    return f"{tur}|{_norm(blok)}|{5000 if 5000 <= ornek < 9000 else ornek}"


def detay_uyarla(detay, yapi, secim=None, tablo=None, bariyerler=None):
    return _detay_uyarla_ic(detay, yapi, secim, tablo, bariyerler)


DETAY_OLCEK = False   # True: izolatör çizimi cam farkı kadar UZATILIR (ölçekleme). Varsayılan KAPALI: hiçbir parça
                      # ölçeklenmez; yalnızca dış parçalar (kapak, baskı, dış/orta fitil, 01.05) ve seçilen bariyer
                      # zinciri şekli bozulmadan ÖTELENİR. Kalan boşluk/binmeler çizimde ve uyarılarda görünür.


def _detay_uyarla_ic(detay, yapi, secim=None, tablo=None, bariyerler=None):
    """Cam toplam kalınlığına göre detayı uyarlar: baskı plakası, kapak, dış/orta fitil iç yüzden
    uzağa (cam kalınlığı farkı kadar) kayar; izolatör aynı farkla uzar/kısalır.
    Profil ve iç yüz tarafındaki parçalar yerinde kalır. Dönüş: yeni {tur: detay} sözlüğü."""
    out = dict(detay or {})
    if not yapi:
        return out
    for tur in ("dikey", "yatay"):
        d = out.get(tur)
        if not d or not d.get("ref") or not d.get("grup"):
            continue
        g = _cam_geo(d, tur)
        if not g:
            continue
        shift = yapi["kalinlik"] - g[4]
        # parça etiketleri: detaydaki kodlar (detay kalınlığının tablo satırı) -> seçilen satırın kodları
        kodlar = {}
        if secim and tablo:
            taban = [r for r in tablo if not r.get("alternatif") and abs(r["mm"] - g[4]) < 0.5]
            if taban:
                for alan in ("dikey_ic_fitil", "yatay_ic_fitil", "dis_fitil", "orta_fitil", "pvc"):
                    if taban[0].get(alan) and secim.get(alan):
                        kodlar[taban[0][alan].strip()] = secim[alan].strip()
        kombo = _bariyer_kombo(secim, bariyerler)
        if abs(shift) < 0.01 and not kodlar and not kombo:
            continue
        ti, yon = g[2], g[3]
        ax = 1 if tur == "dikey" else 0
        izo = [p for p, gr in zip(d["prims"], d["grup"]) if gr == "izo" and p[0] != "text"]
        ub = ua = None
        if izo:
            bb = _prim_bbox(izo)
            u = sorted((yon * (bb[ax] - ti), yon * (bb[ax + 2] - ti)))
            ua, ub = u
        esik = (ub - 4.0) if ub is not None else 24.0
        # "izu" grubu (izolatör ucuna oturan parça): izolatör zincirinin yeni ucu kadar kayar
        izu_delta = shift
        if kombo and ub is not None:
            izu_delta = (ua + zincir_toplam_gercek(d, tur, kombo, bariyerler, secim, tablo)) - ub

        def yeni(c, delta):
            return c + yon * delta

        def uc_(pts):
            cs = [q[ax] for q in pts]
            return yon * ((min(cs) + max(cs)) / 2 - ti)

        def hareket(pts, gr):
            if gr == "izo" and ub is not None and ub > ua and DETAY_OLCEK:
                out_ = []
                for q in pts:
                    u_ = yon * (q[ax] - ti)
                    dl = shift * min(1.0, max(0.0, (u_ - ua) / (ub - ua)))
                    q2 = list(q)
                    q2[ax] = yeni(q[ax], dl)
                    out_.append(tuple(q2))
                return out_
            rijit = gr in ("dis", "izu") or (gr == "" and uc_(pts) >= esik)
            if not rijit:
                return pts
            # izu: izolatör ucuna oturan parça; köprü fitil (01.05) de zincirin ucundaki kanala oturur
            kay = izu_delta if (gr == "izu" or (kombo and _norm(getattr(gr, "blok", "")).startswith("01.05"))) else shift
            out_ = []
            for q in pts:
                q2 = list(q)
                q2[ax] = yeni(q[ax], kay)
                out_.append(tuple(q2))
            return out_
        yeni_p = []
        for p, gr in zip(d["prims"], d["grup"]):
            if p[0] == "fill":
                yeni_p.append(("fill", [hareket(lp, gr) for lp in p[1]], p[2], p[3], p[4]))
            elif p[0] == "poly":
                yeni_p.append(("poly", hareket(p[1], gr), p[2], p[3]))
            else:                                   # text
                q = hareket([(p[1], p[2])], gr)[0]
                rest = list(p[3:])
                rest[2] = kodlar.get(str(rest[2]).strip(), rest[2])
                yeni_p.append(("text", q[0], q[1]) + tuple(rest))
        grup = list(d["grup"])
        if kombo and ub is not None:
            referans = None
            if secim and tablo:
                tb = [r for r in tablo if not r.get("alternatif") and abs(r["mm"] - g[4]) < 0.5]
                if tb and tb[0].get("pvc") and "+" not in tb[0]["pvc"]:
                    referans = tb[0]["pvc"].strip()
            # detaydaki gerçek izolatör bloğu (ör. silikon şablonda 02.01.13) yön referansıdır: tablodaki kod değil
            gercek = {str(gr_.blok) for p_, gr_ in zip(d["prims"], d["grup"]) if gr_ == "izo" and getattr(gr_, "blok", "")}
            kat_ = {_norm(b_["kod"]) for b_ in (bariyerler or []) if b_.get("prims")}
            gercek = [x for x in gercek if _norm(x) in kat_]
            if len(gercek) == 1:
                referans = next(b_["kod"] for b_ in bariyerler if _norm(b_["kod"]) == _norm(gercek[0]))
            # özgün izolatör etiketi (tek kod) çıkarılır; her bariyere kendi etiketi _bariyer_yerlestir'de eklenir
            pvc0 = ""
            if secim and tablo:
                tb0 = [r for r in tablo if not r.get("alternatif") and abs(r["mm"] - g[4]) < 0.5]
                pvc0 = (tb0[0].get("pvc") or "").strip() if tb0 else ""
            sec_pvc = (secim.get("pvc") or "").strip() if secim else ""
            etk = []
            if pvc0:
                kalan_p, kalan_g = [], []
                for q, gr in zip(yeni_p, grup):
                    if q[0] == "text" and str(q[5]).strip() in (pvc0, sec_pvc) and not etk:
                        etk.append(q)
                    else:
                        kalan_p.append(q)
                        kalan_g.append(gr)
                if etk:
                    yeni_p, grup = kalan_p, kalan_g
            byon = next((v_ for k_, v_ in _YON.items() if re.match(r"^02\.\d\d", k_) and v_), "")
            yeni_p, grup = _bariyer_yerlestir(yeni_p, grup, kombo, referans, bariyerler, ti, yon, ax, ua, ub, shift,
                                              [p_ for p_, gr_ in zip(d["prims"], d["grup"]) if gr_ == "izo"],
                                              etk[0] if etk else None, byon)
        nd = dict(d)
        nd["prims"] = yeni_p
        nd["grup"] = grup
        nd["bbox"] = _prim_bbox(yeni_p) or d["bbox"]
        out[tur] = nd
    return out


_ZINCIR_SON = {}          # son _bariyer_yerlestir çağrısının zincir boyu (profil gagasından, mm)
_ZT_ONB = {}
_OTURMA_ONB = {}
_YON_ONB = {}


def _yerel_nokta(pt, b, yu, yc, rot_):
    """Parçanın bir noktasını zincir yerel eksenlerine (u: zincir boyunca, v: enine, zincir merkezine göre) çevirir."""
    l = b["uzun"]
    bb_ = b["bbox"]
    kcb = (bb_[1 - l] + bb_[3 - l]) / 2
    lam, kap = pt[l], pt[1 - l]
    if rot_:
        a_, b_ = lam - (bb_[l] + bb_[l + 2]) / 2, kap - kcb
        a_, b_ = (-b_, a_) if rot_ == 1 else (b_, -a_)
        return (bb_[l + 2] - bb_[l]) / 2 + yu * a_, yc * b_
    return ((lam - bb_[l]) if yu > 0 else (bb_[l + 2] - lam)), yc * (kap - kcb)


def _oturma_derinligi(bA, fA, bB, fB, azami=8.0, adim=0.25, hucre=0.5, tol=2):
    """Adaptör ile komşu parça birbirine, malzemeleri çarpışmadan en derin ne kadar girer (mm)?
    A'nın ucuna B'yi yaklaştırıp kayarak girdirir; ilk çarpışmada durur. Katalog parçaları şekil olarak değişmez."""
    anah = (bA["kod"], fA, bB["kod"], fB)
    if anah in _OTURMA_ONB:
        return _OTURMA_ONB[anah]

    def yerel(b, f):
        out = []
        for q in b["prims"]:
            if q[0] == "fill":
                out.append(([[_yerel_nokta(pt, b, *f) for pt in lp] for lp in q[1]], q[2]))
        return out
    PA, PB = yerel(bA, fA), yerel(bB, fB)
    if not PA or not PB:
        _OTURMA_ONB[anah] = 0.0
        return 0.0

    def kutu(P):
        xs = [p[0] for lps, _d in P for lp in lps for p in lp]
        ys = [p[1] for lps, _d in P for lp in lps for p in lp]
        return min(xs), min(ys), max(xs), max(ys)
    ka, kb = kutu(PA), kutu(PB)
    lenA = ka[2]

    def malzeme(P, pt):
        return any(_nokta_malzeme(pt, lps, dr) for lps, dr in P)
    derin, s = 0.0, adim
    while s <= azami + 1e-9:
        o = lenA - s                                   # B'nin başlangıcı
        x0, x1 = max(ka[0], kb[0] + o), min(ka[2], kb[2] + o)
        y0, y1 = max(ka[1], kb[1]), min(ka[3], kb[3])
        cak = 0
        if x1 > x0 and y1 > y0:
            nx, ny = max(1, int((x1 - x0) / hucre)), max(1, int((y1 - y0) / hucre))
            for ix in range(nx):
                for iy in range(ny):
                    pt = (x0 + (ix + 0.5) * (x1 - x0) / nx, y0 + (iy + 0.5) * (y1 - y0) / ny)
                    if malzeme(PA, pt) and malzeme(PB, (pt[0] - o, pt[1])):
                        cak += 1
                        if cak > tol:
                            break
                if cak > tol:
                    break
        if cak > tol:
            break
        derin = s
        s += adim
    _OTURMA_ONB[anah] = round(derin, 2)
    return _OTURMA_ONB[anah]


def zincir_toplam_gercek(d, tur, kombo, bariyerler, secim=None, tablo=None):
    """Zincirin profil gagasından dış ucuna gerçek boyu (mm): Σara + son bindirme − adaptör oturma payları.
    Parçaların yönü ve oturması _bariyer_yerlestir'deki ile aynı kurallarla (kuru çalıştırma) bulunur."""
    kodlar = tuple(b["kod"] for b in kombo)
    anah = (id(d), kodlar, tur, tuple(sorted(_YON.items())))
    e = _ZT_ONB.get(anah)
    if e and e[0] is d:
        return e[1]
    g = _cam_geo(d, tur)
    sade = sum(b["ara"] for b in kombo) + kombo[-1].get("bindirme", BARIYER_UC)
    if not g:
        return sade
    ti, yon, ax = g[2], g[3], (1 if tur == "dikey" else 0)
    izo = [p for p, gr in zip(d["prims"], d["grup"]) if gr == "izo" and p[0] != "text"]
    if not izo:
        return sade
    bb = _prim_bbox(izo)
    ua, ub = sorted((yon * (bb[ax] - ti), yon * (bb[ax + 2] - ti)))
    referans = None
    if secim and tablo:
        tb = [r for r in tablo if not r.get("alternatif") and abs(r["mm"] - g[4]) < 0.5]
        if tb and tb[0].get("pvc") and "+" not in tb[0]["pvc"]:
            referans = tb[0]["pvc"].strip()
    gercek = {str(gr_.blok) for p_, gr_ in zip(d["prims"], d["grup"]) if gr_ == "izo" and getattr(gr_, "blok", "")}
    kat_ = {_norm(b_["kod"]) for b_ in (bariyerler or []) if b_.get("prims")}
    gercek = [x for x in gercek if _norm(x) in kat_]
    if len(gercek) == 1:
        referans = next(b_["kod"] for b_ in bariyerler if _norm(b_["kod"]) == _norm(gercek[0]))
    byon = next((v_ for k_, v_ in _YON.items() if re.match(r"^02\.\d\d", k_) and v_), "")
    try:
        _ZINCIR_SON.clear()
        _bariyer_yerlestir(list(d["prims"]), list(d["grup"]), kombo, referans, bariyerler, ti, yon, ax, ua, ub, 0.0,
                           [p_ for p_, gr_ in zip(d["prims"], d["grup"]) if gr_ == "izo"], None, byon)
        toplam = _ZINCIR_SON.get("toplam", sade)
    except Exception:
        toplam = sade
    if len(_ZT_ONB) > 400:
        _ZT_ONB.clear()
    _ZT_ONB[anah] = (d, toplam)
    return toplam


def zincir_uyum_hatasi(d, tur, yapi, kodlar, bariyerler, secim=None, tablo=None):
    """Seçilen zincirin (kodlar: bariyer/adaptör/fitil) bu cam kalınlığında dış parçalarla (baskı, kapak) uyumsuzluğu, mm.
    + : zincir uzun -> 01.05 / baskı BİNER   - : zincir kısa -> BOŞLUK.  Hesaplanamıyorsa None.
    (Dış parçalar cam farkı kadar, zincirin ucundaki parçalar zincir boyu kadar ötelenir; fark uyumsuzluktur.)"""
    if not d or not yapi or not d.get("ref") or not d.get("grup"):
        return None
    g = _cam_geo(d, tur)
    if not g:
        return None
    ti, yon, ax = g[2], g[3], (1 if tur == "dikey" else 0)
    izo = [p for p, gr in zip(d["prims"], d["grup"]) if gr == "izo" and p[0] != "text"]
    if not izo:
        return None
    bb = _prim_bbox(izo)
    ua, ub = sorted((yon * (bb[ax] - ti), yon * (bb[ax + 2] - ti)))
    kat = dict(_FITIL_EK)
    kat.update({_norm(b["kod"]): b for b in bariyerler or []})
    zin = [kat.get(_norm(k)) for k in kodlar]
    if not zin or any(z is None for z in zin):
        return None
    toplam = zincir_toplam_gercek(d, tur, zin, bariyerler, secim, tablo)
    return toplam - (ub - ua) - (yapi["kalinlik"] - g[4])


def bariyer_oner(detay, yapi, bariyerler, azami=3, tol=0.6, en_cok=12, secim=None, tablo=None, ilerleme=None):
    """Cam kalınlığına uyan zincir önerileri: [{"zincir","parca","hata": {tur: mm}, "mutlak"}] (en uygun önce).
    Adaylar: (isteğe bağlı adaptör) + 1..azami ısı bariyeri. Dikey ve yatay detayın ikisinde de en küçük hata öne çıkar."""
    bar = sorted([b for b in bariyerler or [] if b.get("prims")], key=lambda b: (b["ara"], b["kod"]))
    ada = [v for v in _FITIL_EK.values() if v.get("klasor") == "ADAPTOR"]
    turler = [t for t in ("dikey", "yatay") if (detay or {}).get(t)]
    out = []
    adim_, adim_top = 0, max(1, (len(ada) + 1) * azami)
    for ad in [None] + ada:
        for n in range(1, azami + 1):
            adim_ += 1
            if ilerleme:
                ilerleme(adim_ / adim_top)
            for kom in itertools.combinations_with_replacement(bar, n):
                kodlar = ([ad["kod"]] if ad else []) + [b["kod"] for b in kom]
                hata = {}
                for t in turler:
                    h = zincir_uyum_hatasi(detay[t], t, yapi, kodlar, bariyerler, secim, tablo)
                    if h is not None:
                        hata[t] = h
                if not hata:
                    continue
                out.append({"zincir": "+".join(kodlar), "parca": len(kodlar), "hata": hata,
                            "mutlak": max(abs(h) for h in hata.values())})
    out.sort(key=lambda r: (r["mutlak"] > tol, r["parca"] if r["mutlak"] <= tol else 0, r["mutlak"]))
    return out[:en_cok]


def _bariyer_kombo(secim, bariyerler):
    """Seçilen bariyerlerin kataloktaki kayıtları (alttan yukarı); kesiti olmayan varsa None."""
    if not secim or not bariyerler or not secim.get("pvc"):
        return None
    kat = dict(_FITIL_EK)
    kat.update({_norm(b["kod"]): b for b in bariyerler})
    out = []
    for k in secim["pvc"].split("+"):
        b = kat.get(_norm(k))
        if not b or not b.get("prims"):
            return None
        out.append(b)
    return out or None


BARIYER_UC = 3.9    # bariyer bloğunun ara mesafe dışında kalan uzantısı (mm): toplam boy = ara + 3.9
KATMAN_BINDIRME = {"ISI_BARIYERI": BARIYER_UC, "FITIL": BARIYER_UC, "ADAPTOR": 0.0}   # klasör başına katmanların birbirine girme payı (mm)


def _bariyer_yerlestir(prims, grup, kombo, referans, bariyerler, ti, yon, ax, ua, ub, shift, eski_prims, etiket=None,
                       byon=""):
    """Detaydaki izolatör (02.xx) çizimini seçilen bariyerlerle değiştirir. Bariyerler iç yüzden dışa doğru
    üst üste dizilir (komşu parçalar BARIYER_UC kadar bindirir); toplam boy cam kalınlığına göre kayan
    dış parçalarla uyumludur. Yön ve simetri, detaydaki özgün izolatörden (referans kod) alınır."""
    eski = [(q, "izo") for q in eski_prims if q[0] != "text"]
    bb = _prim_bbox([q for q, _ in eski])
    if not bb:
        return prims, grup
    kc = (bb[1 - ax] + bb[3 - ax]) / 2          # özgün izolatörün enine merkezi
    # özgün çizimin yönü: köşe noktalarının ortalaması orta çizgiye göre hangi yanda
    def noktalar(pl):
        for q in pl:
            if q[0] == "fill":
                for lp in q[1]:
                    yield from lp
            elif q[0] == "poly":
                yield from q[1]
    eskipts = list(noktalar([q for q, _ in eski]))
    mu = sum(yon * (pt[ax] - ti) for pt in eskipts) / len(eskipts)
    mc = sum(pt[1 - ax] for pt in eskipts) / len(eskipts)
    so = mu - (ua + ub) / 2
    sc_ = mc - kc
    yon_u, yon_c = 1, 1
    ref = next((b for b in (bariyerler or []) if referans and _norm(b["kod"]) == _norm(referans) and b.get("prims")), None)
    izu_p = [q for q, gr in zip(prims, grup) if gr == "izu" and q[0] != "text"]
    fitil_var = any(b.get("fitil") for b in kombo)
    if ref:
        l = ref["uzun"]
        bpts = list(noktalar(ref["prims"]))
        rb = ref["bbox"]
        ml = sum(pt[l] for pt in bpts) / len(bpts) - (rb[l] + rb[l + 2]) / 2
        mk = sum(pt[1 - l] for pt in bpts) / len(bpts) - (rb[1 - l] + rb[3 - l]) / 2
        if abs(so) > 0.05 and abs(ml) > 0.05:
            yon_u = 1 if so * ml > 0 else -1
        if abs(sc_) > 0.02 and abs(mk) > 0.02:
            yon_c = 1 if sc_ * mk > 0 else -1
    for ch in (byon or ""):           # kullanıcı yön ayarı: x = ekranda sağ-sol, y = ekranda iç-dış (yukarı-aşağı)
        if (ch == "x") == (ax == 0):
            yon_u = -yon_u
        else:
            yon_c = -yon_c
    toplam = sum(b["ara"] for b in kombo) + kombo[-1].get("bindirme", BARIYER_UC)
    # bariyer dizisi profilin gagasından (özgün izolatörün profile giren ucu = ua) başlar; cam kalınlığı farkı
    # (shift) yalnızca dış tarafta, orta fitil ucunda kalır. Böylece dizi ortalanıp kaymaz.
    baslangic = ua
    fkodlar = {_norm(b["kod"]) for b in kombo if b.get("fitil")}
    yeni = [(q, gr) for q, gr in zip(prims, grup)
            if (gr != "izo" and not (fitil_var and gr == "izu")) or
            (q[0] == "text" and _norm(str(q[5]).strip()) not in fkodlar)]
    # zincirin son halkası fitilse: yönü şablondaki fitilden (izu grubu) alınır
    izu_pts = list(noktalar(izu_p)) if izu_p else []
    izu_bb = _prim_bbox(izu_p) if izu_p else None
    ofs = 0.0
    eklenen = []
    onceki_, ofs_liste = None, []
    for bi_, b in enumerate(kombo):
        l = b["uzun"]
        bb_ = b["bbox"]
        kcb = (bb_[1 - l] + bb_[3 - l]) / 2
        grb = Grup("izo", _norm(b["kod"]), b["kod"], 5000 + bi_)
        yu, yc = (1, 1) if b.get("klasor") else (yon_u, yon_c)      # fitil/adaptör: izolatörün yönünden bağımsız
        if b.get("fitil") and izu_pts and izu_bb:
            bp_ = list(noktalar(b["prims"]))
            ml_ = sum(pt[l] for pt in bp_) / len(bp_) - (bb_[l] + bb_[l + 2]) / 2
            mk_ = sum(pt[1 - l] for pt in bp_) / len(bp_) - (bb_[1 - l] + bb_[3 - l]) / 2
            su_ = (sum(yon * (pt[ax] - ti) for pt in izu_pts) / len(izu_pts)
                   - (yon * (izu_bb[ax] - ti) + yon * (izu_bb[ax + 2] - ti)) / 2)
            sk_ = sum(pt[1 - ax] for pt in izu_pts) / len(izu_pts) - (izu_bb[1 - ax] + izu_bb[3 - ax]) / 2
            yu = (1 if su_ * ml_ > 0 else -1) if (abs(su_) > 0.05 and abs(ml_) > 0.05) else 1
            yc = (1 if sk_ * mk_ > 0 else -1) if (abs(sk_) > 0.02 and abs(mk_) > 0.02) else 1
        rot_ = 0
        oto_yon_ = False
        if b.get("klasor") and not b.get("bariyer_gibi"):       # fitil/adaptör: parça yönü ayarı (x: sağ-sol, y: iç-dış, rakam: 90° dönüş)
            ys_ = next((v_ for k_, v_ in _YON.items() if _sade(k_) == _sade(b["kod"])), "") or ""
            rot_ = int("".join(ch for ch in ys_ if ch.isdigit()) or 0) % 4
            oto_yon_ = not ys_.strip()                   # elle yön verilmemişse otomatik yönlendirilir
            fl_ = [ch for ch in ys_ if ch in "xy"]
            if rot_ == 2:                                # 180°: iki yönde çevirme
                fl_ += ["x", "y"]
                rot_ = 0
            for ch in fl_:
                if (ch == "x") == (ax == 0):
                    yu = -yu
                else:
                    yc = -yc

        def esle(pt, yu_=None, yc_=None):
            nu, v = _yerel_nokta(pt, b, yu if yu_ is None else yu_, yc if yc_ is None else yc_, rot_)
            w = [0.0, 0.0]
            w[ax] = ti + yon * (baslangic + ofs + nu)
            w[1 - ax] = kc + v
            return tuple(w)
        if oto_yon_:
            # elle yön verilmedi: dört çevirme (düz, sağ-sol, iç-dış, ikisi) denenir; profil/fitil malzemesiyle EN AZ
            # çakışan yön seçilir (adaptör profil gagasına oturur). Beraberlikte varsayılan yön korunur.
            diger = [(q_, _prim_bbox([q_])) for q_, g_ in yeni
                     if q_[0] == "fill" and g_ != "izo" and getattr(g_, "blok", "") and not str(getattr(g_, "blok", "")).startswith("02.")]
            yk_ = (b["kod"], round(ti, 2), round(baslangic + ofs, 2), len(diger),
                   round(sum(sum(bb2) for _o, bb2 in diger if bb2), 2), yu, yc)
            if yk_ in _YON_ONB:
                en_iyi = _YON_ONB[yk_]
            else:
                en_iyi, en_az = (yu, yc), None
                for ay_, ac_ in ((yu, yc), (-yu, yc), (yu, -yc), (-yu, -yc)):
                    cak = 0
                    for q in b["prims"]:
                        if q[0] != "fill":
                            continue
                        lps = [[esle(pt, ay_, ac_) for pt in lp] for lp in q[1]]
                        xs_ = [p_[0] for lp in lps for p_ in lp]
                        ys2_ = [p_[1] for lp in lps for p_ in lp]
                        x0_, x1_, y0_, y1_ = min(xs_), max(xs_), min(ys2_), max(ys2_)
                        adim_ = max(0.6, max(x1_ - x0_, y1_ - y0_) / 24)
                        comp = [(o_, bb2) for o_, bb2 in diger if bb2 and bb2[0] < x1_ and bb2[2] > x0_ and bb2[1] < y1_ and bb2[3] > y0_]
                        if not comp:
                            continue
                        nx_ = int((x1_ - x0_) / adim_) + 1
                        ny_ = int((y1_ - y0_) / adim_) + 1
                        for ix_ in range(nx_):
                            for iy_ in range(ny_):
                                pt_ = (x0_ + (ix_ + 0.5) * adim_, y0_ + (iy_ + 0.5) * adim_)
                                if not _nokta_malzeme(pt_, lps, q[2]):
                                    continue
                                if any(bb2[0] <= pt_[0] <= bb2[2] and bb2[1] <= pt_[1] <= bb2[3]
                                       and _nokta_malzeme(pt_, o_[1], o_[2]) for o_, bb2 in comp):
                                    cak += 1
                    if en_az is None or cak < en_az - 1:       # belirgin biçimde daha az çakışıyorsa değiştir
                        en_az, en_iyi = cak, (ay_, ac_)
                if len(_YON_ONB) > 300:
                    _YON_ONB.clear()
                _YON_ONB[yk_] = en_iyi
            yu, yc = en_iyi
        # adaptör oturması: adaptörün komşusuyla çakışmadan en derin girdiği kadar zincir kısalır (bindirme elle
        # verilmişse — ayar 'katman_bindirme' — dokunulmaz)
        if onceki_ is not None and (b.get("klasor") == "ADAPTOR" or onceki_[0].get("klasor") == "ADAPTOR") \
                and katman_bindirme("ADAPTOR") == 0.0:
            ofs -= _oturma_derinligi(onceki_[0], onceki_[1], b, (yu, yc, rot_))
        ofs_liste.append(ofs)
        onceki_ = (b, (yu, yc, rot_))
        for q in b["prims"]:
            if q[0] == "fill":
                eklenen.append((("fill", [[esle(pt) for pt in lp] for lp in q[1]], q[2], q[3], q[4]), grb))
            elif q[0] == "poly":
                eklenen.append((("poly", [esle(pt) for pt in q[1]], q[2], q[3]), grb))
        ofs += b["ara"]
    _ZINCIR_SON["toplam"] = ofs + kombo[-1].get("bindirme", BARIYER_UC)
    if etiket is not None:
        # her bariyerin kendi etiketi: parçanın orta noktasında; çakışırsa enine yönde dışarı kaydırılır
        _, ex, ey, eh, ea, _m, ehz = etiket
        nch = 0.62                                           # karakter genişliği / yükseklik
        enine = ey if ax == 0 else ex
        itis = -1 if enine < kc else 1

        def kutu(x, y, h, a, m):
            n = len(str(m)) * nch * h
            if abs(a) < 45:
                return (x, y, x + n, y + h)
            return (x - h, y, x, y + n)
        yer = [kutu(q[1], q[2], q[3], q[4], q[5]) for q, _g in yeni if q[0] == "text"]
        for bi2_, b in enumerate(kombo):
            uc = baslangic + ofs_liste[bi2_] + (b["ara"] + b.get("bindirme", BARIYER_UC)) / 2
            n = len(str(b["kod"])) * nch * eh
            pos = [ex, ey]
            pos[ax] = ti + yon * uc - n / 2
            for _k in range(4):
                kb = kutu(pos[0], pos[1], eh, ea, b["kod"])
                if not any(kb[0] < r[2] and kb[2] > r[0] and kb[1] < r[3] and kb[3] > r[1] for r in yer):
                    break
                pos[1 - ax] += itis * 1.5 * eh
            yer.append(kutu(pos[0], pos[1], eh, ea, b["kod"]))
            eklenen.append((("text", pos[0], pos[1], eh, ea, b["kod"], ehz), ""))
    yeni = [x for x in eklenen if x[0][0] != "text"] + yeni + [x for x in eklenen if x[0][0] == "text"]   # bariyerler en altta, etiketler üstte
    if fitil_var and izu_pts:
        # köprü fitil (01.05) şablonda izolatör ucundaki fitile (ES ...) göre durur: zincirdeki fitil şablondakinden
        # farklı yere geldiyse köprü fitil de aynı farkla taşınır (kanala oturması bozulmasın)
        son_f = next((b for b in reversed(kombo) if b.get("fitil")), None)
        if son_f is not None:
            nk = _norm(son_f["kod"])
            cu = [yon * (pt[ax] - ti) for q, g_ in eklenen if q[0] != "text" and getattr(g_, "blok", "") == nk
                  for pt in (noktalar([q]))]
            if cu:
                dif = max(cu) - max(yon * (pt[ax] - ti) for pt in izu_pts)
                if abs(dif) > 0.01:
                    def kay_(pt):
                        w = list(pt)
                        w[ax] += yon * dif
                        return tuple(w)
                    yy = []
                    for q, g_ in yeni:
                        if g_ and _norm(getattr(g_, "blok", "")).startswith("01.05"):
                            if q[0] == "fill":
                                q = ("fill", [[kay_(pt) for pt in lp] for lp in q[1]], q[2], q[3], q[4])
                            elif q[0] == "poly":
                                q = ("poly", [kay_(pt) for pt in q[1]], q[2], q[3])
                            else:
                                w = kay_((q[1], q[2]))
                                q = ("text", w[0], w[1]) + tuple(q[3:])
                        yy.append((q, g_))
                    yeni = yy
    return [q for q, _ in yeni], [gr for _, gr in yeni]


def detay_cam_dikdortgenleri(d, tur, yapi, surekli=False):
    """Kesit sekmesi için: detaydaki cam konumuna (tek açıklık, her iki yanda) katmanlı cam paketi."""
    g = _cam_geo(d, tur)
    H = d.get("cam_hatch") or []
    if not g or not H:
        return []
    rx, ry = d["ref"]
    o1, o2, ti, yon, kal0 = g
    ar = cam_araliklari(yapi, ti, yon, kal0, "cam")
    if tur == "dikey":
        sol = [b for b in H if (b[0] + b[2]) / 2 < rx]
        sag = [b for b in H if (b[0] + b[2]) / 2 > rx]
        araliklar = ((min(b[0] for b in sol), rx - o1), (rx + o2, max(b[2] for b in sag)))
    else:
        alt = [b for b in H if (b[1] + b[3]) / 2 < ry]
        ust = [b for b in H if (b[1] + b[3]) / 2 > ry]
        araliklar = ((min(b[1] for b in alt), ry - o1), (ry + o2, max(b[3] for b in ust)))
    if surekli:                                   # yalancı aks/hat: cam profil boyunca kesintisiz devam eder
        araliklar = ((araliklar[0][0], araliklar[1][1]),)
    out = []
    for a0, a1 in araliklar:
        out += _cam_dikdortgenleri(a0, a1, ar, tur == "dikey")
    return out


def cam_araliklari(yapi, ti, yon, kal0, tip):
    """Kalınlık ekseninde katman aralıkları [(alt, üst, tür)]. İç yüzden dışa doğru dizilir.
    yapi yoksa gömülü cam kalınlığında tek cam/panel."""
    pt = PANEL_TIPLERI.get(tip, {})
    if pt.get("bos"):
        return []
    if tip not in ("cam", "spandrel") and pt.get("kal"):
        a, b = sorted((ti, ti + yon * pt["kal"]))
        return [(a, b, tip)]
    if tip == "spandrel" or not yapi:
        kal = yapi["kalinlik"] if yapi else kal0
        a, b = sorted((ti, ti + yon * kal))
        return [(a, b, "spandrel" if tip == "spandrel" else "cam")]
    out, c = [], 0.0
    for tr, v in reversed(yapi["katman"]):          # yapi dıştan içe; iç yüzden başla
        a, b = sorted((ti + yon * c, ti + yon * (c + v)))
        out.append((a, b, tr))
        c += v
    return out


def _cam_dikdortgenleri(boy0, boy1, aralik, yatay_boy):
    """Bir cam alanının dikdörtgenleri. yatay_boy=True: boyuna eksen x (plan), kalınlık y."""
    out = []
    for a, b, tr in aralik:
        if yatay_boy:
            out.append((boy0, a, boy1, b, tr))
            if tr == "hava" and boy1 - boy0 > 2.5 * KENAR_CONTA:
                out.append((boy0, a, boy0 + KENAR_CONTA, b, "aralik"))
                out.append((boy1 - KENAR_CONTA, a, boy1, b, "aralik"))
        else:
            out.append((a, boy0, b, boy1, tr))
            if tr == "hava" and boy1 - boy0 > 2.5 * KENAR_CONTA:
                out.append((a, boy0, b, boy0 + KENAR_CONTA, "aralik"))
                out.append((a, boy1 - KENAR_CONTA, b, boy1, "aralik"))
    return out


def detay_tip_varyanti(d, cikar, zorla=()):
    """Detaydan, blok adı cikar listesinde (normlanmış kodlar) olan parçaları çıkarılmış kopya."""
    if not cikar:
        return d
    cik, zor = set(cikar), set(zorla or ())
    # izolatör zincirine seçilerek eklenen fitil (ornek >= 5000), tipin kendi çıkar listesinden etkilenmez;
    # ama kullanıcının o hat için açıkça çıkardığı parça (zorla) zincirdekini de çıkarır
    keep = [i for i, g in enumerate(d["grup"])
            if getattr(g, "blok", "") not in cik
            or (getattr(g, "ornek", 0) >= 5000 and getattr(g, "blok", "") in _FITIL_EK
                and getattr(g, "blok", "") not in zor)]
    nd = dict(d)
    nd["prims"] = [d["prims"][i] for i in keep]
    nd["grup"] = [d["grup"][i] for i in keep]
    return nd


def _profil_blok(d):
    """Detaydaki ana profil bloğunun (grup) adı: sınır kutusu profil kutusuyla (pbox) çakışan blok."""
    pb = d.get("pbox") if d else None
    if not pb:
        return None
    by = {}
    for pr, g in zip(d["prims"], d["grup"]):
        if pr[0] != "text":
            by.setdefault(getattr(g, "blok", ""), []).append(pr)
    for b, prs in by.items():
        if b:
            bb = _prim_bbox(prs)
            if all(abs(bb[i] - pb[i]) < 0.6 for i in range(4)):
                return b
    return None


def sayfa_yerlesim(s, th):
    """Görünüşün altındaki plan ve sağındaki kesit için yerleşim (mm, y yukarı).
    Katalog detayı her aks (plan) ve her yatay hatta (kesit) tekrarlanır;
    cam/spandrel bantları bölgelere göre otomatik eklenir.
    Kesitte, kesilmeyen dikey profil arkada silüet olarak gösterilir (alt/üst uzantılı boyuyla);
    plan ve kesit detaylarının cam düzlemleri çakıştırılarak derinlik hizalanır."""
    cols = s["cols"]
    cx = [0.0]
    for c in cols:
        cx.append(cx[-1] + c)
    TW = cx[-1]
    TH = sum(s["rows"])
    ys = [y for y, _ in s["cizgiler"]]
    alt_raw, ust_raw = s.get("dikey_alt", 0.0), s.get("dikey_ust", 0.0)
    det = s.get("detay") or {}
    out = {}
    dd = det.get("dikey")
    if dd and dd.get("ref"):
        rx, ry = dd["ref"]
        x0, y0, x1, y1 = dd["bbox"]
        dy = -10 * th - max(0.0, alt_raw) - y1
        cam = []
        yapi = s.get("cam_yapi")
        g = _cam_geo(dd, "dikey")
        py0, py1 = y0, y1
        if g:
            off_l, off_r, ti, yon, kal0 = g
            yal_s = s.get("yalanci") or set()
            for i in range(len(cols)):
                ar = cam_araliklari(yapi, ti, yon, kal0, "cam")
                # yalancı aksta profil yok: cam aksın ötesine kadar devam eder
                cam += _cam_dikdortgenleri(cx[i] + (0.0 if ("d", i) in yal_s else off_r),
                                           cx[i + 1] - (0.0 if ("d", i + 1) in yal_s else off_l),
                                           [(a + dy, b + dy, t) for a, b, t in ar], True)
            py0 = min(py0, min(a for a, _, _ in ar)); py1 = max(py1, max(b for _, b, _ in ar))
        pcik_s = s.get("parca_cikar") or {}
        dyok_s = s.get("dik_yok") or set()
        dtp_s = {t["tip"]: t for t in (s.get("dtipler") or [])}
        dtik_s = s.get("dik_tip") or {}
        hd_p, ofs_p = [], []
        dtv_s = s.get("detay_tip_d") or {}
        for i in range(len(cx)):
            sg_ = [j for j in range(len(s["rows"])) if (i, j) not in dyok_s]
            rm_ = set.intersection(*[{_norm(x) for x in pcik_s.get(("d", i, j), ())} for j in sg_]) if sg_ else set()
            sayac_ = Counter(dtik_s.get((i, j), s.get("dtip")) for j in sg_)
            ad_ = max(sayac_, key=lambda a: (sayac_[a], a == s.get("dtip"))) if sayac_ else s.get("dtip")
            gv_ = _cam_geo(dtv_s[ad_], "dikey") if (ad_ in dtv_s and dtv_s[ad_].get("ref")) else None
            zc_ = (s.get("zincir_hat") or {}).get(("d", i))               # bu aksa özel katman zinciri
            kur_ = kayma_kurali(s.get("kayma"), ("d", i))                  # bu aksta elle oturtulan parçalar
            zd_ = s.get("detay_zincir") or {}
            if g and gv_:                       # kendi şablonu olan dikey tip: cam düzlemi taban detayla çakıştırılır
                dv_ = (zd_.get(("dikey", ad_, zc_)) if zc_ else None) or dtv_s[ad_]
                dv2_ = detay_tip_varyanti(dv_, sorted(rm_), rm_) if rm_ else dv_
                hd_p.append(kayma_uygula(dv2_, kur_))
                ofs_p.append((cx[i] - dv_["ref"][0], dy + g[2] - gv_[2]))
                continue
            tc_ = set(_norm(x) for x in (dtp_s[ad_]["cikar"] if ad_ in dtp_s else []))
            dd_i = (zd_.get(("dikey", "", zc_)) if zc_ else None) or dd
            dd2_ = detay_tip_varyanti(dd_i, sorted(rm_ | tc_), rm_) if (rm_ or tc_) else dd_i
            hd_p.append(kayma_uygula(dd2_, kur_))
            ofs_p.append((cx[i] - rx, dy))
        out["plan"] = {"detay": dd, "ofset": ofs_p, "cam": cam, "geo": g, "hat_detay": hd_p,
                       "bbox": (cx[0] + x0 - rx, dy + py0, cx[-1] + x1 - rx, dy + py1)}
    d = det.get("yatay")
    if d and d.get("ref"):
        rx, ry = d["ref"]
        x0, y0, x1, y1 = d["bbox"]
        g = _cam_geo(d, "yatay")
        # dikey profilin kesitteki silüeti: cam düzlemleri çakıştırılır, dış yön her detayda
        # camın profil merkezine göre bulunduğu tarafa göre belirlenir
        sil = None
        gp = _cam_geo(dd, "dikey") if (dd and dd.get("ref") and dd.get("pbox")) else None
        if g and gp:
            pb = dd["pbox"]
            yg, xg = gp[2], g[2]              # iç yüz düzlemleri çakıştırılır
            k_ = g[3] * gp[3]                 # plan y yönü -> kesit x yönü
            sil = tuple(sorted((xg + k_ * (pb[1] - yg), xg + k_ * (pb[3] - yg))))
        yapi = s.get("cam_yapi")
        gx0, gx1 = x0, x1
        if g:
            ar0 = cam_araliklari(yapi, g[2], g[3], g[4], "cam")
            gx0, gx1 = min(x0, min(a for a, _, _ in ar0)), max(x1, max(b for _, b, _ in ar0))
        xmin_d = min(gx0, sil[0]) if sil else gx0
        xmax_d = max(gx1, sil[1]) if sil else gx1
        tvar = {}                # kendi şablonu olan hat tipleri: cam oturma düzlemi taban detayla çakıştırılır
        for ad_t, dv in (s.get("detay_tip") or {}).items():
            gv = _cam_geo(dv, "yatay") if dv.get("ref") else None
            if g and gv:
                tvar[ad_t] = (dv, g[2] - gv[2])
                xmin_d = min(xmin_d, dv["bbox"][0] + g[2] - gv[2])
                xmax_d = max(xmax_d, dv["bbox"][2] + g[2] - gv[2])
        xs = TW + 14 * th
        dx = xs - xmin_d
        cam = []
        if g:
            off_alt, off_ust, ti, yon, kal0 = g
            hu_k = s.get("hucre") or {}
            kk_ = s.get("kesit_kol")
            yal_y = {}
            for k_y, hid_y in enumerate(s.get("hat_id") or []):
                if ("y",) + tuple(hid_y) in (s.get("yalanci") or set()) and k_y < len(ys):
                    yal_y[round(ys[k_y], 3)] = True
            for z in s["bolgeler"]:
                ya, yb = z["y0"] + off_ust, z["y1"] - off_alt
                if yal_y.get(round(z["y0"], 3)):          # alt/üst hat yalancı: cam hattın ötesine devam eder
                    ya = z["y0"]
                if yal_y.get(round(z["y1"], 3)):
                    yb = z["y1"]
                if yb > ya:
                    spy = s.get("spandrel_yapi")
                    # kesit tek bir aks aralığından geçer: seçili aks varsa o aralık, yoksa bölgedeki hücrelerin çoğunluğu
                    if kk_ is not None and 0 <= kk_ < len(cols):
                        ztip = hu_k.get((z["kat"], z.get("k", 0), kk_), z["tip"])
                    else:
                        say_z = Counter(hu_k.get((z["kat"], z.get("k", 0), i), z["tip"]) for i in range(len(cols)))
                        ztip = max(say_z, key=lambda a: (say_z[a], a == z["tip"])) if say_z else z["tip"]
                    if ztip == "spandrel" and spy:
                        ar = cam_araliklari(spy, ti, yon, kal0, "cam")
                    else:
                        ar = cam_araliklari(yapi, ti, yon, kal0, ztip)
                    cam += _cam_dikdortgenleri(ya, yb, [(a + dx, b + dx, t) for a, b, t in ar], False)
        ylo, yhi = ys[0] + y0 - ry, ys[-1] + y1 - ry
        mull = None
        if sil:
            mull = {"x1": sil[0] + dx, "x2": sil[1] + dx, "y1": -alt_raw, "y2": TH + ust_raw,
                    "alt": alt_raw, "ust": ust_raw, "TH": TH}
            ylo, yhi = min(ylo, -alt_raw), max(yhi, TH + ust_raw)
        yt = s.get("ytip") or []
        tp = {t["tip"]: t for t in (s.get("ytipler") or [])}
        var = {}
        hat_detay = []
        ofs = []
        pcik_s = s.get("parca_cikar") or {}
        yyok_s = s.get("yat_yok") or set()
        hid_s = s.get("hat_id") or []
        for k in range(len(ys)):
            yad_ = yt[k] if k < len(yt) else None
            if k < len(hid_s) and yad_ is not None:         # hattaki parçaların çoğunluğunun tipi çizilir
                say_ = Counter(s.get("yat_tip", {}).get((hid_s[k][0], hid_s[k][1], i), yad_)
                               for i in range(len(cols)) if (hid_s[k][0], hid_s[k][1], i) not in yyok_s)
                if say_:
                    yad_ = max(say_, key=lambda a: (say_[a], a == yad_))
            t_ = tp.get(yad_) if yad_ is not None else None
            rm_ = set()
            if k < len(hid_s):
                sg_ = [i for i in range(len(cols)) if (hid_s[k][0], hid_s[k][1], i) not in yyok_s]
                if sg_:
                    rm_ = set.intersection(*[{_norm(x) for x in pcik_s.get(("y", hid_s[k][0], hid_s[k][1], i), ())}
                                             for i in sg_])
            hk_ = ("y",) + tuple(hid_s[k]) if k < len(hid_s) else None
            zc_ = (s.get("zincir_hat") or {}).get(hk_) if hk_ else None     # bu hatta özel katman zinciri
            kur_ = kayma_kurali(s.get("kayma"), hk_) if hk_ else {}          # bu hatta elle oturtulan parçalar
            zd_ = s.get("detay_zincir") or {}
            if t_ and yad_ in tvar:
                dv, tx = tvar[yad_]
                dv = (zd_.get(("yatay", yad_, zc_)) if zc_ else None) or dv
                hat_detay.append(kayma_uygula(detay_tip_varyanti(dv, sorted(rm_), rm_) if rm_ else dv, kur_))
                ofs.append((dx + tx, ys[k] - dv["ref"][1]))
                continue
            ofs.append((dx, ys[k] - ry))
            d_k = (zd_.get(("yatay", "", zc_)) if zc_ else None) or d
            cik_ = tuple(sorted(set(t_["cikar"] if t_ else ()) | rm_))
            if cik_:
                kk_v = (cik_, tuple(sorted(rm_)), zc_ or "")
                var.setdefault(kk_v, detay_tip_varyanti(d_k, cik_, rm_))
                hat_detay.append(kayma_uygula(var[kk_v], kur_))
            else:
                hat_detay.append(kayma_uygula(d_k, kur_))
        out["kesit"] = {"detay": d, "hat_detay": hat_detay,
                        "ofset": ofs, "cam": cam, "geo": g,
                        "mullion": mull, "bbox": (xs, ylo, xs + (xmax_d - xmin_d), yhi)}
    return out


def ciz_detay(cv, det, X, Y, sc, dx=0.0, dy=0.0, yazi=False):
    """Detayı Tk canvas'a çizer. X, Y: dünya (mm) -> ekran; dx, dy: yerleşim ofseti."""
    for p in det["prims"]:
        t = p[0]
        if t == "fill":
            loops, derin, renk = p[1], p[2], p[3]
            kh, _, kk = p[4].partition("|")
            renk = katman_renk(kh, renk)
            kontur = katman_renk(kk, "#6b767e")
            for i in sorted(range(len(loops)), key=lambda j: derin[j]):
                pts = [c for x, y in loops[i] for c in (X(x + dx), Y(y + dy))]
                if len(pts) >= 6:
                    cv.create_polygon(pts, fill=renk if derin[i] % 2 == 0 else "white",
                                      outline=kontur)
        elif t == "poly":
            pts_ = p[1] + [p[1][0]] if p[2] else p[1]
            q = [c for x, y in pts_ for c in (X(x + dx), Y(y + dy))]
            if len(q) >= 4:
                cv.create_line(q, fill=katman_renk(p[3], "#2f373d"))
        elif t == "text" and yazi:
            _, x, y, h, aci, metin, hiza = p
            px = int(round(h * sc / 0.72))
            if 6 <= px <= 120:
                cv.create_text(X(x + dx), Y(y + dy), text=metin, font=("Arial", -px),
                               angle=aci, anchor=hiza, fill="#b0533f")


def detay_parcalari(det):
    """Detaydaki her parça örneği (INSERT) için kod ve sınır kutusu: [{"kod", "bbox", "grup"}]."""
    out = {}
    for pr, g in zip(det["prims"], det["grup"]):
        if pr[0] == "text" or not isinstance(g, Grup) or not g.kod:
            continue
        b = _prim_bbox([pr])
        if not b:
            continue
        k = (g.blok, g.ornek)
        if k in out:
            o = out[k]["bbox"]
            out[k]["bbox"] = [min(o[0], b[0]), min(o[1], b[1]), max(o[2], b[2]), max(o[3], b[3])]
        else:
            out[k] = {"kod": g.kod, "bbox": list(b), "grup": str(g)}
    return list(out.values())


def _nokta_icinde(pt, loops):
    """Çift-tek kuralıyla: nokta, aynı dolgunun konturlarının içinde (malzeme üstünde) mi?"""
    x, y = pt
    n_ic = 0
    for lp in loops:
        ic = False
        j = len(lp) - 1
        for i in range(len(lp)):
            xi, yi = lp[i]
            xj, yj = lp[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                ic = not ic
            j = i
        n_ic += ic
    return n_ic % 2 == 1


def _nokta_malzeme(pt, loops, derin):
    """Derinlik bilgisiyle: nokta çift (dış) seviyeli bir konturun içinde, tek (delik) seviyeli konturların dışında mı?
    Aynı konumda iki kez çizilmiş kontur (çift çizim) çift-tek kuralında birbirini götürürdü; burada yok sayılır."""
    ic = dis = False
    for lp, d in zip(loops, derin):
        if not _nokta_icinde(pt, [lp]):
            continue
        if d % 2 == 0:
            ic = True
        else:
            dis = True
    return ic and not dis


def _kesisir(seg, r):
    """Doğru parçası ile dikdörtgenin (x1,y1,x2,y2) kesişimi (Liang-Barsky)."""
    (x0, y0), (x1, y1) = seg
    dx, dy = x1 - x0, y1 - y0
    t0, t1 = 0.0, 1.0
    for pp, qq in ((-dx, x0 - r[0]), (dx, r[2] - x0), (-dy, y0 - r[1]), (dy, r[3] - y0)):
        if abs(pp) < 1e-12:
            if qq < 0:
                return False
        else:
            t = qq / pp
            if pp < 0:
                t0 = max(t0, t)
            else:
                t1 = min(t1, t)
            if t0 > t1:
                return False
    return True


def etiket_yerlestir(parcalar, dolgular, boyut, alan, aralik=3.0, mevcut=None, secim=None):
    """Parça etiketlerini parçaların yanındaki boş yerlere yerleştirir (ekran koordinatlarında).
    parcalar: [(kod, (x1,y1,x2,y2))]; dolgular: [[kontur, ...]] (her dolgunun ekran konturları);
    boyut: [(genişlik, yükseklik)] her parçanın etiket boyutu (px); alan: görünür ekran (x1,y1,x2,y2);
    mevcut: önceden yerleşmiş etiket kutuları; secim: yalnızca bu parça indeksleri.
    Etiket yalnızca başka bir parçanın malzemesine ya da başka bir etikete değmeden sığıyorsa konur
    (yakınlaştırdıkça boşluklar büyür, etiketler görünür). Dönüş: {indeks: (x1,y1,x2,y2)}"""
    dbb = []
    for loops in dolgular:
        xs = [x for lp in loops for x, _ in lp]
        ys = [y for lp in loops for _, y in lp]
        if xs:
            dbb.append((min(xs), min(ys), max(xs), max(ys), loops))

    def dolu(r):
        for x1, y1, x2, y2, loops in dbb:
            if x2 < r[0] or x1 > r[2] or y2 < r[1] or y1 > r[3]:
                continue
            for lp in loops:
                n = len(lp)
                for i in range(n):
                    if _kesisir((lp[i], lp[(i + 1) % n]), r):
                        return True
            cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
            for pt in ((r[0], r[1]), (r[2], r[1]), (r[0], r[3]), (r[2], r[3]), (cx, cy)):
                if _nokta_icinde(pt, loops):
                    return True
        return False
    yerlesen, sonuc = list(mevcut or []), {}
    idx = list(range(len(parcalar))) if secim is None else list(secim)
    idx.sort(key=lambda i: (parcalar[i][1][2] - parcalar[i][1][0]) * (parcalar[i][1][3] - parcalar[i][1][1]))
    for i in idx:
        bx1, by1, bx2, by2 = parcalar[i][1]
        tw, th = boyut[i]
        if bx2 < alan[0] or bx1 > alan[2] or by2 < alan[1] or by1 > alan[3]:
            continue
        cx, cy = (bx1 + bx2) / 2, (by1 + by2) / 2
        adaylar = []
        for f in (0.5, 0.0, 1.0, 0.25, 0.75):          # kenar boyunca kaydırarak dene
            yy = by1 + f * (by2 - by1) - th / 2
            yy = min(max(yy, by1 - th / 2), by2 - th / 2)
            xx = bx1 + f * (bx2 - bx1) - tw / 2
            adaylar += [(bx2 + aralik, yy), (bx1 - aralik - tw, yy), (xx, by1 - aralik - th), (xx, by2 + aralik)]
        for x, y in adaylar:
            r = (x, y, x + tw, y + th)
            if r[0] < alan[0] or r[1] < alan[1] or r[2] > alan[2] or r[3] > alan[3]:
                continue
            if any(not (r[2] < q[0] or r[0] > q[2] or r[3] < q[1] or r[1] > q[3]) for q in yerlesen):
                continue
            if dolu(r):
                continue
            yerlesen.append(r)
            sonuc[i] = r
            break
    return sonuc


ETIKET_YAZI = (9, 8)       # kod ve ölçü yazı yüksekliği (px)


def etiket_duzeni(det, X, Y, dx, dy, alan, olcu=True):
    """Etiket yerleşimi: [(kod, ölçü_metni|"", (x1,y1,x2,y2))]. Önce kod+ölçü (iki satır), sığmayan parçalar kod (tek satır)."""
    f1, f2, cw = ETIKET_YAZI[0], ETIKET_YAZI[1], 0.6
    parcalar = detay_parcalari(det)
    if not parcalar:
        return []
    dolgular = [[[(X(x + dx), Y(y + dy)) for x, y in lp] for lp in pr[1]] for pr in det["prims"] if pr[0] == "fill"]
    ekr, olc = [], []
    for pc in parcalar:
        b = pc["bbox"]
        x1, x2 = sorted((X(b[0] + dx), X(b[2] + dx)))
        y1, y2 = sorted((Y(b[1] + dy), Y(b[3] + dy)))
        ekr.append((pc["kod"], (x1, y1, x2, y2)))
        olc.append(f"{b[2] - b[0]:.1f}×{b[3] - b[1]:.1f}")
    bir = [(len(pc["kod"]) * cw * f1 + 4, f1 + 3) for pc in parcalar]
    iki = [(max(len(pc["kod"]) * cw * f1, len(o) * cw * f2) + 4, f1 + f2 + 4) for pc, o in zip(parcalar, olc)]
    sonuc, kutular = [], []
    kalan = list(range(len(parcalar)))
    if olcu:
        yer = etiket_yerlestir(ekr, dolgular, iki, alan)
        for i, r in yer.items():
            sonuc.append((parcalar[i]["kod"], olc[i], r))
            kutular.append(r)
        kalan = [i for i in kalan if i not in yer]
    yer = etiket_yerlestir(ekr, dolgular, bir, alan, mevcut=kutular, secim=kalan)
    for i, r in yer.items():
        sonuc.append((parcalar[i]["kod"], "", r))
    return sonuc


def etiket_ciz(cv, det, X, Y, dx, dy, alan, olcu=True):
    """Detaydaki parçaların kodunu (ve en x boy ölçüsünü) yanlarındaki boş yerlere yazar."""
    f1, f2 = ETIKET_YAZI
    for kod, olc, r in etiket_duzeni(det, X, Y, dx, dy, alan, olcu):
        cv.create_rectangle(r[0], r[1], r[2], r[3], fill="white", outline="")
        mx = (r[0] + r[2]) / 2
        cv.create_text(mx, r[1] + 2 + f1 / 2, text=kod, fill="#1f5f7a", font=("Arial", -f1, "bold"))
        if olc:
            cv.create_text(mx, r[1] + f1 + 3 + f2 / 2, text=olc, fill="#7a858e", font=("Arial", -f2))


_PC_ONB = {}


def detay_parca_listesi(det):
    """Detaydaki parçalar: [{"kod","blok","ornek","grup","bbox","idx": [fill prim indisleri]}] (önbellekli)."""
    k = id(det)
    e = _PC_ONB.get(k)
    if e and e[0] is det and e[1] == len(det["prims"]):
        return e[2]
    out = {}
    for i, (pr, g) in enumerate(zip(det["prims"], det["grup"])):
        if pr[0] == "text" or not isinstance(g, Grup) or not g.kod:
            continue
        b = _prim_bbox([pr])
        if not b:
            continue
        key = (g.blok, g.ornek)
        if key in out:
            o = out[key]
            ob = o["bbox"]
            o["bbox"] = [min(ob[0], b[0]), min(ob[1], b[1]), max(ob[2], b[2]), max(ob[3], b[3])]
            if pr[0] == "fill":
                o["idx"].append(i)
        else:
            out[key] = {"kod": g.kod, "blok": g.blok, "ornek": g.ornek, "grup": str(g), "bbox": list(b),
                        "idx": [i] if pr[0] == "fill" else []}
    lst = list(out.values())
    if len(_PC_ONB) > 300:
        _PC_ONB.clear()
    _PC_ONB[k] = (det, len(det["prims"]), lst)
    return lst


def parca_alan(det, pc):
    """Parçanın kesit alanı (mm²): dolgu konturları, içteki boşluklar çıkarılarak."""
    a = 0.0
    for i in pc["idx"]:
        pr = det["prims"][i]
        gor = []
        for lp, d in zip(pr[1], pr[2]):
            xs_, ys_ = [q[0] for q in lp], [q[1] for q in lp]
            anh = (d, round(min(xs_), 1), round(min(ys_), 1), round(max(xs_), 1), round(max(ys_), 1))
            if anh in gor:
                continue                  # aynı yere iki kez çizilmiş kontur: bir kez say
            gor.append(anh)
            t = 0.0
            for (x1, y1), (x2, y2) in zip(lp, lp[1:] + lp[:1]):
                t += x1 * y2 - x2 * y1
            a += abs(t) / 2 * (1 if d % 2 == 0 else -1)
    return max(a, 0.0)


def parca_vur(girdiler, mx, my):
    """Ekran noktasının (mx, my) üstündeki parça: (girdi, parça) | None. Birden çok varsa en küçük olan."""
    en = None
    for g in girdiler:
        det, dx, dy, X, Y = g["det"], g["dx"], g["dy"], g["X"], g["Y"]
        b = det["bbox"]
        xs = sorted((X(b[0] + dx), X(b[2] + dx)))
        ys = sorted((Y(b[1] + dy), Y(b[3] + dy)))
        if not (xs[0] - 2 <= mx <= xs[1] + 2 and ys[0] - 2 <= my <= ys[1] + 2):
            continue
        for pc in detay_parca_listesi(det):
            bb = pc["bbox"]
            px = sorted((X(bb[0] + dx), X(bb[2] + dx)))
            py = sorted((Y(bb[1] + dy), Y(bb[3] + dy)))
            if not (px[0] - 1 <= mx <= px[1] + 1 and py[0] - 1 <= my <= py[1] + 1):
                continue
            hit = not pc["idx"]
            for i in pc["idx"]:
                loops = [[(X(x + dx), Y(y + dy)) for x, y in lp] for lp in det["prims"][i][1]]
                if _nokta_malzeme((mx, my), loops, det["prims"][i][2]):
                    hit = True
                    break
            if hit:
                ar = (px[1] - px[0]) * (py[1] - py[0])
                if en is None or ar < en[0]:
                    en = (ar, g, pc)
    return (en[1], en[2]) if en else None


# =====================================================================================================
# Mühendislik hesapları (cam, ankraj, genleşme, ısıl), ön kontrol ve üretim listeleri.
# Hepsi ön hesaptır (nihai kontrol ilgili standart / firma hesabıyla yapılmalıdır).
# =====================================================================================================
CAM_DAYANIM = {"tavli": ("Tavlı (float)", 17.5), "hs": ("Isıl güçlendirilmiş", 29.0), "temperli": ("Temperli", 50.0)}
# 4 kenarı mesnetli dikdörtgen plak, düzgün yük (Roark): a/b, β (gerilme), α (sehim)
_ROARK = [(1.0, .2874, .0444), (1.2, .3762, .0616), (1.4, .4530, .0770), (1.6, .5172, .0906), (1.8, .5688, .1017),
          (2.0, .6102, .1106), (3.0, .7134, .1336), (4.0, .7410, .1400), (5.0, .7476, .1416), (99.0, .75, .1422)]
E_CAM = 70000.0            # N/mm²
ALFA_ALU = 23.5e-6         # 1/K
HESAP_VARSAYILAN = {"cam_dayanim": "Temperli", "cam_sigma": "", "cam_max_boy": 6000, "cam_max_en": 3210, "cam_max_kg": 500,
                    "ankraj_adet": 2, "ankraj_sabit": 1, "ankraj_kap": "", "dT": 60, "drift": "",
                    "Ug": 1.1, "Uf": 2.0, "psi": 0.07, "Up": 0.5, "Ti": 20, "Te": -5, "RH": 50}


def _roark(oran):
    oran = max(1.0, float(oran))
    for (a0, b0, c0), (a1, b1, c1) in zip(_ROARK, _ROARK[1:]):
        if oran <= a1:
            t = (oran - a0) / (a1 - a0)
            return b0 + t * (b1 - b0), c0 + t * (c1 - c0)
    return _ROARK[-1][1], _ROARK[-1][2]


def hesap_prm(v):
    """Arayüz girdilerinden (anahtar -> metin) hesap parametreleri; boş/hatalı olanlar varsayılana düşer."""
    out = {}
    for k, d in HESAP_VARSAYILAN.items():
        t = str(v.get(k, d)).strip().replace(",", ".") if v.get(k, d) is not None else ""
        if k == "cam_dayanim":
            out[k] = t or d
            continue
        if t == "":
            out[k] = None if k in ("cam_sigma", "ankraj_kap", "drift") else float(d)
            continue
        try:
            out[k] = float(t)
        except ValueError:
            out[k] = None if k in ("cam_sigma", "ankraj_kap", "drift") else float(d)
    return out


def _boyut_ayir(m):
    try:
        a, b = str(m).lower().replace("×", "x").split("x")
        return float(a), float(b)
    except ValueError:
        return None


def cam_kontrol(s, prm):
    """Her cam boyutu için: ağırlık, boyut sınırı, rüzgar altında gerilme ve sehim (basit plak, tüm camlar aynı sehimi yapar,
    yük kalınlığın küpü oranında paylaşılır). Dönüş: satırlar [dict]."""
    yapi = s.get("cam_yapi")
    if not yapi:
        return []
    camlar = [t for tur, t in yapi["katman"] if tur == "cam"]
    t3 = sum(t ** 3 for t in camlar) or 1.0
    tmax = max(camlar) if camlar else 0.0
    kn = float((s.get("p") or {}).get("ruzgar_kn") or 0.0)
    q = kn / 1000.0                                        # N/mm²
    izin = prm.get("cam_sigma") or next((v[1] for v in CAM_DAYANIM.values() if v[0] == prm.get("cam_dayanim")), 50.0)
    rows = []
    for ad, boyut, adet, m2 in s.get("cam") or []:
        if ad != "Cam":
            continue
        wh = _boyut_ayir(boyut)
        if not wh:
            continue
        a, b = max(wh), min(wh)
        kg = yapi["kg_m2"] * a * b / 1e6
        r = {"boyut": boyut, "adet": adet, "a": a, "b": b, "kg": kg, "ok_kg": kg <= (prm.get("cam_max_kg") or 1e9),
             "ok_boy": a <= prm["cam_max_boy"] and b <= prm["cam_max_en"], "sig": None, "izin": izin, "defl": None,
             "lim": b / 65.0, "ok_g": True, "ok_d": True}
        if q > 0 and camlar:
            beta, alfa = _roark(a / b)
            qd = KOMB_W * q
            r["sig"] = beta * qd * b * b * tmax / t3
            r["defl"] = alfa * q * b ** 4 / (E_CAM * t3)
            r["ok_g"] = r["sig"] <= izin
            r["ok_d"] = r["defl"] <= r["lim"]
        rows.append(r)
    return rows


def ankraj_hesap(s, prm):
    """Dikme başına ankraj yükleri (aks bazında): rüzgar mesnet tepkisi (seçili mesnet şemasına göre) ve cam ölü yükü.
    Dönüş: {"satir": [...], "adet": toplam ankraj, "max_n", "max_v", "oran"} ya da None (rüzgar/statik yoksa)."""
    an = s.get("analiz") or {}
    d = an.get("dikey")
    if not d:
        return None
    cols, rows_ = s["cols"], s["rows"]
    kn = an["kn"]
    Gk = an["G"]
    L_m = d["L"] / 100.0
    n_aks = len(cols) + 1
    dyok = s.get("dik_yok") or set()
    n_ank = max(1, int(prm.get("ankraj_adet") or 1))
    n_sab = max(1, min(n_ank, int(prm.get("ankraj_sabit") or 1)))
    out, toplam, max_n, max_v = [], 0, 0.0, 0.0
    for i in range(n_aks):
        kat_say = sum(1 for j in range(len(rows_)) if (i, j) not in dyok)
        if not kat_say:
            continue
        tw = ((cols[i - 1] if i > 0 else 0) + (cols[i] if i < len(cols) else 0)) / 2000.0       # m
        R = d["rc"] * kn * tw * L_m                          # kN (servis)
        Rd = KOMB_W * R
        Ng = Gk * tw * L_m * G_YER / 1000.0                  # kN
        N_a = Rd / n_ank
        V_a = KOMB_G * Ng / n_sab
        out.append({"aks": i + 1, "tw": tw * 1000, "R": R, "Rd": Rd, "N": N_a, "V": V_a, "kat": kat_say})
        toplam += kat_say * n_ank
        max_n, max_v = max(max_n, N_a), max(max_v, V_a)
    kap = prm.get("ankraj_kap")
    return {"satir": out, "adet": toplam, "max_n": max_n, "max_v": max_v, "n_ank": n_ank, "n_sab": n_sab,
            "oran": (max(max_n, max_v) / kap) if kap else None, "kap": kap, "sema": d.get("sema_ad", "")}


def genlesme_hesap(s, prm):
    """Isıl genleşme (ΔL = α·ΔT·L) ve kat arası ötelenmeye göre ek yeri / kayar bağlantı payları."""
    p = s.get("p") or {}
    dT = prm["dT"]
    dikey_ad, yatay_ad = p.get("dikey_ad", "Dikey"), p.get("yatay_ad", "Yatay")
    L_d = max([r[1] for r in s.get("kesim") or [] if r[0] == dikey_ad] or [max(s["rows"])])
    L_y = max([r[1] for r in s.get("kesim") or [] if r[0] == yatay_ad] or [max(s["cols"])])
    toplam_h = float(sum(s["rows"]))
    satir = []
    for ad, L in (("Dikey profil (en uzun parça)", L_d), ("Yatay profil (en uzun parça)", L_y),
                  ("Cephe toplam yüksekliği", toplam_h)):
        dl = ALFA_ALU * dT * L
        satir.append({"ad": ad, "L": L, "dl": dl, "ek": dl + 2.0})
    h_kat = max(s["rows"])
    drift = prm.get("drift")
    onerilen = h_kat / 500.0
    return {"dT": dT, "satir": satir, "drift": drift, "drift_oner": onerilen,
            "kayar": max(satir[0]["dl"], 0) + (drift if drift is not None else onerilen)}


def isil_hesap(s, prm):
    """Basit ISO 12631 yaklaşımı: Ucw = (Ag·Ug + Af·Uf + Ap·Up + Σlg·ψ) / Atop; iç yüzey sıcaklığı ve çiğlenme noktası ile
    yoğuşma ön kontrolü (profil için 1B yaklaşım, kaba)."""
    cols, bol = s.get("cols") or [], s.get("bolgeler") or []
    if not cols or not bol:
        return None
    TW, TH = float(sum(cols)), float(sum(s["rows"]))
    vw, hw = float(s.get("vw") or 0), float(s.get("hw") or 0)
    Ag = Ap = lg = 0.0
    for g in s.get("cam_gruplari") or []:
        tp = g["tip"]
        if PANEL_TIPLERI[tp].get("bos"):
            continue
        w = sum(cols[g["i0"]:g["i1"] + 1]) - vw
        h = bol[g["z1"]]["y1"] - bol[g["z0"]]["y0"] - hw
        if w <= 0 or h <= 0:
            continue
        if tp == "cam":
            Ag += w * h / 1e6
            lg += 2 * (w + h) / 1000.0
        else:
            Ap += w * h / 1e6
    At = TW * TH / 1e6
    Af = max(0.0, At - Ag - Ap)
    Ug, Uf, psi, Up = prm["Ug"], prm["Uf"], prm["psi"], prm["Up"]
    Ucw = (Ag * Ug + Af * Uf + Ap * Up + lg * psi) / At if At > 0 else 0.0
    import math
    Ti, Te, RH = prm["Ti"], prm["Te"], max(1.0, min(100.0, prm["RH"]))
    gm = math.log(RH / 100.0) + 17.62 * Ti / (243.12 + Ti)
    Td = 243.12 * gm / (17.62 - gm)                              # çiğlenme noktası (Magnus)
    Rsi = 0.13
    th_f = Ti - Rsi * Uf * (Ti - Te)                             # profil iç yüzeyi (kaba)
    th_g = Ti - Rsi * Ug * (Ti - Te)
    return {"At": At, "Ag": Ag, "Af": Af, "Ap": Ap, "lg": lg, "Ucw": Ucw, "Td": Td, "th_f": th_f, "th_g": th_g,
            "risk_f": th_f < Td, "risk_g": th_g < Td,
            "Rw_kaba": (13.0 * math.log10(max((s.get("cam_yapi") or {}).get("kg_m2", 0.0), 1.0)) + 14.0)}


def on_kontrol(s, prm):
    """Ön kontrol (preflight): [(seviye 'hata'|'uyari'|'bilgi', kategori, mesaj)]."""
    out = []
    if not s:
        return out
    add = lambda sv, kat, m: out.append((sv, kat, m))
    for u in s.get("cubuk_uyari") or []:
        add("uyari", "Çubuk", u)
    if s.get("cam_secim_uyari"):
        add("uyari", "Cam / fitil", str(s["cam_secim_uyari"]))
    if s.get("takoz_not") and "yok" in str(s["takoz_not"]).lower():
        add("uyari", "Cam takozu", str(s["takoz_not"]))
    bn = s.get("bariyer_not") or ""
    if "dışı" in bn:
        add("hata", "Isı bariyeri", bn)
    # çubuk boyu aşımı
    stok_max = max([r[1] for r in s.get("cubuk") or []] or [0])
    for r in s.get("kesim") or []:
        if stok_max and r[1] > stok_max + 1e-6:
            add("hata", "Çubuk", f"{r[0]} {r[1]:g} mm parça, en uzun stok çubuğundan ({stok_max:g} mm) uzun")
    # statik
    an = s.get("analiz")
    if not an:
        add("bilgi", "Statik", "Rüzgar yükü girilmediği için statik kontrol yapılmadı")
    else:
        for ad, k in (("Dikey", an.get("dikey")), ("Yatay", an.get("yatay"))):
            if k:
                if not k.get("ok_g"):
                    add("hata", "Statik", f"{ad} profil gerilmesi sınırı aşıyor ({k['sig']:.0f} > {k['sig_rd']:.0f} kg/cm²)")
                if not k.get("ok_d"):
                    add("hata", "Statik", f"{ad} profil sehimi sınırı aşıyor")
    # cam
    for r in cam_kontrol(s, prm):
        if not r["ok_boy"]:
            add("hata", "Cam", f"{r['boyut']} mm cam, izin verilen azami boyutu aşıyor ({prm['cam_max_boy']:g}×{prm['cam_max_en']:g})")
        if not r["ok_kg"]:
            add("hata", "Cam", f"{r['boyut']} mm cam {r['kg']:.0f} kg: azami cam ağırlığını aşıyor ({prm['cam_max_kg']:g} kg)")
        if r["sig"] is not None and not r["ok_g"]:
            add("hata", "Cam", f"{r['boyut']} mm cam gerilmesi {r['sig']:.1f} > {r['izin']:.1f} N/mm²: kalınlık/tür yetersiz")
        if r["defl"] is not None and not r["ok_d"]:
            add("uyari", "Cam", f"{r['boyut']} mm cam sehimi {r['defl']:.1f} mm > sınır {r['lim']:.1f} mm")
    # ankraj
    ak = ankraj_hesap(s, prm)
    if ak and ak["oran"] is not None and ak["oran"] > 1:
        add("hata", "Ankraj", f"Ankraj yükü kapasiteyi aşıyor (oran %{ak['oran'] * 100:.0f})")
    # isıl
    ih = isil_hesap(s, prm)
    if ih and ih["risk_f"]:
        add("uyari", "Isıl", f"Profil iç yüzey sıcaklığı {ih['th_f']:.1f} °C < çiğlenme noktası {ih['Td']:.1f} °C: yoğuşma riski")
    # genel
    if not s.get("detay") or not (s["detay"].get("dikey") and s["detay"].get("yatay")):
        add("uyari", "Detay", "Dikey/yatay detay yüklü değil: kesit ve 3B görünüm sınırlı")
    if (s.get("p") or {}).get("dilatasyon", 0) in (0, 0.0, None):
        add("bilgi", "Genleşme", "Dilatasyon payı 0: kesim boylarında ek yeri boşluğu bırakılmadı")
    if not any(x[0] in ("hata", "uyari") for x in out):
        add("bilgi", "Genel", "Ön kontrolde hata ya da uyarı bulunmadı")
    return out


def parca_etiketleri(s):
    """Üretim parça listesi (tek tek): [{"tur","profil","boy","konum"}]. Yatay: hat/bay; dikey: aks/kat aralığı."""
    p = s.get("p") or {}
    cols, rows = s["cols"], s["rows"]
    n = len(rows)
    vw = float(s.get("vw") or 0)
    dyok, yyok = s.get("dik_yok_ham") or set(), s.get("yat_yok_ham") or set()
    alt, ust = float(s.get("dikey_alt") or 0), float(s.get("dikey_ust") or 0)
    dilat = float(p.get("dilatasyon", 0.0) or 0.0)
    gecis = {int(k[1]) for k in (p.get("dik_gecis") or ()) if 0 < int(k[1]) < n}
    orta = {int(k[1]) for k in (p.get("dik_orta") or ()) if 0 <= int(k[1]) < n}
    kes, cum = dikey_kesim_noktalari(rows, gecis, orta)
    out = []
    dik_ad, yat_ad = p.get("dikey_ad", "Dikey"), p.get("yatay_ad", "Yatay")
    for i in range(len(cols) + 1):
        j = 0
        while j < n:
            if (i, j) in dyok:
                j += 1
                continue
            j0 = j
            while j + 1 < n and (i, j + 1) not in dyok:
                j += 1
            for lo, hi, boy in dikey_boylari(cum[j0], cum[j + 1], kes, alt, ust, dilat, j0 == 0, j == n - 1):
                out.append({"tur": "Dikey", "profil": dik_ad, "boy": boy,
                            "konum": f"Aks {i + 1} / {lo / 1000:.2f}–{hi / 1000:.2f} m"})
            j += 1
    for h, hid in enumerate(s.get("hat_id") or []):
        for i, c in enumerate(cols):
            if (hid[0], hid[1], i) in yyok:
                continue
            out.append({"tur": "Yatay", "profil": yat_ad, "boy": c - vw,
                        "konum": f"Hat {hat_adi(hid)} / Aks {i + 1}–{i + 2}"})
    return out


def xlsx_yaz(yol, sayfalar):
    """Bağımlılıksız basit .xlsx yazıcı. sayfalar: [(ad, [[hücre, ...], ...])]; sayılar sayı, diğerleri metin."""
    import zipfile
    from xml.sax.saxutils import escape

    def sutun(i):
        t = ""
        i += 1
        while i:
            i, r = divmod(i - 1, 26)
            t = chr(65 + r) + t
        return t
    ct = ['<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>']
    wb = ['<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>']
    rel = ['<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    with zipfile.ZipFile(yol, "w", zipfile.ZIP_DEFLATED) as z:
        for k, (ad, satirlar) in enumerate(sayfalar, 1):
            ct.append(f'<Override PartName="/xl/worksheets/sheet{k}.xml" '
                      'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
            wb.append(f'<sheet name="{escape(str(ad)[:31])}" sheetId="{k}" r:id="rId{k}"/>')
            rel.append(f'<Relationship Id="rId{k}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                       f'Target="worksheets/sheet{k}.xml"/>')
            x = ['<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
            for r, satir in enumerate(satirlar, 1):
                x.append(f'<row r="{r}">')
                for c, h in enumerate(satir):
                    ref = f"{sutun(c)}{r}"
                    if isinstance(h, bool) or h is None or h == "":
                        continue
                    if isinstance(h, (int, float)):
                        x.append(f'<c r="{ref}"><v>{h}</v></c>')
                    else:
                        x.append(f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(str(h))}</t></is></c>')
                x.append("</row>")
            x.append("</sheetData></worksheet>")
            z.writestr(f"xl/worksheets/sheet{k}.xml", "".join(x))
        ct.append("</Types>")
        wb.append("</sheets></workbook>")
        rel.append("</Relationships>")
        z.writestr("[Content_Types].xml", "".join(ct))
        z.writestr("xl/workbook.xml", "".join(wb))
        z.writestr("xl/_rels/workbook.xml.rels", "".join(rel))
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')


def dxf_aks_kat_oku(yol, tol=5.0, min_boy_orani=0.5):
    """Mimari cephe DXF'inden aks/kat önerisi: uzun düşey çizgilerin x'leri → aks aralıkları, uzun yatay çizgilerin y'leri →
    kat yükseklikleri. Dönüş: (cols, rows, bilgi). LINE ve düz LWPOLYLINE parçalarına bakar."""
    model, _bl, _tb = _dxf_varliklar_yol(yol)
    dikey, yatay = [], []
    seg = []
    for e in model:
        kod = e["kod"]
        d = {}
        pts = []
        for k, v in kod:
            if e["tur"] == "LINE":
                d.setdefault(k, v)
            elif e["tur"] == "LWPOLYLINE" and k in ("10", "20"):
                pts.append((k, float(v)))
        try:
            if e["tur"] == "LINE":
                seg.append((float(d["10"]), float(d["20"]), float(d["11"]), float(d["21"])))
            elif e["tur"] == "LWPOLYLINE":
                xs = [v for k, v in pts if k == "10"]
                ys = [v for k, v in pts if k == "20"]
                seg += [(xs[i], ys[i], xs[i + 1], ys[i + 1]) for i in range(min(len(xs), len(ys)) - 1)]
        except (KeyError, ValueError):
            continue
    if not seg:
        raise ValueError("DXF'te LINE / LWPOLYLINE bulunamadı.")
    xmin = min(min(a, c) for a, b, c, d in seg)
    xmax = max(max(a, c) for a, b, c, d in seg)
    ymin = min(min(b, d) for a, b, c, d in seg)
    ymax = max(max(b, d) for a, b, c, d in seg)
    W, H = xmax - xmin, ymax - ymin
    for a, b, c, d in seg:
        if abs(a - c) <= 1.0 and abs(b - d) >= min_boy_orani * H:
            dikey.append(round((a + c) / 2 - xmin, 1))
        elif abs(b - d) <= 1.0 and abs(a - c) >= min_boy_orani * W:
            yatay.append(round((b + d) / 2 - ymin, 1))

    def kume(vals):
        vals = sorted(vals)
        out = []
        for v in vals:
            if out and v - out[-1] <= tol:
                continue
            out.append(v)
        return out
    xs, ys = kume(dikey), kume(yatay)
    if len(xs) < 2 or len(ys) < 2:
        raise ValueError("Yeterli düşey/yatay hat bulunamadı (en az 2 + 2 uzun çizgi gerekir).")
    cols = [round(b - a, 1) for a, b in zip(xs, xs[1:])]
    rows = [round(b - a, 1) for a, b in zip(ys, ys[1:])]
    return cols, rows, f"{len(xs)} düşey, {len(ys)} yatay hat bulundu"



class Gorunum:
    """Canvas için fare tekerleği ile yakınlaştırma, sürükleyerek kaydırma,
    çift tıkla sıfırlama. ciz() her çizimde self.fit = (ox0, oy0, sc0) ayarlar."""

    def __init__(self, cv, ciz):
        self.cv, self.ciz = cv, ciz
        self.z, self.px, self.py = 1.0, 0.0, 0.0
        self.fit = None
        self._son = (0, 0)
        self.kx = self.ky = 0          # son çizimden beri sürükleyerek kayma (çizim yenilenince sıfırlanır)
        self.tasi_cb = None            # Shift+sürükle: parçayı taşıma (mıknatıs) geri çağrısı (faz, olay) -> bool
        self._tasi = False
        cv.bind("<Enter>", lambda _e: cv.focus_set())
        cv.bind("<MouseWheel>", lambda e: self._yakin(e, 1.25 if e.delta > 0 else 1 / 1.25))
        cv.bind("<Button-4>", lambda e: self._yakin(e, 1.25))
        cv.bind("<Button-5>", lambda e: self._yakin(e, 1 / 1.25))
        cv.bind("<ButtonPress-1>", self._bas)
        cv.bind("<B1-Motion>", self._surukle)
        self.olcu_cb = None            # ölçü aracı: tıklama geri çağrısı (olay) -> bool (True: tıklama ölçü noktası oldu)
        self.cift_cb = None            # çift tık: aks odağı geri çağrısı (olay) -> bool (True: sıfırlama yapma)
        cv.bind("<Double-Button-1>", self._cift)

    def boyut(self):
        """Tuval boyutu değişince (yan panel genişletildi/daraltıldı) yeniden çizer; yakınlaştırılmış / kaydırılmış
        görünümde tuvalin ortasındaki nokta ve ekrandaki ölçek korunur (görünüm kaymaz, bozulmaz)."""
        try:
            W, H = self.cv.winfo_width(), self.cv.winfo_height()
        except tk.TclError:
            return
        eski = getattr(self, "_wh", None)
        koru = None
        if eski and self.fit and eski != (W, H) and (abs(self.z - 1.0) > 1e-6 or abs(self.px) > 0.5 or abs(self.py) > 0.5):
            ox, oy, sc = self.donustur()
            if sc > 0:
                koru = ((eski[0] / 2 - ox) / sc, (oy - eski[1] / 2) / sc, sc)
        self.ciz()
        if W >= 250 and H >= 200:
            self._wh = (W, H)
        if koru and self.fit and self.fit[2] > 0:
            vx, vy, sc_mut = koru
            self.z = min(1500.0, max(0.3, sc_mut / self.fit[2]))
            sc2 = self.fit[2] * self.z
            self.px = W / 2 - vx * sc2 - self.fit[0]
            self.py = H / 2 + vy * sc2 - self.fit[1]
            self.ciz()

    def _cift(self, e):
        if self.cift_cb and self.cift_cb(e):
            return
        self._sifirla(e)

    def donustur(self):
        ox0, oy0, sc0 = self.fit
        return ox0 + self.px, oy0 + self.py, sc0 * self.z

    def _yakin(self, e, f):
        if not self.fit:
            return
        if genel_ayar("teker_ters"):
            f = 1.0 / f
        z2 = min(1500.0, max(0.3, self.z * f))
        ox, oy, sc = self.donustur()
        vx, vy = (e.x - ox) / sc, (oy - e.y) / sc
        sc2 = self.fit[2] * z2
        self.px = e.x - vx * sc2 - self.fit[0]
        self.py = e.y + vy * sc2 - self.fit[1]
        self.z = z2
        self.ciz()

    def _bas(self, e):
        self._son = (e.x, e.y)
        if getattr(self, "olcu_cb", None) and self.olcu_cb(e):      # ölçü aracı açıkken tıklama nokta seçer
            self._tasi, self._bant = False, None
            return
        self._tasi = bool(self.tasi_cb and e.state & 0x0001 and self.tasi_cb("bas", e))
        self._bant = (e.x, e.y) if (getattr(self, "bant_ac", False) and e.state & 0x0004) else None

    def _surukle(self, e):
        if getattr(self, "olcu_cb", None) and getattr(self, "olcu_hareket", None) and self.olcu_hareket(e):
            return
        if self._tasi:
            self.tasi_cb("hareket", e)
            return
        if getattr(self, "_bant", None):                  # Ctrl basılı: kaydırma yerine seçim bandı
            self.cv.delete("bant")
            b_ = self._bant
            self.cv.create_rectangle(b_[0], b_[1], e.x, e.y, outline="#e65100", dash=(4, 3), tags="bant")
            return
        dx, dy = e.x - self._son[0], e.y - self._son[1]
        self._son = (e.x, e.y)
        self.px += dx
        self.py += dy
        self.kx += dx
        self.ky += dy
        self.cv.move("all", dx, dy)

    def _sifirla(self, _e=None):
        self.z, self.px, self.py = 1.0, 0.0, 0.0
        self.ciz()


def dxf_yaz(s, yol):
    """Cephe görünüşünü DXF (R12, ASCII) olarak yazar. Birim: mm, gerçek ölçü, ölçeksiz.
    Katmanlar: CAM, SPANDREL, PROFIL_DIKEY, PROFIL_YATAY, AKS, OLCU, YAZI, KESIT_*."""
    cols, rows, vw, hw = s["cols"], s["rows"], s["vw"], s["hw"]
    TW, TH = sum(cols), sum(rows)
    th = max(100.0, max(TW, TH) / 45)      # yazı/ofset birimi
    tx = th * 0.8                          # yazı yüksekliği
    cx, cy = [0.0], [0.0]
    for c in cols:
        cx.append(cx[-1] + c)
    for r in rows:
        cy.append(cy[-1] + r)

    E = []
    f = lambda v: f"{v:.3f}"

    def line(k, x1, y1, x2, y2):
        E.append(f"0\nLINE\n8\n{k}\n10\n{f(x1)}\n20\n{f(y1)}\n30\n0.0"
                 f"\n11\n{f(x2)}\n21\n{f(y2)}\n31\n0.0")

    def rect(k, x1, y1, x2, y2):
        line(k, x1, y1, x2, y1)
        line(k, x2, y1, x2, y2)
        line(k, x2, y2, x1, y2)
        line(k, x1, y2, x1, y1)

    def circle(k, x, y, r):
        E.append(f"0\nCIRCLE\n8\n{k}\n10\n{f(x)}\n20\n{f(y)}\n30\n0.0\n40\n{f(r)}")

    def poly(k, pts, kapali=True):
        E.append(f"0\nPOLYLINE\n8\n{k}\n66\n1\n70\n{int(kapali)}\n10\n0.0\n20\n0.0\n30\n0.0")
        for x, y in pts:
            E.append(f"0\nVERTEX\n8\n{k}\n10\n{f(x)}\n20\n{f(y)}\n30\n0.0\n70\n0")
        E.append(f"0\nSEQEND\n8\n{k}")

    def text(x, y, metin, orta=True, aci=0, h=None):
        h = tx if h is None else h
        E.append(f"0\nTEXT\n8\nYAZI\n10\n{f(x)}\n20\n{f(y)}\n30\n0.0\n40\n{f(h)}"
                 f"\n1\n{metin}\n50\n{aci}\n72\n{1 if orta else 0}"
                 f"\n11\n{f(x)}\n21\n{f(y)}\n31\n0.0\n73\n2")

    # bölgeler (cam / spandrel), yatay ve dikey profiller
    alt, ust = s["dikey_alt"], s["dikey_ust"]
    hucre_, dik_yok_, yat_yok_ = s.get("hucre") or {}, s.get("dik_yok") or set(), s.get("yat_yok") or set()
    hat_id_ = s.get("hat_id") or [(0, 0)] * len(s["cizgiler"])
    for g_ in s.get("cam_gruplari") or []:
        tp_ = g_["tip"]
        if PANEL_TIPLERI[tp_].get("bos"):
            continue
        kat_ = "CAM" if tp_ == "cam" else "SPANDREL"
        rect(kat_, cx[g_["i0"]] + vw / 2, s["bolgeler"][g_["z0"]]["y0"] + hw / 2,
             cx[g_["i1"] + 1] - vw / 2, s["bolgeler"][g_["z1"]]["y1"] - hw / 2)
    for (yy, _ek), hid in zip(s["cizgiler"], hat_id_):
        for i in range(len(cols)):
            if (hid[0], hid[1], i) in yat_yok_:
                continue
            rect("PROFIL_YATAY", cx[i] + vw / 2, yy - hw / 2, cx[i + 1] - vw / 2, yy + hw / 2)
    for i in range(len(cols) + 1):
        for j in range(len(rows)):
            if (i, j) in dik_yok_:
                continue
            rect("PROFIL_DIKEY", cx[i] - vw / 2, -alt if j == 0 else cy[j],
                 cx[i] + vw / 2, TH + ust if j == len(rows) - 1 else cy[j + 1])

    # akslar + balonlar
    r_b = th * 1.4
    if max(balon_seviye(cx, r_b, 0.2 * th) + balon_seviye(cy, r_b, 0.2 * th)) >= 2:
        r_b = th * 0.9                                   # sıkışık akslar: küçük balon + kademeli yerleşim
    lev_c = balon_seviye(cx, r_b, 0.2 * th)
    lev_r = balon_seviye(cy, r_b, 0.2 * th)
    adim = 2 * r_b + 0.3 * th
    for i, x in enumerate(cx):
        yb_ = TH + 3 * th + max(0.0, ust) + r_b + lev_c[i] * adim
        line("AKS", x, -th - max(0.0, alt), x, yb_ - r_b)
        circle("AKS", x, yb_, r_b)
        text(x, yb_, str(i + 1), h=min(tx, r_b * 0.9))
    for k, y in enumerate(cy):
        xb_ = -3 * th - r_b - lev_r[k] * adim
        line("AKS", xb_ + r_b, y, TW + th, y)
        circle("AKS", xb_, y, r_b)
        text(xb_, y, aks_adi(k), h=min(tx, r_b * 0.9))

    # ölçü zincirleri
    def zincir_x(vals, pos, y):
        line("OLCU", pos[0], y, pos[-1], y)
        for p_ in pos:
            line("OLCU", p_ - 0.3 * th, y - 0.3 * th, p_ + 0.3 * th, y + 0.3 * th)
        for a, b, v in zip(pos, pos[1:], vals):
            if b - a >= 3.4 * th:
                text((a + b) / 2, y + 0.9 * th, f"{v:g}")
            elif b - a >= 0.9 * th:               # dar aralık: dik yazı
                h_ = min(tx, (b - a) * 0.7)
                t_ = f"{v:.0f}"
                text((a + b) / 2, y + 0.4 * th + len(t_) * h_ * 0.35, t_, aci=90, h=h_)

    def zincir_y(vals, pos, x, aci=0):
        line("OLCU", x, pos[0], x, pos[-1])
        for p_ in pos:
            line("OLCU", x - 0.3 * th, p_ - 0.3 * th, x + 0.3 * th, p_ + 0.3 * th)
        for a, b, v in zip(pos, pos[1:], vals):
            if aci:
                text(x - 0.9 * th, (a + b) / 2, f"{v:g}", aci=aci)
            else:
                text(x + 0.6 * th, (a + b) / 2, f"{v:g}", orta=False)

    ys_h = [y for y, _ in s["cizgiler"]]
    ek_var = any(e for _y, e in s["cizgiler"])
    yb = -max(0.0, alt)
    zincir_x(cols, cx, yb - 2.5 * th)
    zincir_x([TW], [0, TW], yb - 5 * th)
    if ek_var:
        zincir_y([b - a for a, b in zip(ys_h, ys_h[1:])], ys_h, TW + 3 * th, aci=90)
        zincir_y(rows, cy, TW + 6 * th)
        zincir_y([TH], [0, TH], TW + 10 * th, aci=90)
    else:
        zincir_y(rows, cy, TW + 3 * th)
        zincir_y([TH], [0, TH], TW + 7 * th, aci=90)

    # plan (görünüşün altında) ve kesit (sağında): katalog detayı her aks / kat hattında
    sayfa = sayfa_yerlesim(s, th)
    for nm, baslik in (("plan", "PLAN"), ("kesit", "KESIT")):
        g = sayfa.get(nm)
        if not g:
            continue
        m = g.get("mullion")
        if m:                    # kesilmeyen dikey profil silüeti + alt/üst uzantı ölçüleri
            rect("KESIT_DIKEY", m["x1"], m["y1"], m["x2"], m["y2"])
            for ya, yb in ((m["y1"], 0.0), (m["TH"], m["y2"])):
                if abs(ya - yb) >= 0.5:
                    zincir_y([abs(ya - yb)], sorted((ya, yb)), m["x1"] - 1.2 * th, aci=90)
        for x1, y1, x2, y2, tp in g["cam"]:
            rect({"cam": "KESIT_CAM", "pvb": "KESIT_PVB", "hava": "KESIT_HAVA",
                  "aralik": "KESIT_ARALIK"}.get(tp, "KESIT_PANEL"), x1, y1, x2, y2)
        for k_, (dx, dy) in enumerate(g["ofset"]):
            hd = (g.get("hat_detay") or [])
            for p in (hd[k_] if k_ < len(hd) else g["detay"])["prims"]:
                if p[0] == "fill":
                    for lp in p[1]:
                        poly("KESIT_DOLGU", [(x + dx, y + dy) for x, y in lp])
                elif p[0] == "poly":
                    poly("KESIT_CIZGI", [(x + dx, y + dy) for x, y in p[1]], p[2])
        bx0, by0 = g["bbox"][0], g["bbox"][1]
        text(bx0, by0 - 2 * th, baslik, orta=False)

    sip_ = [(e_, d_) for e_, d_ in (s.get("siparis") or []) if d_ and e_ != "Not"]
    if sip_:                       # sipariş bilgileri: görünüşün üstünde, sol hizalı
        y0_ = TH + max(0.0, ust) + 9 * th + max(lev_c) * adim
        for i_, (e_, d_) in enumerate(sip_):
            text(0.0, y0_ + (len(sip_) - i_) * 1.5 * th, f"{_ascii(e_)}: {_ascii(d_)}", orta=False, h=0.9 * th)

    # tek profil kesitleri (gerçek ölçü, 1:1): detay yüklenmemişse
    plan_var = bool(sayfa.get("plan") or sayfa.get("kesit"))
    kes = s.get("kesit") or {}
    x0 = TW + 12 * th
    for tur in ("dikey", "yatay"):
        k = kes.get(tur)
        if not k or plan_var:
            continue
        ox, oy = x0 - k["xmin"], -k["ymin"]
        for lp in k["donguler"]:
            poly("KESIT", [(x + ox, y + oy) for x, y in lp])
        text(x0 + k["w"] / 2, -12.0, _ascii(k["ad"]) or tur.upper(), h=8.0)
        text(x0 + k["w"] / 2, -24.0,
             f"{k['w']:.1f} x {k['h']:.1f}  A={k['alan']:.1f} mm2", h=6.0)
        x0 += k["w"] + 60

    katmanlar = (("CAM", 5, "CONTINUOUS"), ("PROFIL_DIKEY", 8, "CONTINUOUS"),
                 ("PROFIL_YATAY", 9, "CONTINUOUS"), ("AKS", 1, "DASHED"),
                 ("OLCU", 3, "CONTINUOUS"), ("YAZI", 7, "CONTINUOUS"),
                 ("KESIT", 2, "CONTINUOUS"), ("KESIT_DOLGU", 8, "CONTINUOUS"),
                 ("KESIT_CIZGI", 7, "CONTINUOUS"), ("KESIT_CAM", 5, "CONTINUOUS"),
                 ("KESIT_PANEL", 30, "CONTINUOUS"), ("KESIT_PVB", 3, "CONTINUOUS"),
                 ("KESIT_HAVA", 4, "CONTINUOUS"), ("KESIT_ARALIK", 8, "CONTINUOUS"), ("SPANDREL", 30, "CONTINUOUS"),
                 ("KESIT_DIKEY", 8, "CONTINUOUS"))
    baslik = ["0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC",
              "0\nSECTION\n2\nTABLES",
              "0\nTABLE\n2\nLTYPE\n70\n2",
              "0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0",
              "0\nLTYPE\n2\nDASHED\n70\n0\n3\nDashed\n72\n65\n73\n2\n40\n"
              f"{f(th * 1.5)}\n49\n{f(th)}\n49\n{f(-th * 0.5)}",
              "0\nENDTAB",
              f"0\nTABLE\n2\nLAYER\n70\n{len(katmanlar)}"]
    for ad, renk, lt in katmanlar:
        baslik.append(f"0\nLAYER\n2\n{ad}\n70\n0\n62\n{renk}\n6\n{lt}")
    baslik += ["0\nENDTAB", "0\nENDSEC", "0\nSECTION\n2\nENTITIES"]

    with open(yol, "w", newline="", encoding="ascii") as dosya:
        dosya.write("\r\n".join(baslik + E + ["0\nENDSEC", "0\nEOF"]).replace("\n", "\r\n")
                    .replace("\r\r\n", "\r\n") + "\r\n")


# ---------------------------------------------------------------- PDF RAPOR
class _TTF:
    """Basit TrueType okuyucu: karakter -> glyph numarası, genişlik. PDF'e tam gömülür."""

    def __init__(self, yol):
        d = self.veri = open(yol, "rb").read()
        if d[:4] not in (b"\x00\x01\x00\x00", b"true"):
            raise ValueError(f"Desteklenmeyen yazı tipi biçimi: {os.path.basename(yol)} (TTF gerekli).")
        n = struct.unpack(">H", d[4:6])[0]
        self.tablo = {}
        for i in range(n):
            tag, _cs, off, ln = struct.unpack(">4sIII", d[12 + 16 * i: 28 + 16 * i])
            self.tablo[tag.decode("latin-1")] = (off, ln)
        t = lambda ad: self.tablo[ad][0]
        self.upm = struct.unpack(">H", d[t("head") + 18: t("head") + 20])[0]
        self.bbox = struct.unpack(">4h", d[t("head") + 36: t("head") + 44])
        self.ascent, self.descent = struct.unpack(">2h", d[t("hhea") + 4: t("hhea") + 8])
        self.nhm = struct.unpack(">H", d[t("hhea") + 34: t("hhea") + 36])[0]
        self.hmtx = t("hmtx")
        c = t("cmap")
        nt = struct.unpack(">H", d[c + 2: c + 4])[0]
        sec = None
        for i in range(nt):
            pid, eid, off = struct.unpack(">HHI", d[c + 4 + 8 * i: c + 12 + 8 * i])
            if (pid, eid) == (3, 1):
                sec = c + off
                break
        if sec is None or struct.unpack(">H", d[sec: sec + 2])[0] != 4:
            raise ValueError(f"{os.path.basename(yol)}: Unicode (BMP, biçim 4) eşlemesi yok.")
        sx2 = struct.unpack(">H", d[sec + 6: sec + 8])[0]
        seg = sx2 // 2
        self._bitis = struct.unpack(f">{seg}H", d[sec + 14: sec + 14 + sx2])
        self._basla = struct.unpack(f">{seg}H", d[sec + 16 + sx2: sec + 16 + 2 * sx2])
        self._delta = struct.unpack(f">{seg}h", d[sec + 16 + 2 * sx2: sec + 16 + 3 * sx2])
        self._ro_pos = sec + 16 + 3 * sx2
        self._ro = struct.unpack(f">{seg}H", d[self._ro_pos: self._ro_pos + sx2])
        self._gid, self._gen = {}, {}

    def gid(self, kod):
        if kod in self._gid:
            return self._gid[kod]
        g = 0
        for i, bit in enumerate(self._bitis):
            if kod <= bit:
                if kod >= self._basla[i]:
                    if self._ro[i] == 0:
                        g = (kod + self._delta[i]) & 0xFFFF
                    else:
                        pos = self._ro_pos + 2 * i + self._ro[i] + 2 * (kod - self._basla[i])
                        gg = struct.unpack(">H", self.veri[pos: pos + 2])[0]
                        g = (gg + self._delta[i]) & 0xFFFF if gg else 0
                break
        self._gid[kod] = g
        return g

    def ilerleme(self, g):
        """glyph ilerleme genişliği (font birimi)"""
        if g in self._gen:
            return self._gen[g]
        i = min(g, self.nhm - 1)
        v = struct.unpack(">H", self.veri[self.hmtx + 4 * i: self.hmtx + 4 * i + 2])[0]
        self._gen[g] = v
        return v


def _yazi_tipi_yolu(kalin):
    win = os.environ.get("WINDIR", r"C:\Windows")
    adaylar = [
        os.path.join(win, "Fonts", "arialbd.ttf" if kalin else "arial.ttf"),
        os.path.join(win, "Fonts", "segoeuib.ttf" if kalin else "segoeui.ttf"),
        os.path.join(win, "Fonts", "calibrib.ttf" if kalin else "calibri.ttf"),
        "/Library/Fonts/Arial Bold.ttf" if kalin else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if kalin
        else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if kalin
        else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if kalin
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        os.path.join(uygulama_klasoru(), "fonts", "DejaVuSans-Bold.ttf" if kalin else "DejaVuSans.ttf"),
    ]
    for y in adaylar:
        if os.path.isfile(y):
            return y
    return None


class Pdf:
    """Bağımlılıksız küçük PDF yazıcısı: vektör çizim + gömülü TrueType yazı (Türkçe karakterler)."""
    A4L = (841.89, 595.28)

    def __init__(self, yazi=None, kalin=None):
        yazi = yazi or _yazi_tipi_yolu(False)
        kalin = kalin or _yazi_tipi_yolu(True) or yazi
        if not yazi:
            raise ValueError("PDF için TrueType yazı tipi bulunamadı (Windows'ta arial.ttf olmalı).")
        self.f = [_TTF(yazi), _TTF(kalin)]
        self.kullanilan = [{}, {}]
        self.sayfalar = []

    def sayfa(self, w=None, h=None):
        p = {"w": w or self.A4L[0], "h": h or self.A4L[1], "k": []}
        self.sayfalar.append(p)
        return p

    @staticmethod
    def _rg(renk):
        if not renk:
            return None
        renk = {"white": "#ffffff", "black": "#000000"}.get(renk, renk)
        if not (renk.startswith("#") and len(renk) == 7):
            return None
        return " ".join(f"{int(renk[i:i + 2], 16) / 255:.3f}" for i in (1, 3, 5))

    def yol(self, p, pts, dolgu=None, cizgi=None, kal=0.5, dash=None, kapali=True):
        if len(pts) < 2:
            return
        H = p["h"]
        fg, sg = self._rg(dolgu), self._rg(cizgi)
        k = ["q"]
        if fg:
            k.append(f"{fg} rg")
        if sg:
            k.append(f"{sg} RG {kal:.3f} w")
        k.append(f"[{dash[0]:.2f} {dash[1]:.2f}] 0 d" if dash else "[] 0 d")
        k.append(f"{pts[0][0]:.2f} {H - pts[0][1]:.2f} m")
        for x, y in pts[1:]:
            k.append(f"{x:.2f} {H - y:.2f} l")
        if kapali:
            k.append("h")
        k.append("B" if fg and sg else "f" if fg else "S" if sg else "n")
        k.append("Q")
        p["k"].append("\n".join(k))

    def cizgi(self, p, x1, y1, x2, y2, renk="#000000", kal=0.5, dash=None):
        self.yol(p, [(x1, y1), (x2, y2)], None, renk, kal, dash, kapali=False)

    def dikdortgen(self, p, x, y, w, h, dolgu=None, cizgi=None, kal=0.5):
        self.yol(p, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], dolgu, cizgi, kal)

    def elips(self, p, x1, y1, x2, y2, dolgu=None, cizgi=None, kal=0.5):
        H = p["h"]
        cx, cy = (x1 + x2) / 2, H - (y1 + y2) / 2
        rx, ry = abs(x2 - x1) / 2, abs(y2 - y1) / 2
        k = 0.5523
        fg, sg = self._rg(dolgu), self._rg(cizgi)
        s = ["q"]
        if fg:
            s.append(f"{fg} rg")
        if sg:
            s.append(f"{sg} RG {kal:.3f} w")
        s.append(f"{cx + rx:.2f} {cy:.2f} m")
        for (ax, ay, bx, by, ex, ey) in (
                (cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry),
                (cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy),
                (cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry),
                (cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy)):
            s.append(f"{ax:.2f} {ay:.2f} {bx:.2f} {by:.2f} {ex:.2f} {ey:.2f} c")
        s.append("h")
        s.append("B" if fg and sg else "f" if fg else "S" if sg else "n")
        s.append("Q")
        p["k"].append("\n".join(s))

    def kirp(self, p, x, y, w, h):
        p["k"].append(f"q {x:.2f} {p['h'] - y - h:.2f} {w:.2f} {h:.2f} re W n")

    def kirp_bitir(self, p):
        p["k"].append("Q")

    def genislik(self, metin, boyut, kalin=False):
        f = self.f[1 if kalin else 0]
        toplam = 0
        for c in metin:
            g = f.gid(ord(c)) or f.gid(ord("?"))
            toplam += f.ilerleme(g)
        return toplam * boyut / f.upm

    def yazi(self, p, x, y, metin, boyut=9.0, kalin=False, renk="#000000", hiza="sol",
             aci=0.0, dikey="taban"):
        """x, y: sayfa üst-sol orijinli; hiza: sol|orta|sag; dikey: taban|orta|ust|alt"""
        if not metin:
            return
        fi = 1 if kalin else 0
        f = self.f[fi]
        hexs = []
        for c in metin:
            g = f.gid(ord(c)) or f.gid(ord("?"))
            self.kullanilan[fi][g] = c if f.gid(ord(c)) else "?"
            hexs.append(f"{g:04X}")
        w = self.genislik(metin, boyut, kalin)
        a = math.radians(aci)
        ca, sa = math.cos(a), math.sin(a)
        ox = {"sol": 0.0, "orta": 0.5, "sag": 1.0}[hiza] * w
        oy = {"taban": 0.0, "orta": -0.35 * boyut, "ust": -0.72 * boyut, "alt": 0.2 * boyut}[dikey]
        px, py = x, p["h"] - y
        bx = px - ox * ca - oy * sa
        by = py - ox * sa + oy * ca
        rg = self._rg(renk) or "0 0 0"
        p["k"].append(f"q BT /F{fi + 1} {boyut:.2f} Tf {ca:.4f} {sa:.4f} {-sa:.4f} {ca:.4f} "
                      f"{bx:.2f} {by:.2f} Tm {rg} rg <{''.join(hexs)}> Tj ET Q")

    def kaydet(self, yol):
        nesne = {}

        def akis(sozluk, veri):
            z = zlib.compress(veri)
            return (f"<< {sozluk} /Filter /FlateDecode /Length {len(z)} >>\nstream\n".encode("latin-1")
                    + z + b"\nendstream")

        yazi_adlari = ("CepheYazi", "CepheYaziKalin")
        for fi, f in enumerate(self.f):
            base = 3 + fi * 5
            ad = yazi_adlari[fi]
            gl = sorted(self.kullanilan[fi])
            w_ = " ".join(f"{g} [{round(f.ilerleme(g) * 1000 / f.upm)}]" for g in gl)
            nesne[base] = (f"<< /Type /Font /Subtype /Type0 /BaseFont /{ad} /Encoding /Identity-H "
                           f"/DescendantFonts [{base + 1} 0 R] /ToUnicode {base + 4} 0 R >>").encode()
            nesne[base + 1] = (f"<< /Type /Font /Subtype /CIDFontType2 /BaseFont /{ad} "
                               f"/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> "
                               f"/FontDescriptor {base + 2} 0 R /DW 600 /W [{w_}] /CIDToGIDMap /Identity >>").encode()
            bb = "[" + " ".join(str(round(v * 1000 / f.upm)) for v in f.bbox) + "]"
            nesne[base + 2] = (f"<< /Type /FontDescriptor /FontName /{ad} /Flags 32 /FontBBox {bb} "
                               f"/ItalicAngle 0 /Ascent {round(f.ascent * 1000 / f.upm)} "
                               f"/Descent {round(f.descent * 1000 / f.upm)} "
                               f"/CapHeight {round(f.ascent * 700 / f.upm)} /StemV {120 if fi else 80} "
                               f"/FontFile2 {base + 3} 0 R >>").encode()
            nesne[base + 3] = akis(f"/Length1 {len(f.veri)}", f.veri)
            cm = ["/CIDInit /ProcSet findresource begin 12 dict begin begincmap",
                  "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
                  "/CMapName /Adobe-Identity-UCS def /CMapType 2 def",
                  "1 begincodespacerange <0000> <FFFF> endcodespacerange"]
            for i in range(0, len(gl), 100):
                kk = gl[i:i + 100]
                cm.append(f"{len(kk)} beginbfchar")
                for g in kk:
                    cm.append(f"<{g:04X}> <{ord(self.kullanilan[fi][g]):04X}>")
                cm.append("endbfchar")
            cm.append("endcmap CMapName currentdict /CMap defineresource pop end end")
            nesne[base + 4] = akis("", "\n".join(cm).encode("ascii"))

        sayfa_idler = []
        for i, p in enumerate(self.sayfalar):
            pid, cid = 13 + 2 * i, 14 + 2 * i
            sayfa_idler.append(pid)
            nesne[cid] = akis("", "\n".join(p["k"]).encode("latin-1"))
            nesne[pid] = (f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {p['w']:.2f} {p['h']:.2f}] "
                          f"/Resources << /Font << /F1 3 0 R /F2 8 0 R >> >> /Contents {cid} 0 R >>").encode()
        nesne[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
        nesne[2] = (f"<< /Type /Pages /Kids [{' '.join(f'{i} 0 R' for i in sayfa_idler)}] "
                    f"/Count {len(sayfa_idler)} >>").encode()
        cikti = bytearray(b"%PDF-1.5\n%\xe2\xe3\xcf\xd3\n")
        ofset = {}
        for no in sorted(nesne):
            ofset[no] = len(cikti)
            cikti += f"{no} 0 obj\n".encode() + nesne[no] + b"\nendobj\n"
        xref = len(cikti)
        enb = max(nesne)
        cikti += f"xref\n0 {enb + 1}\n0000000000 65535 f \n".encode()
        for no in range(1, enb + 1):
            cikti += f"{ofset.get(no, 0):010d} 00000 n \n".encode()
        cikti += (f"trailer\n<< /Size {enb + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n").encode()
        with open(yol, "wb") as dosya:
            dosya.write(cikti)


class PdfTuval:
    """Tk Canvas arayüzünü PDF sayfasına çizen adaptör (ciz / ciz_kesit ayni kodla çizer)."""

    def __init__(self, pdf, sayfa, x, y, w, h, f=0.85, kirp=True):
        self.pdf, self.p, self.ox, self.oy, self.f = pdf, sayfa, x, y, f
        self.W, self.H = w / f, h / f
        self.kirpildi = kirp
        if kirp:
            pdf.kirp(sayfa, x, y, w, h)

    def bitir(self):
        if self.kirpildi:
            self.pdf.kirp_bitir(self.p)

    def winfo_width(self):
        return self.W

    def winfo_height(self):
        return self.H

    def delete(self, *a):
        pass

    def _pt(self, x, y):
        return self.ox + x * self.f, self.oy + y * self.f

    @staticmethod
    def _koord(args):
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            return list(args[0])
        return list(args)

    def _kal(self, width):
        return max(0.25, 0.6 * self.f * float(width))

    def create_rectangle(self, x1, y1, x2, y2, fill="", outline="black", width=1, **k):
        a, b = self._pt(x1, y1), self._pt(x2, y2)
        self.pdf.dikdortgen(self.p, min(a[0], b[0]), min(a[1], b[1]), abs(b[0] - a[0]), abs(b[1] - a[1]),
                            fill or None, outline or None, self._kal(width))

    def create_polygon(self, *args, fill="black", outline="", width=1, **k):
        c = self._koord(args)
        pts = [self._pt(c[i], c[i + 1]) for i in range(0, len(c) - 1, 2)]
        self.pdf.yol(self.p, pts, fill or None, outline or None, self._kal(width))

    def create_line(self, *args, fill="black", dash=None, width=1, **k):
        c = self._koord(args)
        pts = [self._pt(c[i], c[i + 1]) for i in range(0, len(c) - 1, 2)]
        d = (dash[0] * self.f, dash[1] * self.f) if dash else None
        self.pdf.yol(self.p, pts, None, fill or None, self._kal(width), d, kapali=False)

    def create_oval(self, x1, y1, x2, y2, fill="", outline="black", width=1, **k):
        a, b = self._pt(x1, y1), self._pt(x2, y2)
        self.pdf.elips(self.p, a[0], a[1], b[0], b[1], fill or None, outline or None, self._kal(width))

    def create_text(self, x, y, text="", font=("Arial", 9), fill="black", anchor="center",
                    angle=0, justify="left", **k):
        boyut = abs(float(font[1])) * self.f
        kalin = "bold" in [str(v) for v in font[2:]]
        hiza = "sol" if "w" in anchor else "sag" if "e" in anchor else "orta"
        dikey = "ust" if "n" in anchor else "alt" if "s" in anchor else "orta"
        satirlar = str(text).split("\n")
        px, py = self._pt(x, y)
        ls = boyut * 1.25
        ilk = -(len(satirlar) - 1) * ls / 2 if dikey == "orta" else 0.0
        for i, ln in enumerate(satirlar):
            self.pdf.yazi(self.p, px, py + ilk + i * ls, ln, boyut, kalin, fill, hiza, angle, dikey)


class _SabitGorunum:
    def __init__(self):
        self.fit = None

    def donustur(self):
        return self.fit


def _satir_boz(pdf, metin, genislik, boyut, kalin=False):
    """Kelime bazlı satır kırma; metindeki \n satır sonu sayılır."""
    out = []
    for par in str(metin).split("\n"):
        cur = ""
        for kelime in par.split(" "):
            deneme = (cur + " " + kelime).strip()
            if cur and pdf.genislik(deneme, boyut, kalin) > genislik:
                out.append(cur)
                cur = kelime
            else:
                cur = deneme
        out.append(cur)
    return out


def _kisalt(pdf, metin, genislik, boyut, kalin=False):
    """Metin genişliğe sığmıyorsa sonuna … koyarak kısaltır."""
    if pdf.genislik(metin, boyut, kalin) <= genislik:
        return metin
    while metin and pdf.genislik(metin + "…", boyut, kalin) > genislik:
        metin = metin[:-1]
    return metin.rstrip() + "…"


# ---------------------------------------------------------------- sipariş dosyası ile karşılaştırma
def _xlsx_oku(yol):
    """Bağımlılıksız .xlsx okuyucu: ilk sayfanın satırlarını [[hücre,...],...] döndürür (metin / sayı)."""
    import zipfile
    import xml.etree.ElementTree as ET
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    z = zipfile.ZipFile(yol)
    ad = z.namelist()
    ortak = []
    if "xl/sharedStrings.xml" in ad:
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", ns):
            ortak.append("".join(t.text or "" for t in si.iter("{%s}t" % ns["m"])))
    sayfa = sorted(n for n in ad if re.match(r"xl/worksheets/sheet\d+\.xml$", n))
    if not sayfa:
        return []
    satirlar = []
    for row in ET.fromstring(z.read(sayfa[0])).iter("{%s}row" % ns["m"]):
        hucre = {}
        for c in row.findall("m:c", ns):
            ref = re.match(r"([A-Z]+)", c.get("r") or "")
            if not ref:
                continue
            kol = 0
            for ch in ref.group(1):
                kol = kol * 26 + ord(ch) - 64
            t = c.get("t")
            if t == "s":
                v = c.find("m:v", ns)
                val = ortak[int(v.text)] if v is not None and v.text is not None else ""
            elif t == "inlineStr":
                val = "".join(x.text or "" for x in c.iter("{%s}t" % ns["m"]))
            else:
                v = c.find("m:v", ns)
                val = v.text if v is not None and v.text is not None else ""
            hucre[kol - 1] = val
        if hucre:
            satirlar.append([hucre.get(i, "") for i in range(max(hucre) + 1)])
        else:
            satirlar.append([])
    return satirlar


def siparis_dosyasi_oku(yol):
    """.xlsx ya da .csv/.txt sipariş dosyasını satır listesi olarak okur."""
    if yol.lower().endswith((".xlsx", ".xlsm")):
        return _xlsx_oku(yol)
    with open(yol, "r", encoding="utf-8-sig", errors="replace", newline="") as f:
        orn = f.read(4096)
        f.seek(0)
        sep = max(";,\t", key=orn.count)
        return [r for r in csv.reader(f, delimiter=sep)]


def _sayi_oku(v):
    t = str(v).strip().replace("\xa0", "").replace(" ", "")
    if not t:
        return None
    if "," in t and "." in t:
        t = t.replace(".", "").replace(",", ".") if t.rfind(",") > t.rfind(".") else t.replace(",", "")
    else:
        t = t.replace(",", ".")
    try:
        return float(t)
    except ValueError:
        return None


def siparis_karsilastir(program, satirlar, kol_kod, kol_adet, kol_boy=None, baslik=True):
    """program: [(kalem, olcu, birim, miktar)] (malzeme_listesi'nden); satirlar: sipariş dosyası satırları.
    Dönüş: [(kod, programda, siparişte, fark, durum)] — durum: eşit | eksik | fazla | siparişte yok | programda yok.
    Eşleşme kod ile (boşluk/tire/büyük-küçük harf yok sayılır); sipariş boy sütunu varsa 'kod|boy' ile de denenir.
    Programdaki miktar: profilde çubuk adedi (yoksa kesim adedi), diğer kalemlerde listedeki miktar."""
    prog = {}
    for kalem, olcu, birim, miktar in program:
        try:
            m = float(str(miktar).replace(",", "."))
        except ValueError:
            continue
        k = _sade(kalem)
        e = prog.setdefault(k, {"ad": kalem, "cubuk": 0.0, "adet": 0.0, "diger": 0.0, "boylar": {}})
        if birim == "çubuk":
            e["cubuk"] += m
            bm = re.match(r"\s*([\d.,]+)\s*mm", str(olcu))
            if bm:
                e["boylar"][bm.group(1)] = e["boylar"].get(bm.group(1), 0.0) + m
        elif birim == "adet":
            e["adet"] += m
        else:
            e["diger"] += m
    sip = {}
    for i, r in enumerate(satirlar):
        if baslik and i == 0:
            continue
        if kol_kod >= len(r) or kol_adet >= len(r):
            continue
        kod = str(r[kol_kod]).strip()
        n = _sayi_oku(r[kol_adet])
        if not kod or n is None:
            continue
        k = _sade(kod)
        e = sip.setdefault(k, {"ad": kod, "n": 0.0})
        e["n"] += n
    sonuc = []
    for k in sorted(set(prog) | set(sip)):
        pe, se = prog.get(k), sip.get(k)
        if pe:
            pm = pe["cubuk"] if pe["cubuk"] else (pe["adet"] if pe["adet"] else pe["diger"])
        else:
            pm = None
        sm = se["n"] if se else None
        ad = (pe or se)["ad"]
        if pm is None:
            sonuc.append((ad, None, sm, None, "programda yok"))
        elif sm is None:
            sonuc.append((ad, pm, None, None, "siparişte yok"))
        else:
            f = sm - pm
            sonuc.append((ad, pm, sm, f, "eşit" if abs(f) < 1e-6 else ("eksik" if f < 0 else "fazla")))
    return sonuc


def detay_kitapcigi_olustur(s, bilgi, yazi=None, kalin=None):
    """Detay kitapçığı: cephedeki birbirinden FARKLI her aks/hat kesiti ayrı sayfada, büyük ölçekte; sayfa başında proje,
    cam yapısı ve ısı bariyeri zinciri yazılır."""
    pdf = Pdf(yazi, kalin)
    W, H = Pdf.A4L
    M = 28.0
    GRI, KOYU, ACIK = "#55606a", "#2f373d", "#c9d0d5"
    proje, sistem = (bilgi.get("proje") or "").strip(), (bilgi.get("sistem") or "").strip()
    yapi = s.get("cam_yapi") or {}
    sec = s.get("cam_secim") or {}
    cam_s = (f"Cam {yapi.get('ad', '-')} = {yapi.get('kalinlik', 0):.2f} mm" if yapi else "")
    zinc_s = ("Isı bariyeri zinciri: " + str(sec.get("pvc"))) if sec.get("pvc") else ""
    tarih = bilgi.get("tarih") or ""
    n_top, i = None, 0
    while n_top is None or i < n_top:
        pg = pdf.sayfa()
        tv = PdfTuval(pdf, pg, M, M + 48, W - 2 * M, H - 2 * M - 48 - 10, 0.92, kirp=False)
        sp = _Sayfa(tv, s)
        sp._kesit_hepsi, sp._kesit_sadece = True, i
        Uygulama.ciz_kesit(sp)
        tv.bitir()
        if n_top is None:
            n_top = max(1, getattr(sp, "_kesit_oge_n", 0))
        etk = (getattr(sp, "_kesit_oge_etk", None) or [""])
        etk = etk[i] if i < len(etk) else ""
        pdf.yazi(pg, M, M + 12, "Detay kitapçığı" + (f" — {proje}" if proje else ""), 13, True, KOYU)
        pdf.yazi(pg, W - M, M + 12, f"Detay {i + 1} / {n_top}", 9, False, GRI, "sag")
        pdf.cizgi(pg, M, M + 20, W - M, M + 20, ACIK, 0.6)
        pdf.yazi(pg, M, M + 34, _kisalt(pdf, "  |  ".join(t_ for t_ in (sistem, cam_s, zinc_s, tarih) if t_), W - 2 * M, 8.5),
                 8.5, False, GRI)
        if etk:
            pdf.yazi(pg, M, M + 46, etk, 10, True, KOYU)
        i += 1
    return pdf


def rapor_olustur(s, bilgi, yazi=None, kalin=None):
    """Tek PDF: 1) görünüş + plan + kesit + ölçüler/özet  2) kesit detayları
    3) kesim listesi 4) cam/spandrel listesi 5) çubuk kesim planı (optimizasyon)."""
    pdf = Pdf(yazi, kalin)
    W, H = Pdf.A4L
    M = 28.0
    GRI, KOYU, ACIK = "#55606a", "#2f373d", "#c9d0d5"
    pr = s["p"]
    o = s["ozet"]
    proje, sistem = (bilgi.get("proje") or "").strip(), (bilgi.get("sistem") or "").strip()

    # ----------------------------------------------------------- 1. sayfa
    p = pdf.sayfa()
    pdf.yazi(p, M, M + 14, "CEPHE METRAJ RAPORU", 16, True, KOYU)
    tarih_m = f"Tarih: {bilgi['tarih']}"
    pdf.yazi(p, W - M, M + 32, tarih_m, 9.5, False, GRI, "sag")
    kalan_w = W - 2 * M - pdf.genislik(tarih_m, 9.5) - 24
    parcalar = [t for t in (f"Proje: {proje}" if proje else "", f"Sistem: {sistem}" if sistem else "") if t]
    if parcalar:
        pay = kalan_w / len(parcalar) - 12
        xx = M
        for t in parcalar:
            t = _kisalt(pdf, t, pay, 9.5)
            pdf.yazi(p, xx, M + 32, t, 9.5, False, GRI)
            xx += pdf.genislik(t, 9.5) + 24
    sip = dict(s.get("siparis") or [])
    sip_satir = "   |   ".join(f"{e_}: {d_}" for e_, d_ in (s.get("siparis") or [])
                               if d_ and e_ not in ("Proje", "Sistem", "Tarih", "Not"))
    ek_h = 12.0 if sip_satir else 0.0
    if sip_satir:
        pdf.yazi(p, M, M + 44, _kisalt(pdf, sip_satir, W - 2 * M, 8.5), 8.5, False, GRI)
    pdf.cizgi(p, M, M + 40 + ek_h, W - M, M + 40 + ek_h, ACIK, 0.6)
    ax, ay, aw = M, M + 48 + ek_h, 566.0
    ah = H - M - 22 - ay
    pdf.dikdortgen(p, ax, ay, aw, ah, None, "#d9dee2", 0.6)
    tv = PdfTuval(pdf, p, ax, ay, aw, ah, 0.85)
    Uygulama.ciz(_Sayfa(tv, s))
    tv.bitir()

    sx = ax + aw + 16
    sw = W - M - sx
    y = [ay + 2]

    def blok(etiket, metin):
        pdf.yazi(p, sx, y[0] + 8, etiket, 7.5, True, GRI)
        y[0] += 12
        for ln in _satir_boz(pdf, metin, sw, 8.5):
            pdf.yazi(p, sx, y[0] + 8, ln, 8.5, False, KOYU)
            y[0] += 11
        y[0] += 6

    pdf.yazi(p, sx, y[0] + 10, "Ölçüler ve özet", 10.5, True, KOYU)
    y[0] += 20
    blok("Cephe ölçüsü", f"{o['olcu'][0]:g} x {o['olcu'][1]:g} mm")
    blok("Aks aralıkları (soldan sağa)", sikistir(s["cols"]) + " mm")
    blok("Kat yükseklikleri (alttan yukarı)", sikistir(s["rows"]) + " mm")
    ek_s = [f"{aks_adi(j)}–{aks_adi(j + 1)}: " + ", ".join(f"{h:g}" for h in e)
            for j, e in enumerate(s["ek"]) if e]
    if ek_s:
        blok("Ek yatay hatlar (kat içinde, alttan)", "; ".join(ek_s) + " mm")
    blok("Profiller", f"Dikey: {pr['dikey_ad']} ({pr['dikey_g']:g} mm, {pr['dikey_kg']:.3f} kg/m)\n"
                      f"Yatay: {pr['yatay_ad']} ({pr['yatay_g']:g} mm, {pr['yatay_kg']:.3f} kg/m)\n"
                      f"Dikey boy: kat + aks altı {s['dikey_alt']:g} mm + aks üstü {s['dikey_ust']:g} mm")
    bol = f"Cam: {o['cam_adet']} adet, {o['cam_m2']:.2f} m²"
    if o["sp_adet"]:
        bol += f"\nPanel/Spandrel: {o['sp_adet']} adet, {o['sp_m2']:.2f} m²"
    blok("Bölgeler", bol)
    yp_ = s.get("cam_yapi")
    if yp_:
        cam_s = (f"{yp_['ad']} mm, toplam {yp_['kalinlik']:.2f} mm, {yp_['kg_m2']:.1f} kg/m²"
                 f"\nPVB: {[k for k in yp_['katman'] if k[0] == 'pvb'][0][1]:g} mm" if any(k[0] == "pvb" for k in yp_["katman"]) else
                 f"{yp_['ad']} mm, toplam {yp_['kalinlik']:.2f} mm, {yp_['kg_m2']:.1f} kg/m²")
        for u in cam_secim_metni(s):
            cam_s += "\n" + u
        for u in cam_uyarilari(s.get("detay"), yp_):
            cam_s += "\nUYARI: " + u
        blok("Cam yapısı", cam_s)
    ag = s.get("agirlik")
    if ag:
        blok("Ağırlık özeti (teorik)",
             f"Ana profil {ag['ana_kg']:.1f} kg | yardımcı alüminyum {ag['yard_alu_kg']:.1f} kg\n"
             f"Toplam alüminyum {ag['alu_toplam_kg']:.1f} kg | cam {ag['cam_kg']:.1f} kg\n"
             f"Conta {ag['conta_m']:.1f} m ({ag['conta_kg']:.1f} kg) | izolatör {ag['izolator_m']:.1f} m\n"
             f"Teorik ağırlıklar katalog değerleridir; gerçek ağırlık ±%10 farklı olabilir.")
    n_cubuk = sum(c[1] for c in o["cubuk_ozet"])
    boylar_ = sorted({r[1] for r in s["cubuk"]}, reverse=True) or [pr["cubuk"]]
    blok("Üretim ve sipariş", f"Çubuk {', '.join(f'{b:g}' for b in boylar_)} mm, testere {pr['testere']:g} mm, cam ucu aksa {_CAM_UI.get('aks_d'):g} / {_CAM_UI.get('aks_y'):g} mm (dikey / yatay)\n"
                              f"Sipariş: {n_cubuk} çubuk, {o['siparis_kg']:.1f} kg")

    # ----------------------------------------- 2. sayfa: kesit detayları
    kisa_ust = "  |  ".join(t_ for t_ in (proje, f"Sipariş no: {sip['Sipariş no']}" if sip.get("Sipariş no") else "") if t_)

    def sayfa_baslik(pg, metin):
        pdf.yazi(pg, M, M + 12, metin, 13, True, KOYU)
        if kisa_ust:
            pdf.yazi(pg, W - M, M + 12, _kisalt(pdf, kisa_ust, W * 0.5, 8.5), 8.5, False, GRI, "sag")
        pdf.cizgi(pg, M, M + 20, W - M, M + 20, ACIK, 0.6)

    for t_k, bsl_k in (("dikey", "Kesit detayları — düşey akslar (farklı olanlar)"),
                       ("yatay", "Kesit detayları — yatay hatlar (farklı olanlar)")):
        if not (s.get("kesit") or {}).get(t_k):
            continue
        p2 = pdf.sayfa()
        sayfa_baslik(p2, bsl_k)
        tv = PdfTuval(pdf, p2, M, M + 28, W - 2 * M, H - 2 * M - 28 - 10, 0.9, kirp=False)
        sp_k = _Sayfa(tv, s)
        sp_k._kesit_hepsi, sp_k._kesit_tur = True, t_k
        Uygulama.ciz_kesit(sp_k)
        tv.bitir()

    # ---------------------------------------------- akış (tablolar / optimizasyon)
    durum = {"p": None, "y": 0.0}

    def yeni_sayfa(baslik):
        durum["p"] = pdf.sayfa()
        sayfa_baslik(durum["p"], baslik)
        durum["y"] = M + 32

    def yer_ayir(h, baslik):
        if durum["p"] is None or durum["y"] + h > H - M - 8:
            yeni_sayfa(baslik)

    def tablo(baslik, kolonlar, satirlar, toplamlar=(), sayfa_basligi="Listeler"):
        """kolonlar: [(başlık, genişlik, hiza)]; toplamlar: kalın yazılan son satırlar"""
        yer_ayir(60, sayfa_basligi)
        pdf.yazi(durum["p"], M, durum["y"] + 10, baslik, 11, True, KOYU)
        durum["y"] += 18
        gen = sum(k[1] for k in kolonlar)

        def baslik_satiri():
            pg_ = durum["p"]
            x = M
            pdf.dikdortgen(pg_, M, durum["y"], gen, 15, "#e9edf0", None)
            for ad, gw, hz in kolonlar:
                tx = x + 4 if hz == "sol" else x + gw - 4
                pdf.yazi(pg_, tx, durum["y"] + 10.5, ad, 8.5, True, KOYU, hz)
                x += gw
            durum["y"] += 15

        baslik_satiri()
        tum = list(satirlar) + list(toplamlar)
        for i, r in enumerate(tum):
            if durum["y"] + 14 > H - M - 8:
                yeni_sayfa(sayfa_basligi + " (devam)")
                baslik_satiri()
            pg_ = durum["p"]
            son = i >= len(satirlar)
            if son and i == len(satirlar):
                pdf.cizgi(pg_, M, durum["y"], M + gen, durum["y"], GRI, 0.7)
            elif not son and i % 2:
                pdf.dikdortgen(pg_, M, durum["y"], gen, 14, "#f5f7f8", None)
            x = M
            for (ad, gw, hz), v in zip(kolonlar, r):
                tx = x + 4 if hz == "sol" else x + gw - 4
                pdf.yazi(pg_, tx, durum["y"] + 10, str(v), 8.5, son, KOYU, hz)
                x += gw
            durum["y"] += 14
        durum["y"] += 14

    # 3. kesim listesi
    kes = s["kesim"]
    tablo("Kesim listesi",
          [("Profil", 260, "sol"), ("Boy (mm)", 90, "sag"), ("Adet", 70, "sag"),
           ("Toplam boy (m)", 110, "sag"), ("Ağırlık (kg)", 100, "sag")],
          [(r[0], f"{r[1]:g}", r[2], f"{r[3]:.2f}", f"{r[4]:.2f}") for r in kes],
          [("Toplam", "", sum(r[2] for r in kes), f"{sum(r[3] for r in kes):.2f}",
            f"{sum(r[4] for r in kes):.2f}")], "Kesim ve cam listeleri")

    # 4. cam / spandrel
    if s["cam"]:
        cam_t = []
        if o["cam_adet"]:
            cam_t.append(("Cam toplam", "", o["cam_adet"], f"{o['cam_m2']:.2f}"))
        if o["sp_adet"]:
            cam_t.append(("Panel/spandrel toplam", "", o["sp_adet"], f"{o['sp_m2']:.2f}"))
        tablo("Cam / spandrel listesi",
              [("Tip", 120, "sol"), ("Ölçü (mm)", 160, "sag"), ("Adet", 80, "sag"), ("m²", 90, "sag")],
              [(r[0], r[1], r[2], f"{r[3]:.2f}") for r in s["cam"]], cam_t, "Kesim ve cam listeleri")

    # 4b. malzeme listesi (parça gruplarına göre)
    for baslik, satirlar, top in malzeme_listesi(s):
        tablo(baslik, [(k[0], k[1], k[2]) for k in MAL_KOLON], satirlar,
              [top] if any(top) else [], "Malzeme listesi")

    # 4c. statik ön hesap (statik hesap raporuyla aynı birimler)
    an = s.get("analiz") or on_analiz(s)
    if an:
        yeni_sayfa("Rüzgar yüküne göre ön değerlendirme")
        pdf.yazi(durum["p"], M, durum["y"] + 8, an["not"][0], 8, False, GRI)
        durum["y"] += 14
        pdf.yazi(durum["p"], M, durum["y"] + 8, an["not"][1], 8, False, GRI)
        durum["y"] += 20
        for baslik, satirlar in statik_bolumleri(an):
            tablo(baslik, [("Büyüklük", 270, "sol"), ("Değer", 150, "sag"), ("Birim", 60, "sol")],
                  satirlar, (), "Statik ön hesap")

    # 5. optimizasyon: çubuk kesim planı
    bar_w = 520.0
    stok = max(boylar_)
    yeni_sayfa("Optimizasyon: çubuk kesim planı")
    pg = durum["p"]
    pdf.yazi(pg, M, durum["y"] + 8, f"Stok çubuk {', '.join(f'{b:g}' for b in boylar_)} mm, testere payı {pr['testere']:g} mm. "
             "Her satır, aynı kesim düzenindeki çubukları gösterir (soldaki sayı çubuk adedi).", 8.5, False, GRI)
    durum["y"] += 20
    for u_ in s.get("cubuk_uyari") or []:
        pdf.yazi(pg, M, durum["y"] + 8, "UYARI: " + u_, 8.5, True, "#b03a2e")
        durum["y"] += 14
    for ad, n_c, fire in o["cubuk_ozet"]:
        yer_ayir(40, "Optimizasyon: çubuk kesim planı (devam)")
        pg = durum["p"]
        pdf.yazi(pg, M, durum["y"] + 10, f"{ad}", 10.5, True, KOYU)
        pdf.yazi(pg, M + 8 + pdf.genislik(ad, 10.5, True), durum["y"] + 10,
                 f"  {n_c} çubuk, fire %{fire:.1f}", 9.5, False, GRI)
        durum["y"] += 18
        for r in [c for c in s["cubuk"] if c[0] == ad]:
            yer_ayir(22, "Optimizasyon: çubuk kesim planı (devam)")
            pg = durum["p"]
            boy_r, adet, kes_s, kalan = r[1], r[2], r[3], r[4]
            parcalar = [float(v) for v in kes_s.split("+")]
            sc = bar_w / stok
            x0 = M + 46
            pdf.yazi(pg, x0 - 8, durum["y"] + 11, f"{adet} ×", 9, True, KOYU, "sag")
            x = x0
            for i, b in enumerate(parcalar):
                gw = b * sc
                pdf.dikdortgen(pg, x, durum["y"], gw, 16, "#b9c6cf" if i % 2 == 0 else "#9fb1bd", "#55606a", 0.5)
                if gw >= 24:
                    pdf.yazi(pg, x + gw / 2, durum["y"] + 11, f"{b:g}", 7.5, False, KOYU, "orta")
                x += gw
            if kalan > 0:
                gw = kalan * sc
                pdf.dikdortgen(pg, x, durum["y"], gw, 16, "#f3dcd5", "#c97b63", 0.5)
            pdf.yazi(pg, x0 + bar_w + 8, durum["y"] + 11, f"{boy_r:g} boy, kalan {kalan:g} mm", 8, False, GRI)
            durum["y"] += 21
            if any(b * sc < 24 for b in parcalar):          # çubuğa sığmayan dar parçaların boyları yazıyla
                grp, onc = [], None
                for b in parcalar:
                    if onc is not None and b == onc[0]:
                        onc[1] += 1
                    else:
                        onc = [b, 1]
                        grp.append(onc)
                metin = "Kesimler: " + " + ".join((f"{n_}×{b:g}" if n_ > 1 else f"{b:g}") for b, n_ in grp)
                pdf.yazi(pg, x0, durum["y"] + 6, _kisalt(pdf, metin, bar_w, 7.5), 7.5, False, GRI)
                durum["y"] += 11
        durum["y"] += 8

    # ------------------------------------------------- alt bilgi: sayfa numarası
    n = len(pdf.sayfalar)
    for i, pg in enumerate(pdf.sayfalar, 1):
        alt_m = " | ".join(t for t in (proje, sistem) if t)
        if alt_m:
            pdf.yazi(pg, M, H - M + 8, _kisalt(pdf, alt_m, W - 2 * M - 120, 8), 8, False, GRI)
        pdf.yazi(pg, W - M, H - M + 8, f"Sayfa {i} / {n}", 8, False, GRI, "sag")
    return pdf


# ------------------------------------------------------------------ ARAYÜZ
class _Acilis:
    """CEPHEX açılış ekranı: çerçevesiz pencere, cephe ızgarası çizilir, yazı belirir; süre sonunda yumuşakça kapanır."""
    SURE = 2600          # ms (görünür toplam süre)

    def __init__(self, ana):
        self.ana = ana
        self.t0 = time.time()
        W, H = 560, 300
        self.pen = tk.Toplevel(ana)
        self.pen.overrideredirect(True)
        self.pen.attributes("-topmost", True)
        try:
            self.pen.attributes("-alpha", 1.0)
        except tk.TclError:
            pass
        x = (self.pen.winfo_screenwidth() - W) // 2
        y = (self.pen.winfo_screenheight() - H) // 2 - 30
        self.pen.geometry(f"{W}x{H}+{x}+{y}")
        self.cv = tk.Canvas(self.pen, width=W, height=H, bg="#14181d", highlightthickness=1, highlightbackground="#2f6f73")
        self.cv.pack()
        self.W, self.H = W, H
        self.adim = 0
        self.pen.update()
        self._ciz()

    def _ciz(self):
        cv = self.cv
        # cephe ızgarası (3 x 3 panel, mullion/transom çizgileri)
        gx, gy, pw, ph, ara = 80, 78, 36, 46, 5
        self.paneller = []
        for r in range(3):
            for c_ in range(3):
                x0, y0 = gx + c_ * (pw + ara), gy + r * (ph + ara)
                self.paneller.append(cv.create_rectangle(x0, y0, x0 + pw, y0 + ph, outline="#2f6f73", fill="#14181d", width=1))
        for k_ in range(4):                                      # taşıyıcı çizgiler
            cv.create_line(gx - 3 + k_ * (pw + ara), gy - 6, gx - 3 + k_ * (pw + ara), gy + 3 * (ph + ara) + 1, fill="#4fc3c8", width=1)
        self.yazi = cv.create_text(330, 128, text="CEPHEX", fill="#14181d", font=("Segoe UI", 44, "bold"), anchor="center")
        self.alt = cv.create_text(330, 178, text="C E P H E   M E T R A J", fill="#14181d", font=("Segoe UI", 12), anchor="center")
        self.cizgi = cv.create_line(210, 200, 210, 200, fill="#4fc3c8", width=2)
        self.surum = cv.create_text(self.W - 14, self.H - 12, text="yükleniyor…", fill="#14181d", font=("Segoe UI", 9), anchor="e")
        self._adim()

    @staticmethod
    def _karis(a, b, t):
        t = max(0.0, min(1.0, t))
        ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
        cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
        return "#%02x%02x%02x" % tuple(int(x + (y - x) * t) for x, y in zip(ca, cb))

    def _adim(self):
        try:
            gecen = (time.time() - self.t0) * 1000
            # pencere saydamlığı: son 450 ms sönerek kapanır
            a = 1.0
            if gecen > self.SURE - 450:
                a = max(0.0, (self.SURE - gecen) / 450.0)
            try:
                self.pen.attributes("-alpha", a)
            except tk.TclError:
                pass
            # paneller sırayla yanar
            for i, pid in enumerate(self.paneller):
                t = (gecen - 150 - i * 90) / 260.0
                self.cv.itemconfigure(pid, fill=self._karis("#14181d", "#1f4f55" if i % 2 else "#2b7a80", t))
            tt = (gecen - 500) / 600.0
            self.cv.itemconfigure(self.yazi, fill=self._karis("#14181d", "#e8f1f2", tt))
            self.cv.itemconfigure(self.alt, fill=self._karis("#14181d", "#8fb7ba", (gecen - 900) / 600.0))
            uz = int(min(1.0, max(0.0, (gecen - 800) / 700.0)) * 240)
            self.cv.coords(self.cizgi, 210, 200, 210 + uz, 200)
            self.cv.itemconfigure(self.surum, fill=self._karis("#14181d", "#5f6b73", (gecen - 1000) / 500.0))
            self.pen.update_idletasks()
            if gecen < self.SURE:
                self.pen.after(16, self._adim)
            else:
                self.bitir()
        except tk.TclError:
            pass

    def bitir(self):
        try:
            self.pen.destroy()
        except tk.TclError:
            pass
        self.ana._acilis_bitti()


def _ilerle_g(app, oran):
    """Bilgi çubuğu ilerlemesi (güvenli): oran 0..1; None = bitir. Çubuk yoksa sessizce geçer."""
    try:
        (app._ilerle_bitir() if oran is None else app._ilerle(oran))
    except AttributeError:
        pass


class _CubukEtiket:
    """Bilgi çubuğundaki yazı: Label benzeri (configure/config/cget/bind) arayüzü; yazıyı canvas üzerine çizer."""

    def __init__(self, cubuk, anchor):
        self.cubuk, self.anchor, self.metin = cubuk, anchor, ""
        self.id = cubuk.create_text(0, 0, text="", anchor="w", font=("Segoe UI", 9))

    def configure(self, **kw):
        if "text" in kw:
            m = str(kw["text"])
            if m != self.metin:
                self.metin = m
                self.cubuk.yerlestir()

    config = configure

    def cget(self, k):
        return self.metin if k == "text" else ""

    def bind(self, seq, fn, add=None):
        self.cubuk.tag_bind(self.id, seq, fn)


class _BilgiCubugu(tk.Canvas):
    """Cephe görünüşünün üstündeki bilgi çubuğu. Hesap sürerken çubuğun TAMAMI %100 sayılıp gri dolguyla ilerler."""
    YUKSEK = 24

    def __init__(self, master):
        super().__init__(master, height=self.YUKSEK, highlightthickness=0, bd=0)
        self.oran = 0.0
        self._dolgu = self.create_rectangle(0, 0, 0, self.YUKSEK, outline="", width=0)
        self.sol = _CubukEtiket(self, "w")
        self.koor = _CubukEtiket(self, "e")
        self.ozet = _CubukEtiket(self, "e")
        self.bg, self.fg, self.dolgu = "#e9ecef", "#7a858e", "#c9d0d6"
        self.bind("<Configure>", lambda _e: self.yerlestir())
        self._tema_uygula()

    def _tema_uygula(self):
        self.configure(background=self.bg)
        self.itemconfigure(self._dolgu, fill=self.dolgu)
        for e in (self.sol, self.koor, self.ozet):
            self.itemconfigure(e.id, fill=self.fg)

    def tema(self, bg, fg, dolgu):
        self.bg, self.fg, self.dolgu = bg, fg, dolgu
        self._tema_uygula()

    def _genislik(self, metin):
        try:
            if getattr(self, "_font", None) is None:
                import tkinter.font as tkf
                self._font = tkf.Font(family="Segoe UI", size=9)
            return self._font.measure(metin)
        except Exception:
            return int(len(metin) * 6.3)

    def yerlestir(self):
        try:
            W = max(int(self.winfo_width()), 50)
        except tk.TclError:
            return
        h = self.YUKSEK // 2
        x = W - 8
        for e in (self.ozet, self.koor):
            w = self._genislik(e.metin) if e.metin else 0
            self.coords(e.id, x, h)
            self.itemconfigure(e.id, text=e.metin, anchor="e")
            x -= w + (14 if e.metin else 0)
        m = self.sol.metin
        bos = x - 8
        if m and self._genislik(m) > bos:
            lo, hi = 0, len(m)
            while lo < hi:
                mid = (lo + hi + 1) // 2
                if self._genislik(m[:mid] + "…") <= bos:
                    lo = mid
                else:
                    hi = mid - 1
            m = m[:lo] + "…"
        self.coords(self.sol.id, 8, h)
        self.itemconfigure(self.sol.id, text=m, anchor="w")
        self.ilerleme(self.oran, guncelle=False)

    def ilerleme(self, oran, guncelle=True):
        """oran 0..1: çubuğun tamamına göre dolgu (gri); 0 = dolgu yok."""
        self.oran = max(0.0, min(1.0, float(oran)))
        try:
            W = max(int(self.winfo_width()), 50)
            self.coords(self._dolgu, 0, 0, W * self.oran, self.YUKSEK)
            if guncelle:
                self.update_idletasks()
        except tk.TclError:
            pass


class _SekmeSeridi(ttk.Frame):
    """Notebook sekme başlıkları için yatay kaydırmalı şerit: sığmazsa ◀ ▶ düğmeleri ve fare tekerleği ile kaydırılır."""

    def __init__(self, ana, nb):
        super().__init__(ana)
        self.nb = nb
        self.sol = ttk.Button(self, text="◀", width=2, command=lambda: self._kay(-1))
        self.sag = ttk.Button(self, text="▶", width=2, command=lambda: self._kay(1))
        self.cv = tk.Canvas(self, height=34, highlightthickness=0)
        self.adim_btn = None
        self.ic = ttk.Frame(self.cv)
        self.cv.create_window((0, 0), window=self.ic, anchor="nw")
        self.ek = ttk.Frame(self)                                    # sağ uçta sabit düğmeler (parça paneli vb.)
        self.ek.pack(side="right", padx=(4, 0))
        self.cv.pack(side="left", fill="x", expand=True)
        self.dugme = {}
        self.cv.bind("<Configure>", lambda _e: self._tasma())
        for w in (self.cv, self.ic):
            for ev in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
                w.bind(ev, self._tekerlek, add="+")
        nb.bind("<<NotebookTabChanged>>", lambda _e: self._vurgula(), add="+")

    def yenile(self):
        for b in self.dugme.values():
            b.destroy()
        self.dugme = {}
        for t in self.nb.tabs():
            b = ttk.Button(self.ic, text=self.nb.tab(t, "text"), style="Sekme.TButton", takefocus=False,
                           command=lambda t=t: self.nb.select(t))
            b.pack(side="left", padx=(0, 2))
            for ev in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
                b.bind(ev, self._tekerlek, add="+")
            self.dugme[t] = b
        self.ic.update_idletasks()
        self.cv.configure(scrollregion=(0, 0, self.ic.winfo_reqwidth(), 34))
        self._vurgula()
        self._tasma()

    def _vurgula(self):
        try:
            sec = self.nb.select()
        except tk.TclError:
            return
        for t, b in self.dugme.items():
            b.configure(style="SekmeSec.TButton" if t == sec else "Sekme.TButton")
        b = self.dugme.get(sec)
        if b is not None:                                            # seçili sekme görünür alana getirilir
            self.ic.update_idletasks()
            toplam = max(1, self.ic.winfo_reqwidth())
            gor = max(1, self.cv.winfo_width())
            x0, x1 = b.winfo_x(), b.winfo_x() + b.winfo_reqwidth()
            sol = self.cv.canvasx(0)
            if x0 < sol:
                self.cv.xview_moveto(max(0.0, (x0 - 6) / toplam))
            elif x1 > sol + gor:
                self.cv.xview_moveto(min(1.0, (x1 - gor + 6) / toplam))

    def _tasma(self):
        taşar = self.ic.winfo_reqwidth() > self.cv.winfo_width() + 1
        if taşar and not self.sol.winfo_ismapped():
            self.sol.pack(side="left", before=self.cv)
            self.sag.pack(side="right", after=self.ek)
        elif not taşar and self.sol.winfo_ismapped():
            self.sol.pack_forget()
            self.sag.pack_forget()
            self.cv.xview_moveto(0)

    def _kay(self, yon):
        self.cv.xview_scroll(yon * 3, "units")

    def _tekerlek(self, e):
        if getattr(e, "num", 0) == 4:
            self._kay(-1)
        elif getattr(e, "num", 0) == 5:
            self._kay(1)
        else:
            self._kay(-1 if e.delta > 0 else 1)
        return "break"


# ---------------------------------------------------------------- girdi alanı şemaları
# Bir girdi alanına tıklanınca sağ panelde o değerin ne anlama geldiğini gösteren şematik çizim.
_SM = {"pr": ("#aab4bb", "#55606a"), "cam": ("#cfe6f2", "#5b97b5"), "pn": ("#e4d9c2", "#8a7a55"),
       "v": "#d0453b", "t": "#3d4851", "ax": "#7a858e"}


def _sm_r(cv, x1, y1, x2, y2, tur="pr", **kw):
    d, c = _SM[tur]
    cv.create_rectangle(x1, y1, x2, y2, fill=d, outline=c, **kw)


def _sm_ok(cv, x1, y1, x2, y2, txt="", yer="u"):
    cv.create_line(x1, y1, x2, y2, fill=_SM["v"], width=2, arrow="both", arrowshape=(6, 7, 3))
    if txt:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        dx, dy, an = {"u": (0, -6, "s"), "a": (0, 6, "n"), "s": (7, 0, "w"), "l": (-7, 0, "e")}[yer]
        cv.create_text(mx + dx, my + dy, text=txt, fill=_SM["v"], font=("Arial", 9, "bold"), anchor=an)


def _sm_t(cv, x, y, txt, an="center", renk=None, boy=8, kalin=False):
    cv.create_text(x, y, text=txt, fill=renk or _SM["t"], anchor=an, font=("Arial", boy, "bold" if kalin else "normal"))


def _sm_ax(cv, x1, y1, x2, y2):
    cv.create_line(x1, y1, x2, y2, fill=_SM["ax"], dash=(6, 3, 1, 3))


def _sm_mm(v):
    t = str(v or "").strip()
    return f"{t} mm" if t else "?"


def _sm_cam_payi(cv, v, **_):
    _sm_r(cv, 14, 14, 42, 108); _sm_r(cv, 194, 14, 222, 108); _sm_r(cv, 58, 20, 178, 102, "cam")
    _sm_ok(cv, 42, 61, 58, 61, _sm_mm(v), "u")
    _sm_t(cv, 118, 61, "cam", kalin=True)


def _sm_cam_payi_y(cv, v, **_):
    _sm_r(cv, 14, 14, 222, 38); _sm_r(cv, 14, 90, 222, 114); _sm_r(cv, 30, 54, 206, 74, "cam")
    _sm_ok(cv, 118, 38, 118, 54, _sm_mm(v), "s")
    _sm_t(cv, 70, 64, "cam", kalin=True)


def _sm_aks(cv, v, yatay=False, oturma=False, **_):
    """Profil kesiti: eksen, cam uçları (eksenin iki yanında), cam oturma payı."""
    e, pay = 14, 9
    if not yatay:                     # dikey profil kesiti: cam üstte, eksen düşey
        _sm_r(cv, 86, 70, 150, 116)
        _sm_ax(cv, 118, 8, 118, 122)
        _sm_r(cv, 20, 34, 118 - e, 70 + pay, "cam"); _sm_r(cv, 118 + e, 34, 216, 70 + pay, "cam")
        cv.create_line(60, 70, 176, 70, fill="#55606a", dash=(2, 2))
        if oturma:
            _sm_ok(cv, 60, 70, 60, 70 + pay, _sm_mm(v), "s")
        else:
            _sm_ok(cv, 118 - e, 50, 118, 50, "", "u"); _sm_ok(cv, 118, 50, 118 + e, 50, "", "u")
            _sm_t(cv, 118, 30, _sm_mm(v), "s", _SM["v"], 9, True)
    else:                             # yatay profil kesiti: cam sağda, eksen yatay
        _sm_r(cv, 20, 40, 84, 90)
        _sm_ax(cv, 8, 65, 226, 65)
        _sm_r(cv, 84 - pay, 10, 190, 65 - e, "cam"); _sm_r(cv, 84 - pay, 65 + e, 190, 120, "cam")
        cv.create_line(84, 8, 84, 122, fill="#55606a", dash=(2, 2))
        if oturma:
            _sm_ok(cv, 84 - pay, 126 - 8, 84, 126 - 8, _sm_mm(v), "u")
        else:
            _sm_ok(cv, 200, 65 - e, 200, 65, "", "s"); _sm_ok(cv, 200, 65, 200, 65 + e, "", "s")
            _sm_t(cv, 206, 65, _sm_mm(v), "w", _SM["v"], 9, True)


def _sm_cam_yapi(cv, v, pvb=None, **_):
    parts = [p.strip() for p in str(v or "").replace(",", ".").split("+") if p.strip()]
    nums = []
    for p in parts:
        try:
            nums.append(float(p))
        except ValueError:
            return
    if not nums or sum(nums) <= 0:
        return
    tot, W0, x = sum(nums), 190.0, 23.0
    for i, n in enumerate(nums):
        w = max(10.0, n / tot * W0)
        tur = "cam" if i % 2 == 0 else None
        if tur:
            _sm_r(cv, x, 34, x + w, 94, "cam")
        else:
            cv.create_rectangle(x, 34, x + w, 94, fill="white", outline="#7a858e", dash=(3, 2))
        _sm_t(cv, x + w / 2, 64, f"{n:g}", boy=9, kalin=True)
        _sm_t(cv, x + w / 2, 104, "cam" if tur else "hava", boy=8)
        x += w
    _sm_ok(cv, 23, 22, 213, 22, f"{tot:g} mm", "u")
    _sm_t(cv, 118, 120, "dıştan içe; hava aralığı kesikli", boy=8)


def _sm_pvb(cv, v, **_):
    _sm_r(cv, 60, 30, 106, 100, "cam"); _sm_r(cv, 132, 30, 178, 100, "cam")
    cv.create_rectangle(106, 30, 132, 100, fill="#f1d27a", outline="#b8962e")
    _sm_ok(cv, 106, 18, 132, 18, _sm_mm(v), "u")
    _sm_t(cv, 119, 65, "PVB", kalin=True)
    _sm_t(cv, 83, 65, "cam"); _sm_t(cv, 155, 65, "cam")
    _sm_t(cv, 118, 116, "lamine camda ara film", boy=8)


def _sm_cols(cv, v, **_):
    for i, x in enumerate((30, 90, 150, 206)):
        cv.create_line(x, 16, x, 108, fill="#55606a", width=3)
        cv.create_oval(x - 8, 2, x + 8, 18, outline="#d0453b")
        _sm_t(cv, x, 10, str(i + 1), boy=8)
    _sm_ok(cv, 30, 80, 90, 80, str(v or "?").split(";")[0].split("x")[-1] + " mm", "u")
    _sm_t(cv, 118, 120, "aks aralıkları, soldan sağa", boy=8)


def _sm_rows(cv, v, **_):
    for i, y in enumerate((14, 52, 90)):
        cv.create_line(20, y, 216, y, fill="#55606a", width=3)
    _sm_ok(cv, 60, 14, 60, 52, str(v or "?").split(";")[0].split("x")[-1] + " mm", "s")
    _sm_t(cv, 118, 120, "kat yükseklikleri, üstten alta", boy=8)


def _sm_cubuk(cv, v, **_):
    _sm_r(cv, 20, 40, 216, 64)
    _sm_ok(cv, 20, 80, 216, 80, _sm_mm(v), "a")
    _sm_t(cv, 118, 52, "stok çubuk", kalin=True)


def _sm_testere(cv, v, **_):
    _sm_r(cv, 20, 40, 106, 64); _sm_r(cv, 124, 40, 216, 64)
    _sm_ok(cv, 106, 52, 124, 52, "", "u")
    _sm_t(cv, 115, 36, _sm_mm(v), "s", _SM["v"], 9, True)
    _sm_t(cv, 118, 100, "her kesimde bu kadar malzeme kaybolur", boy=8)


def _sm_siparis(cv, v, **_):
    for i in range(3):
        _sm_r(cv, 20, 20 + i * 24, 150, 38 + i * 24)
    for i in range(3, 4):
        cv.create_rectangle(20, 20 + i * 24, 150, 38 + i * 24, fill="white", outline=_SM["v"], dash=(4, 2))
    _sm_t(cv, 160, 20 + 3 * 24 + 9, "+ %" + (str(v).strip() or "?") + " ek çubuk", "w", _SM["v"], 9, True)
    _sm_t(cv, 118, 120, "net adedin üstüne eklenen pay", boy=8)


def _sm_dik_alt(cv, v, ust=False, **_):
    cv.create_line(14, 40, 222, 40, fill="#7a858e", dash=(4, 3)); cv.create_line(14, 90, 222, 90, fill="#7a858e", dash=(4, 3))
    _sm_t(cv, 18, 36, "kat (aks) hattı", "sw", boy=7); _sm_t(cv, 18, 94, "kat (aks) hattı", "nw", boy=7)
    _sm_r(cv, 100, 22, 136, 108)
    if ust:
        _sm_ok(cv, 150, 22, 150, 40, _sm_mm(v), "s")
    else:
        _sm_ok(cv, 150, 90, 150, 108, _sm_mm(v), "s")
    _sm_t(cv, 118, 66, "dikey", kalin=True)


def _sm_dilat(cv, v, **_):
    _sm_r(cv, 100, 8, 136, 54); _sm_r(cv, 100, 68, 136, 114)
    _sm_ok(cv, 150, 54, 150, 68, _sm_mm(v), "s")
    _sm_t(cv, 118, 31, "dikey", kalin=True); _sm_t(cv, 118, 91, "dikey", kalin=True)
    _sm_t(cv, 118, 124, "kat birleşiminde boşluk", boy=8)


def _sm_ankraj(cv, v, **_):
    _sm_r(cv, 100, 8, 136, 116)
    for y in (24, 72, 108):
        cv.create_polygon(136, y, 160, y - 8, 160, y + 8, fill="#7a858e", outline="#55606a")
    _sm_ok(cv, 176, 24, 176, 72, _sm_mm(v), "s")
    _sm_t(cv, 118, 52, "dikme", kalin=True)


def _sm_ruzgar(cv, v, **_):
    _sm_r(cv, 120, 12, 136, 108); _sm_r(cv, 136, 12, 154, 108, "cam")
    for y in (26, 50, 74, 98):
        cv.create_line(30, y, 116, y, fill=_SM["v"], width=2, arrow="last", arrowshape=(8, 9, 4))
    _sm_t(cv, 30, 8, "rüzgar W = " + ((str(v).strip() or "?") + " kN/m²"), "w", _SM["v"], 9, True)


def _sm_cam_boy(cv, v, **_):
    _sm_r(cv, 60, 20, 176, 96, "cam")
    _sm_ok(cv, 190, 20, 190, 96, _sm_mm(v), "s")


def _sm_cam_en(cv, v, **_):
    _sm_r(cv, 60, 20, 176, 96, "cam")
    _sm_ok(cv, 60, 108, 176, 108, _sm_mm(v), "a")


def _sm_cam_kg(cv, v, **_):
    _sm_r(cv, 70, 24, 166, 100, "cam")
    _sm_t(cv, 118, 62, "1 m²", kalin=True)
    _sm_t(cv, 118, 112, "kg/m² → " + ((str(v).strip() or "otomatik") + ("" if not str(v).strip() else " kg/m²")), boy=9, kalin=True,
          renk=_SM["v"])


def _sm_panel_kal(cv, v, **_):
    _sm_r(cv, 100, 14, 134, 106, "pn")
    _sm_ok(cv, 100, 114, 134, 114, _sm_mm(v), "u")
    _sm_t(cv, 148, 60, "panel", "w", boy=9)


def _sm_dT(cv, v, **_):
    _sm_r(cv, 24, 50, 160, 74)
    cv.create_rectangle(160, 50, 190, 74, fill="white", outline=_SM["v"], dash=(4, 2))
    _sm_ok(cv, 160, 90, 190, 90, "ΔL", "a")
    _sm_t(cv, 118, 30, "ΔT = " + ((str(v).strip() or "?") + " K"), boy=9, kalin=True, renk=_SM["v"])
    _sm_t(cv, 118, 120, "profil boyunun değişimi", boy=8)


def _sm_drift(cv, v, **_):
    _sm_r(cv, 40, 70, 196, 82); _sm_r(cv, 60, 14, 216, 26)
    cv.create_line(40, 70, 40, 82, fill="#55606a")
    _sm_ok(cv, 40, 98, 60, 98, "", "a")
    _sm_t(cv, 70, 98, _sm_mm(v), "w", _SM["v"], 9, True)
    _sm_t(cv, 118, 50, "iki kat arası yatay öteleme", boy=8)


# anahtar -> (başlık, açıklama, çizici, ek parametre)
SEMA = {
    "cam_yapi": ("Cam yapısı", "Katman kalınlıkları dıştan içe, + ile ayrılır: 6+20+6 = cam + hava + cam.", _sm_cam_yapi, {}),
    "pvb": ("PVB kalınlığı", "Lamine camlarda iki cam arasındaki film kalınlığı; toplam kalınlığa eklenir.", _sm_pvb, {}),
    "cam_payi": ("Cam payı — dikey yan", "Camın dikey profile bakan kenarındaki pay (cephe görünüşü).", _sm_cam_payi, {}),
    "cam_payi_y": ("Cam payı — yatay", "Camın yatay profile bakan kenarındaki pay; boşsa dikey değer kullanılır.", _sm_cam_payi_y, {}),
    "cam_aks_d": ("Cam–aks mesafesi — dikey", "Camın ucu ile dikey profil ekseni arası. Cam eni = aks aralığı − 2 × bu değer.",
                  _sm_aks, {}),
    "cam_aks_y": ("Cam–aks mesafesi — yatay", "Camın ucu ile yatay profil ekseni arası. Cam boyu = bölge yüksekliği − 2 × bu değer.",
                  _sm_aks, {"yatay": True}),
    "cam_oturma": ("Cam oturma payı", "Camın profil yüzünden içeriye oturan kısmı. Boşsa sistem ayarı (varsayılan 6,4 mm) kullanılır.",
                   _sm_aks, {"oturma": True}),
    "cols": ("Aks aralıkları", "Dikey aksların birbirine uzaklığı. Örnek: 5x1200; 1500 → 5 adet 1200 mm, sonra 1500 mm.", _sm_cols, {}),
    "rows": ("Kat yükseklikleri", "Yatay hatlar arası kat yüksekliği. Örnek: 3x3000 → 3 kat, her biri 3000 mm.", _sm_rows, {}),
    "cubuk": ("Stok çubuk boyu", "Profil çubuklarının tedarik boyu; kesim planı bu boydan yapılır.", _sm_cubuk, {}),
    "testere": ("Testere payı", "Her kesimde testere kalınlığı kadar malzeme kaybolur; çubuk planında hesaba katılır.", _sm_testere, {}),
    "siparis_ek": ("Sipariş eki", "Net çubuk adedinin üstüne yüzde olarak eklenen sipariş payı.", _sm_siparis, {}),
    "dikey_alt": ("Dikey alt uzantı", "Dikey profilin kat (aks) hattının altına taşan boyu.", _sm_dik_alt, {}),
    "dikey_ust": ("Dikey üst uzantı", "Dikey profilin kat (aks) hattının üstüne taşan boyu.", _sm_dik_alt, {"ust": True}),
    "dilatasyon": ("Dilatasyon", "Dikey profillerin kat birleşiminde bırakılan boşluk; kesim boyları buna göre kısalır.", _sm_dilat, {}),
    "ankraj_mm": ("Ankraj aralığı", "Dikmenin ankrajlandığı noktalar arası mesafe (boşsa kat yüksekliği).", _sm_ankraj, {}),
    "ruzgar_kn": ("Rüzgar yükü", "Cepheye dik etkiyen tasarım rüzgar basıncı; statik ön hesabın girdisidir.", _sm_ruzgar, {}),
    "cam_max_boy": ("Azami cam boyu", "Üreticinin üretebildiği en büyük cam boyu; aşan camlar uyarılır.", _sm_cam_boy, {}),
    "cam_max_en": ("Azami cam eni", "Üreticinin üretebildiği en büyük cam eni; aşan camlar uyarılır.", _sm_cam_en, {}),
    "cam_kg": ("Cam ağırlığı", "1 m² camın ağırlığı; boşsa cam yapısından otomatik hesaplanır.", _sm_cam_kg, {}),
    "pn_sandvic_kal": ("Sandviç panel kalınlığı", "Opak sandviç panelin toplam kalınlığı.", _sm_panel_kal, {}),
    "pn_levha_kal": ("Levha kalınlığı", "Opak levha panelin kalınlığı.", _sm_panel_kal, {}),
    "dT": ("Sıcaklık farkı ΔT", "Isıl genleşme hesabında kullanılan sıcaklık değişimi (ΔL = α·L·ΔT).", _sm_dT, {}),
    "drift": ("Kat arası ötelenme", "Depremde/yükte iki kat arası yatay öteleme; boşsa kat yüksekliği/500.", _sm_drift, {}),
}


class Uygulama(tk.Tk):
    ARKA = "#f4f5f3"
    etkilesim = True      # PDF vekilinde False: fare ipuçları yazılmaz

    def __init__(self):
        super().__init__()
        self._acilis, self._acilis_hazir = None, False
        try:                                        # CEPHEX açılış ekranı (ana pencere hazır olana dek gizli)
            self.withdraw()
            self._acilis = _Acilis(self)
        except Exception:
            self._acilis = None
        self.ek_malzeme = []                        # elle eklenen malzemeler (projeyle kaydedilir)
        self.stoklar = [dict(e) for e in (genel_ayar("cubuk_stok") or []) if isinstance(e, dict) and e.get("boy")]
        self._vur = {"cephe": [], "kesit": []}      # çizimde kaydedilen detaylar: fareyle parça seçimi için
        self._secili = None
        self._hv_son = None
        self._bas_xy = None
        self._aks_d = self._aks_h = None
        self.title("Cephe Metraj")
        self.protocol("WM_DELETE_WINDOW", self._kapat)
        self.after(1500, self._kayit_isaretle)
        self.geometry("1500x800")
        self.minsize(1180, 620)
        self.tema = "koyu" if genel_ayar("tema") == "koyu" else "acik"
        self.configure(bg=self.ARKA)
        self.sonuc = None
        self.v = {}
        self.katalog = []
        self.katalog_yol = ""
        self.proje_yolu = ""
        self.kesit = {"dikey": None, "yatay": None}
        self.detay = {"dikey": None, "yatay": None}
        self.parca = {"dikey": None, "yatay": None}
        self.parca_kat = {}
        self.bariyerler = bariyer_varsayilan()
        self.cam_tablo = []
        self.kurallar = []
        self.detay_kaynak = {}
        self._kural_kal = None
        self._kural_not = ""
        self._kesit_not = {}
        self._etiket = {}
        self.model = {"ek": [], "tip": [], "ytip": [], "hucre": {}, "dik_yok": set(), "yat_yok": set(), "yalanci": set(), "dik_gecis": set(), "dik_orta": set(), "kayma": {}, "zincir_hat": {},
                      "dtip": "", "dik_tip": {}, "yat_tip": {}, "parca_cikar": {}, "parca_grup": {}, "takoz_hat": {}, "ilerleme": set()}
        self.cephe_tipleri = []
        self.yatay_tipleri = list(YATAY_TIP_VARSAYILAN)
        self.dikey_tipleri = list(YATAY_TIP_VARSAYILAN)
        self._sec = set()                 # Ctrl ile seçilen cephe öğeleri: ("z",kat,bölge,aks) ("d",aks,kat) ("y",kat,hat,aralık)
        self._e_cols, self._e_rows, self._e_ek, self._e_tip = [], [], [], []
        self._stil()
        self._arayuz()
        if self._acilis is None:
            self._acilis_bitti()
        else:
            self._acilis.t0 = time.time()           # animasyon, arayüz hazır olduktan sonra tam süre oynar
        self._tema_uygula()
        self._otomatik_katalog()
        self.hesapla()

    def _renk_t(self, anahtar):
        return TEMALAR[self.tema][anahtar]

    def _acilis_bitti(self):
        """Açılış ekranı kapandığında ana pencereyi tam ekran gösterir."""
        if self._acilis_hazir:
            return
        self._acilis_hazir = True
        try:
            self.deiconify()
            _tam_ekran(self)
            self.lift()
            self.focus_force()
        except tk.TclError:
            pass

    def _tema_uygula(self):
        """Seçili temayı (açık / koyu) ttk stillerine, tk bileşenlerine ve çizimlere uygular."""
        t = TEMALAR[self.tema]
        st = ttk.Style(self)
        st.configure(".", background=t["arka"], foreground=t["yazi"], fieldbackground=t["alan"],
                     bordercolor=t["cizgi"], troughcolor=t["cizgi"], selectbackground=t["sec"],
                     selectforeground=t["sec_yazi"], insertcolor=t["yazi"], lightcolor=t["dugme"], darkcolor=t["cizgi"])
        st.configure("TFrame", background=t["arka"])
        st.configure("Bilgi.TFrame", background=t["baslik"])
        st.configure("Bilgi.TLabel", background=t["baslik"], foreground=t["soluk"], font=("Segoe UI", 9))
        if getattr(self, "_bilgi_cv", None) is not None:
            self._bilgi_cv.tema(t["baslik"], t["soluk"], "#555d65" if self.tema == "koyu" else "#c4cbd1")
        st.configure("TLabel", background=t["arka"], foreground=t["yazi"])
        st.configure("TLabelframe", background=t["arka"], bordercolor=t["cizgi"])
        st.configure("TLabelframe.Label", background=t["arka"], foreground=t["yazi"])
        st.configure("TButton", background=t["dugme"], foreground=t["yazi"], bordercolor=t["cizgi"], focuscolor=t["dugme"])
        st.map("TButton", background=[("active", t["dugme_ust"]), ("pressed", t["dugme_ust"])])
        st.configure("TEntry", fieldbackground=t["alan"], foreground=t["yazi"], insertcolor=t["yazi"])
        st.configure("TCombobox", fieldbackground=t["alan"], background=t["dugme"], foreground=t["yazi"],
                     arrowcolor=t["yazi"], insertcolor=t["yazi"])
        st.map("TCombobox", fieldbackground=[("readonly", t["alan"]), ("disabled", t["arka"])],
               foreground=[("readonly", t["yazi"]), ("disabled", t["soluk"])],
               selectbackground=[("readonly", t["alan"])], selectforeground=[("readonly", t["yazi"])])
        st.configure("Treeview", background=t["alan"], fieldbackground=t["alan"], foreground=t["yazi"])
        st.map("Treeview", background=[("selected", t["sec"])], foreground=[("selected", t["sec_yazi"])])
        st.configure("Treeview.Heading", background=t["baslik"], foreground=t["yazi"], bordercolor=t["cizgi"])
        st.map("Treeview.Heading", background=[("active", t["dugme_ust"])])
        st.configure("Sekme.TButton", background=t["dugme"], foreground=t["yazi"], bordercolor=t["cizgi"])
        st.configure("SekmeSec.TButton", background=t["alan"], foreground=t["yazi"], bordercolor=t["sec"])
        st.map("Sekme.TButton", background=[("active", t["dugme_ust"])])
        st.map("SekmeSec.TButton", background=[("active", t["alan"])])
        st.configure("TNotebook", background=t["arka"], bordercolor=t["cizgi"])
        st.configure("TNotebook.Tab", background=t["dugme"], foreground=t["yazi"])
        st.map("TNotebook.Tab", background=[("selected", t["alan"])], foreground=[("selected", t["yazi"])])
        st.configure("TScrollbar", background=t["dugme"], troughcolor=t["arka"], bordercolor=t["cizgi"], arrowcolor=t["yazi"])
        for ad in ("TCheckbutton", "TRadiobutton"):
            st.configure(ad, background=t["arka"], foreground=t["yazi"])
            st.map(ad, background=[("active", t["arka"])], foreground=[("disabled", t["soluk"])])
        for kal, deger in (("*TCombobox*Listbox.background", t["alan"]), ("*TCombobox*Listbox.foreground", t["yazi"]),
                           ("*TCombobox*Listbox.selectBackground", t["sec"]), ("*TCombobox*Listbox.selectForeground", t["sec_yazi"]),
                           ("*Text.background", t["alan"]), ("*Text.foreground", t["yazi"]),
                           ("*Text.insertBackground", t["yazi"]), ("*Listbox.background", t["alan"]),
                           ("*Listbox.foreground", t["yazi"]), ("*Menu.background", t["alan"]), ("*Menu.foreground", t["yazi"]),
                           ("*Menu.activeBackground", t["sec"]), ("*Menu.activeForeground", t["sec_yazi"])):
            self.option_add(kal, deger)
        self.configure(bg=t["arka"])
        self._tk_boya(self)
        try:
            self._statik_ciz()
        except Exception:
            pass
        if hasattr(self, "_kr_tr2"):
            self._kr_tr2.tag_configure("kural", background=t["kural"])
        if hasattr(self, "_btn_tema"):
            self._btn_tema.config(text="Açık tema" if self.tema == "koyu" else "Koyu tema")
        if self.sonuc:
            self.ciz()
            self.ciz_kesit()

    def _tk_boya(self, w):
        t = TEMALAR[self.tema]
        for c in w.winfo_children():
            sinif = c.winfo_class()
            try:
                if sinif in ("Text", "Listbox"):
                    c.configure(bg=t["alan"], fg=t["yazi"], selectbackground=t["sec"], selectforeground=t["sec_yazi"])
                    if sinif == "Text":
                        c.configure(insertbackground=t["yazi"])
                elif sinif == "Canvas":
                    if c is getattr(self, "cv", None) or c is getattr(self, "cv_kesit", None):
                        c.configure(bg=koyu_renk(c, "white") if self.tema == "koyu" else "white")
                    else:
                        c.configure(bg=t["arka"])
                elif sinif == "Panedwindow":
                    c.configure(bg=t["cizgi"])
                elif sinif == "Toplevel":
                    c.configure(bg=t["arka"])
            except tk.TclError:
                pass
            self._tk_boya(c)

    # ------------------------------------------------ komut satırı ve işlem günlüğü
    def _konsol_kur(self, ust):
        fr = ttk.LabelFrame(ust, text=" Komut satırı / işlem günlüğü ", padding=4)
        if hasattr(ust, "panes"):                      # bölmeli pencere: kenarından sürüklenip boyutu ayarlanır
            ust.add(fr, minsize=90, stretch="never")
        else:
            fr.pack(side="bottom", fill="x", pady=(6, 0))
        kt = ttk.Frame(fr)
        kt.pack(fill="both", expand=True)
        self._log_txt = tk.Text(kt, height=7, wrap="word", state="disabled", font=("Consolas", 9), relief="flat")
        sb = ttk.Scrollbar(kt, orient="vertical", command=self._log_txt.yview)
        self._log_txt.configure(yscrollcommand=sb.set)
        self._log_txt.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        self._log_txt.tag_configure("zaman", foreground="#8a949c")
        self._log_txt.tag_configure("komut", foreground="#1f6feb")
        self._log_txt.tag_configure("hata", foreground="#d1242f")
        self._log_txt.tag_configure("uyari", foreground="#b8860b")
        kb = ttk.Frame(fr)
        kb.pack(side="bottom", fill="x", pady=(4, 0), before=kt)
        ttk.Label(kb, text="›").pack(side="left")
        self._kom_v = tk.StringVar()
        e = ttk.Entry(kb, textvariable=self._kom_v)
        e.pack(side="left", fill="x", expand=True, padx=4)
        self._kom_gecmis, self._kom_i = [], 0
        e.bind("<Return>", self._kom_calistir)
        e.bind("<Up>", lambda _e: self._kom_gez(-1))
        e.bind("<Down>", lambda _e: self._kom_gez(1))
        ttk.Button(kb, text="Betik...", width=8, command=lambda: self._komut("betik")).pack(side="left", padx=(0, 4))
        ttk.Button(kb, text="Yardım", width=8, command=lambda: self._komut("yardim")).pack(side="left")
        ttk.Button(kb, text="Temizle", width=8, command=lambda: self._komut("temizle")).pack(side="left", padx=(4, 0))
        self._log("Program hazır. Komutlar için 'yardim' yazın; yapılan işlemler burada listelenir.")

    BILGI_VARSAYILAN = ("Ölçüler mm   |   Tekerlek: yakınlaştır   |   Sürükle: kaydır   |   Çift tık: sıfırla   |   "
                        "Ctrl+tık / Ctrl+sürükle: çoklu seçim   |   Esc: seçimi temizle")

    def _bilgi_goster(self):
        l_ = getattr(self, "_bilgi_lbl", None)
        if l_ is None:
            return
        m = getattr(self, "_bilgi_gecici", "") or getattr(self, "_bilgi_hov", "") or self.BILGI_VARSAYILAN
        try:
            l_.configure(text=m)
        except tk.TclError:
            pass

    def _bilgi_yaz(self, msg="", sn=8):
        """Üstteki bilgi çubuğuna geçici mesaj yazar (sn saniye); sonra fare altındaki bilgiye / ipuçlarına döner."""
        try:
            if getattr(self, "_bilgi_id", None):
                self.after_cancel(self._bilgi_id)
                self._bilgi_id = None
            self._bilgi_gecici = (str(msg).splitlines() or [""])[0] if msg else ""
            self._bilgi_goster()
            if msg:
                self._bilgi_id = self.after(int(sn * 1000), self._bilgi_yaz)
        except tk.TclError:
            pass

    def _bilgi_hover(self, m=""):
        """Fare altındaki parça / hat bilgisi (geçici mesaj yoksa çubukta görünür)."""
        if m != getattr(self, "_bilgi_hov", ""):
            self._bilgi_hov = m
            self._bilgi_goster()

    def _uyari_listesi(self):
        s = self.sonuc or {}
        u = list(s.get("cubuk_uyari") or [])
        if s.get("cam_secim_uyari"):
            u.append("Cam: " + str(s["cam_secim_uyari"]))
        if s.get("takoz_not") and "yok" in str(s["takoz_not"]).lower():
            u.append(str(s["takoz_not"]))
        an = s.get("analiz") or {}
        for ad, k in (("Dikey", an.get("dikey")), ("Yatay", an.get("yatay"))):
            if k and not (k.get("ok_g") and k.get("ok_d")):
                u.append(f"Statik: {ad} profil " + ("gerilme" if not k.get("ok_g") else "sehim") + " sınırı aşıyor")
        try:
            prm = hesap_prm({k: v.get() for k, v in self.v.items()})
            for sv, kat, m in on_kontrol(s, prm):
                if sv == "hata" and kat in ("Cam", "Ankraj", "Isıl"):
                    u.append(f"{kat}: {m}")
        except Exception:
            pass
        return u

    def _uyari_goster(self):
        """Özet alanındaki ⚠ sayısına tıklayınca uyarılar sırayla bilgi çubuğunda gösterilir."""
        u = self._uyari_listesi()
        if not u:
            self._bilgi_yaz("Uyarı yok", 3)
            return
        k = getattr(self, "_uyari_k", 0) % len(u)
        self._uyari_k = k + 1
        self._bilgi_yaz(f"⚠ ({k + 1}/{len(u)}) {u[k]}", 10)

    def _bilgi_koordinat(self, e):
        """Cephe görünüşünde imlecin model koordinatı (mm) + hangi aks aralığı / kat içinde olduğu."""
        l_ = getattr(self, "_bilgi_koor", None)
        s = self.sonuc or {}
        cols, rows = s.get("cols"), s.get("rows")
        if l_ is None or not cols or not rows or not getattr(self.gor, "fit", None):
            return
        try:
            kx, ky = self._kayma("cephe")
            ox, oy, sc = self.gor.donustur()
            x = (e.x - kx - ox) / sc
            y = (oy - (e.y - ky)) / sc
            TW, TH = float(sum(cols)), float(sum(rows))
            if genel_ayar("cephe_ayna"):
                x = TW - x
            if not (-500 <= x <= TW + 500 and -500 <= y <= TH + 500):
                l_.configure(text="")
                return
            cx = [0.0]
            for c_ in cols:
                cx.append(cx[-1] + c_)
            cy = [0.0]
            for r_ in rows:
                cy.append(cy[-1] + r_)
            i = min(max(sum(1 for v in cx[1:] if x > v), 0), len(cols) - 1)
            j = min(max(sum(1 for v in cy[1:] if y > v), 0), len(rows) - 1)
            l_.configure(text=f"X {x:.0f}  Y {y:.0f} mm   ·   {i + 1}–{i + 2}. aks   ·   {j + 1}. kat")
        except (ValueError, ZeroDivisionError, TypeError, KeyError, AttributeError):
            pass

    def _cam_alani(self):
        """Görünüşteki cam toplamı: (m², adet); boş ve spandrel bölgeler sayılmaz."""
        s = self.sonuc or {}
        cols, bol = s.get("cols") or [], s.get("bolgeler") or []
        vw, hw = float(s.get("vw") or 0), float(s.get("hw") or 0)
        m2, n = 0.0, 0
        for g_ in s.get("cam_gruplari") or []:
            if g_.get("tip") != "cam":
                continue
            w = sum(cols[g_["i0"]:g_["i1"] + 1]) - vw
            h = bol[g_["z1"]]["y1"] - bol[g_["z0"]]["y0"] - hw
            if w > 0 and h > 0:
                m2 += w * h / 1e6
                n += 1
        return m2, n

    def _adim(self, baslik, ayrinti=""):
        """Hesap adımı kaydı: başlık + ayrıntı satırları; geçen süre ile birlikte 'Hesap adımları' penceresinde gösterilir."""
        try:
            t0 = getattr(self, "_adim_t0", None) or time.time()
            self._adimlar.append((time.time() - t0, str(baslik), str(ayrinti or "")))
        except AttributeError:
            pass

    def _adim_metni(self):
        """Son hesabın adımlarını düz metin (not defteri) olarak üretir."""
        s = getattr(self, "sonuc", None)
        k = getattr(self, "_adimlar", None) or []
        if not k and not s:
            return "Henüz hesap yapılmadı. Önce 'Hesapla' düğmesine basın."
        ln = ["CEPHE METRAJ — HESAP ADIMLARI", "=" * 60,
              "Zaman: " + datetime.datetime.now().strftime("%d.%m.%Y %H:%M:%S"), ""]
        for no, (dt, b, a) in enumerate(k, 1):
            ln.append(f"{no:>2}. {b}   [{dt:5.2f} sn]")
            for x in a.splitlines():
                ln.append("      " + x)
            ln.append("")
        an = (s or {}).get("analiz")
        if an:
            ln += ["-" * 60, "STATİK ÖN HESAP — adım adım", "-" * 60]
            ln += [f"Rüzgar W = {an['kn']:.2f} kN/m²  →  {an['kgm2']:.1f} kg/m²   (W[kg/m²] = kN/m² × 1000 / 9.80665)",
                   f"Cam ağırlığı G = {an['G']:.1f} kg/m²",
                   f"Kombinasyon: {KOMB_G:g}·G + {KOMB_W:g}·W (Eurocode)",
                   f"İzinli gerilme σ_RD = f0 / γm = {an['f0']:g} / {GAMA_M:g} = {an['sig_rd']:.1f} kg/cm²", ""]
            d = an.get("dikey")
            if d:
                ln += [f"DİKEY PROFİL  ({d['sema_ad']}; kesit değerleri: {d['kaynak']})",
                       f"  Yük genişliği (tw) = {d['tw']:.1f} cm;  mesnet aralığı L = {d['L']:.1f} cm",
                       f"  Çizgisel rüzgar yükü w = q·tw = {d['w']:.4f} kg/cm",
                       f"  M = {KOMB_W:g}·{d['mc']:.4f}·w·L² = {d['M3']:.0f} kgcm",
                       f"  N = {KOMB_G:g}·G·tw·L (cam ağırlığı) = {d['N']:.1f} kg",
                       f"  Wx = {d['Wx']:.2f} cm³;  A = {d['A']:.2f} cm²;  Jxx = {d['I']:.1f} cm⁴",
                       f"  σ = M/Wx + N/A = {d['sig']:.0f} kg/cm²   (sınır {d['sig_rd']:.0f})  →  "
                       + ("OK" if d["ok_g"] else "YETERSİZ"),
                       f"  Sehim = {d['dc']:.4f}·w·L⁴ / (E·J) = {d['d']:.2f} cm   (sınır {d['dl']:.2f})  →  "
                       + ("OK" if d["ok_d"] else "YETERSİZ")]
                if not d["ok_d"]:
                    ln.append(f"  Gereken Jxx ≥ {d['Ireq']:.0f} cm⁴ (mevcut {d['I']:.0f})")
                ln.append(f"  Mesnet tepkisi: rüzgar {d['Rw']:.0f} kg, cam ağırlığı {d['Rg']:.0f} kg")
                ln.append("")
            y = an.get("yatay")
            if y:
                ln += [f"YATAY PROFİL  (kesit değerleri: {y['kaynak']})",
                       f"  Yük yüksekliği (tr) = {y['tr']:.1f} cm;  açıklık L = {y['L']:.1f} cm",
                       f"  w = q·tr = {y['w']:.4f} kg/cm;  M₃ = {KOMB_W:g}·w·L²/8 = {y['M3']:.0f} kgcm",
                       f"  Cam takozu P = {an['takoz']['P']:.1f} kg;  M₂ = {KOMB_G:g}·P·L/4 = {y['M2']:.0f} kgcm",
                       f"  σ = M₃/Wx + M₂/Wy = {y['sig']:.0f} kg/cm²   (sınır {y['sig_rd']:.0f})  →  "
                       + ("OK" if y["ok_g"] else "YETERSİZ"),
                       f"  Sehim (kuvvetli) = 5wL⁴/(384EJ) = {y['d_k']:.2f} cm   (sınır L/200 = {y['dl_k']:.2f})",
                       f"  Sehim (zayıf, cam ağırlığı) = {y['d_z']:.2f} cm   (sınır {y['dl_z']:.2f})  →  "
                       + ("OK" if y["ok_d"] else "YETERSİZ"), ""]
        return "\n".join(ln)

    def _adimlar_goster(self):
        """Hesap adımlarını not defteri benzeri bir pencerede gösterir (kaydet / kopyala / yenile)."""
        pen = getattr(self, "_adim_pen", None)
        try:
            if pen is not None and pen.winfo_exists():
                pen.deiconify()
                pen.lift()
                self._adim_yaz()
                return
        except tk.TclError:
            pass
        pen = tk.Toplevel(self)
        self._adim_pen = pen
        pen.title("Hesap adımları — Not defteri")
        pen.geometry("780x620")
        bar = ttk.Frame(pen)
        bar.pack(fill="x", padx=6, pady=6)
        ttk.Button(bar, text="Yeniden hesapla", command=lambda: (self.hesapla(), self._adim_yaz())).pack(side="left")
        ttk.Button(bar, text="Kopyala", command=self._adim_kopyala).pack(side="left", padx=4)
        ttk.Button(bar, text="Kaydet (.txt)...", command=self._adim_kaydet).pack(side="left")
        gv = ttk.Frame(pen)
        gv.pack(fill="both", expand=True, padx=6, pady=(0, 6))
        sc = ttk.Scrollbar(gv, orient="vertical")
        self._adim_txt = tk.Text(gv, font=("Consolas", 10), wrap="word", padx=10, pady=8, relief="solid", bd=1,
                                 yscrollcommand=sc.set, bg="#fffef7", fg="#222222")
        sc.config(command=self._adim_txt.yview)
        sc.pack(side="right", fill="y")
        self._adim_txt.pack(side="left", fill="both", expand=True)
        self._adim_yaz()

    def _adim_yaz(self):
        t = getattr(self, "_adim_txt", None)
        if t is None:
            return
        try:
            t.configure(state="normal")
            t.delete("1.0", "end")
            t.insert("1.0", self._adim_metni())
            t.configure(state="normal")
        except tk.TclError:
            pass

    def _adim_kopyala(self):
        try:
            self.clipboard_clear()
            self.clipboard_append(self._adim_txt.get("1.0", "end-1c"))
            self._log("Hesap adımları panoya kopyalandı")
        except Exception:
            pass

    def _adim_kaydet(self):
        yol = filedialog.asksaveasfilename(defaultextension=".txt", initialfile="hesap_adimlari.txt",
                                           filetypes=[("Metin", "*.txt")])
        if not yol:
            return
        try:
            with open(yol, "w", encoding="utf-8") as f:
                f.write(self._adim_txt.get("1.0", "end-1c"))
            self._log(f"Hesap adımları kaydedildi: {os.path.basename(yol)}")
        except OSError as e:
            messagebox.showerror("Kaydedilemedi", str(e))

    def _ilerle(self, oran):
        """Bilgi çubuğunun tamamını %100 sayıp hesap ilerlemesini gri dolguyla gösterir (0..1)."""
        cv = getattr(self, "_bilgi_cv", None)
        if cv is not None:
            a_, b_ = getattr(self, "_il_ab", (0.0, 1.0))
            cv.ilerleme(a_ + (b_ - a_) * max(0.0, min(1.0, oran)))

    def _ilerle_bitir(self):
        cv = getattr(self, "_bilgi_cv", None)
        if cv is None:
            return
        self._il_ab = (0.0, 1.0)
        cv.ilerleme(1.0)
        try:
            self.after(350, lambda: cv.ilerleme(0.0))
        except tk.TclError:
            cv.ilerleme(0.0)

    def _bilgi_ozet_yaz(self):
        """Çubuğun sağı: proje özeti, seçili aks/hat/parça, yakınlaştırma, uyarı sayısı."""
        l_ = getattr(self, "_bilgi_ozet", None)
        if l_ is None:
            return
        s = self.sonuc or {}
        p = []
        o = s.get("ozet")
        if o:
            try:
                p.append(f"{o['aks']} aks · {o['kat']} kat · {o['modul']} modül")
                p.append(f"{o['olcu'][0] / 1000:.2f}×{o['olcu'][1] / 1000:.2f} m")
                p.append(f"{s['agirlik']['alu_toplam_kg']:.0f} kg alu")
                m2, n_c = self._cam_alani()
                if n_c:
                    p.append(f"cam {m2:.1f} m² ({n_c} adet)")
            except (KeyError, TypeError, IndexError):
                pass
        sec = []
        d, h = getattr(self, "_aks_d", None), getattr(self, "_aks_h", None)
        hid = list(s.get("hat_id") or [])
        if d is not None:
            sec.append(f"{d + 1}. aks")
        if h is not None and h < len(hid):
            sec.append(f"{hat_adi(hid[h])} hattı")
        if getattr(self, "_bilgi_parca", ""):
            sec.append(self._bilgi_parca)
        if sec:
            p.append("Seçili: " + " · ".join(sec))
        try:
            p.append(f"%{self.gor.z * 100:.0f}")
        except AttributeError:
            pass
        n = len(self._uyari_listesi())
        p.append(f"⚠ {n}" if n else "✔ uyarı yok")
        try:
            l_.configure(text="   |   ".join(p))
        except tk.TclError:
            pass

    def _log(self, msg, tur=""):
        try:
            self._bilgi_yaz(msg)
        except Exception:
            pass
        t = getattr(self, "_log_txt", None)
        if t is None:
            return
        try:
            t.configure(state="normal")
            for k_, ln in enumerate(str(msg).splitlines() or [""]):
                t.insert("end", (datetime.datetime.now().strftime("%H:%M:%S ") if k_ == 0 else "         "), "zaman")
                t.insert("end", ln + "\n", tur or ())
            n_ = int(t.index("end-1c").split(".")[0])
            if n_ > 1500:
                t.delete("1.0", f"{n_ - 1500}.0")
            t.see("end")
            t.configure(state="disabled")
        except tk.TclError:
            pass

    def _kom_gez(self, d):
        if not self._kom_gecmis:
            return "break"
        self._kom_i = max(0, min(len(self._kom_gecmis), self._kom_i + d))
        self._kom_v.set(self._kom_gecmis[self._kom_i] if self._kom_i < len(self._kom_gecmis) else "")
        return "break"

    def _kom_calistir(self, _e=None):
        satir = self._kom_v.get().strip()
        self._kom_v.set("")
        if satir:
            self._kom_gecmis.append(satir)
            self._kom_i = len(self._kom_gecmis)
            self._komut(satir)

    def _komut(self, satir):
        parca = satir.split()
        if not parca:
            return
        self._log("› " + satir, "komut")
        ad, arg = _norm(parca[0]), parca[1:]
        s = self.sonuc or {}
        if ad in self.PROJE_KOMUTLARI:
            try:
                cik = self._proje_komut(ad, satir.split(None, 1)[1] if len(parca) > 1 else "")
                if cik:
                    self._log(cik)
            except Exception as e_:
                self._log(f"Hata: {e_}", "hata")
            return
        try:
            if ad in ("yardim", "help", "?"):
                self._log("\n".join([
                    "hesapla                      : yeniden hesapla",
                    "ozet                         : proje özeti",
                    "tipler                       : dikey/yatay tipler (kapaklı, silikon ...)",
                    "tip dikey|yatay|hepsi <ad>   : tüm sistemi bu tipe çevir (örn: tip hepsi silikon)",
                    "parcalar                     : çıkarılabilir parça kodları",
                    "cikar <kod> [dikey|yatay]    : parçayı tüm sistemden çıkar (örn: cikar R50P03)",
                    "geri                         : çıkarılan tüm parçaları geri koy",
                    "undo | redo                  : son işlemi geri al / ileri al (Ctrl+Z, Ctrl+Y; 50 adım)",
                    "grup <dikey|yatay> <kod> <N> [düşüm_mm] : parça her N aksta/katta bir kesilsin (N=0: kapat)",
                    "sec temizle                  : Ctrl seçimini temizle",
                    "pdf | csv | dxf | kaydet | ac : çıktı al / proje kaydet / proje aç",
                    "parca | parca <kod> <yeni> | parca sifirla <kod> | parca yon <kod> x|y|180 | parca yerlesim : şablon parçaları",
                    "tema                         : koyu/açık tema",
                    "proje | betik                : projenin betiğini ver / betik yapıştırma penceresi (aks, dusey, ek, bolge, yalanci, cam, stok, takoz, proje komutları)",
                    "dusey kat=90,323,3600 alt=25 ust=35 dilatasyon=20 gecis=B,C orta=E : düşey profil boyu",
                    "temizle                      : günlüğü temizle"]))
            elif ad == "hesapla":
                self.hesapla()
            elif ad == "temizle":
                self._log_txt.configure(state="normal")
                self._log_txt.delete("1.0", "end")
                self._log_txt.configure(state="disabled")
            elif ad == "ozet":
                if not s:
                    self._log("Henüz hesap yok.", "uyari")
                else:
                    o, pg = s["ozet"], s["agirlik"]
                    self._log(f"{o['aks']} aks, {o['kat']} kat, {o['modul']} modül, ölçü {o['olcu'][0]:g} x {o['olcu'][1]:g} mm | "
                              f"alüminyum {pg['alu_toplam_kg']:.0f} kg | silikon {pg.get('silikon_m', 0):.1f} m, "
                              f"{pg.get('silikon_kartus', 0)} kartuş")
            elif ad == "tipler":
                self._log("Dikey : " + ", ".join(t["tip"] for t in self.dikey_tipleri) + f"   (şimdiki varsayılan: {s.get('dtip', '')})\n"
                          "Yatay : " + ", ".join(t["tip"] for t in self.yatay_tipleri))
            elif ad == "tip":
                if len(arg) < 2:
                    self._log("Kullanım: tip dikey|yatay|hepsi <tip adı>", "uyari")
                    return
                hedef, tad = _norm(arg[0]), " ".join(arg[1:])
                bul = lambda tur: self._tip_adi(tur, tad) or next(
                    (t["tip"] for t in (self.yatay_tipleri if tur == "yatay" else self.dikey_tipleri)
                     if _sade(tad) in _sade(t["tip"])), None)
                yap = []
                if hedef in ("dikey", "hepsi") and bul("dikey"):
                    self.model["dtip"], self.model["dik_tip"] = bul("dikey"), {}
                    yap.append("dikey=" + bul("dikey"))
                if hedef in ("yatay", "hepsi") and bul("yatay"):
                    self.model["ytip"] = [bul("yatay")] * len(s.get("cizgiler") or [])
                    self.model["yat_tip"] = {}
                    yap.append("yatay=" + bul("yatay"))
                if not yap:
                    self._log(f"'{tad}' tipi bulunamadı. 'tipler' ile listeleyin.", "hata")
                    return
                self._log("Tüm sistem tipi: " + ", ".join(yap))
                self.hesapla()
            elif ad == "parcalar":
                kk = s.get("parca_kodlar") or {}
                self._log("\n".join(f"{t.capitalize()}: " + ", ".join(k[0] for k in kk.get(t, [])) for t in ("dikey", "yatay")))
            elif ad == "cikar":
                if not arg:
                    self._log("Kullanım: cikar <parça kodu> [dikey|yatay]", "uyari")
                    return
                turler = [_norm(arg[1])] if len(arg) > 1 and _norm(arg[1]) in ("dikey", "yatay") else ["dikey", "yatay"]
                pc = self.model.setdefault("parca_cikar", {})
                bulundu = []
                for tur in turler:
                    kod = next((k[0] for k in (s.get("parca_kodlar") or {}).get(tur, []) if _sade(k[0]) == _sade(arg[0])), None)
                    if not kod:
                        continue
                    harf = "d" if tur == "dikey" else "y"
                    for sg in self._tum_segler():
                        if sg[0] == harf:
                            pc[sg] = {x for x in pc.get(sg, ()) if _norm(x) != _norm(kod)} | {kod}
                    bulundu.append(f"{kod} ({tur})")
                if not bulundu:
                    self._log(f"'{arg[0]}' parçası bulunamadı. 'parcalar' ile listeleyin.", "hata")
                    return
                self._log("Tüm sistemden çıkarıldı: " + ", ".join(bulundu))
                self.hesapla()
            elif ad in ("undo", "gerial", "z"):
                self._gerial_ileri(True)
            elif ad in ("redo", "ileri", "y"):
                self._gerial_ileri(False)
            elif ad == "geri":
                self.model["parca_cikar"] = {}
                self._log("Çıkarılan tüm parçalar geri konuldu.")
                self.hesapla()
            elif ad == "grup":
                if len(arg) < 3 or _norm(arg[0]) not in ("dikey", "yatay"):
                    self._log("Kullanım: grup dikey|yatay <kod> <N> [düşüm_mm]", "uyari")
                    return
                tur = _norm(arg[0])
                kod = next((k[0] for k in (s.get("parca_kodlar") or {}).get(tur, []) if _sade(k[0]) == _sade(arg[1])), None)
                if not kod:
                    self._log(f"'{arg[1]}' {tur} parçası bulunamadı.", "hata")
                    return
                n_ = int(float(arg[2]))
                d_ = float(arg[3].replace(",", ".")) if len(arg) > 3 else 0.0
                pg = self.model.setdefault("parca_grup", {})
                for k_ in [k_ for k_ in pg if k_[0] == tur and k_[1] == _norm(kod)]:
                    del pg[k_]
                if n_ > 0:
                    pg[(tur, _norm(kod), None)] = (n_, d_)
                self._log(f"{kod} ({tur}): " + (f"her {n_} {'aksta' if tur == 'yatay' else 'katta'} bir, uç düşümü {d_:g} mm"
                                              if n_ > 0 else "grup kapatıldı"))
                self.hesapla()
            elif ad == "sec":
                self._sec_temizle()
                self._log("Seçim temizlendi.")
            elif ad == "pdf":
                self.pdf_kaydet()
            elif ad == "csv":
                self.csv_kaydet()
            elif ad == "dxf":
                self.dxf_kaydet()
            elif ad == "kaydet":
                self.proje_kaydet()
            elif ad == "ac":
                self.proje_ac()
            elif ad == "tema":
                self._tema_degistir()
            elif ad in ("parca", "ayar", "kontrol", "sistem"):          # kütüphane/ayar komutları (Kur sekmesindeki ile aynı)
                cikti, yen = ayar_komut(self._aktif_sistem(), satir)
                if cikti:
                    self._log(cikti)
                if yen:
                    self._ayar_sonrasi(yen)
            else:
                self._log(f"Bilinmeyen komut: {parca[0]}  ('yardim' yazın)", "hata")
        except (ValueError, IndexError, KeyError, TypeError) as e:
            self._log(f"Komut hatası: {e}", "hata")

    def _tema_degistir(self):
        self.tema = "acik" if self.tema == "koyu" else "koyu"
        _ayar_db().setdefault("genel", {})["tema"] = self.tema
        ayar_kaydet()
        self._tema_uygula()

    def _stil(self):
        st = ttk.Style(self)
        st.theme_use("clam")
        st.configure(".", background=self.ARKA, font=("Segoe UI", 9))
        st.configure("TLabelframe", background=self.ARKA)
        st.configure("TLabelframe.Label", background=self.ARKA, foreground="#4a5560")
        st.configure("Treeview", rowheight=22)
        st.configure("Ana.TButton", padding=6)
        st.configure("TNotebook.Tab", padding=(8, 4))
        st.layout("Gizli.TNotebook.Tab", [])                 # sekme başlıkları üstteki kaydırmalı şeritte
        st.configure("Gizli.TNotebook", tabmargins=0, borderwidth=0)
        st.configure("Sekme.TButton", padding=(12, 5), borderwidth=1)
        st.configure("SekmeSec.TButton", padding=(12, 5), borderwidth=1, font=("Segoe UI", 9, "bold"))

    def _alan(self, ust, etiket, anahtar, varsayilan, satir, sutun=0, w=14):
        ttk.Label(ust, text=etiket).grid(row=satir, column=sutun, sticky="w", pady=2)
        self.v[anahtar] = tk.StringVar(value=str(varsayilan))
        e = ttk.Entry(ust, textvariable=self.v[anahtar], width=w)
        e.grid(row=satir, column=sutun + 1, sticky="we", padx=(6, 0), pady=2)
        e.bind("<Return>", lambda _e: self.hesapla())
        son = {"v": self.v[anahtar].get()}

        def _odak_cikti(_e=None):          # Enter'a basmadan başka alana geçilince de değişiklik hesaba girer
            simdi = self.v[anahtar].get()
            if simdi != son["v"]:
                son["v"] = simdi
                self.hesapla()
        e.bind("<FocusOut>", _odak_cikti)
        return e

    def _kaydirma_paneli(self, taraf, pw=None):
        """Dikey kaydırmalı yan panel (taraf: 'left' | 'right'); içindeki çerçeveyi döndürür.
        pw (bölmeli pencere) verilirse panel kenarından sürüklenerek yeniden boyutlanır."""
        kap = ttk.Frame(pw if pw is not None else self)
        if pw is not None:
            pw.add(kap, minsize=200, stretch="never")
        else:
            kap.pack(side=taraf, fill="y")
        kv = tk.Canvas(kap, highlightthickness=0, bg=self.ARKA)
        kb = ttk.Scrollbar(kap, orient="vertical", command=kv.yview)
        kv.configure(yscrollcommand=kb.set)
        kb.pack(side="right", fill="y")
        kv.pack(side="left", fill="both", expand=True)
        ic = ttk.Frame(kv, padding=10)
        pen_ = kv.create_window((0, 0), window=ic, anchor="nw")
        ilk = {"w": True}

        def boyut(_e=None):
            kv.configure(scrollregion=kv.bbox("all"))
            if ilk["w"]:                                  # ilk genişlik içeriğe göre; sonra sürükleyerek ayarlanır
                ilk["w"] = False
                kv.configure(width=ic.winfo_reqwidth())
        ic.bind("<Configure>", boyut)
        kv.bind("<Configure>", lambda e: kv.itemconfigure(pen_, width=max(e.width, 200)))

        def tekerlek(e):
            w = self.winfo_containing(e.x_root, e.y_root)
            while w is not None and w is not kap:
                w = w.master
            if w is None or ic.winfo_reqheight() <= kv.winfo_height():
                return
            if getattr(e, "num", 0) == 4:
                kv.yview_scroll(-3, "units")
            elif getattr(e, "num", 0) == 5:
                kv.yview_scroll(3, "units")
            else:
                kv.yview_scroll(-1 if e.delta > 0 else 1, "units")
        for ev in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
            self.bind_all(ev, tekerlek, add="+")
        return ic

    def _sekme_sayfasi(self, nb, genis=False):
        """Dikey kaydırmalı sekme sayfası. Dönüş: (sayfa çerçevesi -> nb.add/insert, içerik çerçevesi)."""
        dis = ttk.Frame(nb)
        kv = tk.Canvas(dis, highlightthickness=0, bg=self.ARKA)
        kb = ttk.Scrollbar(dis, orient="vertical", command=kv.yview)
        kv.configure(yscrollcommand=kb.set)
        kb.pack(side="right", fill="y")
        kv.pack(side="left", fill="both", expand=True)
        ic = ttk.Frame(kv, padding=12)
        pen = kv.create_window((0, 0), window=ic, anchor="nw")
        ic.bind("<Configure>", lambda _e: kv.configure(scrollregion=kv.bbox("all")))
        if genis:                                         # içerik sayfa genişliğine yayılır (çizim alanları için)
            kv.bind("<Configure>", lambda e: kv.itemconfigure(pen, width=max(e.width, 300)))

        def tekerlek(e):
            w = self.winfo_containing(e.x_root, e.y_root)
            while w is not None and w is not dis:
                w = w.master
            if w is None or ic.winfo_reqheight() <= kv.winfo_height():
                return
            if getattr(e, "num", 0) == 4:
                kv.yview_scroll(-3, "units")
            elif getattr(e, "num", 0) == 5:
                kv.yview_scroll(3, "units")
            else:
                kv.yview_scroll(-1 if e.delta > 0 else 1, "units")
        for ev in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
            self.bind_all(ev, tekerlek, add="+")
        return dis, ic

    def _panel_gizle_goster(self, taraf):
        """Yan paneli kendi başlığındaki düğmeyle gizler; yerine dar bir açma şeridi bırakır (şeritteki düğme geri açar)."""
        kap = self._sol_kap if taraf == "sol" else self._sol2_kap
        ince = self._ince[taraf]
        if self._pw_icinde(kap):
            self._pw.forget(kap)
            if taraf == "sol":
                self._pw.add(ince, before=self._sag_cerceve, minsize=0, width=26, stretch="never")
            else:
                self._pw.add(ince, minsize=0, width=26, stretch="never")
        else:
            if self._pw_icinde(ince):
                self._pw.forget(ince)
            if taraf == "sol":
                self._pw.add(kap, before=self._sag_cerceve, minsize=200, stretch="never")
            else:
                self._pw.add(kap, minsize=200, stretch="never")
            self.after(50, self._pw_sinirla)

    def _parca_paneli_ac_kapa(self):
        self._panel_gizle_goster("sag")

    def _pw_icinde(self, kap):
        """Panel şu an bölmeli pencerede görünüyor mu? (panes() Tcl nesnesi dönebilir → str'e çevrilir)"""
        try:
            return str(kap) in [str(x) for x in self._pw.panes()]
        except Exception:
            return False

    def _ruzgar_yardimci(self):
        """Yükseklik, arazi ve bölgeden rüzgar yükünü (kN/m²) hesaplayıp 'Rüzgar yükü' kutusuna yazar."""
        try:
            z = float(self.v["bina_h"].get().replace(",", "."))
            vb = float(self.v["vb"].get().replace(",", "."))
            if z <= 0 or vb <= 0:
                raise ValueError
        except ValueError:
            messagebox.showwarning("Rüzgar yükü", "Bina yüksekliği ve temel rüzgar hızı pozitif sayı olmalı.")
            return
        ar = next((k for k, v_ in ARAZI.items() if v_[0] == self.v["arazi"].get()), "III")
        bk = next((k for k, v_ in RUZGAR_BOLGE.items() if v_[0] == self.v["ruzgar_bolge"].get()), "orta")
        r = ruzgar_basinci(z, ar, vb, RUZGAR_BOLGE[bk][1])
        self.v["ruzgar_kn"].set(f"{r['w']:.2f}")
        self.lbl_ruzgar.config(text=f"z = {r['z']:.0f} m, arazi {ar}: cr = {r['cr']:.2f}, Iv = {r['Iv']:.2f}, "
                                    f"vm = {r['vm']:.1f} m/s → qp = {r['qp']:.2f} kN/m²; "
                                    f"cp = {RUZGAR_BOLGE[bk][1]:.2f} → W = {r['w']:.2f} kN/m² (kutuya yazıldı)")
        self._log(f"Rüzgar yükü: qp {r['qp']:.2f} kN/m² × cp {RUZGAR_BOLGE[bk][1]:.2f} = {r['w']:.2f} kN/m²")
        self.hesapla()

    # ------------------------------------------------ Statik sekmesi: şemalar ve kullanım oranları
    def _statik_kur(self, ana):
        fr = ttk.LabelFrame(ana, text=" Şemalar ve sonuçlar ", padding=6)
        fr.pack(fill="both", expand=True, pady=(8, 0))
        self._st_cv = tk.Canvas(fr, height=900, highlightthickness=0)
        self._st_cv.pack(fill="x", expand=True)
        self._st_cv.bind("<Configure>", lambda e: self._statik_ciz())
        self.tr_statik = ttk.Treeview(fr, columns=("b", "d", "u"), show="headings", height=9)
        for k, ad, w in (("b", "Büyüklük", 260), ("d", "Değer", 120), ("u", "Birim", 60)):
            self.tr_statik.heading(k, text=ad)
            self.tr_statik.column(k, width=w, anchor="w")
        self.tr_statik.pack(fill="x", pady=(6, 0))

    @staticmethod
    def _st_merkez(donguler, derin):
        """Dolu döngülerden (çift derinlik) ağırlık merkezi; deliklerin alanı çıkarılır."""
        A = Sx = Sy = 0.0
        for lp, d in zip(donguler, derin):
            sg = 1 if d % 2 == 0 else -1
            a = cx = cy = 0.0
            for k in range(len(lp)):
                x1, y1, x2, y2 = lp[k][0], lp[k][1], lp[(k + 1) % len(lp)][0], lp[(k + 1) % len(lp)][1]
                c = x1 * y2 - x2 * y1
                a += c / 2
                cx += (x1 + x2) * c / 6
                cy += (y1 + y2) * c / 6
            A += sg * abs(a)
            sa = 1 if a >= 0 else -1
            Sx += sg * cx * sa
            Sy += sg * cy * sa
        return (Sx / A, Sy / A) if abs(A) > 1e-9 else (0.0, 0.0)

    def _statik_ciz(self):
        cv = getattr(self, "_st_cv", None)
        if cv is None:
            return
        import math
        t = TEMALAR[self.tema]
        FG, SOLUK, ALAN, CIZGI = t["yazi"], t["soluk"], t["alan"], t["cizgi"]
        YUK, SEHIM, MOM, YESIL, SARI, KIRMIZI = "#d9822b", "#3b8ed0", "#4aa36b", "#4aa36b", "#d9a02b", "#d0453b"
        cv.delete("all")
        W = max(cv.winfo_width(), 320)
        s = self.sonuc or {}
        a = s.get("analiz")
        for i in self.tr_statik.get_children():
            self.tr_statik.delete(i)
        F = ("Segoe UI", 9)
        FB = ("Segoe UI", 10, "bold")

        def yaz(x, y, m, anc="w", col=None, f=F):
            cv.create_text(x, y, text=m, anchor=anc, fill=col or FG, font=f)
        if not a:
            yaz(10, 12, "Rüzgar yükü (kN/m²) girip Hesapla'ya basın: şemalar ve kullanım oranları burada görünür.", col=SOLUK)
            cv.configure(height=40)
            return
        for b_, rows_ in statik_bolumleri(a):
            for r_ in rows_:
                self.tr_statik.insert("", "end", values=r_)
        y = 8
        # --- 1) kullanım oranları
        yaz(10, y, "Kullanım oranları (talep / kapasite)", f=FB)
        y += 22
        d, yt = a.get("dikey"), a.get("yatay")
        oranlar = []
        if d:
            oranlar += [("Dikey · gerilme", d["sig"] / d["sig_rd"], f"{d['sig']:.0f} / {d['sig_rd']:.0f} kg/cm²"),
                        ("Dikey · sehim", d["d"] / d["dl"], f"{d['d']:.2f} / {d['dl']:.2f} cm")]
        if yt:
            oranlar += [("Yatay · gerilme", yt["sig"] / yt["sig_rd"], f"{yt['sig']:.0f} / {yt['sig_rd']:.0f} kg/cm²"),
                        ("Yatay · sehim (rüzgar)", yt["d_k"] / yt["dl_k"], f"{yt['d_k']:.2f} / {yt['dl_k']:.2f} cm"),
                        ("Yatay · sehim (cam ağırlığı)", yt["d_z"] / yt["dl_z"], f"{yt['d_z']:.2f} / {yt['dl_z']:.2f} cm")]
        bx0, bx1 = 190, W - 150
        for ad, r, m in oranlar:
            yaz(10, y + 8, ad)
            cv.create_rectangle(bx0, y, bx1, y + 16, fill=ALAN, outline=CIZGI)
            wd = (bx1 - bx0) * min(r, 1.25) / 1.25
            col = YESIL if r < 0.75 else (SARI if r < 1.0 else KIRMIZI)
            cv.create_rectangle(bx0, y, bx0 + wd, y + 16, fill=col, outline="")
            xl = bx0 + (bx1 - bx0) / 1.25
            cv.create_line(xl, y - 2, xl, y + 18, fill=FG, dash=(3, 2))
            yaz(bx1 + 8, y + 8, f"%{r * 100:.0f}  " + ("OK" if r <= 1 else "YETERSİZ"), col=col, f=FB)
            yaz(bx0 + 4, y + 8, m, col="#ffffff" if wd > 90 else FG)
            y += 24
        y += 6

        # --- 2) kiriş şemaları
        def kiris(y0, baslik, L, w, w_et, Mm, defl, lim, nokta=None, R=None, sema="basit"):
            xa, xb = 50, W - 50
            nsp = {"surekli2": 2, "surekli3": 3}.get(sema, 1)
            konsol = sema == "konsol"
            yaz(10, y0, baslik, f=FB)
            yb = y0 + 78
            if nokta is None:                           # yayılı yük okları
                cv.create_line(xa, y0 + 30, xb, y0 + 30, fill=YUK, width=2)
                for k in range(13):
                    xx = xa + (xb - xa) * k / 12
                    cv.create_line(xx, y0 + 30, xx, yb - 6, fill=YUK, arrow="last")
                yaz((xa + xb) / 2, y0 + 20, w_et, "center", YUK)
            else:                                       # noktasal yükler (takozlar)
                for fr_ in nokta:
                    xx = xa + (xb - xa) * fr_
                    cv.create_line(xx, y0 + 28, xx, yb - 6, fill=YUK, width=2, arrow="last")
                yaz((xa + xb) / 2, y0 + 20, w_et, "center", YUK)
            cv.create_line(xa, yb, xb, yb, fill=FG, width=5)                       # kiriş
            if konsol:                                                              # ankraj duvarı
                cv.create_rectangle(xa - 10, yb - 26, xa, yb + 26, fill=SOLUK, outline=FG)
                for k in range(-2, 3):
                    cv.create_line(xa - 10, yb + k * 11, xa - 20, yb + k * 11 + 8, fill=FG)
            else:
                for k in range(nsp + 1):
                    xx = xa + (xb - xa) * k / nsp
                    if k == 0:
                        cv.create_polygon(xx, yb + 3, xx - 9, yb + 17, xx + 9, yb + 17, fill=SOLUK, outline=FG)
                    else:
                        cv.create_oval(xx - 7, yb + 4, xx + 7, yb + 18, fill=SOLUK, outline=FG)
            cv.create_line(xa, yb + 66, xb, yb + 66, fill=SOLUK, arrow="both")
            yaz((xa + xb) / 2, yb + 59, (f"{nsp} × L, L = {L:.0f} cm" if nsp > 1 else f"L = {L:.0f} cm"), "center", SOLUK)
            if R is not None and nsp == 1 and not konsol:
                for xx in (xa, xb):
                    cv.create_line(xx, yb + 40, xx, yb + 22, fill=MOM, arrow="last", width=2)
                yaz(xa, yb + 48, f"R = {R:.0f} kg", "center", MOM)
                yaz(xb, yb + 48, f"R = {R:.0f} kg", "center", MOM)
            elif R is not None:
                yaz(xb, yb + 48, f"en büyük mesnet tepkisi ≈ {R:.0f} kg", "e", MOM)
            dp = 4 + 14 * min(1.0, defl / lim if lim else 0)
            pts = []
            for k in range(61):
                tt = k / 60
                if konsol:
                    yy = dp * tt * tt * (3 - tt) / 2
                else:
                    sp = (tt * nsp) % 1.0 if tt < 1 else 1.0
                    yy = dp * math.sin(math.pi * sp)
                pts += [xa + (xb - xa) * tt, yb + yy]
            cv.create_line(*pts, fill=SEHIM, width=2, dash=(5, 3), smooth=True)
            yaz((xa + xb) / 2, yb + dp + 12, f"δ = {defl:.2f} cm (sınır {lim:.2f})", "center", SEHIM)

            def mom(tt):                                 # normalize moment (+ aşağı: açıklık, − yukarı: mesnet)
                if nokta is not None:
                    return min(1.0, tt / 0.25, (1 - tt) / 0.25)
                if konsol:
                    return -(1 - tt) ** 2
                if sema == "surekli2":
                    u = tt * 2
                    u = 2 - u if u > 1 else u
                    return (0.375 * u - u * u / 2) / 0.125
                if sema == "surekli3":
                    u = tt * 3
                    sg = min(int(u), 2)
                    u -= sg
                    if sg == 1:
                        return (-0.1 + 0.5 * u * (1 - u)) / 0.1
                    u = u if sg == 0 else 1 - u
                    return (0.4 * u - u * u / 2) / 0.1
                return 4 * tt * (1 - tt)
            hog = 38 if (konsol or nsp > 1) else 0
            ym = yb + 82 + hog
            cv.create_line(xa, ym, xb, ym, fill=SOLUK)
            pts = [xa, ym]
            for k in range(121):
                tt = k / 120
                pts += [xa + (xb - xa) * tt, ym + 38 * mom(tt)]
            pts += [xb, ym]
            cv.create_polygon(*pts, fill=MOM, outline=MOM, stipple="gray50")
            yaz((xa + xb) / 2, ym + 38 + 12, f"M = {Mm:.0f} kg·cm" + (" (mesnette, üst lifte çekme)" if (konsol or nsp > 1) else ""),
                "center", MOM)
            return y0 + 78 + 82 + hog + 38 + 30

        if d:
            y = kiris(y, "Dikey profil — " + d.get("sema_ad", "basit mesnetli") + " (rüzgar yükü)", d["L"], d["w"],
                      f"w = {d['w']:.2f} kg/cm (1.5·W, yük genişliği {d['tw']:.0f} cm)", d["M3"], d["d"], d["dl"],
                      R=d["Rw"] * KOMB_W, sema=d.get("sema", "basit"))
            yaz(10, y - 6, f"Eksenel (cam ağırlığı): N = {d['N']:.0f} kg  ·  σ = M/W + N/A = {d['sig']:.0f} kg/cm²", col=SOLUK)
            y += 22
        if yt:
            y = kiris(y, "Yatay profil — kuvvetli eksen (rüzgar yükü)", yt["L"], yt["w"],
                      f"w = {yt['w']:.2f} kg/cm (1.5·W, yük yüksekliği {yt['tr']:.0f} cm)", yt["M3"], yt["d_k"], yt["dl_k"],
                      R=yt["w"] * yt["L"] / 2 * KOMB_W)
            tk_ = a.get("takoz") or {}
            y = kiris(y, "Yatay profil — zayıf eksen (cam takozları L/4 ve 3L/4)", yt["L"], 0,
                      f"P = {tk_.get('P', 0):.1f} kg / takoz (cam {tk_.get('bay', 0):.2f} × {tk_.get('H', 0):.2f} m)",
                      yt["M2"], yt["d_z"], yt["dl_z"], nokta=(0.25, 0.75), R=KOMB_G * tk_.get("P", 0))
            y += 4

        # --- 3) kesitler
        kes = s.get("kesit") or {}
        yaz(10, y, "Profil kesitleri ve özellikleri", f=FB)
        y += 22
        kx = 10
        kutu = min(170, (W - 40) / 2)
        for ad, k, bil in (("Dikey", kes.get("dikey"), d and (d["I"], d["Wx"], d["A"])),
                           ("Yatay", kes.get("yatay"), yt and (yt["If"], yt["Wx"], yt["A"]))):
            if not k:
                continue
            xmn, xmx, ymn, ymx = k["xmin"], k["xmax"], k["ymin"], k["ymax"]
            sc = (kutu - 20) / max(xmx - xmn, ymx - ymn, 1.0)
            ox = kx + (kutu - (xmx - xmn) * sc) / 2 - xmn * sc
            oy = y + (kutu - (ymx - ymn) * sc) / 2 + ymx * sc
            cv.create_rectangle(kx, y, kx + kutu, y + kutu, outline=CIZGI)
            for lp, dr in zip(k["donguler"], k["derin"]):
                cv.create_polygon(*[v for q in lp for v in (ox + q[0] * sc, oy - q[1] * sc)],
                                  fill=(FG if dr % 2 == 0 else ALAN), outline=FG)
            gx, gy = self._st_merkez(k["donguler"], k["derin"])
            cv.create_line(kx + 3, oy - gy * sc, kx + kutu - 3, oy - gy * sc, fill=YUK, dash=(4, 3))
            cv.create_line(ox + gx * sc, y + 3, ox + gx * sc, y + kutu - 3, fill=YUK, dash=(4, 3))
            yaz(kx + 6, y + 8, (k.get("ad") or ad), col=SOLUK)
            if bil:
                yaz(kx, y + kutu + 12, f"I = {bil[0]:.0f} cm⁴   W = {bil[1]:.1f} cm³", col=FG)
                yaz(kx, y + kutu + 28, f"A = {bil[2]:.2f} cm²   {k['w']:.0f}×{k['h']:.0f} mm", col=SOLUK)
            kx += kutu + 20
        y += kutu + 44

        # --- 4) yük alanı
        cols, rows = s.get("cols") or [], s.get("rows") or []
        if cols and rows and d:
            yaz(10, y, "Yük alanı (taşıyıcı genişlik / yükseklik)", f=FB)
            y += 20
            TW, TH = float(sum(cols)), float(sum(rows))
            bw = W - 60
            sc = min(bw / TW, 150.0 / TH)
            fx, fy = 30, y
            cxs = [0.0]
            for c_ in cols:
                cxs.append(cxs[-1] + c_)
            cys = [0.0]
            for r_ in rows:
                cys.append(cys[-1] + r_)
            X = lambda v: fx + v * sc
            Yf = lambda v: fy + (TH - v) * sc
            cv.create_rectangle(X(0), Yf(TH), X(TW), Yf(0), outline=FG, fill=ALAN)
            for v in cxs:
                cv.create_line(X(v), Yf(0), X(v), Yf(TH), fill=SOLUK)
            for v in cys:
                cv.create_line(X(0), Yf(v), X(TW), Yf(v), fill=SOLUK)
            n = len(cols)
            tr_ = [((cols[i - 1] if i > 0 else 0) + (cols[i] if i < n else 0)) / 2 for i in range(n + 1)]
            im = max(range(n + 1), key=lambda i: tr_[i])
            xc = cxs[im]
            tw_mm = d["tw"] * 10
            cv.create_rectangle(X(max(0, xc - tw_mm / 2)), Yf(TH), X(min(TW, xc + tw_mm / 2)), Yf(0),
                                fill=YUK, outline=YUK, stipple="gray25")
            yaz(X(xc), Yf(TH) - 8, f"dikey: {d['tw']:.0f} cm", "center", YUK)
            if yt:
                cz = [float(zz["y0"]) for zz in s.get("bolgeler") or []]
                bol = [zz["y1"] - zz["y0"] for zz in s.get("bolgeler") or []]
                if bol:
                    ks = [(bol[k - 1] if k > 0 else 0) + (bol[k] if k < len(bol) else 0) for k in range(len(bol) + 1)]
                    km = max(range(len(ks)), key=lambda k: ks[k])
                    yc = (s["cizgiler"][km][0] if km < len(s.get("cizgiler") or []) else cys[min(km, len(cys) - 1)])
                    h_mm = yt["tr"] * 10
                    cv.create_rectangle(X(0), Yf(min(TH, yc + h_mm / 2)), X(TW), Yf(max(0, yc - h_mm / 2)),
                                        fill=SEHIM, outline=SEHIM, stipple="gray25")
                    yaz(X(TW) - 4, Yf(yc) - 12, f"yatay: {yt['tr']:.0f} cm", "e", SEHIM)
            y += TH * sc + 22
        cv.configure(height=int(y + 10))

    # ------------------------------------------------ 3B görünüm (sol alt)
    def _uc_kur(self, ana):
        fr = ttk.LabelFrame(ana, text=" 3B görünüm (sürükle: döndür · tekerlek: yakınlaştır · çift tık: sıfırla) ", padding=4)
        fr.pack(fill="x", pady=(10, 0))
        ust_ = ttk.Frame(fr)
        ust_.pack(fill="x")
        self._uc_hafif = tk.BooleanVar(value=False)
        ttk.Checkbutton(ust_, text="Hafiflet (yavaşlarsa)", variable=self._uc_hafif,
                        command=lambda: self._uc_ciz()).pack(side="left")
        ttk.Label(ust_, text="Sağ/orta tuş veya Shift+sürükle: kaydır", foreground="#7a858e").pack(side="right")
        self._uc_cv = tk.Canvas(fr, height=300, highlightthickness=0)
        self._uc_cv.pack(fill="x", expand=True)
        self._uc = {"yaw": self._uc_hedef_yaw(), "pit": 18.0, "zoom": 1.0, "px": 0.0, "py": 0.0, "son": None, "anim": None}
        cv = self._uc_cv
        cv.bind("<ButtonPress-1>", self._uc_bas)
        cv.bind("<B1-Motion>", self._uc_surukle)
        for tus in ("2", "3"):                                      # orta / sağ tuş: kaydır (pan)
            cv.bind("<ButtonPress-%s>" % tus, lambda e: self._uc.__setitem__("son", (e.x, e.y)))
            cv.bind("<B%s-Motion>" % tus, lambda e: self._uc_surukle(e, True))
            cv.bind("<ButtonRelease-%s>" % tus, lambda e: (self._uc.__setitem__("son", None), self._uc_ciz()))
        cv.bind("<ButtonRelease-1>", lambda e: (self._uc.__setitem__("son", None), self._uc_ciz()))
        cv.bind("<MouseWheel>", self._uc_teker)
        cv.bind("<Button-4>", lambda e: self._uc_teker(e, 1))
        cv.bind("<Button-5>", lambda e: self._uc_teker(e, -1))
        cv.bind("<Double-Button-1>", self._uc_sifirla)
        cv.bind("<Configure>", lambda e: self._uc_ciz())

    def _uc_hedef_yaw(self):
        """Görünüşteki bakışa uygun izometrik açı: normalde dıştan; 'Aynala' açıksa içeriden (karşı taraf)."""
        return -145.0 if genel_ayar("cephe_ayna") else -35.0

    def _uc_sifirla(self, _e=None):
        """Çift tık: görünüşteki duruşa göre izometrik açıya animasyonla döner (zoom ve kaydırma da sıfırlanır)."""
        u = self._uc
        if u.get("anim"):
            try:
                self.after_cancel(u["anim"])
            except Exception:
                pass
        h_yaw = self._uc_hedef_yaw()
        d_yaw = (h_yaw - u["yaw"] + 180.0) % 360.0 - 180.0        # en kısa dönüş yönü
        bas = (u["yaw"], u["pit"], u["zoom"], u["px"], u["py"])
        adim_n = 16

        def adim(k=1):
            t = k / adim_n
            e = 1 - (1 - t) ** 3                                   # yavaşlayarak durur
            u["yaw"] = bas[0] + d_yaw * e
            u["pit"] = bas[1] + (18.0 - bas[1]) * e
            u["zoom"] = bas[2] + (1.0 - bas[2]) * e
            u["px"] = bas[3] * (1 - e)
            u["py"] = bas[4] * (1 - e)
            if k < adim_n:
                self._uc_ciz(hizli=True)
                u["anim"] = self.after(18, lambda: adim(k + 1))
            else:
                u["anim"] = None
                u["yaw"] = h_yaw % 360.0 if h_yaw % 360.0 <= 180 else h_yaw % 360.0 - 360.0
                self._uc_ciz()
        adim()

    def _uc_bas(self, e):
        a = self._uc.get("anim")
        if a:
            try:
                self.after_cancel(a)
            except Exception:
                pass
            self._uc["anim"] = None
        self._uc["son"] = (e.x, e.y)

    def _uc_surukle(self, e, kaydir=False):
        son = self._uc.get("son")
        if son:
            if kaydir or (e.state & 0x0001):                         # Shift + sol tuş de kaydırır
                self._uc["px"] += e.x - son[0]
                self._uc["py"] += e.y - son[1]
            else:
                self._uc["yaw"] += (e.x - son[0]) * 0.6
                self._uc["pit"] = max(-85.0, min(85.0, self._uc["pit"] + (e.y - son[1]) * 0.6))
        self._uc["son"] = (e.x, e.y)
        self._uc_ciz(hizli=True)

    def _uc_teker(self, e, yon=None):
        yon = yon if yon is not None else (1 if e.delta > 0 else -1)
        if genel_ayar("teker_ters"):
            yon = -yon
        self._uc["zoom"] = max(0.3, min(6.0, self._uc["zoom"] * (1.12 if yon > 0 else 1 / 1.12)))
        self._uc_ciz()

    # --- gerçek kesitlerden 3B geometri: detay DXF'indeki dolgular (profil, fitil, izolatör ...) uzatılır
    @staticmethod
    def _uc_sade(lp, tol=1.2):
        """Döngüyü Douglas-Peucker ile sadeleştirir (3B çizim hızlı kalsın)."""
        if len(lp) < 8:
            return list(lp)
        pts = list(lp)

        def dp(a, b):
            if b <= a + 1:
                return [pts[a]]
            (x1, y1), (x2, y2) = pts[a][:2], pts[b][:2]
            dx, dy = x2 - x1, y2 - y1
            n = (dx * dx + dy * dy) ** 0.5 or 1e-9
            en, ei = -1.0, a
            for k in range(a + 1, b):
                d = abs(dy * (pts[k][0] - x1) - dx * (pts[k][1] - y1)) / n
                if d > en:
                    en, ei = d, k
            if en > tol:
                return dp(a, ei) + dp(ei, b)
            return [pts[a]]
        h = len(pts) // 2
        o = dp(0, h) + dp(h, len(pts) - 1) + [pts[-1]]
        return o if len(o) >= 3 else list(lp)

    def _uc_katilar(self, d, tur):
        """Detaydan (a: boyuna eksen, T: kalınlık ekseni) katıları çıkarır. Dönüş: (katilar, a_min, a_max, yon, ti) | None"""
        if not d or not d.get("ref"):
            return None
        g = _cam_geo(d, tur)
        if not g:
            return None
        rx, ry = d["ref"]
        kat, amin, amax = [], 1e18, -1e18
        for p in d["prims"]:
            if p[0] != "fill" or not p[1]:
                continue
            dong = []
            for lp, dr in zip(p[1], list(p[2]) + [0] * len(p[1])):
                pts = [((x - rx) if tur == "dikey" else (y - ry), y if tur == "dikey" else x) for x, y in lp]
                pts = self._uc_sade(pts)
                if len(pts) >= 3:
                    dong.append((pts, dr % 2))
            if not dong:
                continue
            ren = p[3] if isinstance(p[3], str) and p[3].startswith("#") and len(p[3]) == 7 else "#8d99a3"
            renk = tuple(int(ren[k:k + 2], 16) for k in (1, 3, 5))
            aa = [q[0] for lp, _ in dong for q in lp]
            tt = [q[1] for lp, _ in dong for q in lp]
            kat.append({"dong": dong, "renk": renk, "bb": (min(aa), max(aa), min(tt), max(tt))})
            if not any(x in str(p[4]) for x in ("epdm",)) and not ("izo" in str(p[4])):
                amin, amax = min(amin, min(aa)), max(amax, max(aa))
        if not kat:
            return None
        if amin > amax:
            amin = min(k["bb"][0] for k in kat)
            amax = max(k["bb"][1] for k in kat)
        return kat, amin, amax, g[3], g[2], g

    def _uc_geometri(self, hizli):
        """Cephenin dünya koordinatlı yüz listesi: [(noktalar, normal, renk, kenar, stipple)]. y: dışa doğru -y."""
        s = self.sonuc
        xs, zs = [0.0], [0.0]
        for w in s["cols"]:
            xs.append(xs[-1] + float(w))
        for h in s["rows"]:
            zs.append(zs[-1] + float(h))
        W, H = xs[-1], zs[-1]
        det = s.get("detay") or {}
        dk = self._uc_katilar(det.get("dikey"), "dikey")
        yt = self._uc_katilar(det.get("yatay"), "yatay")
        yuz = []

        def kutu(x0, x1, y0, y1, z0, z1, renk, kenar="#3a4046", stp=""):
            P = lambda x, y, z: (x, y, z)
            for pts, n in (
                ([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], (0, -1, 0)),
                ([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], (0, 1, 0)),
                ([P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], (-1, 0, 0)),
                ([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], (1, 0, 0)),
                ([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], (0, 0, 1)),
                ([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], (0, 0, -1)),
            ):
                yuz.append((pts, n, renk, kenar, stp))

        # --- görünüşle birebir yerleşim (DXF/ekran çizimiyle aynı veriler): dikmeler, yataylar, camlar
        vw_, hw_ = float(s.get("vw") or 50.0), float(s.get("hw") or 50.0)
        cy_l = [float(v) for v in (s.get("cy") or zs)]
        alt_, ust_ = float(s.get("dikey_alt") or 0.0), float(s.get("dikey_ust") or 0.0)
        dyok = s.get("dik_yok") or set()
        yyok = s.get("yat_yok") or set()
        hat_id = s.get("hat_id") or [(0, 0)] * len(s.get("cizgiler") or [])
        mull = []                                             # (x, z0, z1)
        mull_var = {}                                         # (aks, kat) -> var mı
        for i in range(len(xs)):
            for j in range(len(s["rows"])):
                var = (i, j) not in dyok
                mull_var[(i, j)] = var
                if var:
                    mull.append((xs[i], -alt_ if j == 0 else cy_l[j],
                                 (H + ust_) if j == len(s["rows"]) - 1 else cy_l[j + 1]))

        def dikme_var(i, z):
            for j in range(len(cy_l) - 1):
                if cy_l[j] - 1e-6 <= z <= cy_l[j + 1] + 1e-6 and mull_var.get((i, j)):
                    return True
            return False
        trans = []                                            # (z, i)
        for (yy, _ek), hid in zip(s.get("cizgiler") or [], hat_id):
            for i in range(len(s["cols"])):
                if (hid[0], hid[1], i) not in yyok:
                    trans.append((float(yy), i))
        cam_l = []                                            # (i0, i1, z0, z1, tip)
        for g_ in s.get("cam_gruplari") or []:
            if PANEL_TIPLERI[g_["tip"]].get("bos"):
                continue
            cam_l.append((g_["i0"], g_["i1"], s["bolgeler"][g_["z0"]]["y0"], s["bolgeler"][g_["z1"]]["y1"], g_["tip"]))

        if not dk or not yt:                                  # detay yoksa basit kutu modeli
            kx, kz = vw_ / 2, hw_ / 2
            for x, z0, z1 in mull:
                kutu(x - kx, x + kx, -150, 0, z0, z1, (150, 158, 166))
            for z, i in trans:
                x0 = xs[i] + (kx if dikme_var(i, z) else 0.0)
                x1 = xs[i + 1] - (kx if dikme_var(i + 1, z) else 0.0)
                kutu(x0, x1, -100, 0, z - kz, z + kz, (130, 138, 146))
            for i0, i1, z0, z1, tp in cam_l:
                kutu(xs[i0] + kx, xs[i1 + 1] - kx, -2, 0, z0 + kz, z1 - kz,
                     (110, 165, 200) if tp == "cam" else (170, 150, 120), "#4a6a80", "gray50" if tp == "cam" else "")
            return yuz, W, H

        def uzat(kat_, tur, yon, ti, taban, u0, u1, ucu0=True, ucu1=True):
            """Katıyı kesit düzleminde tur'e göre uzatır: dikey → z=u0..u1; yatay → x=u0..u1."""
            def M(a, T, u):
                y = -yon * (T - ti)
                return (taban + a, y, u) if tur == "dikey" else (u, y, taban + a)
            for kt in kat_:
                if hizli:
                    a0, a1, t0, t1 = kt["bb"]
                    ya, yb = sorted((-yon * (t0 - ti), -yon * (t1 - ti)))
                    if tur == "dikey":
                        kutu(taban + a0, taban + a1, ya, yb, u0, u1, kt["renk"])
                    else:
                        kutu(u0, u1, ya, yb, taban + a0, taban + a1, kt["renk"])
                    continue
                for lp, delik in kt["dong"]:
                    n = len(lp)
                    cx = sum(q[0] for q in lp) / n
                    cT = sum(q[1] for q in lp) / n
                    for k in range(n):
                        (a1_, T1), (a2_, T2) = lp[k], lp[(k + 1) % n]
                        pts = [M(a1_, T1, u0), M(a2_, T2, u0), M(a2_, T2, u1), M(a1_, T1, u1)]
                        ex, eT = a2_ - a1_, T2 - T1                     # kenar vektörü; dış normal = (eT, -ex) yönlü
                        mx_, mT = (a1_ + a2_) / 2 - cx, (T1 + T2) / 2 - cT
                        sg = 1 if (eT * mx_ - ex * mT) >= 0 else -1
                        sg = -sg if delik else sg
                        nA, nT = sg * eT, -sg * ex
                        n3 = M(nA, nT, 0)
                        o3 = M(0, 0, 0)
                        yuz.append((pts, (n3[0] - o3[0], n3[1] - o3[1], n3[2] - o3[2]), kt["renk"], "#1d2226", ""))
                    pts0 = [M(q[0], q[1], u0) for q in lp]
                    pts1 = [M(q[0], q[1], u1) for q in lp]
                    nz = (0, 0, -1) if tur == "dikey" else (-1, 0, 0)
                    pz = (0, 0, 1) if tur == "dikey" else (1, 0, 0)
                    col = tuple(int(v * 0.6) for v in kt["renk"]) if delik else kt["renk"]
                    if delik:                                   # boşluk tabanı: dış kapağın hemen önünde (üst üste binmesin)
                        pts0 = [M(q[0], q[1], u0 + 0.5) for q in lp]
                        pts1 = [M(q[0], q[1], u1 - 0.5) for q in lp]
                    if ucu0:
                        yuz.append((pts0, nz, col, "#1d2226", ""))
                    if ucu1:
                        yuz.append((pts1, pz, col, "#1d2226", ""))

        kd, dmin, dmax, ydk, tid, gd = dk
        ky, ymin_, ymax_, yyt, tit, gy = yt
        for x, z0, z1 in mull:                                # dikmeler: kat kat parçalı (boyama sırası doğru kalsın)
            kz_ = sorted({z0, z1} | {c for c in cy_l if z0 < c < z1})
            for jj in range(len(kz_) - 1):
                uzat(kd, "dikey", ydk, tid, x, kz_[jj], kz_[jj + 1], jj == 0, jj == len(kz_) - 2)
        for z, i in trans:                                    # yataylar: komşu dikme varsa yarım dikme kadar içeriden
            x0 = xs[i] + (dmax if dikme_var(i, z) else 0.0)
            x1 = xs[i + 1] + (dmin if dikme_var(i + 1, z) else 0.0)
            if x1 > x0:
                uzat(ky, "yatay", yyt, tit, z, x0, x1)
        kal = float((s.get("cam_yapi") or {}).get("kalinlik") or gd[4])
        for i0, i1, z0, z1, tp in cam_l:                      # cam / spandrel: bölge grupları (boş olanlar çizilmez)
            x0, x1 = xs[i0] + gd[1], xs[i1 + 1] - gd[0]
            za, zb = z0 + gy[1], z1 - gy[0]
            if x1 > x0 and zb > za:
                if tp == "cam":
                    kutu(x0, x1, -kal, 0.0, za, zb, (110, 165, 200), "#4a6a80", "gray50")
                else:
                    pr_ = PANEL_TIPLERI.get(tp, {})
                    hx = (pr_.get("renk") or ("#d8cfbd",))[0]
                    rg = tuple(int(hx[k:k + 2], 16) for k in (1, 3, 5)) if len(hx) == 7 else (170, 150, 120)
                    kp = float(pr_.get("kal") or kal)
                    kutu(x0, x1, -kp, 0.0, za, zb, rg, "#4a4030", "")
        return yuz, W, H

    def _uc_ciz(self, hizli=False):
        """Girilen cepheyi gerçek profil kesitlerinden (dikme, yatay, fitil, izolatör, cam) 3B çizer."""
        import math
        cv = getattr(self, "_uc_cv", None)
        s = self.sonuc
        if cv is None:
            return
        cv.delete("all")
        if not s or not s.get("cols") or not s.get("rows"):
            cv.create_text(10, 10, anchor="nw", fill="#8a949c", text="Hesapla'dan sonra cephe burada görünür")
            return
        hizli = bool(hizli) or bool(getattr(self, "_uc_hafif", None) and self._uc_hafif.get())
        ayna = bool(genel_ayar("cephe_ayna"))
        anah = (id(s), hizli)
        onb = getattr(self, "_uc_onb", None)
        if not onb or onb[0] != anah:
            try:
                g_ = self._uc_geometri(hizli)
                if not hizli and len(g_[0]) > 30000:         # çok büyük: ağır, hızlı kutu modeline düş
                    g_ = self._uc_geometri(True)
            except Exception:
                g_ = self._uc_geometri(True)
            self._uc_onb = onb = (anah, g_)
        faces, W, H = onb[1]
        ya, pi_ = math.radians(self._uc["yaw"]), math.radians(self._uc["pit"])
        cy_, sy_, cp_, sp_ = math.cos(ya), math.sin(ya), math.cos(pi_), math.sin(pi_)
        mx, mz = W / 2, H / 2

        def don(x, y, z):
            x -= mx; z -= mz
            x1 = x * cy_ - y * sy_
            y1 = x * sy_ + y * cy_
            return x1, y1 * cp_ - z * sp_, y1 * sp_ + z * cp_

        gw, gh = max(cv.winfo_width(), 100), max(cv.winfo_height(), 100)
        sc = min(gw, gh) / (max(W, H, 1.0) * 0.95) * self._uc["zoom"]
        cx, cy = gw / 2 + self._uc.get("px", 0.0), gh / 2 + self._uc.get("py", 0.0)
        isik = (-0.35, -0.8, 0.45)
        fn = math.sqrt(sum(i * i for i in isik))
        cizim = []
        for pts, n, renk, kenar, stp in faces:
            nr = don(n[0] + mx, n[1], n[2] + mz)
            nl = math.sqrt(nr[0] ** 2 + nr[1] ** 2 + nr[2] ** 2) or 1.0
            if nr[1] / nl > 0.0001 and not stp:              # kameraya arkası dönük (cam iki yüzlü çizilir)
                continue
            ps = [don(*q) for q in pts]
            ln = max(0.35, min(1.1, 0.55 + 0.6 * (-(nr[0] * isik[0] + nr[1] * isik[1] + nr[2] * isik[2]) / (fn * nl))))
            c = "#%02x%02x%02x" % tuple(min(255, int(v * ln)) for v in renk)
            cizim.append((sum(p[1] for p in ps) / len(ps), [(cx + p[0] * sc, cy - p[2] * sc) for p in ps], c, kenar, stp))
        cizim.sort(key=lambda t: -t[0])
        for dp, pts, c, kenar, stp in cizim:
            kw = {"fill": c, "outline": kenar}
            if stp:
                kw["stipple"] = stp
            cv.create_polygon(*[v for p in pts for v in p], **kw)
        cv.create_text(6, gh - 6, anchor="sw", fill="#8a949c", text=f"{W/1000:.2f} × {H/1000:.2f} m")

    def _sol_paneli_ac_kapa(self):
        self._panel_gizle_goster("sol")

    # sürükleyerek verilebilecek en büyük ölçüler (piksel)
    SOL_MAX, SAG_MAX, KONSOL_MAX = 480, 420, 260

    SOL_ILK = 400

    def _sol_ilk_genislik(self):
        """Açılışta sol (girdi + 3B) paneli daha geniş açar."""
        try:
            if self._pw_icinde(self._sol_kap):
                x, y = self._pw.sash_coord(0)
                if x < self.SOL_ILK:
                    self._pw.sash_place(0, self.SOL_ILK, y)
        except Exception:
            pass

    def _pw_sinirla(self, _e=None):
        """Çizgiden çekilen panelleri üst sınırda tutar (gereksiz büyümesin)."""
        try:
            pw, pv = self._pw, self._pw_v
            panes = [str(x) for x in pw.panes()]
            W = pw.winfo_width()
            if str(self._sol_kap) in panes:
                x, y = pw.sash_coord(0)
                if x > self.SOL_MAX:
                    pw.sash_place(0, self.SOL_MAX, y)
            if str(self._sol2_kap) in panes:
                i = len(panes) - 2
                x, y = pw.sash_coord(i)
                if W - x > self.SAG_MAX:
                    pw.sash_place(i, W - self.SAG_MAX, y)
            H = pv.winfo_height()
            if len(pv.panes()) > 1:
                x, y = pv.sash_coord(0)
                if H - y > self.KONSOL_MAX:
                    pv.sash_place(0, x, H - self.KONSOL_MAX)
        except Exception:
            pass

    def _arayuz(self):
        # üç bölme: sol girdiler | orta (sekmeler + komut penceresi) | sağ 'Seçili parça'; kenarlardan sürüklenir
        self._pw = pw = tk.PanedWindow(self, orient="horizontal", sashwidth=6, sashrelief="raised", bd=0,
                                       opaqueresize=True)
        pw.pack(fill="both", expand=True)
        for w_ in (pw,):
            w_.bind("<B1-Motion>", self._pw_sinirla, add="+")
            w_.bind("<ButtonRelease-1>", self._pw_sinirla, add="+")
        sol = self._kaydirma_paneli("left", pw)      # girdiler: akslar, rapor, düğmeler
        self._sol_kap = sol.master.master
        h_ = ttk.Frame(sol); h_.pack(fill="x", pady=(0, 6))
        ttk.Button(h_, text="◂ Gizle", width=9, command=self._sol_paneli_ac_kapa).pack(side="right")
        sag = ttk.Frame(pw, padding=(4, 10, 4, 10))
        pw.add(sag, minsize=420, stretch="always")
        sol2 = self._kaydirma_paneli("right", pw)    # yalnız 'Seçili parça' (üstteki sekmelerle birlikte açık kalır)
        self._sol2_kap = sol2.master.master
        h2_ = ttk.Frame(sol2); h2_.pack(fill="x", pady=(0, 6))
        ttk.Button(h2_, text="Gizle ▸", width=9, command=self._parca_paneli_ac_kapa).pack(side="right")
        self._ince = {}
        for t_, m_, c_ in (("sol", "▸", self._sol_paneli_ac_kapa), ("sag", "◂", self._parca_paneli_ac_kapa)):
            f_ = ttk.Frame(pw)
            ttk.Button(f_, text=m_, width=2, command=c_).pack(fill="x", pady=(10, 0))
            self._ince[t_] = f_
        self._sag_cerceve = sag
        # orta bölme: üstte sekmeler, altta komut / işlem günlüğü (aralarındaki çizgiden sürüklenir)
        self._pw_v = tk.PanedWindow(sag, orient="vertical", sashwidth=6, sashrelief="raised", bd=0, opaqueresize=True)
        self._pw_v.pack(fill="both", expand=True)
        self._pw_v.bind("<B1-Motion>", self._pw_sinirla, add="+")
        self._pw_v.bind("<ButtonRelease-1>", self._pw_sinirla, add="+")
        self.after(300, self._sol_ilk_genislik)
        self.after(500, self._pw_sinirla)
        ust_f = ttk.Frame(self._pw_v)
        self._pw_v.add(ust_f, minsize=260, stretch="always")
        # sekmeler: sol panelden taşınan girdi grupları üstteki sekmelerde (Profil / Cam / Statik)
        self._nb = ttk.Notebook(ust_f, style="Gizli.TNotebook")
        sf_p, sp_ = self._sekme_sayfasi(self._nb)
        sf_c, sc_ = self._sekme_sayfasi(self._nb)
        sf_s, ss_ = self._sekme_sayfasi(self._nb, True)

        # Akslar
        g1 = ttk.LabelFrame(sol, text=" Akslar ", padding=8)
        g1.pack(fill="x")
        self._alan(g1, "Aks aralıkları (mm)", "cols", "5x1200", 0, w=26)
        self._alan(g1, "Kat yükseklikleri (mm)", "rows", "3x3000", 1, w=26)
        ttk.Label(g1, text="Örnek: 5x1200; 1500; 2x1000", foreground="#7a858e") \
            .grid(row=2, column=0, columnspan=2, sticky="w", pady=(4, 0))

        # Katalog
        gk = ttk.LabelFrame(sp_, text=" Profil kataloğu ", padding=8)
        gk.pack(fill="x", pady=(8, 0))
        ust = ttk.Frame(gk)
        ust.pack(fill="x")
        ttk.Button(ust, text="Katalog yükle...", command=self.katalog_yukle).pack(side="left")
        ttk.Button(ust, text="Ayarlar / Komut...", command=self._ayar_penceresi).pack(side="right")
        self._btn_tema = ttk.Button(ust, text="Koyu tema", width=10, command=self._tema_degistir)
        self._btn_tema.pack(side="right", padx=(0, 4))
        self.lbl_katalog = ttk.Label(ust, text="yüklenmedi", foreground="#7a858e")
        self.lbl_katalog.pack(side="left", padx=8)
        alt = ttk.Frame(gk)
        alt.pack(fill="x", pady=(6, 0))
        alt.columnconfigure(1, weight=1)
        self.cb = {}
        for i, (k, e) in enumerate((("sistem", "Sistem"), ("dikey", "Dikey"), ("yatay", "Yatay"))):
            ttk.Label(alt, text=e).grid(row=i, column=0, sticky="w", pady=2)
            cb = ttk.Combobox(alt, state="readonly", width=30)
            cb.grid(row=i, column=1, sticky="we", padx=(6, 0), pady=2)
            self.cb[k] = cb
        self.cb["sistem"].bind("<<ComboboxSelected>>", self._sistem_degisti)
        self.cb["dikey"].bind("<<ComboboxSelected>>", lambda _e: self._profil_sec("dikey"))
        self.cb["yatay"].bind("<<ComboboxSelected>>", lambda _e: self._profil_sec("yatay"))

        # Profiller
        g2 = ttk.LabelFrame(sp_, text=" Seçili profiller (elle de düzenlenebilir) ", padding=8)
        g2.pack(fill="x", pady=8)
        for j, b in enumerate(("", "Ad", "Genişlik", "kg/m")):
            ttk.Label(g2, text=b).grid(row=0, column=j, sticky="w", padx=2)
        for i, (k, ad, gen, kg) in enumerate((
                ("dikey", "Dikey kayıt 60x150", 60, 5.2),
                ("yatay", "Yatay kayıt 60x80", 60, 3.1)), start=1):
            ttk.Label(g2, text=k.capitalize()).grid(row=i, column=0, sticky="w")
            for j, (suf, val, w) in enumerate(
                    (("ad", ad, 18), ("g", gen, 7), ("kg", kg, 7)), start=1):
                self.v[f"{k}_{suf}"] = tk.StringVar(value=str(val))
                e = ttk.Entry(g2, textvariable=self.v[f"{k}_{suf}"], width=w)
                e.grid(row=i, column=j, padx=2, pady=2)
                e.bind("<Return>", lambda _e: self.hesapla())
            ttk.Button(g2, text="Kesit...", width=8,
                       command=lambda t=k: self.dxf_kesit_al(t)).grid(row=i, column=4, padx=(4, 0))
        self.lbl_kesit = ttk.Label(g2, text="", foreground="#7a858e", wraplength=340,
                                   justify="left")
        self.lbl_kesit.grid(row=3, column=0, columnspan=5, sticky="w", pady=(6, 0))

        # Üretim
        g3 = ttk.LabelFrame(sp_, text=" Üretim (bilgi — girişler 'Çubuk planı' sekmesinde) ", padding=8)
        g3.pack(fill="x")
        for e_ in (self._alan(g3, "Stok çubuk boyu (mm)", "cubuk", 6000, 0, w=10),
                   self._alan(g3, "Testere payı (mm)", "testere", 4, 1, w=10),
                   self._alan(g3, "Sipariş eki (%)", "siparis_ek", 0, 3, w=10)):
            e_.configure(state="disabled")
        self.lbl_stok_ozet = ttk.Label(g3, text="", foreground="#7a858e", wraplength=330, justify="left")
        self.lbl_stok_ozet.grid(row=2, column=0, columnspan=2, sticky="w", pady=(4, 0))

        self._sema_kur(sol2)
        gcp = ttk.LabelFrame(sol2, text=" Cam bilgisi ", padding=8)
        gcp.pack(fill="x", pady=(0, 8))
        self._cp_yapi = ttk.Label(gcp, text="", font=("Segoe UI", 10, "bold"), wraplength=240, justify="left")
        self._cp_yapi.pack(anchor="w")
        self._cp_giris = ttk.Frame(gcp)                      # düzenlenebilir alanlar: Cam sekmesiyle aynı değişkenler
        self._cp_giris.pack(fill="x", pady=(4, 2))
        self._cp_bilgi = ttk.Label(gcp, text="", wraplength=240, justify="left")
        self._cp_bilgi.pack(anchor="w", pady=(2, 0))
        self._cp_uyari = ttk.Label(gcp, text="", foreground="#c0392b", wraplength=240, justify="left")
        self._cp_uyari.pack(anchor="w", pady=(4, 0))

        gp = ttk.LabelFrame(sol2, text=" Seçili parça ", padding=8)
        gp.pack(fill="x", pady=(0, 8))
        self._pp_baslik = ttk.Label(gp, text="Kesitte ya da cephede bir parçaya tıklayın",
                                    font=("Segoe UI", 10, "bold"), wraplength=240, justify="left")
        self._pp_baslik.pack(anchor="w")
        self._pp_bilgi = ttk.Label(gp, text="", wraplength=240, justify="left")
        self._pp_bilgi.pack(anchor="w", pady=(2, 0))
        self._pp_lb_et = ttk.Label(gp, text="Alternatifler:")
        self._pp_lb_et.pack(anchor="w", pady=(6, 0))
        lf = ttk.Frame(gp)
        lf.pack(fill="x")
        self._pp_lb = tk.Listbox(lf, height=8, width=30, exportselection=False, font=("Segoe UI", 9))
        lsb = ttk.Scrollbar(lf, orient="vertical", command=self._pp_lb.yview)
        self._pp_lb.configure(yscrollcommand=lsb.set)
        self._pp_lb.pack(side="left", fill="x", expand=True)
        lsb.pack(side="left", fill="y")
        self._pp_lb.bind("<Double-Button-1>", lambda _e: self._parca_degistir())
        self._pp_lb.bind("<<ListboxSelect>>", lambda _e: self._onizleme_planla())
        self._pp_onz = tk.Canvas(gp, height=170, highlightthickness=1, highlightbackground="#555a60", bg="#1e2226")
        self._pp_onz.pack(fill="x", pady=(6, 0))
        pb = ttk.Frame(gp)
        pb.pack(fill="x", pady=(6, 0))
        ttk.Button(pb, text="Bununla değiştir", command=self._parca_degistir).pack(side="left", fill="x", expand=True)
        ttk.Button(pb, text="Orijinal", command=self._parca_orijinal).pack(side="left", padx=(6, 0))
        yb = ttk.Frame(gp)
        yb.pack(fill="x", pady=(6, 0))
        ttk.Label(yb, text="Yön:").pack(side="left")
        for metin, eylem in (("↔ Sağ-sol", "x"), ("↕ İç-dış", "y"), ("↻ 90°", "90"), ("↻ 180°", "180")):
            ttk.Button(yb, text=metin, width=8, command=lambda e_=eylem: self._parca_yon(e_)).pack(side="left", padx=(4, 0))
        mb_ = ttk.Frame(gp)
        mb_.pack(fill="x", pady=(6, 0))
        ttk.Button(mb_, text="↺ Parça konumu", command=self._kayma_sifirla).pack(side="left")
        ttk.Button(mb_, text="↺ Aksın tüm ayarı", command=lambda: self._kayma_sifirla(True)).pack(side="left", padx=(4, 0))
        ttk.Label(mb_, text="Shift+sürükle: parçayı kenara yapıştır", foreground="#7a858e").pack(side="left", padx=(8, 0))
        mb2_ = ttk.Frame(gp)
        mb2_.pack(fill="x", pady=(4, 0))
        ttk.Button(mb2_, text="Bu aks/hat ayarını tüm akslara / hatlara uygula",
                   command=self._aks_ayari_tumune).pack(side="left")
        tb_ = ttk.Frame(gp)            # sistem tipi ayrımı kaldırıldı: gizli (pack edilmez)
        self._pp_tip_et = ttk.Label(tb_, text="Bu detayın sistem tipi:")
        self._pp_tip_et.pack(side="left")
        self._pp_tip_v = tk.StringVar(value="")
        self._pp_tip_cb = ttk.Combobox(tb_, textvariable=self._pp_tip_v, state="readonly", width=14, values=())
        self._pp_tip_cb.pack(side="left", padx=(6, 0))
        self._pp_tip_cb.bind("<<ComboboxSelected>>", lambda _e: self._pp_tip_uygula())
        self._pp_tip_g = None
        kb = ttk.Frame(gp)
        kb.pack(fill="x", pady=(6, 0))
        ttk.Button(kb, text="Yalnız bu aksta / hatta çıkar", command=lambda: self._parca_cikar_btn("bu")).pack(
            side="left", fill="x", expand=True)
        ttk.Button(kb, text="Bu aks/hatta geri koy", command=lambda: self._parca_cikar_btn("bu_geri")).pack(
            side="left", padx=(6, 0))
        kb2 = ttk.Frame(gp)
        kb2.pack(fill="x", pady=(4, 0))
        ttk.Button(kb2, text="Tüm sistemden çıkar", command=lambda: self._parca_cikar_btn(True)).pack(
            side="left", fill="x", expand=True)
        ttk.Button(kb2, text="Hepsini geri koy", command=lambda: self._parca_cikar_btn(None)).pack(
            side="left", padx=(6, 0))
        self._pp_durum = ttk.Label(gp, text="", foreground="#7a858e", wraplength=240, justify="left")
        self._pp_durum.pack(anchor="w", pady=(4, 0))

        gc = ttk.LabelFrame(sc_, text=" Cam ", padding=8)
        gc.pack(fill="x", pady=(8, 0))
        self._alan(gc, "Yapı (mm, dıştan içe)", "cam_yapi", "6+20+6", 0, w=16)
        ttk.Label(gc, text="PVB kalınlığı (mm)").grid(row=1, column=0, sticky="w", pady=2)
        self.v["pvb"] = tk.StringVar(value="0,76")
        cb_pvb = ttk.Combobox(gc, textvariable=self.v["pvb"], values=("0,76", "1,52"), width=8)
        cb_pvb.grid(row=1, column=1, sticky="w", padx=(6, 0), pady=2)
        cb_pvb.bind("<<ComboboxSelected>>", lambda _e: self.hesapla())
        self.v["ilk_ic"] = tk.BooleanVar(value=False)
        ttk.Checkbutton(gc, text="İlk katman iç yüzde", variable=self.v["ilk_ic"],
                        command=self.hesapla).grid(row=2, column=0, columnspan=2, sticky="w")
        self.v["kural_oto"] = tk.BooleanVar(value=True)
        ttk.Checkbutton(gc, text="Detayı kural tablosundan seç", variable=self.v["kural_oto"],
                        command=self.hesapla).grid(row=3, column=0, columnspan=2, sticky="w")
        self._alan(gc, "Spandrel yapısı (boşsa düz panel)", "spandrel_yapi", "", 4, w=16)
        self._alan(gc, "Sandviç panel kalınlık (mm)", "pn_sandvic_kal", f"{PANEL_TIPLERI['sandvic']['kal']:g}", 5, w=16)
        self._alan(gc, "Sandviç panel (kg/m²)", "pn_sandvic_kg", f"{PANEL_TIPLERI['sandvic']['kg_m2']:g}", 6, w=16)
        self._alan(gc, "Levha kalınlık (mm)", "pn_levha_kal", f"{PANEL_TIPLERI['levha']['kal']:g}", 7, w=16)
        self._alan(gc, "Levha (kg/m²)", "pn_levha_kg", f"{PANEL_TIPLERI['levha']['kg_m2']:g}", 8, w=16)
        ttk.Label(gc, text="Isı bariyeri").grid(row=9, column=0, sticky="w", pady=2)
        self.v["bariyer_elle"] = tk.StringVar(value=BARIYER_OTO)
        self.cb_bariyer = ttk.Combobox(gc, textvariable=self.v["bariyer_elle"], values=(BARIYER_OTO,),
                                       width=22, state="readonly")
        self.cb_bariyer.grid(row=9, column=1, sticky="w", padx=(6, 0), pady=2)
        self.cb_bariyer.bind("<<ComboboxSelected>>", lambda _e: self.hesapla())
        ttk.Separator(gc).grid(row=10, column=0, columnspan=2, sticky="we", pady=(6, 4))
        self._alan(gc, "Cam payı – dikey yan (mm)", "cam_payi", 6, 11, w=16)
        self._alan(gc, "Cam payı – yatay (mm, boş=dikey)", "cam_payi_y", "", 12, w=16)
        for r_, et_, an_, vs_ in ((13, "Cam–aks mesafesi dikey (mm)", "cam_aks_d", CAM_AKS_VARSAYILAN),
                                  (14, "Cam–aks mesafesi yatay (mm)", "cam_aks_y", CAM_AKS_VARSAYILAN),
                                  (15, "Cam oturma payı (mm, boş=sistem)", "cam_oturma", "")):
            e_ = self._alan(gc, et_, an_, vs_, r_, w=16)
            e_.bind("<Return>", lambda _e: self._cam_ui_degisti(), add="+")
            e_.bind("<FocusOut>", lambda _e: self._cam_ui_degisti(), add="+")
        self.lbl_cam = ttk.Label(gc, text="", foreground="#7a858e", wraplength=340, justify="left")
        self.lbl_cam.grid(row=16, column=0, columnspan=2, sticky="w", pady=(4, 0))
        ttk.Separator(gc).grid(row=17, column=0, columnspan=2, sticky="we", pady=(6, 4))
        self.lbl_katman = ttk.Label(gc, text="Katmanlar (profil gagasından dışa doğru; her katmana istediğin klasörden parça)")
        self.lbl_katman.grid(row=18, column=0, columnspan=2, sticky="w")
        self._zincir_cb = {}
        for i_ in range(1, 6):
            an_ = f"z{i_}"
            ttk.Label(gc, text=f"{i_}. katman").grid(row=18 + i_, column=0, sticky="w", pady=2)
            self.v[an_] = tk.StringVar(value=ZINCIR_OTO if i_ == 1 else ZINCIR_YOK)
            cb_ = ttk.Combobox(gc, textvariable=self.v[an_], values=(self.v[an_].get(),), width=30, state="readonly")
            cb_.grid(row=18 + i_, column=1, sticky="w", padx=(6, 0), pady=2)
            cb_.bind("<<ComboboxSelected>>", lambda _e: self._zincir_degisti())
            self._zincir_cb[an_] = cb_
        self.lbl_zincir = ttk.Label(gc, text="", foreground="#7a858e", wraplength=340, justify="left")
        self.lbl_zincir.grid(row=24, column=0, columnspan=2, sticky="w", pady=(4, 0))
        ttk.Label(gc, text="Cam takozu").grid(row=25, column=0, sticky="w", pady=2)
        self.v["takoz_elle"] = tk.StringVar(value=ZINCIR_OTO)
        self.cb_takoz = ttk.Combobox(gc, textvariable=self.v["takoz_elle"], values=(ZINCIR_OTO, ZINCIR_YOK), width=30,
                                     state="readonly")
        self.cb_takoz.grid(row=25, column=1, sticky="w", padx=(6, 0), pady=2)
        self.cb_takoz.bind("<<ComboboxSelected>>", lambda _e: self.hesapla())
        ttk.Button(gc, text="Takoz ağırlık kuralları…", command=self._takoz_kural_diyalog).grid(
            row=26, column=0, columnspan=2, sticky="w", pady=2)
        self.lbl_takoz = ttk.Label(gc, text="", foreground="#7a858e", wraplength=340, justify="left")
        self.lbl_takoz.grid(row=27, column=0, columnspan=2, sticky="w")
        ttk.Separator(gc).grid(row=28, column=0, columnspan=2, sticky="we", pady=(6, 4))
        self.lbl_aks_sec = ttk.Label(gc, text="Seçili aks/hat: yok (üstteki Aks / Hat kutularından ya da kesitte tıklayarak seçin)",
                                     foreground="#e65100", wraplength=340, justify="left")
        self.lbl_aks_sec.grid(row=29, column=0, columnspan=2, sticky="w")
        ttk.Label(gc, text="Seçili hatta cam takozu").grid(row=30, column=0, sticky="w", pady=2)
        self._takoz_hat_var = tk.StringVar(value="(genel)")
        self.cb_takoz_hat = ttk.Combobox(gc, textvariable=self._takoz_hat_var, values=("(genel)", "(yok)"), width=30,
                                         state="disabled")
        self.cb_takoz_hat.grid(row=30, column=1, sticky="w", padx=(6, 0), pady=2)
        self.cb_takoz_hat.bind("<<ComboboxSelected>>", lambda _e: self._takoz_hat_degisti())
        ttk.Button(gc, text="Bu seçimi tüm hatlara uygula", command=self._takoz_hat_tumu).grid(
            row=31, column=0, columnspan=2, sticky="w", pady=2)
        ttk.Label(gc, text="Takoz, hattın üstündeki camların altına konur (cam başına 2 adet). '(genel)' = yukarıdaki "
                           "takoz seçimi / ağırlık kuralı; '(yok)' = bu hatta takoz yok.",
                  foreground="#7a858e", wraplength=340, justify="left").grid(row=32, column=0, columnspan=2, sticky="w")

        self._adim_btn = ttk.Button(ss_, text="📝 Hesap adımları (not defteri)", command=self._adimlar_goster)
        self._adim_btn.pack(fill="x")
        ttk.Button(ss_, text="⚖ SAP2000 ile karşılaştır...", command=self._sap_karsilastir).pack(fill="x", pady=(3, 0))
        gr = ttk.LabelFrame(ss_, text=" Statik — rüzgar yükü (ön analiz) ", padding=8)
        gr.pack(fill="x", pady=(8, 0))
        self._alan(gr, "Rüzgar yükü (kN/m²)", "ruzgar_kn", 1.0, 0, w=10)
        self._alan(gr, "Karakt. gerilme f0 (kg/cm²)", "f0", 1600, 1, w=10)
        self._alan(gr, "Cam ağırlığı (kg/m², boş=otomatik)", "cam_kg", "", 2, w=10)
        ttk.Label(gr, text="Dikey profil mesnet şeması").grid(row=3, column=0, sticky="w", pady=2)
        self.v["dik_mesnet"] = tk.StringVar(value=MESNET["basit"][3])
        cb_m = ttk.Combobox(gr, textvariable=self.v["dik_mesnet"], state="readonly", width=30,
                            values=[v_[3] for v_ in MESNET.values()])
        cb_m.grid(row=3, column=1, sticky="we", padx=(6, 0), pady=2)
        cb_m.bind("<<ComboboxSelected>>", lambda _e: self.hesapla())
        self._alan(gr, "Ankraj aralığı (mm, boş = kat yüksekliği)", "ankraj_mm", "", 4, w=10)
        self.lbl_analiz = ttk.Label(gr, text="", foreground="#7a858e", wraplength=340, justify="left")
        self.lbl_analiz.grid(row=5, column=0, columnspan=2, sticky="w", pady=(4, 0))

        gy_ = ttk.LabelFrame(ss_, text=" Rüzgar yükü yardımcısı (TS EN 1991-1-4, yaklaşık) ", padding=8)
        gy_.pack(fill="x", pady=(8, 0))
        self._alan(gy_, "Bina yüksekliği z (m)", "bina_h", 20, 0, w=10)
        ttk.Label(gy_, text="Arazi kategorisi").grid(row=1, column=0, sticky="w", pady=2)
        self.v["arazi"] = tk.StringVar(value=ARAZI["III"][0])
        ttk.Combobox(gy_, textvariable=self.v["arazi"], state="readonly", width=30,
                     values=[v_[0] for v_ in ARAZI.values()]).grid(row=1, column=1, sticky="we", padx=(6, 0), pady=2)
        self._alan(gy_, "Temel rüzgar hızı vb (m/s)", "vb", 28, 2, w=10)
        ttk.Label(gy_, text="Cephe bölgesi").grid(row=3, column=0, sticky="w", pady=2)
        self.v["ruzgar_bolge"] = tk.StringVar(value=RUZGAR_BOLGE["orta"][0])
        ttk.Combobox(gy_, textvariable=self.v["ruzgar_bolge"], state="readonly", width=30,
                     values=[v_[0] for v_ in RUZGAR_BOLGE.values()]).grid(row=3, column=1, sticky="we", padx=(6, 0), pady=2)
        ttk.Button(gy_, text="Hesapla → Rüzgar yükü kutusuna yaz", command=self._ruzgar_yardimci).grid(
            row=4, column=0, columnspan=2, sticky="we", pady=(6, 0))
        self.lbl_ruzgar = ttk.Label(gy_, text="vb: Ulusal Ek rüzgar haritasından alın (varsayılan 28 m/s yaklaşık bir değerdir). "
                                              "Sonuç ön değerdir; nihai yük statik hesapla belirlenir.",
                                    foreground="#7a858e", wraplength=340, justify="left")
        self.lbl_ruzgar.grid(row=5, column=0, columnspan=2, sticky="w", pady=(4, 0))
        self._statik_kur(ss_)

        g4 = ttk.LabelFrame(sol, text=" Rapor ", padding=8)
        g4.pack(fill="x", pady=(8, 0))
        self._alan(g4, "Proje adı", "proje_adi", "", 0, w=26)
        self._alan(g4, "Sistem adı", "sistem_adi", "", 1, w=26)

        bf = ttk.Frame(sol)
        bf.pack(fill="x", pady=12)
        pf = ttk.Frame(bf)
        pf.pack(fill="x", pady=(0, 8))
        ttk.Button(pf, text="Yeni proje (Ctrl+N)", command=self.yeni_proje).pack(side="left", padx=(0, 6))
        ttk.Button(pf, text="Proje aç... (Ctrl+O)", command=self.proje_ac).pack(
            side="left", fill="x", expand=True)
        self._son_btn = ttk.Button(pf, text="▲", width=3, command=self._son_projeler_menu)
        self._son_btn.pack(side="left", padx=(2, 0))
        ttk.Button(pf, text="Proje kaydet (Ctrl+S)", command=self.proje_kaydet).pack(
            side="left", fill="x", expand=True, padx=(6, 0))
        ttk.Button(pf, text="Farklı kaydet...", command=lambda: self.proje_kaydet(farkli=True)).pack(
            side="left", padx=(4, 0))
        ttk.Button(pf, text="Sürümler...", command=self._surumler_ac).pack(side="left", padx=(4, 0))
        ttk.Button(pf, text="Sistem denetimi...", command=self._sistem_denetim_ac).pack(side="left", padx=(4, 0))
        def _kisa(geri):
            def f_(e):
                if e.widget.winfo_class() in ("Text",):
                    return None
                self._gerial_ileri(geri)
                return "break"
            return f_
        self.bind_all("<Control-z>", _kisa(True))
        self.bind_all("<Control-y>", _kisa(False))
        self.bind_all("<Control-Shift-Z>", _kisa(False))
        self.bind_all("<Control-s>", lambda _e: self.proje_kaydet())
        self.bind_all("<Control-o>", lambda _e: self.proje_ac())
        self.bind_all("<Control-n>", lambda _e: self.yeni_proje())
        ttk.Button(bf, text="Hesapla", style="Ana.TButton",
                   command=self.hesapla).pack(fill="x")
        ttk.Button(bf, text="CSV olarak kaydet...", style="Ana.TButton",
                   command=self.csv_kaydet).pack(fill="x", pady=(6, 0))
        ttk.Button(bf, text="DXF olarak kaydet...", style="Ana.TButton",
                   command=self.dxf_kaydet).pack(fill="x", pady=(6, 0))
        ttk.Button(bf, text="PDF rapor kaydet...", style="Ana.TButton",
                   command=self.pdf_kaydet).pack(fill="x", pady=(6, 0))
        ttk.Button(bf, text="Detay kitapçığı (PDF)...", style="Ana.TButton",
                   command=self.detay_kitapcigi_kaydet).pack(fill="x", pady=(6, 0))
        ttk.Button(bf, text="Siparişle karşılaştır...", style="Ana.TButton",
                   command=self._siparis_karsilastir_ac).pack(fill="x", pady=(6, 0))

        # Sağ: altta komut satırı / işlem günlüğü, üstte sekmeler
        self._konsol_kur(self._pw_v)
        nb = self._nb
        self._sekme_seridi = _SekmeSeridi(ust_f, nb)
        self._sekme_seridi.pack(fill="x", pady=(0, 4))
        nb.pack(fill="both", expand=True)

        t1 = ttk.Frame(nb)
        nb.add(t1, text="Cephe görünüşü")
        # sabit bilgilendirme çubuğu: kısayol ipuçları; işlem günlüğündeki son mesaj birkaç saniye burada görünür
        self._bilgi_cv = _BilgiCubugu(t1)
        self._bilgi_cv.pack(fill="x")
        self._bilgi_ozet = self._bilgi_cv.ozet
        self._bilgi_ozet.bind("<Button-1>", lambda _e: self._uyari_goster())
        self._bilgi_koor = self._bilgi_cv.koor
        self._bilgi_lbl = self._bilgi_cv.sol
        self._bilgi_lbl.configure(text=self.BILGI_VARSAYILAN)
        try:
            self._bilgi_cv.tema(TEMALAR[self.tema]["baslik"], TEMALAR[self.tema]["soluk"],
                                "#555d65" if self.tema == "koyu" else "#c4cbd1")
        except (KeyError, AttributeError):
            pass
        cb_ = ttk.Frame(t1)
        cb_.pack(fill="x")
        ttk.Button(cb_, text="⇄ Aynala", command=self._cephe_aynala).pack(side="left", padx=6, pady=4)
        ttk.Button(cb_, text="↶ Geri", width=7, command=lambda: self._gerial_ileri(True)).pack(side="left", padx=(0, 2))
        ttk.Button(cb_, text="↷ İleri", width=7, command=lambda: self._gerial_ileri(False)).pack(side="left", padx=(0, 6))
        ttk.Button(cb_, text="Parça / boy ayarları…", command=self._sistem_tip_dialog).pack(side="left", padx=2)
        ttk.Button(cb_, text="⟳ Yenile", command=self.gorunum_yenile).pack(side="left", padx=(2, 0))
        ttk.Button(cb_, text="⟲ Uyarla", command=self.proje_uyarla).pack(side="left", padx=(2, 0))
        ttk.Label(cb_, text="Aks:").pack(side="left", padx=(10, 2))
        self.cb_aks_d = ttk.Combobox(cb_, width=5, state="readonly", values=())
        self.cb_aks_d.pack(side="left")
        self.cb_aks_d.bind("<<ComboboxSelected>>", lambda _e: self._aks_cb_secildi("d"))
        ttk.Label(cb_, text="Hat:").pack(side="left", padx=(8, 2))
        self.cb_aks_h = ttk.Combobox(cb_, width=6, state="readonly", values=())
        self.cb_aks_h.pack(side="left")
        self.cb_aks_h.bind("<<ComboboxSelected>>", lambda _e: self._aks_cb_secildi("h"))
        ttk.Button(cb_, text="◎ Git", width=6, command=lambda: self._aks_git()).pack(side="left", padx=(4, 0))
        self._olcu_btn = ttk.Button(cb_, text="📏 Ölç", width=7, command=self._olcu_degistir)
        self._olcu_btn.pack(side="left", padx=(4, 0))
        self._olcu_temizle_btn = ttk.Button(cb_, text="🧹 Temizle", width=10, command=self._olcu_temizle)
        self._olcu_temizle_btn.pack(side="left", padx=(2, 0))
        ttk.Button(cb_, text="⇄ Önce/Sonra", width=12, command=self._once_sonra).pack(side="left", padx=(4, 0))
        ttk.Button(cb_, text="✕", width=3, command=lambda: self._aks_sec_ayarla(None, None, temizle=True)).pack(
            side="left", padx=(2, 0))
        self.lbl_sec = ttk.Label(cb_, text="", foreground="#e65100")
        self.lbl_sec.pack(side="left", padx=8)
        ttk.Label(cb_, text="Ctrl+tık / Ctrl+sürükle: çoklu seçim",
                  foreground="#7a858e").pack(side="left")
        self.cv = tk.Canvas(t1, bg="white", highlightthickness=0)
        self.cv.pack(fill="both", expand=True)
        self.cv.bind("<Configure>", lambda _e: self.gor.boyut())
        self.gor = Gorunum(self.cv, self.ciz)
        self.gor.bant_ac = True
        self._olcular, self._olcu_acik, self._olcu_ilk = [], False, None
        self.gor.olcu_cb = self._olcu_tikla
        self.gor.olcu_hareket = self._olcu_hareket
        self.cv.bind("<Motion>", self._olcu_gez, add="+")
        self.cv.bind("<BackSpace>", lambda _e: self._olcu_sil(), add="+")
        self.cv.bind("<Delete>", lambda _e: self._olcu_sil(True), add="+")
        self._fare_bagla(self.cv, "cephe")
        self.cv.bind("<Escape>", lambda _e: (self._olcu_kapat() if getattr(self, "_olcu_acik", False) else
                                             (setattr(self, "_odak", None), self._sec_temizle(), self.ciz())))

        self._editor_arayuz(nb)

        tk_ = ttk.Frame(nb)
        nb.add(tk_, text="Kesit detayı")
        kb_ = ttk.Frame(tk_)
        kb_.pack(fill="x")
        ttk.Button(kb_, text="⇄ Aynala", command=self._kesit_aynala).pack(side="left", padx=6, pady=4)
        ttk.Button(kb_, text="⟳ Güncelle", command=self._kesit_guncelle).pack(side="left", padx=(0, 4), pady=4)
        ttk.Button(kb_, text="▣ Tek detay", command=lambda: self._kesit_guncelle(False)).pack(side="left", padx=(0, 8), pady=4)
        ttk.Label(kb_, text="Güncelle: cephedeki farklı akslar (düşey/yatay ayrı) | Aynala: iç/dış yön, PDF'e de yansır",
                  foreground="#7a858e").pack(side="left")
        self.cv_kesit = tk.Canvas(tk_, bg="white", highlightthickness=0)
        self.cv_kesit.pack(fill="both", expand=True)
        self.cv_kesit.bind("<Configure>", lambda _e: self.gor_k.boyut())
        self.gor_k = Gorunum(self.cv_kesit, self.ciz_kesit)
        self.gor.tasi_cb = lambda faz, e: self._tasi_cb("cephe", faz, e)
        self.gor.cift_cb = self._cift_odak
        self.gor_k.tasi_cb = lambda faz, e: self._tasi_cb("kesit", faz, e)
        self._fare_bagla(self.cv_kesit, "kesit")
        for _cv_ in (self.cv, self.cv_kesit):
            if _cv_ is None:
                continue
            _cv_.bind("<Button-1>", lambda ev: ev.widget.focus_set(), add="+")
            for _k_, _dx_, _dy_ in (("Left", -1, 0), ("Right", 1, 0), ("Up", 0, 1), ("Down", 0, -1)):
                for _m_ in ("", "Shift-"):
                    _cv_.bind(f"<{_m_}{_k_}>", lambda ev, x=_dx_, y=_dy_: self._ok_ayar(ev, x, y))

        self.tr_kesim = self._tablo(nb, "Kesim listesi",
                                    ("Profil", "Boy (mm)", "Adet", "Toplam boy (m)", "Ağırlık (kg)"),
                                    (220, 90, 70, 110, 100))
        self.tr_cubuk = self._cubuk_sekmesi(nb)
        self.tr_cam = self._tablo(nb, "Cam / spandrel",
                                  ("Tip", "Ölçü (mm)", "Adet", "m²"), (90, 200, 80, 90))
        self.tr_mal = self._tablo(nb, "Malzeme listesi",
                                  tuple(k[0] for k in MAL_KOLON), (260, 170, 60, 110, 100))
        self.tr_parca = self._tablo(nb, "Parça listesi",
                                    ("Parça", "Hat", "Sınıf", "Adet/hat", "Toplam (m)", "kg/m", "kg"),
                                    (160, 70, 90, 70, 90, 70, 80))

        t5 = ttk.Frame(nb)
        nb.add(t5, text="Özet")
        self.txt = tk.Text(t5, font=("Consolas", 10), bg="white", relief="flat",
                           padx=14, pady=12, wrap="word")
        self.txt.pack(fill="both", expand=True)
        self._yeni_sekmeler(nb)
        nb.insert(1, sf_p, text="Profil")
        nb.insert(2, sf_c, text="Cam")
        nb.insert(3, sf_s, text="Statik")
        self._mh_kur(nb)
        self._cam_panel_girdi_kur()
        self._sekme_seridi.yenile()
        self._uc_kur(sol)

    # ================================================== Mühendislik / kontrol / üretim / proje sekmeleri
    def _agac(self, ana, kolonlar, yukseklik=6):
        """kolonlar: [(anahtar, başlık, genişlik, hiza)] → Treeview"""
        tr = ttk.Treeview(ana, columns=[k[0] for k in kolonlar], show="headings", height=yukseklik)
        for k, ad, w, hz in kolonlar:
            tr.heading(k, text=ad)
            tr.column(k, width=w, anchor=hz, stretch=False)
        return tr

    @staticmethod
    def _agac_doldur(tr, satirlar, etiketler=None):
        for i in tr.get_children():
            tr.delete(i)
        for k, r in enumerate(satirlar):
            tr.insert("", "end", values=r, tags=((etiketler[k],) if etiketler else ()))
        try:
            tr.configure(height=max(2, min(14, len(satirlar) + 1)))
        except tk.TclError:
            pass

    def _mh_kur(self, nb):
        """Hesaplar / Kontrol / Üretim / Proje sekmelerini ekler (Statik sekmesinden sonra)."""
        # ---- Hesaplar (cam, ankraj, genleşme, ısıl)
        sf_h, sh_ = self._sekme_sayfasi(nb, True)
        gc_ = ttk.LabelFrame(sh_, text=" 1 · Cam kontrolü (rüzgar altında gerilme/sehim, ağırlık, boyut) ", padding=8)
        gc_.pack(fill="x")
        ttk.Label(gc_, text="Cam türü").grid(row=0, column=0, sticky="w", pady=2)
        self.v["cam_dayanim"] = tk.StringVar(value=HESAP_VARSAYILAN["cam_dayanim"])
        cbx = ttk.Combobox(gc_, textvariable=self.v["cam_dayanim"], state="readonly", width=22,
                           values=[v_[0] for v_ in CAM_DAYANIM.values()])
        cbx.grid(row=0, column=1, sticky="w", padx=(6, 0))
        cbx.bind("<<ComboboxSelected>>", lambda _e: self._mh_yenile())
        self._alan(gc_, "İzinli gerilme (N/mm², boş=tür değeri)", "cam_sigma", "", 1, w=10)
        self._alan(gc_, "Azami cam boyu (mm)", "cam_max_boy", 6000, 2, w=10)
        self._alan(gc_, "Azami cam eni (mm)", "cam_max_en", 3210, 3, w=10)
        self._alan(gc_, "Azami cam ağırlığı (kg)", "cam_max_kg", 500, 4, w=10)
        self.tr_camk = self._agac(gc_, [("b", "Boyut (mm)", 110, "w"), ("n", "Adet", 40, "e"), ("kg", "kg/adet", 60, "e"),
                                       ("s", "σ N/mm²", 65, "e"), ("si", "σ izin", 55, "e"), ("d", "Sehim mm", 65, "e"),
                                       ("dl", "Sınır", 50, "e"), ("o", "Durum", 90, "w")])
        self.tr_camk.grid(row=5, column=0, columnspan=2, sticky="we", pady=(6, 0))
        self.lbl_cam_k = ttk.Label(gc_, text="", foreground="#7a858e", wraplength=420, justify="left")
        self.lbl_cam_k.grid(row=6, column=0, columnspan=2, sticky="w", pady=(4, 0))

        ga_ = ttk.LabelFrame(sh_, text=" 4 · Ankraj yükleri (dikme başına) ", padding=8)
        ga_.pack(fill="x", pady=(8, 0))
        self._alan(ga_, "Dikme başına ankraj adedi (kat başına)", "ankraj_adet", 2, 0, w=10)
        self._alan(ga_, "Ölü yükü taşıyan (sabit) ankraj sayısı", "ankraj_sabit", 1, 1, w=10)
        self._alan(ga_, "Ankraj kapasitesi (kN, boş=kontrol yok)", "ankraj_kap", "", 2, w=10)
        self.tr_ank = self._agac(ga_, [("a", "Aks", 40, "e"), ("t", "Yük gen. mm", 75, "e"), ("r", "Rüzgar R kN", 80, "e"),
                                       ("rd", "Tasarım kN", 75, "e"), ("n", "Çekme/itme kN", 90, "e"),
                                       ("v", "Kesme kN", 65, "e"), ("k", "Kat", 40, "e")])
        self.tr_ank.grid(row=3, column=0, columnspan=2, sticky="we", pady=(6, 0))
        self.lbl_ank = ttk.Label(ga_, text="", foreground="#7a858e", wraplength=420, justify="left")
        self.lbl_ank.grid(row=4, column=0, columnspan=2, sticky="w", pady=(4, 0))

        gg_ = ttk.LabelFrame(sh_, text=" 5 · Isıl genleşme ve ötelenme ", padding=8)
        gg_.pack(fill="x", pady=(8, 0))
        self._alan(gg_, "Sıcaklık farkı ΔT (K)", "dT", 60, 0, w=10)
        self._alan(gg_, "Kat arası ötelenme (mm, boş=h/500)", "drift", "", 1, w=10)
        self.tr_gen = self._agac(gg_, [("a", "Eleman", 190, "w"), ("l", "Boy mm", 70, "e"), ("d", "ΔL mm", 60, "e"),
                                       ("e", "Ek yeri payı mm", 100, "e")])
        self.tr_gen.grid(row=2, column=0, columnspan=2, sticky="we", pady=(6, 0))
        self.lbl_gen = ttk.Label(gg_, text="", foreground="#7a858e", wraplength=420, justify="left")
        self.lbl_gen.grid(row=3, column=0, columnspan=2, sticky="w", pady=(4, 0))

        gi_ = ttk.LabelFrame(sh_, text=" 7 · Isıl ve akustik (kaba) ", padding=8)
        gi_.pack(fill="x", pady=(8, 0))
        for k_, (et_, vr_) in enumerate((("Ug cam (W/m²K)", ("Ug", 1.1)), ("Uf profil (W/m²K)", ("Uf", 2.0)),
                                         ("ψg kenar (W/mK)", ("psi", 0.07)), ("Up panel (W/m²K)", ("Up", 0.5)),
                                         ("İç sıcaklık (°C)", ("Ti", 20)), ("Dış sıcaklık (°C)", ("Te", -5)),
                                         ("İç bağıl nem (%)", ("RH", 50)))):
            self._alan(gi_, et_, vr_[0], vr_[1], k_, w=10)
        self.lbl_isil = ttk.Label(gi_, text="", foreground="#7a858e", wraplength=420, justify="left")
        self.lbl_isil.grid(row=8, column=0, columnspan=2, sticky="w", pady=(6, 0))
        ttk.Label(sh_, text="Bu sayfa ön hesaptır; nihai kontrol ilgili standart (cam: TS EN 16612 / DIN 18008, ankraj: üretici "
                            "kapasite tabloları, ısıl: TS EN ISO 12631) ve firma hesabıyla yapılmalıdır.",
                  foreground="#7a858e", wraplength=420, justify="left").pack(anchor="w", pady=(8, 0))
        nb.add(sf_h, text="Hesaplar")

        # ---- Kontrol (preflight)
        sf_k, sk_ = self._sekme_sayfasi(nb, True)
        self.lbl_kontrol = ttk.Label(sk_, text="", font=("Segoe UI", 11, "bold"))
        self.lbl_kontrol.pack(anchor="w")
        self.tr_kontrol = self._agac(sk_, [("s", "Seviye", 70, "w"), ("k", "Kategori", 110, "w"), ("m", "Mesaj", 560, "w")], 12)
        self.tr_kontrol.tag_configure("hata", foreground="#d0453b")
        self.tr_kontrol.tag_configure("uyari", foreground="#c98a14")
        self.tr_kontrol.tag_configure("bilgi", foreground="#7a858e")
        self.tr_kontrol.pack(fill="x", pady=(6, 0))
        ttk.Button(sk_, text="Kontrolü yenile", command=self._mh_yenile).pack(anchor="w", pady=(6, 0))
        ttk.Label(sk_, text="Kontroller: çubuk boyu, cam (boyut, ağırlık, gerilme, sehim), ısı bariyeri, statik, ankraj, yoğuşma, "
                            "detay eksikliği. Raporu vermeden önce 'hata' satırlarının sıfırlanması önerilir.",
                  foreground="#7a858e", wraplength=620, justify="left").pack(anchor="w", pady=(6, 0))
        nb.add(sf_k, text="Kontrol")

        # ---- Üretim
        sf_u, su_ = self._sekme_sayfasi(nb, True)
        gu_ = ttk.LabelFrame(su_, text=" Üretim listeleri ", padding=8)
        gu_.pack(fill="x")
        self._alan(gu_, "Cam kasası kapasitesi (kg)", "kasa_kg", 2500, 0, w=10)
        for k_, (et_, kom_) in enumerate((("Parça etiket listesi (CSV)", lambda: self._uretim_kaydet("etiket")),
                                          ("Testere / kesim listesi (CSV)", lambda: self._uretim_kaydet("testere")),
                                          ("Paketleme / sevkiyat listesi (CSV)", lambda: self._uretim_kaydet("paket")),
                                          ("Hepsi → Excel (.xlsx)", lambda: self._excel_kaydet()))):
            ttk.Button(gu_, text=et_, command=kom_).grid(row=1 + k_, column=0, columnspan=2, sticky="we", pady=2)
        self.tr_etiket = self._agac(su_, [("no", "Etiket", 120, "w"), ("p", "Profil", 90, "w"), ("b", "Boy mm", 70, "e"),
                                          ("k", "Konum", 240, "w")], 12)
        self.tr_etiket.pack(fill="x", pady=(8, 0))
        self.lbl_uretim = ttk.Label(su_, text="", foreground="#7a858e", wraplength=620, justify="left")
        self.lbl_uretim.pack(anchor="w", pady=(4, 0))
        ttk.Label(su_, text="Not: delik / frezeleme (işleme) listesi için profil işleme verisi (CNC şablonu) gerekir; bu sürümde "
                            "yalnız boy ve konum içerir.", foreground="#7a858e", wraplength=620,
                  justify="left").pack(anchor="w", pady=(4, 0))
        nb.add(sf_u, text="Üretim")

        # ---- Proje (cephe tipleri, ilerleme, veri alışverişi)
        sf_r, sr_ = self._sekme_sayfasi(nb, True)
        gt_ = ttk.LabelFrame(sr_, text=" 9 · Cephe tipleri (birleşik metraj) ", padding=8)
        gt_.pack(fill="x")
        self.tr_tipler = self._agac(gt_, [("ad", "Tip", 110, "w"), ("n", "Adet", 45, "e"), ("o", "Ölçü (m)", 90, "w"),
                                          ("c", "Cam m²", 65, "e"), ("a", "Alu kg", 65, "e"), ("t", "Toplam alu kg", 90, "e")], 5)
        self.tr_tipler.pack(fill="x")
        bt_ = ttk.Frame(gt_)
        bt_.pack(fill="x", pady=(6, 0))
        for et_, kom_ in (("Mevcut cepheyi tip olarak ekle", self._tip_ekle), ("Adedi değiştir", self._tip_adet),
                          ("Sil", self._tip_sil), ("Toplamı Excel'e", lambda: self._excel_kaydet(toplam=True))):
            ttk.Button(bt_, text=et_, command=kom_).pack(side="left", padx=(0, 4))
        self.lbl_tipler = ttk.Label(gt_, text="", foreground="#7a858e", wraplength=620, justify="left")
        self.lbl_tipler.pack(anchor="w", pady=(4, 0))
        gl_ = ttk.LabelFrame(sr_, text=" Montaj ilerlemesi (modüle tıklayarak işaretleyin) ", padding=8)
        gl_.pack(fill="x", pady=(8, 0))
        self.cv_ilerleme = tk.Canvas(gl_, height=220, highlightthickness=0)
        self.cv_ilerleme.pack(fill="x")
        self.cv_ilerleme.bind("<Button-1>", self._ilerleme_tikla)
        self.cv_ilerleme.bind("<Configure>", lambda _e: self._ilerleme_ciz())
        bi_ = ttk.Frame(gl_)
        bi_.pack(fill="x", pady=(4, 0))
        ttk.Button(bi_, text="Hakediş için CSV", command=self._hakedis_csv).pack(side="left")
        ttk.Button(bi_, text="Hepsini temizle", command=lambda: (self.model.__setitem__("ilerleme", set()),
                                                                 self._ilerleme_ciz())).pack(side="left", padx=4)
        self.lbl_ilerleme = ttk.Label(gl_, text="", foreground="#7a858e")
        self.lbl_ilerleme.pack(anchor="w", pady=(4, 0))
        gv_ = ttk.LabelFrame(sr_, text=" 10 · Veri alışverişi ", padding=8)
        gv_.pack(fill="x", pady=(8, 0))
        for et_, kom_ in (("Excel BOM (tek dosya)", lambda: self._excel_kaydet()),
                          ("Geometriyi JSON olarak dışa aktar (Grasshopper / script)", self._json_disa),
                          ("DXF'ten aks ve kat oku (mimari cephe çizgisi)…", self._dxf_aks_kat_al)):
            ttk.Button(gv_, text=et_, command=kom_).pack(fill="x", pady=2)
        ttk.Label(gv_, text="IFC çıktısı bu sürümde yok.", foreground="#7a858e").pack(anchor="w")
        nb.add(sf_r, text="Proje")

    # ---- yenileme
    def _mh_yenile(self):
        s = self.sonuc
        if not s or not getattr(self, "tr_camk", None):
            return
        prm = hesap_prm({k: v.get() for k, v in self.v.items()})
        # cam
        cr = cam_kontrol(s, prm)
        satir, et = [], []
        for r in cr:
            dur = []
            if not r["ok_boy"]:
                dur.append("BOYUT")
            if not r["ok_kg"]:
                dur.append("AĞIRLIK")
            if r["sig"] is not None and not r["ok_g"]:
                dur.append("GERİLME")
            if r["defl"] is not None and not r["ok_d"]:
                dur.append("SEHİM")
            satir.append((r["boyut"], r["adet"], f"{r['kg']:.0f}", "-" if r["sig"] is None else f"{r['sig']:.1f}",
                          f"{r['izin']:.1f}", "-" if r["defl"] is None else f"{r['defl']:.1f}", f"{r['lim']:.1f}",
                          "OK" if not dur else " ".join(dur)))
            et.append("tamam" if not dur else "hata")
        self.tr_camk.tag_configure("hata", foreground="#d0453b")
        self._agac_doldur(self.tr_camk, satir, et)
        y_ = s.get("cam_yapi") or {}
        self.lbl_cam_k.config(text=(f"Cam yapısı {y_.get('ad', '-')} ({y_.get('kalinlik', 0):.1f} mm, {y_.get('kg_m2', 0):.1f} kg/m²). "
                                    "Yük camlara kalınlığın küpü oranında paylaşılır; 4 kenar mesnetli plak, doğrusal teori (muhafazakâr)."
                                    + ("" if (s.get("p") or {}).get("ruzgar_kn") else " Rüzgar yükü girilmedi: yalnız boyut/ağırlık kontrol edildi.")))
        # ankraj
        ak = ankraj_hesap(s, prm)
        if ak:
            self._agac_doldur(self.tr_ank, [(x["aks"], f"{x['tw']:.0f}", f"{x['R']:.2f}", f"{x['Rd']:.2f}", f"{x['N']:.2f}",
                                             f"{x['V']:.2f}", x["kat"]) for x in ak["satir"]])
            self.lbl_ank.config(text=(f"Toplam {ak['adet']} ankraj ({ak['n_ank']}/dikme/kat). En büyük ankraj yükü: çekme/itme {ak['max_n']:.2f} kN, "
                                      f"kesme {ak['max_v']:.2f} kN. Mesnet şeması: {ak['sema']}."
                                      + (f" Kapasite oranı %{ak['oran'] * 100:.0f}." if ak["oran"] is not None else "")))
        else:
            self._agac_doldur(self.tr_ank, [])
            self.lbl_ank.config(text="Rüzgar yükü girip hesaplayınca ankraj yükleri burada görünür.")
        # genleşme
        gh = genlesme_hesap(s, prm)
        self._agac_doldur(self.tr_gen, [(x["ad"], f"{x['L']:.0f}", f"{x['dl']:.1f}", f"{x['ek']:.1f}") for x in gh["satir"]])
        self.lbl_gen.config(text=(f"Kat arası ötelenme {'girilen' if gh['drift'] is not None else 'öneri (h/500)'}: "
                                  f"{(gh['drift'] if gh['drift'] is not None else gh['drift_oner']):.1f} mm → "
                                  f"kayar bağlantı payı ≥ {gh['kayar']:.1f} mm (dikey genleşme + ötelenme). "
                                  "Ek yeri payı = ΔL + 2 mm montaj toleransı."))
        # ısıl
        ih = isil_hesap(s, prm)
        if ih:
            self.lbl_isil.config(text=(f"Ucw ≈ {ih['Ucw']:.2f} W/m²K  (cam {ih['Ag']:.1f} m², profil {ih['Af']:.1f} m², "
                                       f"panel {ih['Ap']:.1f} m², cam çevresi {ih['lg']:.0f} m).\n"
                                       f"Çiğlenme noktası {ih['Td']:.1f} °C; iç yüzey: profil {ih['th_f']:.1f} °C "
                                       f"({'YOĞUŞMA RİSKİ' if ih['risk_f'] else 'risk yok'}), cam {ih['th_g']:.1f} °C "
                                       f"({'YOĞUŞMA RİSKİ' if ih['risk_g'] else 'risk yok'}).\n"
                                       f"Akustik (kütle yasası, kaba): Rw ≈ {ih['Rw_kaba']:.0f} dB; çok katmanlı cam için ölçülü Rw değeri esas alınmalı."))
        # kontrol
        ks = on_kontrol(s, prm)
        h_, u_, b_ = (sum(1 for x in ks if x[0] == sv) for sv in ("hata", "uyari", "bilgi"))
        self.lbl_kontrol.config(text=f"✖ {h_} hata   ⚠ {u_} uyarı   ℹ {b_} bilgi")
        sira = {"hata": 0, "uyari": 1, "bilgi": 2}
        ks.sort(key=lambda x: sira[x[0]])
        self._agac_doldur(self.tr_kontrol, [({"hata": "HATA", "uyari": "UYARI", "bilgi": "Bilgi"}[x[0]], x[1], x[2]) for x in ks],
                          [x[0] for x in ks])
        self._kontrol_sonuc = ks
        # üretim önizleme
        try:
            et_ = parca_etiketleri(s)
            pr_ = (self.v["proje_adi"].get().strip() or "PRJ").replace(" ", "")[:10]
            self._agac_doldur(self.tr_etiket, [(f"{pr_}-{k + 1:04d}", e["profil"], f"{e['boy']:.1f}", e["konum"])
                                               for k, e in enumerate(et_[:300])])
            self.lbl_uretim.config(text=f"Toplam {len(et_)} parça etiketlenecek (önizleme ilk {min(300, len(et_))} satır).")
        except Exception as ex:
            self.lbl_uretim.config(text=f"Etiket listesi hazırlanamadı: {ex}")
        self._tipler_yenile()
        self._ilerleme_ciz()
        self._bilgi_ozet_yaz()

    # ---- üretim çıktıları
    def _uretim_satirlari(self, tur):
        s = self.sonuc
        pr = (self.v["proje_adi"].get().strip() or "PRJ").replace(" ", "")[:10]
        if tur == "etiket":
            sat = [["Etiket", "Tür", "Profil", "Boy (mm)", "Konum"]]
            for k, e in enumerate(parca_etiketleri(s)):
                sat.append([f"{pr}-{k + 1:04d}", e["tur"], e["profil"], round(e["boy"], 1), e["konum"]])
            return sat
        if tur == "testere":
            sat = [["Çubuk no", "Profil", "Stok boyu (mm)", "Kesimler (mm)", "Artık (mm)"]]
            no = 0
            for ad, stok, adet, dizi, artik in s.get("cubuk") or []:
                for _ in range(int(adet)):
                    no += 1
                    sat.append([no, ad, stok, dizi, round(float(artik), 1)])
            return sat
        # paketleme
        prm = hesap_prm({k: v.get() for k, v in self.v.items()})
        sat = [["Paket", "Kalem", "Adet", "Toplam boy (m)", "Ağırlık (kg)"]]
        dik, yat = {}, {}
        for e in parca_etiketleri(s):
            key = e["konum"].split(" / ")[0]
            d = dik if e["tur"] == "Dikey" else yat
            a = d.setdefault(key, [0, 0.0])
            a[0] += 1
            a[1] += e["boy"] / 1000.0
        for key, (n, m) in sorted(dik.items()):
            sat.append([f"Dikme {key}", s["p"].get("dikey_ad", "Dikey"), n, round(m, 2), ""])
        for key, (n, m) in sorted(yat.items()):
            sat.append([f"Yatay {key}", s["p"].get("yatay_ad", "Yatay"), n, round(m, 2), ""])
        try:
            kasa = float(self.v["kasa_kg"].get().replace(",", "."))
        except ValueError:
            kasa = 2500.0
        top = 0.0
        for r in cam_kontrol(s, prm):
            sat.append([f"Cam {r['boyut']}", "Cam", r["adet"], "", round(r["kg"] * r["adet"], 0)])
            top += r["kg"] * r["adet"]
        sat.append(["Cam kasası", f"≈ {max(1, int(top / kasa + 0.999)) if top else 0} kasa ({kasa:g} kg/kasa)", "", "", round(top, 0)])
        return sat

    def _uretim_kaydet(self, tur):
        if not self.sonuc:
            messagebox.showinfo("Üretim", "Önce Hesapla'ya basın.")
            return
        ad = {"etiket": "parca_etiketleri", "testere": "testere_listesi", "paket": "paketleme_listesi"}[tur]
        yol = filedialog.asksaveasfilename(defaultextension=".csv", initialfile=f"{ad}.csv",
                                           filetypes=[("CSV", "*.csv")], title="Üretim listesi kaydet")
        if not yol:
            return
        import csv as _csv
        try:
            with open(yol, "w", newline="", encoding="utf-8-sig") as f:
                _csv.writer(f, delimiter=";").writerows(self._uretim_satirlari(tur))
        except OSError as e:
            messagebox.showerror("Üretim", str(e))
            return
        self._log(f"Üretim listesi kaydedildi: {yol}")

    # ---- Excel / JSON
    def _excel_sayfalari(self, toplam=False):
        s = self.sonuc
        prm = hesap_prm({k: v.get() for k, v in self.v.items()})
        sy = []
        if toplam and self.cephe_tipleri:
            sy.append(("Cephe tipleri", [["Tip", "Adet", "Ölçü (m)", "Cam m²", "Alu kg", "Toplam alu kg"]] +
                       [[t["ad"], t["adet"], t["olcu"], t["cam_m2"], t["ana_kg"], round(t["ana_kg"] * t["adet"], 1)]
                        for t in self.cephe_tipleri]))
            tp, tc = {}, {}
            for t in self.cephe_tipleri:
                for b, sat in t["malzeme"]:
                    for r in sat:
                        key = (b, r[0], r[1], r[2])
                        a = tp.setdefault(key, [0.0, 0.0])
                        try:
                            a[0] += float(str(r[3]).replace(",", ".") or 0) * t["adet"]
                        except ValueError:
                            pass
                for r in t["cam"]:
                    tc[(r[0], r[1])] = tc.get((r[0], r[1]), 0) + r[2] * t["adet"]
            sy.append(("Toplam malzeme", [["Bölüm", "Kalem", "Kod / ölçü", "Birim", "Miktar"]] +
                       [[k[0], k[1], k[2], k[3], round(v[0], 2)] for k, v in sorted(tp.items(), key=str)]))
            sy.append(("Toplam cam", [["Tür", "Boyut", "Adet"]] + [[a, b, n] for (a, b), n in sorted(tc.items())]))
            return sy
        o = s.get("ozet") or {}
        sy.append(("Özet", [["Proje", self.v["proje_adi"].get()], ["Sistem", (self.v["sistem_adi"].get() if "sistem_adi" in self.v else getattr(self, "sistem_ad", ""))],
                            ["Ölçü (mm)", f"{o.get('olcu', ('', ''))[0]} x {o.get('olcu', ('', ''))[1]}"], ["Aks", o.get("aks")],
                            ["Kat", o.get("kat")], ["Modül", o.get("modul")], ["Cam m²", o.get("cam_m2")],
                            ["Alüminyum kg", round(s.get("agirlik", {}).get("alu_toplam_kg", 0), 1)]]))
        mal = [["Bölüm", "Kalem", "Kod / ölçü", "Birim", "Miktar", "Ağırlık (kg)"]]
        for baslik, satirlar, top in malzeme_listesi(s):
            for r in satirlar:
                mal.append([baslik] + [x for x in r[:5]])
        sy.append(("Malzeme", mal))
        sy.append(("Kesim", [["Profil", "Boy (mm)", "Adet", "Metre", "kg"]] + [list(r) for r in s.get("kesim") or []]))
        sy.append(("Çubuk planı", [["Profil", "Stok (mm)", "Çubuk adedi", "Kesimler", "Artık (mm)"]] + [list(r) for r in s.get("cubuk") or []]))
        sy.append(("Cam listesi", [["Tür", "Boyut (mm)", "Adet", "m²"]] + [list(r) for r in s.get("cam") or []]))
        cam = [["Boyut", "Adet", "kg/adet", "σ N/mm²", "σ izin", "Sehim mm", "Sınır mm"]]
        for r in cam_kontrol(s, prm):
            cam.append([r["boyut"], r["adet"], round(r["kg"], 1), None if r["sig"] is None else round(r["sig"], 2),
                        round(r["izin"], 1), None if r["defl"] is None else round(r["defl"], 2), round(r["lim"], 1)])
        sy.append(("Cam kontrol", cam))
        ak = ankraj_hesap(s, prm)
        if ak:
            sy.append(("Ankraj", [["Aks", "Yük genişliği mm", "Rüzgar R kN", "Tasarım kN", "Çekme/itme kN", "Kesme kN", "Kat"]] +
                       [[x["aks"], round(x["tw"]), round(x["R"], 2), round(x["Rd"], 2), round(x["N"], 2), round(x["V"], 2), x["kat"]]
                        for x in ak["satir"]]))
        sy.append(("Kontrol", [["Seviye", "Kategori", "Mesaj"]] + [list(x) for x in on_kontrol(s, prm)]))
        sy.append(("Etiketler", self._uretim_satirlari("etiket")))
        return sy

    def _excel_kaydet(self, toplam=False):
        if not self.sonuc and not toplam:
            messagebox.showinfo("Excel", "Önce Hesapla'ya basın.")
            return
        if toplam and not self.cephe_tipleri:
            messagebox.showinfo("Excel", "Önce 'Mevcut cepheyi tip olarak ekle' ile en az bir cephe tipi ekleyin.")
            return
        yol = filedialog.asksaveasfilename(defaultextension=".xlsx", initialfile="cephe_toplam.xlsx" if toplam else "cephe_bom.xlsx",
                                           filetypes=[("Excel", "*.xlsx")], title="Excel kaydet")
        if not yol:
            return
        try:
            xlsx_yaz(yol, self._excel_sayfalari(toplam))
        except (OSError, KeyError, ValueError) as e:
            messagebox.showerror("Excel", str(e))
            return
        self._log(f"Excel kaydedildi: {yol}")

    def _json_disa(self):
        s = self.sonuc
        if not s:
            messagebox.showinfo("JSON", "Önce Hesapla'ya basın.")
            return
        yol = filedialog.asksaveasfilename(defaultextension=".json", initialfile="cephe_geometri.json",
                                           filetypes=[("JSON", "*.json")], title="Geometriyi kaydet")
        if not yol:
            return
        cx = [0.0]
        for c in s["cols"]:
            cx.append(cx[-1] + c)
        veri = {"birim": "mm", "aks_x": cx, "kat_y": [0.0] + [sum(s["rows"][:k + 1]) for k in range(len(s["rows"]))],
                "yatay_hat_y": s.get("cy"), "hat_id": s.get("hat_id"),
                "dikme_yok": sorted([i, j] for i, j in (s.get("dik_yok_ham") or ())),
                "yatay_yok": sorted([list(k) for k in (s.get("yat_yok_ham") or ())]),
                "dikme_genislik": s.get("vw"), "yatay_yukseklik": s.get("hw"),
                "dikey_alt": s.get("dikey_alt"), "dikey_ust": s.get("dikey_ust"),
                "cam_gruplari": [{"tip": g["tip"], "x0": cx[g["i0"]], "x1": cx[g["i1"] + 1], "y0": s["bolgeler"][g["z0"]]["y0"],
                                  "y1": s["bolgeler"][g["z1"]]["y1"]} for g in s.get("cam_gruplari") or []],
                "cam_yapi": s.get("cam_yapi"), "parcalar": parca_etiketleri(s)}
        try:
            with open(yol, "w", encoding="utf-8") as f:
                json.dump(veri, f, ensure_ascii=False, indent=1, default=str)
        except OSError as e:
            messagebox.showerror("JSON", str(e))
            return
        self._log(f"Geometri JSON olarak kaydedildi: {yol}")

    def _dxf_aks_kat_al(self):
        yol = filedialog.askopenfilename(title="Mimari cephe DXF", filetypes=[("DXF", "*.dxf")])
        if not yol:
            return
        try:
            cols, rows, bilgi = dxf_aks_kat_oku(yol)
        except (ValueError, OSError, KeyError) as e:
            messagebox.showwarning("DXF", str(e))
            return
        if not messagebox.askyesno("DXF'ten aks ve kat",
                                   f"{bilgi}.\nAks aralıkları: {sikistir(cols)}\nKat yükseklikleri: {sikistir(rows)}\n\n"
                                   "Girdilere yazılsın mı? (mevcut aks/kat değişir)"):
            return
        self.v["cols"].set(sikistir(cols))
        self.v["rows"].set(sikistir(rows))
        self._log(f"DXF'ten aks/kat alındı: {bilgi}")
        self.hesapla()

    # ---- cephe tipleri
    def _tip_ekle(self):
        s = self.sonuc
        if not s:
            messagebox.showinfo("Cephe tipi", "Önce Hesapla'ya basın.")
            return
        ad = simpledialog.askstring("Cephe tipi", "Tip adı (örn. T1):", parent=self,
                                    initialvalue=f"T{len(self.cephe_tipleri) + 1}")
        if not ad:
            return
        adet = simpledialog.askinteger("Cephe tipi", "Bu tipten kaç adet var?", parent=self, initialvalue=1, minvalue=1)
        if not adet:
            return
        o = s["ozet"]
        tip = {"ad": ad.strip(), "adet": int(adet), "olcu": f"{o['olcu'][0] / 1000:.2f}×{o['olcu'][1] / 1000:.2f}",
               "cam_m2": round(o.get("cam_m2", 0), 2), "ana_kg": round(s["agirlik"]["alu_toplam_kg"], 1),
               "malzeme": [(b, [list(map(str, r)) for r in sat]) for b, sat, _t in malzeme_listesi(s)],
               "cam": [list(r) for r in s.get("cam") or []]}
        self.cephe_tipleri = [t for t in self.cephe_tipleri if t["ad"] != tip["ad"]] + [tip]
        self._tipler_yenile()
        self._log(f"Cephe tipi eklendi: {tip['ad']} × {tip['adet']}")

    def _tip_secili(self):
        sec = self.tr_tipler.selection()
        if not sec:
            messagebox.showinfo("Cephe tipi", "Listeden bir tip seçin.")
            return None
        ad = self.tr_tipler.item(sec[0], "values")[0]
        return next((t for t in self.cephe_tipleri if t["ad"] == ad), None)

    def _tip_adet(self):
        t = self._tip_secili()
        if not t:
            return
        n = simpledialog.askinteger("Cephe tipi", f"{t['ad']} adedi:", parent=self, initialvalue=t["adet"], minvalue=1)
        if n:
            t["adet"] = int(n)
            self._tipler_yenile()

    def _tip_sil(self):
        t = self._tip_secili()
        if t:
            self.cephe_tipleri = [x for x in self.cephe_tipleri if x is not t]
            self._tipler_yenile()

    def _tipler_yenile(self):
        tr = getattr(self, "tr_tipler", None)
        if tr is None:
            return
        sat = [(t["ad"], t["adet"], t["olcu"], f"{t['cam_m2']:.1f}", f"{t['ana_kg']:.0f}", f"{t['ana_kg'] * t['adet']:.0f}")
               for t in self.cephe_tipleri]
        self._agac_doldur(tr, sat)
        tc = sum(t["cam_m2"] * t["adet"] for t in self.cephe_tipleri)
        ta = sum(t["ana_kg"] * t["adet"] for t in self.cephe_tipleri)
        self.lbl_tipler.config(text=(f"Toplam: {sum(t['adet'] for t in self.cephe_tipleri)} cephe, cam {tc:.1f} m², alüminyum {ta:.0f} kg. "
                                     "Her tip, eklendiği andaki hesabın kopyasıdır (cepheyi değiştirirseniz tipi yeniden ekleyin)."
                                     if self.cephe_tipleri else "Henüz tip yok: bir cephe hesaplayıp 'Mevcut cepheyi tip olarak ekle'ye basın."))

    # ---- montaj ilerlemesi
    def _ilerleme_geo(self):
        s = self.sonuc
        cv = self.cv_ilerleme
        if not s:
            return None
        W, H = max(cv.winfo_width(), 200), 220
        TW, TH = float(sum(s["cols"])), float(sum(s["rows"]))
        sc = min((W - 20) / TW, (H - 20) / TH)
        return W, H, TW, TH, sc, (W - TW * sc) / 2, (H - TH * sc) / 2

    def _ilerleme_ciz(self):
        cv = getattr(self, "cv_ilerleme", None)
        if cv is None:
            return
        cv.delete("all")
        g = self._ilerleme_geo()
        if not g:
            cv.create_text(10, 10, anchor="nw", text="Hesapla'dan sonra modüller burada görünür.", fill="#8a949c")
            return
        W, H, TW, TH, sc, ox, oy = g
        s = self.sonuc
        ayna = bool(genel_ayar("cephe_ayna"))
        t = TEMALAR[self.tema]
        bitti = self.model.setdefault("ilerleme", set())
        cx = [0.0]
        for c in s["cols"]:
            cx.append(cx[-1] + c)
        cy = [0.0]
        for r in s["rows"]:
            cy.append(cy[-1] + r)
        alan_t = alan_b = 0.0
        for j in range(len(s["rows"])):
            for i in range(len(s["cols"])):
                x0, x1 = (TW - cx[i + 1], TW - cx[i]) if ayna else (cx[i], cx[i + 1])
                a = (s["cols"][i]) * s["rows"][j] / 1e6
                alan_t += a
                ok = (j, i) in bitti
                alan_b += a if ok else 0
                cv.create_rectangle(ox + x0 * sc, oy + (TH - cy[j + 1]) * sc, ox + x1 * sc, oy + (TH - cy[j]) * sc,
                                    fill="#4aa36b" if ok else t["alan"], outline=t["cizgi"])
        yuz = 100.0 * alan_b / alan_t if alan_t else 0.0
        self.lbl_ilerleme.config(text=f"Tamamlanan: {len(bitti)} / {len(s['cols']) * len(s['rows'])} modül  ·  alan bazlı %{yuz:.1f}")

    def _ilerleme_tikla(self, e):
        g = self._ilerleme_geo()
        if not g:
            return
        W, H, TW, TH, sc, ox, oy = g
        s = self.sonuc
        x = (e.x - ox) / sc
        y = TH - (e.y - oy) / sc
        if not (0 <= x <= TW and 0 <= y <= TH):
            return
        if genel_ayar("cephe_ayna"):
            x = TW - x
        cx = 0.0
        i = len(s["cols"]) - 1
        for k, c in enumerate(s["cols"]):
            cx += c
            if x <= cx:
                i = k
                break
        cy = 0.0
        j = len(s["rows"]) - 1
        for k, r in enumerate(s["rows"]):
            cy += r
            if y <= cy:
                j = k
                break
        b = self.model.setdefault("ilerleme", set())
        b.symmetric_difference_update({(j, i)})
        self._ilerleme_ciz()

    def _hakedis_csv(self):
        s = self.sonuc
        if not s:
            return
        yol = filedialog.asksaveasfilename(defaultextension=".csv", initialfile="montaj_ilerleme.csv",
                                           filetypes=[("CSV", "*.csv")], title="İlerleme / hakediş CSV")
        if not yol:
            return
        import csv as _csv
        bitti = self.model.get("ilerleme") or set()
        sat = [["Kat", "Aks aralığı", "Genişlik (mm)", "Yükseklik (mm)", "Alan (m²)", "Durum"]]
        top = tam = 0.0
        for j, r in enumerate(s["rows"]):
            for i, c in enumerate(s["cols"]):
                a = c * r / 1e6
                top += a
                tam += a if (j, i) in bitti else 0
                sat.append([j + 1, f"{i + 1}-{i + 2}", c, r, round(a, 3), "Tamam" if (j, i) in bitti else "Bekliyor"])
        sat.append(["Toplam", "", "", "", round(top, 2), f"%{100 * tam / top:.1f}" if top else ""])
        try:
            with open(yol, "w", newline="", encoding="utf-8-sig") as f:
                _csv.writer(f, delimiter=";").writerows(sat)
        except OSError as e:
            messagebox.showerror("CSV", str(e))
            return
        self._log(f"Montaj ilerlemesi kaydedildi: {yol}")


    # -- çubuk stokları (çok boylu optimizasyon)
    def _cubuk_sekmesi(self, nb):
        fr = ttk.Frame(nb)
        nb.add(fr, text="Çubuk planı")
        kf = ttk.LabelFrame(fr, text=" Stok çubuk boyları (liste boşsa 'Stok çubuk boyu' alanı kullanılır) ", padding=6)
        kf.pack(fill="x", padx=6, pady=(6, 2))
        gf = ttk.Frame(fr)
        gf.pack(fill="x", padx=6, pady=(6, 0))
        for i_, (et_, an_) in enumerate((("Varsayılan stok çubuk boyu (mm)", "cubuk"), ("Testere payı (mm)", "testere"),
                                        ("Sipariş eki (%)", "siparis_ek"))):
            ttk.Label(gf, text=et_).grid(row=0, column=2 * i_, sticky="w", padx=(0 if i_ == 0 else 20, 6))
            e_ = ttk.Entry(gf, textvariable=self.v[an_], width=10)
            e_.grid(row=0, column=2 * i_ + 1)
            e_.bind("<Return>", lambda _e: self.hesapla())
            e_.bind("<FocusOut>", lambda _e: self.hesapla())
        kol = ("Profil", "Boy (mm)", "Adet", "Parça en az", "Parça en çok")
        st = ttk.Treeview(kf, columns=kol, show="headings", height=4, selectmode="browse")
        for k_, w_ in zip(kol, (90, 90, 120, 110, 110)):
            st.heading(k_, text=k_)
            st.column(k_, width=w_, anchor="w")
        st.pack(side="left", fill="x", expand=True)
        st.bind("<Double-Button-1>", lambda _e: self._cubuk_duzenle())
        self._cb_tr = st
        bt = ttk.Frame(kf)
        bt.pack(side="left", padx=8)
        for metin, kom in (("Ekle...", self._cubuk_ekle), ("Düzenle...", self._cubuk_duzenle),
                           ("Sil", self._cubuk_sil), ("Listeyi temizle", self._cubuk_temizle)):
            ttk.Button(bt, text=metin, command=kom).pack(fill="x", pady=1)
        ttk.Label(fr, foreground="#7a858e", wraplength=900, justify="left",
                  text="  Adet boşsa sınırsız. 'Parça en az / en çok' ile hangi boydaki parçaların bu stoktan kesileceğini "
                       "gruplayabilirsiniz (örn. 7500 mm stok: parça en az 6000; 6000 mm stok: parça en çok 5999). "
                       "Aralık verilmezse program her parça için en az fire bırakan boyu seçer.").pack(anchor="w")
        kolonlar = ("Profil", "Çubuk boyu (mm)", "Çubuk adedi", "Kesimler (mm)", "Kalan (mm)")
        tf = ttk.Frame(fr)
        tf.pack(fill="both", expand=True, padx=6, pady=4)
        tr = ttk.Treeview(tf, columns=kolonlar, show="headings")
        for k_, w_ in zip(kolonlar, (200, 100, 90, 360, 90)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        sb = ttk.Scrollbar(tf, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        self._cubuk_yenile()
        return tr

    PROFIL_AD = {"tum": "Tümü", "dikey": "Dikey", "yatay": "Yatay"}

    def _cubuk_yenile(self):
        if not hasattr(self, "_cb_tr"):
            return
        tr = self._cb_tr
        try:
            if self.stoklar:
                ad_ = {"tum": "Tümü", "dikey": "Dikey", "yatay": "Yatay"}
                self.lbl_stok_ozet.configure(text="Stok listesi kullanılıyor (yukarıdaki varsayılan boy geçersiz):\n" + "; ".join(
                    f"{ad_.get(e.get('profil', 'tum'), 'Tümü')} {e['boy']:g}"
                    + (f" (parça {e['min']:g}–{e['max']:g})" if e.get("min") and e.get("max") not in (None, "")
                       else f" (parça ≥{e['min']:g})" if e.get("min")
                       else f" (parça ≤{e['max']:g})" if e.get("max") not in (None, "") else "")
                    for e in self.stoklar))
            else:
                self.lbl_stok_ozet.configure(text="Stok listesi boş: yukarıdaki varsayılan boy kullanılır.")
        except Exception:
            pass
        tr.delete(*tr.get_children())
        for i, e in enumerate(self.stoklar):
            tr.insert("", "end", iid=str(i), values=(
                self.PROFIL_AD.get(e.get("profil", "tum"), "Tümü"), f"{e['boy']:g}",
                "sınırsız" if e.get("adet") in (None, "") else f"{int(e['adet'])}",
                "" if not e.get("min") else f"{e['min']:g}", "" if e.get("max") in (None, "") else f"{e['max']:g}"))

    def _cubuk_degisti(self):
        _ayar_db().setdefault("genel", {})["cubuk_stok"] = [dict(e) for e in self.stoklar]
        ayar_kaydet()
        self._cubuk_yenile()
        if self.sonuc:
            self.hesapla()

    def _cubuk_ekle(self):
        e = self._cubuk_diyalog()
        if e:
            self.stoklar.append(e)
            self._cubuk_degisti()

    def _cubuk_duzenle(self):
        sel = self._cb_tr.selection()
        if not sel:
            return
        i = int(sel[0])
        e = self._cubuk_diyalog(self.stoklar[i])
        if e:
            self.stoklar[i] = e
            self._cubuk_degisti()

    def _cubuk_sil(self):
        sel = self._cb_tr.selection()
        if sel:
            del self.stoklar[int(sel[0])]
            self._cubuk_degisti()

    def _cubuk_temizle(self):
        self.stoklar = []
        self._cubuk_degisti()

    def _cubuk_diyalog(self, mevcut=None):
        sonuc = {}
        pen = tk.Toplevel(self)
        pen.title("Stok çubuk")
        pen.transient(self)
        pen.resizable(False, False)
        fr = ttk.Frame(pen, padding=12)
        fr.pack()
        m = mevcut or {}
        v_p = tk.StringVar(value=self.PROFIL_AD.get(m.get("profil", "tum"), "Tümü"))
        v_b = tk.StringVar(value=f"{m['boy']:g}" if m else "6000")
        v_a = tk.StringVar(value="" if m.get("adet") in (None, "") else str(int(m["adet"])))
        v_mn = tk.StringVar(value="" if not m.get("min") else f"{m['min']:g}")
        v_mx = tk.StringVar(value="" if m.get("max") in (None, "") else f"{m['max']:g}")
        for r, (et, w) in enumerate((("Profil", None), ("Çubuk boyu (mm)", v_b), ("Adet (boş = sınırsız)", v_a),
                                     ("Parça en az (mm, boş = sınır yok)", v_mn), ("Parça en çok (mm, boş = sınır yok)", v_mx))):
            ttk.Label(fr, text=et).grid(row=r, column=0, sticky="w", pady=3)
            if w is None:
                ttk.Combobox(fr, textvariable=v_p, values=list(self.PROFIL_AD.values()), state="readonly",
                             width=10).grid(row=r, column=1, padx=8, sticky="w")
            else:
                ttk.Entry(fr, textvariable=w, width=12).grid(row=r, column=1, padx=8, sticky="w")

        def sayi(v, ad, bos_ok):
            t = v.get().strip().replace(",", ".")
            if not t:
                if bos_ok:
                    return None
                raise ValueError(f"{ad} girin.")
            try:
                x = float(t)
            except ValueError:
                raise ValueError(f"{ad}: sayı girin.")
            if x < 0:
                raise ValueError(f"{ad}: negatif olamaz.")
            return x

        def tamam():
            try:
                boy = sayi(v_b, "Çubuk boyu", False)
                adet = sayi(v_a, "Adet", True)
                mn = sayi(v_mn, "Parça en az", True)
                mx = sayi(v_mx, "Parça en çok", True)
            except ValueError as ex:
                messagebox.showwarning("Stok çubuk", str(ex), parent=pen)
                return
            if boy <= 0 or (adet is not None and adet < 1) or (mn is not None and mx is not None and mn > mx):
                messagebox.showwarning("Stok çubuk", "Boy pozitif, adet en az 1 olmalı; en az ≤ en çok olmalı.", parent=pen)
                return
            tur = next((k for k, a in self.PROFIL_AD.items() if a == v_p.get()), "tum")
            sonuc.update({"profil": tur, "boy": boy, "adet": None if adet is None else int(adet),
                          "min": mn, "max": mx})
            pen.destroy()
        bt = ttk.Frame(fr)
        bt.grid(row=5, column=0, columnspan=2, pady=(10, 0))
        ttk.Button(bt, text="Tamam", command=tamam).pack(side="left", padx=4)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=4)
        pen.bind("<Return>", lambda _e: tamam())
        pen.grab_set()
        self.wait_window(pen)
        return sonuc or None

    def _tablo(self, nb, baslik, kolonlar, genislikler):
        fr = ttk.Frame(nb)
        nb.add(fr, text=baslik)
        tr = ttk.Treeview(fr, columns=kolonlar, show="headings")
        for k, w in zip(kolonlar, genislikler):
            tr.heading(k, text=k)
            tr.column(k, width=w, anchor="w")
        sb = ttk.Scrollbar(fr, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        return tr

    # --------------------------------------------------------- katalog
    def _otomatik_katalog(self):
        self.sistem_yollari = sistem_klasorleri()
        if self.sistem_yollari:
            ilk = "E50" if "E50" in self.sistem_yollari else next(iter(self.sistem_yollari))
            self.katalog_yukle(self.sistem_yollari[ilk])
            return
        yol = os.path.join(uygulama_klasoru(), "profil_katalogu.csv")      # eski düzen
        if os.path.isfile(yol):
            self.katalog_yukle(yol)

    def katalog_yukle(self, yol=None):
        self._gecmis_sifirla()
        if not yol:
            yol = filedialog.askopenfilename(
                title="Profil kataloğu seç",
                filetypes=[("CSV", "*.csv"), ("Tüm dosyalar", "*.*")])
            if not yol:
                return
        try:
            kut_uyari = []
            self.katalog = katalog_oku(yol, kut_uyari)
        except (ValueError, OSError) as e:
            messagebox.showwarning("Katalog okunamadı", str(e))
            return
        if kut_uyari:
            messagebox.showwarning("Kütüphanede okunamayan dosyalar",
                                   "\n".join(kut_uyari[:15]) + (f"\n... (+{len(kut_uyari) - 15})" if len(kut_uyari) > 15 else ""))
        self.katalog_yol = os.path.abspath(yol)
        self.lbl_katalog.config(
            text=f"{os.path.basename(yol)} ({len(self.katalog)} profil)")
        klasor = os.path.dirname(os.path.abspath(yol))
        _EK_AYAR.clear()
        _EK_AYAR.update(sistem_ayar(klasor))
        self.kurallar, self.parca_kat = [], {}
        self.cam_tablo, self.bariyerler = [], []
        self.yatay_tipleri = list(YATAY_TIP_VARSAYILAN)
        self.dikey_tipleri = list(YATAY_TIP_VARSAYILAN)
        yp_ = os.path.join(klasor, "panel_tipleri.csv")
        if os.path.exists(yp_):
            try:
                panel_tipleri_oku(yp_)
                for tk_ in ("sandvic", "levha"):
                    for alan, anahtar in (("kal", "kal"), ("kg", "kg_m2")):
                        if f"pn_{tk_}_{alan}" in self.v:
                            self.v[f"pn_{tk_}_{alan}"].set(f"{PANEL_TIPLERI[tk_][anahtar]:g}")
            except (ValueError, OSError) as e:
                messagebox.showwarning("panel_tipleri.csv okunamadı", str(e))
        for ad, oku, hedef in (("cam_kurallari.csv", kural_oku, "kurallar"),
                               ("yatay_tipleri.csv", yatay_tipleri_oku, "yatay_tipleri"),
                               ("bariyer_katalogu.csv", bariyer_oku, "bariyerler"),
                               ("parca_katalogu.csv", parca_katalog_oku, "parca_kat"),
                               ("cam_tablosu.csv", cam_tablosu_oku, "cam_tablo")):
            yp = os.path.join(klasor, ad)
            if os.path.exists(yp):
                try:
                    setattr(self, hedef, oku(yp))
                except (ValueError, OSError) as e:
                    messagebox.showwarning(f"{ad} okunamadı", str(e))
        _kut = kutuphane_klasoru(klasor)
        _kay = sistem_kaydi(os.path.basename(klasor))
        degisim_kur(_kut, (_kay or {}).get("degisim"), (_kay or {}).get("yon"), (_kay or {}).get("kayma"))       # parça değişimleri ve yönleri
        self._tip_onb = {}
        _bk = _alt_klasor(_kut, "ISI_BARIYERI") if _kut else None
        try:
            fitil_ekleri_yukle(_kut)
        except Exception:
            _FITIL_EK.clear()
        if _bk:                          # bariyer çizimleri kütüphanenin ISI_BARIYERI klasöründeki <kod>.dxf dosyalarından
            for b_ in self.bariyerler:
                yp_b = os.path.join(_bk, b_["kod"] + ".dxf")
                if b_.get("prims") is None and os.path.isfile(yp_b):
                    try:
                        bl_ = dxf_blok_bul(yp_b, b_["kod"])
                        if bl_:
                            b_.update(_bariyer_kesiti(yp_b, bl_))
                    except (ValueError, OSError):
                        pass
        if _kut:                          # CSV'siz kurulum: eksik tablolar kütüphane klasöründen otomatik üretilir
            oto_uyari = []
            try:
                oto = otomatik_sistem(klasor, oto_uyari)
            except (ValueError, OSError) as e:
                oto, oto_uyari = None, [f"Otomatik sistem kurulamadı: {e}"]
            if oto:
                if not self.kurallar:
                    self.kurallar = oto["kurallar"]
                if not self.bariyerler and oto["bariyerler"]:
                    self.bariyerler = oto["bariyerler"]
                if not self.cam_tablo:
                    self.cam_tablo = oto["cam_tablo"]
                if self.yatay_tipleri == list(YATAY_TIP_VARSAYILAN) or len(self.yatay_tipleri) == 1 and not os.path.exists(
                        os.path.join(klasor, "yatay_tipleri.csv")):
                    self.yatay_tipleri = oto["yatay_tipleri"]
                if len(self.dikey_tipleri) <= 1 and oto.get("dikey_tipleri"):
                    self.dikey_tipleri = oto["dikey_tipleri"]
            if oto_uyari:
                messagebox.showwarning("Kütüphane (SISTEM / ISI_BARIYERI)", "\n".join(oto_uyari[:10]))
        if not self.bariyerler:
            self.bariyerler = bariyer_varsayilan()      # klasörde bariyer_katalogu.csv yoksa yerleşik E50 verisi
        for k in self.katalog:          # şablonu olmayan kütüphane profilleri: kural tablosundaki ilk şablon
            if k.get("dosya") and not k["sablon_yol"]:
                kr = next((r for r in self.kurallar if r.get(k["tur"])
                           and (not r["sistem"] or r["sistem"] == _norm(k["sistem"]))), None)
                if kr:
                    k["sablon_yol"], k["sablon_blok"] = kr[k["tur"]]
        ad = os.path.basename(klasor)
        if not hasattr(self, "sistem_yollari"):
            self.sistem_yollari = {}
        if not any(os.path.abspath(v) == self.katalog_yol for v in self.sistem_yollari.values()):
            self.sistem_yollari[ad] = self.katalog_yol
        mevcut = next(a_ for a_, v in self.sistem_yollari.items() if os.path.abspath(v) == self.katalog_yol)
        self.cb["sistem"].config(values=sorted(self.sistem_yollari))
        self.cb["sistem"].set(mevcut)
        self._sistem_degisti(yukle=False)
        self._ayar_tazele()

    # ------------------------------------------------ ayarlar / komut penceresi
    def _aktif_sistem(self):
        yol = getattr(self, "katalog_yol", None)
        return os.path.basename(os.path.dirname(yol)) if yol else ""

    def _ayar_penceresi(self):
        pen = getattr(self, "_ayar_pen", None)
        try:
            if pen is not None and pen.winfo_exists():
                pen.lift()
                return
        except tk.TclError:
            pass
        pen = tk.Toplevel(self)
        pen.title("Ayarlar / Komut")
        pen.geometry("780x740")
        self._ayar_pen = pen
        ust = ttk.Frame(pen, padding=8)
        ust.pack(fill="both", expand=True)
        self._ayar_baslik = ttk.Label(ust, text="", font=("Segoe UI", 10, "bold"))
        self._ayar_baslik.pack(anchor="w")
        gv = ttk.LabelFrame(ust, text=" Görünüm ", padding=6)
        gv.pack(fill="x", pady=(4, 6))
        self._gv = {}
        for anahtar, metin in (("teker_ters", "Fare tekerleği yönünü ters çevir (yakınlaştır/uzaklaştır)"),
                               ("parca_kod", "Detayda parça kodlarını göster (yakınlaştıkça boşluklara sığar)"),
                               ("parca_olcu", "Parçaların en × boy ölçüsünü de göster"),
                               ("blok_renk", "Detay renklerini bloklardaki (DXF katman) renklerden al"),
                               ("yon_merkez", "Parça yönünü parçanın ortasından çevir (kapalı: bloğun base point'inden)")):
            v = tk.BooleanVar(value=bool(genel_ayar(anahtar)))
            self._gv[anahtar] = v
            ttk.Checkbutton(gv, text=metin, variable=v,
                            command=lambda a=anahtar: self._genel_degisti(a)).pack(anchor="w")
        rk = ttk.LabelFrame(ust, text=" Renkler (katman başına; boşsa blok rengi) ", padding=6)
        rk.pack(fill="x", pady=(0, 6))
        self._rk_cb = ttk.Combobox(rk, state="readonly", width=44)
        self._rk_cb.pack(side="left")
        self._rk_ornek = tk.Label(rk, width=4, relief="solid", bd=1)
        self._rk_ornek.pack(side="left", padx=6)
        ttk.Button(rk, text="Renk seç…", command=self._renk_sec).pack(side="left")
        ttk.Button(rk, text="Blok rengine dön", command=self._renk_sifirla).pack(side="left", padx=6)
        self._rk_cb.bind("<<ComboboxSelected>>", lambda _e: self._renk_ornek_guncelle())
        self._renk_liste_yenile()
        self._ayar_ozet = tk.Text(ust, height=8, font=("Consolas", 9), bg=self._renk_t("alan"), fg=self._renk_t("yazi"), relief="flat", wrap="none")
        self._ayar_ozet.pack(fill="x", pady=(4, 8))
        ttk.Label(ust, text="Şablondaki parçalar: satırı seçin, yerine başka parça seçip Uygula'ya basın").pack(anchor="w")
        fr = ttk.Frame(ust)
        fr.pack(fill="both", expand=True)
        kol = ("Hat", "Parça", "Adet", "Klasör", "Orijinal")
        tr = ttk.Treeview(fr, columns=kol, show="headings", height=9, selectmode="browse")
        for k_, w_ in zip(kol, (70, 120, 50, 120, 120)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        sb = ttk.Scrollbar(fr, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        tr.bind("<<TreeviewSelect>>", self._ayar_satir_sec)
        self._ayar_tr = tr
        ds = ttk.Frame(ust)
        ds.pack(fill="x", pady=6)
        ttk.Label(ds, text="Yerine:").pack(side="left")
        self._ayar_cb = ttk.Combobox(ds, state="readonly", width=20)
        self._ayar_cb.pack(side="left", padx=6)
        ttk.Button(ds, text="Uygula", command=self._ayar_parca_uygula).pack(side="left")
        ttk.Button(ds, text="Tümünü sıfırla", command=lambda: self._komut_calistir("parca sifirla")).pack(side="left", padx=6)
        ke = ttk.Frame(ust)
        ke.pack(fill="x", pady=(6, 0))
        ttk.Label(ke, text="Komut:").pack(side="left")
        self._komut_v = tk.StringVar()
        en = ttk.Entry(ke, textvariable=self._komut_v)
        en.pack(side="left", fill="x", expand=True, padx=6)
        en.bind("<Return>", lambda _e: self._komut_gonder())
        ttk.Button(ke, text="Çalıştır", command=self._komut_gonder).pack(side="left")
        self._ayar_log = tk.Text(ust, height=8, font=("Consolas", 9), bg=self._renk_t("alan"), fg=self._renk_t("yazi"), relief="flat", wrap="word")
        self._ayar_log.pack(fill="x", pady=(6, 0))
        self._ayar_log.config(state="disabled")
        self._parcalar = []
        self._ayar_yenile()
        self._ayar_yaz("Komutlar için 'yardim' yazın.")
        en.focus_set()

    # ------------------------------------------------ sipariş / kurallar / ek malzeme sekmeleri
    SIPARIS_ALANLARI = (("Proje adı", "proje_adi", "Proje"), ("Sistem", "sistem_adi", "Sistem"),
                        ("Sipariş no", "sip_no", "Sipariş no"), ("Teklif / referans no", "sip_teklif", "Teklif no"),
                        ("Tarih", "sip_tarih", "Tarih"), ("Müşteri / firma", "sip_musteri", "Müşteri"),
                        ("İlgili kişi", "sip_ilgili", "İlgili"), ("Telefon / e-posta", "sip_iletisim", "İletişim"),
                        ("Şantiye / adres", "sip_adres", "Şantiye / adres"), ("Teslim tarihi", "sip_teslim", "Teslim"),
                        ("Revizyon", "sip_rev", "Revizyon"), ("Hazırlayan", "sip_hazirlayan", "Hazırlayan"))
    EK_BIRIMLER = ("adet", "m", "m²", "kg", "takım", "kutu", "paket")

    def _yeni_sekmeler(self, nb):
        self._siparis_sekmesi(nb)
        self._kural_sekmesi(nb)
        self._ek_sekmesi(nb)

    # -- sipariş bilgileri
    def _siparis_sekmesi(self, nb):
        fr = ttk.Frame(nb, padding=14)
        nb.add(fr, text="Sipariş")
        kutu = ttk.LabelFrame(fr, text=" Sipariş / proje bilgileri (PDF, DXF ve CSV çıktılarında görünür) ", padding=12)
        kutu.pack(fill="x")
        kutu.columnconfigure(1, weight=1)
        kutu.columnconfigure(3, weight=1)
        for i, (etiket, anahtar, _c) in enumerate(self.SIPARIS_ALANLARI):
            if anahtar not in self.v:
                self.v[anahtar] = tk.StringVar(value="")
            r, c = divmod(i, 2)
            ttk.Label(kutu, text=etiket).grid(row=r, column=c * 2, sticky="w", pady=3, padx=(0 if c == 0 else 18, 6))
            e = ttk.Entry(kutu, textvariable=self.v[anahtar], width=34)
            e.grid(row=r, column=c * 2 + 1, sticky="we", pady=3)
            if anahtar == "sip_hazirlayan":
                e.bind("<FocusOut>", lambda _e: self._hazirlayan_kaydet())
        if not self.v["sip_tarih"].get():
            self.v["sip_tarih"].set(datetime.date.today().strftime("%d.%m.%Y"))
        if not self.v["sip_hazirlayan"].get():
            self.v["sip_hazirlayan"].set(genel_ayar("hazirlayan") or "")
        nb_ = ttk.LabelFrame(fr, text=" Notlar / özel şartlar ", padding=8)
        nb_.pack(fill="both", expand=True, pady=(10, 0))
        self._sip_not = tk.Text(nb_, height=8, font=("Segoe UI", 10), wrap="word", relief="solid", bd=1)
        self._sip_not.pack(fill="both", expand=True)
        bt = ttk.Frame(fr)
        bt.pack(fill="x", pady=(8, 0))
        ttk.Button(bt, text="Bugünün tarihi", command=lambda: self.v["sip_tarih"].set(
            datetime.date.today().strftime("%d.%m.%Y"))).pack(side="left")
        ttk.Button(bt, text="Yeni sipariş (alanları temizle)", command=self._siparis_temizle).pack(side="left", padx=8)
        ttk.Label(bt, text="Bilgiler projeyle birlikte kaydedilir.", foreground="#7a858e").pack(side="left", padx=8)

    def _hazirlayan_kaydet(self):
        _ayar_db().setdefault("genel", {})["hazirlayan"] = self.v["sip_hazirlayan"].get().strip()
        ayar_kaydet()

    def _siparis_temizle(self):
        for _e, anahtar, _c in self.SIPARIS_ALANLARI:
            if anahtar not in ("sip_hazirlayan", "sistem_adi"):
                self.v[anahtar].set("")
        self.v["sip_tarih"].set(datetime.date.today().strftime("%d.%m.%Y"))
        self._sip_not.delete("1.0", "end")

    def siparis_bilgisi(self):
        """Çıktılarda görünecek sipariş bilgileri: [(etiket, değer)] (boş olanlar atlanır)."""
        out = []
        for _e, anahtar, cikti in self.SIPARIS_ALANLARI:
            d = self.v[anahtar].get().strip() if anahtar in self.v else ""
            if d:
                out.append((cikti, d))
        notu = self._sip_not.get("1.0", "end").strip() if hasattr(self, "_sip_not") else ""
        if notu:
            out.append(("Not", notu))
        return out

    # -- katalog kuralları
    def _kural_sekmesi(self, nb):
        fr = ttk.Frame(nb, padding=12)
        nb.add(fr, text="Kurallar")
        self._kr_baslik = ttk.Label(fr, text="", font=("Segoe UI", 10, "bold"))
        self._kr_baslik.pack(anchor="w")
        ttk.Label(fr, wraplength=900, foreground="#7a858e", justify="left",
                  text="Toplam cam kalınlığına (PVB dahil) göre sabit ısı bariyeri kuralları. Kural bulunmazsa eldeki "
                       "bariyerlerden cam kalınlığına göre otomatik seçilir. Arayüzden elle seçim her zaman önceliklidir. "
                       "Kurallar bu sistem için saklanır.").pack(anchor="w", pady=(2, 6))
        kf = ttk.LabelFrame(fr, text=" Sabit kurallar (bu sistem) ", padding=6)
        kf.pack(fill="x")
        kol = ("Cam en az", "Cam en çok", "Bariyer", "Boşluk (mm)", "Durum", "Not")
        tr = ttk.Treeview(kf, columns=kol, show="headings", height=6, selectmode="browse")
        for k_, w_ in zip(kol, (80, 80, 170, 90, 150, 260)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        tr.pack(fill="x")
        tr.bind("<Double-Button-1>", lambda _e: self._kural_duzenle())
        self._kr_tr = tr
        bt = ttk.Frame(kf)
        bt.pack(fill="x", pady=(6, 0))
        ttk.Button(bt, text="Ekle...", command=self._kural_ekle).pack(side="left")
        ttk.Button(bt, text="Düzenle...", command=self._kural_duzenle).pack(side="left", padx=6)
        ttk.Button(bt, text="Sil", command=self._kural_sil).pack(side="left")
        ttk.Button(bt, text="Uyuşmazlık tara / kod öner...", command=self._uyum_tara).pack(side="left", padx=(18, 0))
        ttk.Button(bt, text="Tüm aks / hatları tara...", command=self._toplu_tara).pack(side="left", padx=(6, 0))
        sf = ttk.LabelFrame(fr, text=" Sonuç tablosu: her cam kalınlığında hangi bariyer seçilir (kural, yoksa otomatik) ",
                            padding=6)
        sf.pack(fill="both", expand=True, pady=(10, 0))
        kol2 = ("Cam kalınlığı", "Kaynak", "Bariyer", "Boşluk (mm)", "Not")
        tr2 = ttk.Treeview(sf, columns=kol2, show="headings", height=12, selectmode="extended")
        for k_, w_ in zip(kol2, (100, 90, 200, 100, 220)):
            tr2.heading(k_, text=k_)
            tr2.column(k_, width=w_, anchor="w")
        sb2 = ttk.Scrollbar(sf, orient="vertical", command=tr2.yview)
        tr2.configure(yscrollcommand=sb2.set)
        tr2.pack(side="left", fill="both", expand=True)
        sb2.pack(side="left", fill="y")
        tr2.tag_configure("kural", background="#e6f0e3")
        self._kr_tr2 = tr2
        bt2 = ttk.Frame(fr)
        bt2.pack(fill="x", pady=(6, 0))
        ttk.Button(bt2, text="Seçili otomatik satırları kural yap", command=self._kural_dondur).pack(side="left")
        self._kr_durum = ttk.Label(bt2, text="", foreground="#7a858e")
        self._kr_durum.pack(side="left", padx=10)

    def _kural_yenile(self):
        if not hasattr(self, "_kr_tr"):
            return
        sistem = self._aktif_sistem()
        kurallar = cam_kurallari(sistem)
        self._kr_baslik.config(text=f"Sistem: {sistem}" if sistem else "Sistem seçilmedi")
        tr = self._kr_tr
        tr.delete(*tr.get_children())
        for i, k in enumerate(kurallar):
            kodlar, eksik = bariyer_coz(self.bariyerler, k["bariyer"])
            if not kodlar or eksik:
                bos, durum = "", "katalogda yok: " + ", ".join(eksik or ["?"])
            else:
                top = bariyer_toplam(self.bariyerler, kodlar)
                lo, hi = k["min"] - top, k["max"] - top
                bos = f"{lo:.1f} – {hi:.1f}"
                durum = ("uygun" if BARIYER_PENCERE[0] - 1e-9 <= lo and hi <= BARIYER_PENCERE[1] + 1e-9
                         else "boşluk aralık dışı")
            tr.insert("", "end", iid=str(i), values=(f"{k['min']:g}", f"{k['max']:g}", k["bariyer"], bos, durum, k["not"]))
        tr2 = self._kr_tr2
        tr2.delete(*tr2.get_children())
        for kal, kaynak, bar, bos, nt in kalinlik_tablosu(self.bariyerler, kurallar, [float(x) for x in range(16, 47)]):
            tr2.insert("", "end", iid=f"{kal:g}", tags=(kaynak,) if kaynak == "kural" else (),
                       values=(f"{kal:g} mm", kaynak, bar, f"{bos:.1f}", nt))
        kal_p = self._cam_kalinlik()
        if kal_p is not None:
            k = kural_bariyer(kurallar, kal_p)
            self._kr_durum.config(text=f"Projedeki cam {kal_p:.2f} mm: " +
                                  (f"kural {k['min']:g}–{k['max']:g} mm → {k['bariyer']}" if k else "kural yok, otomatik seçilir"))
        else:
            self._kr_durum.config(text="")

    def _kural_degisti(self, kurallar):
        cam_kurallari_yaz(self._aktif_sistem(), kurallar)
        self._kural_yenile()
        if self.sonuc:
            self.hesapla()

    def _kural_secili(self):
        sel = self._kr_tr.selection()
        return int(sel[0]) if sel else None

    def _kural_ekle(self):
        yeni = self._kural_diyalog()
        if yeni:
            self._kural_degisti(cam_kurallari(self._aktif_sistem()) + [yeni])

    def _toplu_tara(self):
        """Tüm aks ve hatların zincirini tarar: hata (binme/boşluk) olanları ve önerilen zinciri tek listede gösterir;
        seçilenlere (ya da tüm sorunlu satırlara) tek seferde uygular."""
        s = self.sonuc or {}
        yapi = s.get("cam_yapi")
        if not yapi or not self.detay:
            messagebox.showinfo("Tüm aks / hatları tara", "Önce hesaplayın (cam yapısı ve detay gerekli).")
            return
        sec = s.get("cam_secim")
        genel = str((sec or {}).get("pvc") or "").strip()
        anahtarlar, gor = [], set()
        for g in (self._vur.get("cephe") or []):
            if g.get("idx") is None:
                continue
            ak = self._aks_anahtari(g["tur"], g["idx"])
            if ak and tuple(ak) not in gor:
                gor.add(tuple(ak))
                anahtarlar.append((g["tur"], tuple(ak)))
        if not anahtarlar:
            messagebox.showinfo("Tüm aks / hatları tara", "Cephe görünüşünde taranacak aks/hat detayı yok.")
            return
        zh = self.model.get("zincir_hat") or {}
        try:
            oner = bariyer_oner(self.detay, yapi, self.bariyerler, secim=sec, tablo=self.cam_tablo)
        except Exception:
            oner = []
        onbellek, hata_oncesi = {}, {}

        def hata(tur, zinc):
            k = (tur, zinc)
            if k not in hata_oncesi:
                try:
                    hata_oncesi[k] = zincir_uyum_hatasi(self.detay.get(tur), tur, yapi, [x for x in zinc.split("+") if x],
                                                        self.bariyerler, sec, self.cam_tablo)
                except Exception:
                    hata_oncesi[k] = None
            return hata_oncesi[k]

        def en_iyi(tur):
            if tur not in onbellek:
                adaylar = [r for r in oner if tur in r["hata"]]
                uygun = [r for r in adaylar if abs(r["hata"][tur]) <= 0.6]      # liste zaten az parçalı + uyumlu önce sıralı
                onbellek[tur] = (uygun[0] if uygun else
                                 (min(adaylar, key=lambda r: abs(r["hata"][tur])) if adaylar else None))
            return onbellek[tur]
        satirlar = []
        for tur, ak in anahtarlar:
            zc = zk_coz(zh.get(ak))[0] or genel
            h = hata(tur, zc) if zc else None
            ad = (f"Aks {ak[1] + 1}" if ak[0] == "d" else "Hat " + "-".join(str(x) for x in ak[1:]))
            oz = en_iyi(tur)
            sorun = h is not None and abs(h) > 0.6
            satirlar.append({"ak": ak, "tur": tur, "ad": ad, "zinc": zc, "h": h, "sorun": sorun,
                             "oner": (oz["zincir"] if oz else ""), "oh": (oz["hata"][tur] if oz else None)})
        satirlar.sort(key=lambda r: (not r["sorun"], r["tur"], str(r["ak"])))
        pen = tk.Toplevel(self)
        pen.title("Tüm aks / hatları tara")
        pen.transient(self)
        try:
            pen.geometry("980x560")
        except tk.TclError:
            pass
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        n_s = sum(1 for r in satirlar if r["sorun"])
        ttk.Label(fr, text=f"Cam: {yapi['ad']} = {yapi['kalinlik']:.2f} mm   |   {len(satirlar)} aks/hat tarandı, "
                           f"{n_s} tanesinde binme/boşluk > 0,6 mm", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        kol = ("Aks / Hat", "Şu anki zincir", "Hata (mm)", "Durum", "Önerilen zincir", "Öneri hatası")
        gv = ttk.Frame(fr)
        gv.pack(fill="both", expand=True, pady=(8, 6))
        tr = ttk.Treeview(gv, columns=kol, show="headings", selectmode="extended")
        for k_, w_ in zip(kol, (90, 260, 80, 90, 260, 90)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        sb = ttk.Scrollbar(gv, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        tr.tag_configure("sorun", foreground="#d0453b")
        tr.tag_configure("ok", foreground="#2e7d32")
        for i, r in enumerate(satirlar):
            h = r["h"]
            dur = "—" if h is None else ("BİNME" if h > 0.6 else "BOŞLUK" if h < -0.6 else "uygun")
            tr.insert("", "end", iid=str(i), tags=("sorun" if r["sorun"] else "ok",),
                      values=(r["ad"], r["zinc"] or "-", "-" if h is None else f"{h:+.2f}", dur,
                              (r["oner"] or "-") if r["sorun"] else "—",
                              ("-" if r["oh"] is None else f"{r['oh']:+.2f}") if r["sorun"] else "—"))
        dur_lbl = ttk.Label(fr, text="Satır seçin (Ctrl/Shift ile çoklu) ya da 'Tüm sorunlu satırlara uygula'.",
                            foreground="#7a858e", wraplength=900)
        dur_lbl.pack(anchor="w")

        def uygula(idler):
            n = 0
            for i in idler:
                r = satirlar[int(i)]
                if not r["oner"] or r["oner"] == r["zinc"]:
                    continue
                zc0, deg, yon = zk_coz(zh.get(r["ak"]))
                self._hat_yaz(r["ak"], r["oner"], deg, yon)
                n += 1
            if n:
                self.hesapla()
                self._log(f"Toplu tarama: {n} aks/hat zinciri önerilenle değiştirildi", "uyari")
            pen.destroy()
            if n:
                messagebox.showinfo("Tüm aks / hatları tara", f"{n} aks/hat güncellendi. Geri almak için Geri düğmesini kullanın.")
        bt = ttk.Frame(fr)
        bt.pack(fill="x", pady=(8, 0))
        ttk.Button(bt, text="Seçilenlere öneriyi uygula", command=lambda: uygula(tr.selection())).pack(side="left")
        ttk.Button(bt, text="Tüm sorunlu satırlara uygula",
                   command=lambda: uygula([str(i) for i, r in enumerate(satirlar) if r["sorun"]])).pack(side="left", padx=6)
        ttk.Button(bt, text="Kapat", command=pen.destroy).pack(side="right")

    def _uyum_tara(self):
        """Geçerli cam kalınlığında kesitteki uyuşmazlıkları (binme / boşluk) tarar ve uygun zincir kodlarını önerir."""
        s = self.sonuc or {}
        yapi = s.get("cam_yapi")
        if not yapi or not self.detay:
            messagebox.showinfo("Uyuşmazlık tara", "Önce hesaplayın (cam yapısı ve detay gerekli).")
            return
        kal = yapi["kalinlik"]
        mevcut = str((s.get("cam_secim") or {}).get("pvc") or "").strip()
        pen = tk.Toplevel(self)
        pen.title("Uyuşmazlık tara / kod öner")
        pen.transient(self)
        try:
            pen.geometry("1280x680")
        except tk.TclError:
            pass
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, text=f"Cam: {yapi['ad']}  =  {kal:.2f} mm (PVB dahil)", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        satir = []
        if mevcut:
            hs = []
            for t in ("dikey", "yatay"):
                h = zincir_uyum_hatasi(self.detay.get(t), t, yapi, [x for x in mevcut.split("+") if x], self.bariyerler,
                                       s.get("cam_secim"), self.cam_tablo)
                if h is not None:
                    hs.append(f"{t} {h:+.1f} mm " + ("(BİNME)" if h > 0.6 else "(BOŞLUK)" if h < -0.6 else "(uygun)"))
            satir.append(f"Şu an seçili zincir: {mevcut}" + ("   →   " + ", ".join(hs) if hs else ""))
        else:
            satir.append("Şu an seçili ısı bariyeri zinciri yok / bulunamadı.")
        for t in ("dikey", "yatay"):
            d_ = (s.get("detay") or {}).get(t)
            for u in (detay_kontrol(d_, t) if d_ else []):
                satir.append(f"{t.capitalize()} detay: {u}")
        ttk.Label(fr, text="\n".join(satir), wraplength=640, justify="left").pack(anchor="w", pady=(4, 8))
        kol = ("Zincir (içten dışa)", "Parça", "Hata dikey (mm)", "Hata yatay (mm)")
        govde = ttk.Frame(fr)
        govde.pack(fill="both", expand=True)
        sol_ = ttk.Frame(govde)
        sol_.pack(side="left", fill="y")
        tr = ttk.Treeview(sol_, columns=kol, show="headings", height=14, selectmode="browse")
        for k_, w_ in zip(kol, (230, 50, 95, 95)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        tr.pack(fill="y", expand=True)
        onz = tk.Canvas(govde, width=560, height=380, highlightthickness=1, highlightbackground="#9aa5ad", bg="white")
        onz.pack(side="left", fill="both", expand=True, padx=(10, 0))
        onz_durum = {"zincir": None}
        self._il_ab = (0.0, 1.0)
        try:
            oner = bariyer_oner(self.detay, yapi, self.bariyerler, secim=s.get("cam_secim"), tablo=self.cam_tablo,
                                ilerleme=self._ilerle)
        finally:
            _ilerle_g(self, None)
        if mevcut:
            hm_ = {}
            for t in ("dikey", "yatay"):
                hh_ = zincir_uyum_hatasi(self.detay.get(t), t, yapi, [x for x in mevcut.split("+") if x],
                                         self.bariyerler, s.get("cam_secim"), self.cam_tablo)
                hm_[t] = "-" if hh_ is None else f"{hh_:+.2f}"
            tr.insert("", "end", iid="m", values=("● şu anki: " + mevcut, len([x for x in mevcut.split("+") if x]),
                                                  hm_["dikey"], hm_["yatay"]))
        for i, r in enumerate(oner):
            f = lambda t: (f"{r['hata'][t]:+.2f}" if t in r["hata"] else "-")
            tr.insert("", "end", iid=str(i), values=(r["zincir"], r["parca"], f("dikey"), f("yatay")))

        def onizle(_e=None):
            """Seçili zincirin kesitte nasıl görüneceğini (dikey + yatay) sağdaki tuvale çizer."""
            sec = tr.selection()
            zinc = None
            if sec:
                zinc = mevcut if sec[0] == "m" else oner[int(sec[0])]["zincir"]
            onz_durum["zincir"] = zinc
            cv = self._cv_tema(onz)
            cv.delete("all")
            W, H = onz.winfo_width(), onz.winfo_height()
            if not zinc or W < 120 or H < 120:
                return
            ogeler = []
            for t in ("dikey", "yatay"):
                kay = self.detay.get(t)
                if not kay:
                    continue
                try:
                    r_ = detay_uyarla({t: kay}, yapi, dict(s.get("cam_secim") or {}, pvc=zinc), self.cam_tablo,
                                      self.bariyerler)
                    if r_.get(t):
                        ogeler.append((t, r_[t]))
                except Exception as ex:
                    cv.create_text(W / 2, H / 2, text=f"Önizleme çizilemedi: {ex}", fill="#c0392b", width=W - 40)
                    return
            if not ogeler:
                return
            gap = 0.3 * max(d["bbox"][2] - d["bbox"][0] for _t, d in ogeler)
            tw = sum(d["bbox"][2] - d["bbox"][0] for _t, d in ogeler) + gap * (len(ogeler) - 1)
            hm = max(d["bbox"][3] - d["bbox"][1] for _t, d in ogeler)
            mL, mT, mB = 20, 60, 90
            sc = min((W - 2 * mL) / tw, (H - mT - mB) / hm)
            if sc <= 0:
                return
            ox = mL + ((W - 2 * mL) - tw * sc) / 2
            oy = mT + ((H - mT - mB) + hm * sc) / 2
            X, Y = (lambda v: ox + v * sc), (lambda v: oy - v * sc)
            cv.create_text(W / 2, 14, text="Önizleme: " + zinc, font=("Arial", 10, "bold"), fill="#3d4851")
            x = 0.0
            for t, d in ogeler:
                w_, h_ = d["bbox"][2] - d["bbox"][0], d["bbox"][3] - d["bbox"][1]
                dx, dy = x - d["bbox"][0], (hm - h_) / 2 - d["bbox"][1]
                for x1, y1, x2, y2, tp in detay_cam_dikdortgenleri(d, t, yapi):
                    dolgu, cizgi = cam_renk(tp)
                    cv.create_rectangle(X(x1 + dx), Y(y2 + dy), X(x2 + dx), Y(y1 + dy), fill=dolgu, outline=cizgi)
                ciz_detay(cv, d, X, Y, sc, dx, dy, yazi=True)
                mx = X(x + w_ / 2)
                cv.create_text(mx, 38, text=t.capitalize(), font=("Arial", 9, "bold"), fill="#3d4851")
                yy = Y(d["bbox"][1] + dy) + 14
                try:
                    h_t = zincir_uyum_hatasi(self.detay.get(t), t, yapi, [q for q in zinc.split("+") if q],
                                             self.bariyerler, s.get("cam_secim"), self.cam_tablo)
                except Exception:
                    h_t = None
                if h_t is not None:
                    cv.create_text(mx, yy, anchor="n", font=("Arial", 9, "bold"),
                                   fill="#c0392b" if abs(h_t) > 0.6 else "#2e7d32",
                                   text=f"zincir farkı {h_t:+.2f} mm " + ("(binme)" if h_t > 0.6 else "(boşluk)" if h_t < -0.6 else "(uygun)"))
                    yy += 14
                try:
                    uy = detay_kontrol(d, t)
                except Exception:
                    uy = []
                for ln in uy[:4]:
                    cv.create_text(mx, yy, anchor="n", width=max(140, (w_ + gap * 0.6) * sc), justify="center",
                                   text="! " + ln, fill="#c0392b", font=("Arial", 8))
                    yy += 12 * (1 + int(len(ln) * 5.2 // max(140, (w_ + gap * 0.6) * sc)))
                x += w_ + gap
        tr.bind("<<TreeviewSelect>>", onizle)
        onz.bind("<Configure>", lambda _e: onizle())
        if mevcut:
            tr.selection_set("m")
        elif oner:
            tr.selection_set("0")
        ttk.Label(fr, wraplength=640, foreground="#7a858e", justify="left",
                  text="Hata = zincir boyu ile baskı/kapak konumu arasındaki fark: + binme, − boşluk. 0'a yakın olanlar uyumludur. "
                       "Aday: (isteğe bağlı adaptör) + en çok 3 ısı bariyeri; en az parçalı ve en uyumlu olan önce gelir.").pack(
            anchor="w", pady=(6, 0))

        def kural_ekle():
            sec = tr.selection()
            if not sec or sec[0] == "m":
                return
            r = oner[int(sec[0])]
            kurallar = cam_kurallari(self._aktif_sistem())
            lo, hi = round(kal - 0.05, 2), round(kal + 0.05, 2)
            yeni_k = []
            for k in kurallar:                       # bu kalınlığı kapsayan kural bölünür: yalnız bu kalınlık yeni zinciri alır
                if k["max"] < lo or k["min"] > hi:
                    yeni_k.append(k)
                    continue
                if k["min"] < lo:
                    yeni_k.append(dict(k, max=round(lo - 0.01, 2)))
                if k["max"] > hi:
                    yeni_k.append(dict(k, min=round(hi + 0.01, 2)))
            yeni_k.append({"min": lo, "max": hi, "bariyer": r["zincir"], "not": "uyum taramasından"})
            kurallar = yeni_k
            self._kural_degisti(kurallar)
            pen.destroy()
        bt_ = ttk.Frame(fr)
        bt_.pack(fill="x", pady=(8, 0))
        ttk.Button(bt_, text="Bu cam kalınlığı için kural ekle", command=kural_ekle).pack(side="left")
        ttk.Button(bt_, text="Kapat", command=pen.destroy).pack(side="right")

    def _kural_duzenle(self):
        i = self._kural_secili()
        if i is None:
            return
        kurallar = cam_kurallari(self._aktif_sistem())
        yeni = self._kural_diyalog(kurallar[i])
        if yeni:
            kurallar[i] = yeni
            self._kural_degisti(kurallar)

    def _kural_sil(self):
        i = self._kural_secili()
        if i is None:
            return
        kurallar = cam_kurallari(self._aktif_sistem())
        del kurallar[i]
        self._kural_degisti(kurallar)

    def _kural_dondur(self):
        """Sonuç tablosunda seçili otomatik satırları, ardışık ve aynı bariyerliler birleştirilerek kurala çevirir."""
        kurallar = cam_kurallari(self._aktif_sistem())
        secili = sorted(float(i_) for i_ in self._kr_tr2.selection())
        satir = {r[0]: r for r in kalinlik_tablosu(self.bariyerler, kurallar, secili)}
        grup = []
        for kal in secili:
            r = satir[kal]
            if r[1] != "otomatik" or not r[2]:
                continue
            if grup and abs(kal - grup[-1][1] - 1) < 1e-9 and grup[-1][2] == r[2]:
                grup[-1][1] = kal
            else:
                grup.append([kal, kal, r[2]])
        if not grup:
            self._kr_durum.config(text="Seçimde dönüştürülecek otomatik satır yok.")
            return
        for a, b, bar in grup:
            kurallar.append({"min": a - 0.5, "max": b + 0.49, "bariyer": bar, "not": "otomatik tablodan"})
        self._kural_degisti(kurallar)

    def _kural_diyalog(self, mevcut=None):
        sonuc = {}
        pen = tk.Toplevel(self)
        pen.title("Bariyer kuralı")
        pen.transient(self)
        pen.resizable(False, False)
        fr = ttk.Frame(pen, padding=12)
        fr.pack()
        v_min = tk.StringVar(value=f"{mevcut['min']:g}" if mevcut else "")
        v_max = tk.StringVar(value=f"{mevcut['max']:g}" if mevcut else "")
        v_bar = tk.StringVar(value=mevcut["bariyer"] if mevcut else "")
        v_not = tk.StringVar(value=mevcut["not"] if mevcut else "")
        ttk.Label(fr, text="Cam toplam kalınlığı (mm, PVB dahil)").grid(row=0, column=0, columnspan=4, sticky="w")
        ttk.Label(fr, text="En az").grid(row=1, column=0, sticky="w", pady=4)
        ttk.Entry(fr, textvariable=v_min, width=8).grid(row=1, column=1, padx=6)
        ttk.Label(fr, text="En çok").grid(row=1, column=2, sticky="w")
        ttk.Entry(fr, textvariable=v_max, width=8).grid(row=1, column=3, padx=6)
        ttk.Label(fr, text="Isı bariyeri").grid(row=2, column=0, sticky="w", pady=4)
        ttk.Combobox(fr, textvariable=v_bar, width=34,
                     values=[m for m, _t in bariyer_kombinasyonlari(self.bariyerler)]).grid(
            row=2, column=1, columnspan=3, sticky="we", padx=6)
        ttk.Label(fr, text="Not").grid(row=3, column=0, sticky="w", pady=4)
        ttk.Entry(fr, textvariable=v_not, width=36).grid(row=3, column=1, columnspan=3, sticky="we", padx=6)
        ttk.Label(fr, foreground="#7a858e", text="Birden çok bariyer '+' ile yazılır (örn. 02.01.05+02.01.07)").grid(
            row=4, column=0, columnspan=4, sticky="w")

        def tamam():
            try:
                a = float(v_min.get().replace(",", "."))
                b = float(v_max.get().replace(",", "."))
            except ValueError:
                messagebox.showwarning("Kural", "En az / en çok için sayı girin.", parent=pen)
                return
            if a > b:
                a, b = b, a
            kodlar, eksik = bariyer_coz(self.bariyerler, v_bar.get())
            if not kodlar or eksik:
                messagebox.showwarning("Kural", "Bariyer kataloğunda olmayan kod: " + (", ".join(eksik) or "(boş)"),
                                       parent=pen)
                return
            top = bariyer_toplam(self.bariyerler, kodlar)
            if not (BARIYER_PENCERE[0] - 1e-9 <= a - top and b - top <= BARIYER_PENCERE[1] + 1e-9):
                if not messagebox.askyesno("Kural", f"Bu aralıkta boşluk {a - top:.1f}–{b - top:.1f} mm; uygun aralık "
                                           f"{BARIYER_PENCERE[0]:g}–{BARIYER_PENCERE[1]:g} mm. Yine de kaydedilsin mi?",
                                           parent=pen):
                    return
            sonuc.update({"min": a, "max": b, "bariyer": "+".join(kodlar), "not": v_not.get().strip()})
            pen.destroy()
        bt = ttk.Frame(fr)
        bt.grid(row=5, column=0, columnspan=4, pady=(10, 0))
        ttk.Button(bt, text="Tamam", command=tamam).pack(side="left", padx=4)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=4)
        pen.grab_set()
        self.wait_window(pen)
        return sonuc or None

    # -- ek malzeme
    def _ek_sekmesi(self, nb):
        fr = ttk.Frame(nb, padding=12)
        nb.add(fr, text="Ek malzeme")
        ttk.Label(fr, wraplength=900, foreground="#7a858e", justify="left",
                  text="Sistemde / katalogda olmayan malzemeleri ekleyin; Malzeme listesi, PDF ve CSV çıktılarında "
                       "'8. Ek malzeme' olarak yer alır. Sık kullandıklarınızı 'Tanımlara kaydet' ile saklayın, "
                       "sonra listeden seçerek ekleyin.").pack(anchor="w")
        kt = ttk.LabelFrame(fr, text=" Kalem ", padding=8)
        kt.pack(fill="x", pady=(8, 6))
        kt.columnconfigure(1, weight=1)
        kt.columnconfigure(3, weight=1)
        self._ek_v = {k: tk.StringVar(value="") for k in ("kod", "ad", "birim", "miktar", "kg", "not")}
        self._ek_v["birim"].set("adet")
        self._ek_v["miktar"].set("1")
        ttk.Label(kt, text="Tanımdan seç").grid(row=0, column=0, sticky="w", pady=3)
        self._ek_tanim_cb = ttk.Combobox(kt, state="readonly")
        self._ek_tanim_cb.grid(row=0, column=1, columnspan=3, sticky="we", padx=6)
        self._ek_tanim_cb.bind("<<ComboboxSelected>>", lambda _e: self._ek_tanim_sec())
        ttk.Button(kt, text="Tanımı sil", command=self._ek_tanim_sil).grid(row=0, column=4, padx=(0, 4))
        ttk.Label(kt, text="Kod").grid(row=1, column=0, sticky="w", pady=3)
        ttk.Entry(kt, textvariable=self._ek_v["kod"], width=18).grid(row=1, column=1, sticky="we", padx=6)
        ttk.Label(kt, text="Tanım").grid(row=1, column=2, sticky="w")
        ttk.Entry(kt, textvariable=self._ek_v["ad"], width=40).grid(row=1, column=3, columnspan=2, sticky="we", padx=6)
        ttk.Label(kt, text="Birim").grid(row=2, column=0, sticky="w", pady=3)
        ttk.Combobox(kt, textvariable=self._ek_v["birim"], values=self.EK_BIRIMLER, width=10).grid(
            row=2, column=1, sticky="w", padx=6)
        ttk.Label(kt, text="Miktar").grid(row=2, column=2, sticky="w")
        ttk.Entry(kt, textvariable=self._ek_v["miktar"], width=10).grid(row=2, column=3, sticky="w", padx=6)
        ttk.Label(kt, text="kg / birim").grid(row=3, column=0, sticky="w", pady=3)
        ttk.Entry(kt, textvariable=self._ek_v["kg"], width=10).grid(row=3, column=1, sticky="w", padx=6)
        ttk.Label(kt, text="Not").grid(row=3, column=2, sticky="w")
        ttk.Entry(kt, textvariable=self._ek_v["not"], width=40).grid(row=3, column=3, columnspan=2, sticky="we", padx=6)
        bt = ttk.Frame(kt)
        bt.grid(row=4, column=0, columnspan=5, sticky="w", pady=(6, 0))
        for metin, kom in (("Listeye ekle", self._ek_ekle), ("Seçiliyi güncelle", self._ek_guncelle),
                           ("Seçiliyi sil", self._ek_sil), ("Tanımlara kaydet", self._ek_tanim_kaydet),
                           ("Formu temizle", self._ek_temizle)):
            ttk.Button(bt, text=metin, command=kom).pack(side="left", padx=(0, 6))
        kol = ("Kod", "Tanım", "Birim", "Miktar", "kg/birim", "Toplam kg", "Not")
        lf = ttk.Frame(fr)
        lf.pack(fill="both", expand=True)
        tr = ttk.Treeview(lf, columns=kol, show="headings", selectmode="browse")
        for k_, w_ in zip(kol, (110, 300, 70, 80, 80, 90, 240)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        sb = ttk.Scrollbar(lf, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        tr.bind("<<TreeviewSelect>>", lambda _e: self._ek_sec())
        self._ek_tr = tr
        self._ek_toplam = ttk.Label(fr, text="", foreground="#55606a")
        self._ek_toplam.pack(anchor="w", pady=(4, 0))
        self._ek_yenile()

    def _ek_form(self):
        v = self._ek_v
        kod, ad = v["kod"].get().strip(), v["ad"].get().strip()
        if not (kod or ad):
            raise ValueError("Kod ya da tanım girin.")
        try:
            miktar = float(v["miktar"].get().replace(",", ".") or 0)
            kgs = v["kg"].get().strip().replace(",", ".")
            kg = float(kgs) if kgs else None
        except ValueError:
            raise ValueError("Miktar ve kg/birim için sayı girin.")
        if miktar <= 0 or (kg is not None and kg < 0):
            raise ValueError("Miktar pozitif, kg/birim negatif olmayan sayı olmalı.")
        return {"kod": kod, "ad": ad, "birim": v["birim"].get().strip() or "adet", "miktar": miktar, "kg": kg,
                "not": v["not"].get().strip()}

    def _ek_secili(self):
        sel = self._ek_tr.selection()
        return int(sel[0]) if sel else None

    def _ek_yenile(self):
        if not hasattr(self, "_ek_tr"):
            return
        tr = self._ek_tr
        tr.delete(*tr.get_children())
        top = 0.0
        for i, e in enumerate(self.ek_malzeme):
            kg_t = e["miktar"] * e["kg"] if e.get("kg") else None
            top += kg_t or 0.0
            tr.insert("", "end", iid=str(i), values=(e["kod"], e["ad"], e["birim"], f"{e['miktar']:g}",
                                                      "" if not e.get("kg") else f"{e['kg']:g}",
                                                      "" if kg_t is None else f"{kg_t:.2f}", e.get("not", "")))
        self._ek_toplam.config(text=f"{len(self.ek_malzeme)} kalem" + (f"   |   toplam {top:.2f} kg" if top else ""))
        self._ek_tanim_cb.config(values=[f"{t['kod']}  {t['ad']}".strip() for t in self._ek_tanimlari()])

    def _ek_degisti(self):
        self._ek_yenile()
        if self.sonuc:
            self.hesapla()

    def _ek_ekle(self):
        try:
            self.ek_malzeme.append(self._ek_form())
        except ValueError as e:
            messagebox.showwarning("Ek malzeme", str(e))
            return
        self._ek_degisti()

    def _ek_guncelle(self):
        i = self._ek_secili()
        if i is None:
            return
        try:
            self.ek_malzeme[i] = self._ek_form()
        except ValueError as e:
            messagebox.showwarning("Ek malzeme", str(e))
            return
        self._ek_degisti()

    def _ek_sil(self):
        i = self._ek_secili()
        if i is None:
            return
        del self.ek_malzeme[i]
        self._ek_degisti()

    def _ek_temizle(self):
        for k, v in self._ek_v.items():
            v.set({"birim": "adet", "miktar": "1"}.get(k, ""))

    def _ek_sec(self):
        i = self._ek_secili()
        if i is None or i >= len(self.ek_malzeme):
            return
        e = self.ek_malzeme[i]
        v = self._ek_v
        v["kod"].set(e["kod"])
        v["ad"].set(e["ad"])
        v["birim"].set(e["birim"])
        v["miktar"].set(f"{e['miktar']:g}")
        v["kg"].set("" if not e.get("kg") else f"{e['kg']:g}")
        v["not"].set(e.get("not", ""))

    # tanım kataloğu (program ayarında saklanır, her projede kullanılabilir)
    def _ek_tanimlari(self):
        return _ayar_db().setdefault("genel", {}).setdefault("ek_tanim", [])

    def _ek_tanim_kaydet(self):
        try:
            e = self._ek_form()
        except ValueError as ex:
            messagebox.showwarning("Ek malzeme", str(ex))
            return
        t = {"kod": e["kod"], "ad": e["ad"], "birim": e["birim"], "kg": e["kg"], "not": e["not"]}
        liste = self._ek_tanimlari()
        i = next((j for j, x in enumerate(liste) if _norm(x["kod"]) == _norm(t["kod"]) and _norm(x["ad"]) == _norm(t["ad"])), None)
        if i is None:
            liste.append(t)
        else:
            liste[i] = t
        ayar_kaydet()
        self._ek_yenile()

    def _ek_tanim_sec(self):
        i = self._ek_tanim_cb.current()
        liste = self._ek_tanimlari()
        if i is None or i < 0 or i >= len(liste):
            return
        t = liste[i]
        v = self._ek_v
        v["kod"].set(t["kod"])
        v["ad"].set(t["ad"])
        v["birim"].set(t["birim"])
        v["kg"].set("" if not t.get("kg") else f"{t['kg']:g}")
        v["not"].set(t.get("not", ""))

    def _ek_tanim_sil(self):
        i = self._ek_tanim_cb.current()
        liste = self._ek_tanimlari()
        if i is None or i < 0 or i >= len(liste):
            return
        del liste[i]
        ayar_kaydet()
        self._ek_tanim_cb.set("")
        self._ek_yenile()

    # ------------------------------------------------ fareyle parça seçimi
    def _fare_bagla(self, cv, anahtar):
        cv.bind("<Motion>", lambda e, a=anahtar: self._fare_hareket(e, a), add="+")
        cv.bind("<Leave>", lambda e: (e.widget.delete("hl"), self._bilgi_hover(""),
                                      self._bilgi_koor.configure(text="") if getattr(self, "_bilgi_koor", None) else None), add="+")
        cv.bind("<ButtonPress-1>", lambda e: setattr(self, "_bas_xy", (e.x, e.y)), add="+")
        cv.bind("<ButtonRelease-1>", lambda e, a=anahtar: self._fare_birak(e, a), add="+")
        cv.bind("<Button-3>", lambda e, a=anahtar: self._detay_sag_tik(e, a), add="+")

    def _poly_ciz(self, cv, g, pc, etiket):
        X, Y, dx, dy, det = g["X"], g["Y"], g["dx"], g["dy"], g["det"]
        for i in pc["idx"]:
            pr = det["prims"][i]
            for lp, d in zip(pr[1], pr[2]):
                q = [c for x, y in lp for c in (X(x + dx), Y(y + dy))]
                if len(q) < 6:
                    continue
                cv.create_polygon(q, fill="#ffb300" if d % 2 == 0 else "", stipple="gray50" if d % 2 == 0 else "",
                                  outline="#e65100", width=2, tags=etiket)

    def _fare_hareket(self, e, anahtar):
        if e.state & 0x0100:            # sol tuş basılı: kaydırma
            e.widget.delete("hl")
            return
        if self._hv_son and abs(self._hv_son[0] - e.x) < 2 and abs(self._hv_son[1] - e.y) < 2:
            return
        self._hv_son = (e.x, e.y)
        if anahtar == "cephe":
            self._bilgi_koordinat(e)
        cv = e.widget
        cv.delete("hl")
        kx, ky = self._kayma(anahtar)
        try:
            r = parca_vur(self._vur.get(anahtar) or [], e.x - kx, e.y - ky)
        except (ValueError, IndexError, KeyError, TypeError):
            r = None
        if not r and anahtar == "cephe":
            h_ = self._cep_bul(e.x - kx, e.y - ky)
            if h_:
                cv.config(cursor="hand2")
                self._bilgi_hover(str(h_["ipucu"]).replace("\n", " · "))
                t = cv.create_text(e.x - kx + 14, e.y - ky + 16, anchor="nw", font=("Arial", 9), fill="#1f2d3a",
                                   tags="hl", text=h_["ipucu"])
                bb = cv.bbox(t)
                if bb:
                    rr = cv.create_rectangle(bb[0] - 4, bb[1] - 2, bb[2] + 4, bb[3] + 2, fill="#fffbe6",
                                             outline="#c9b458", tags="hl")
                    cv.tag_raise(t, rr)
                if kx or ky:
                    cv.move("hl", kx, ky)
                return
        if not r:
            cv.config(cursor="")
            self._bilgi_hover("")
            return
        cv.config(cursor="hand2")
        g, pc = r                      # üzerine gelince yalnız ipucu; vurgu tıklayınca (sec)
        b = pc["bbox"]
        try:
            kgm = ""
            for pr_ in (self.parca.get(g["tur"]) or []):
                if _norm(pr_["blok"]) == _norm(pc.get("blok") or pc["kod"]) and pr_.get("kgm"):
                    kgm = f"   ·   {float(pr_['kgm']):.3f} kg/m"
                    break
            self._bilgi_hover(f"{pc['kod']}   {b[2] - b[0]:.1f} × {b[3] - b[1]:.1f} mm{kgm}   ·   "
                              f"{str(g['tur']).capitalize()} profil kesiti")
        except (KeyError, TypeError):
            pass
        t = cv.create_text(e.x - kx + 14, e.y - ky + 16, anchor="nw", font=("Arial", 9, "bold"), fill="#1f2d3a", tags="hl",
                           text=f"{pc['kod']}   {b[2] - b[0]:.1f}×{b[3] - b[1]:.1f}")
        bb = cv.bbox(t)
        if bb:
            rr = cv.create_rectangle(bb[0] - 4, bb[1] - 2, bb[2] + 4, bb[3] + 2, fill="#fffbe6",
                                     outline="#c9b458", tags="hl")
            cv.tag_raise(t, rr)
        if kx or ky:
            cv.move("hl", kx, ky)          # çizimden sonra sürüklendiyse kaydırmayı uygula

    # ------------------------------------------------ ortak aks / hat seçimi (görünüş + plan + kesit)
    def _aks_sec_ayarla(self, d=None, h=None, ciz=True, git=False, temizle=False):
        """Seçili dikey aks (d: 0..n) ve yatay hat (h: hat_id sırası). Görünüşte vurgulanır; plan ve kesit
        detaylarında çerçevelenir; sağ panelde hat takozu bu hatta uygulanır."""
        eski = (getattr(self, "_aks_d", None), getattr(self, "_aks_h", None))
        if temizle:
            self._aks_d = self._aks_h = None
            self._odak = None
        else:
            if d is not None:
                self._aks_d = d
            if h is not None:
                self._aks_h = h
        yeni = (getattr(self, "_aks_d", None), getattr(self, "_aks_h", None))
        if yeni != eski:
            self._odak = None                     # başka aks seçildi: aks odağı kalkar
        self._aks_ui_yenile()
        self._bilgi_ozet_yaz()
        if ciz and (yeni != eski or git):
            self.ciz()
        if yeni != eski:
            try:
                self.ciz_kesit()                 # Kesit sekmesi seçili aksın/hattın detayını gösterir
            except (tk.TclError, AttributeError):
                pass
        if git:
            self._aks_git(git if git in ("d", "h") else None)

    def _aks_cb_secildi(self, hangi):
        try:
            di = self.cb_aks_d.current()
            hi = self.cb_aks_h.current()
        except tk.TclError:
            return
        if hangi == "d":
            self._aks_sec_ayarla(d=di if di >= 0 else None, git="d")
        else:
            self._aks_sec_ayarla(h=hi if hi >= 0 else None, git="h")

    def _aks_tikla(self, g):
        """Plan/kesit detayına tıklanınca o aks/hat seçilir."""
        try:
            if g.get("idx") is None:
                return
            if g["tur"] == "dikey":
                self._aks_sec_ayarla(d=g["idx"])
            else:
                self._aks_sec_ayarla(h=g["idx"])
        except (KeyError, tk.TclError):
            pass

    def _aks_ui_yenile(self):
        """Aks/hat kutularının listelerini ve değerlerini, sağ paneldeki bilgi ve hat takozunu eşitler."""
        s = self.sonuc or {}
        hid = list(s.get("hat_id") or [])
        n_aks = len(s.get("cols") or []) + 1
        d, h = getattr(self, "_aks_d", None), getattr(self, "_aks_h", None)
        if d is not None and d >= n_aks:
            d = self._aks_d = None
        if h is not None and h >= len(hid):
            h = self._aks_h = None
        try:
            dl = [str(i + 1) for i in range(n_aks)]
            hl = [hat_adi(x) for x in hid]
            if tuple(self.cb_aks_d.cget("values")) != tuple(dl):
                self.cb_aks_d.config(values=dl)
            if tuple(self.cb_aks_h.cget("values")) != tuple(hl):
                self.cb_aks_h.config(values=hl)
            self.cb_aks_d.set(str(d + 1) if d is not None else "")
            self.cb_aks_h.set(hl[h] if h is not None else "")
        except (tk.TclError, AttributeError):
            pass
        try:
            parca = []
            if d is not None:
                parca.append(f"{d + 1}. aks")
            if h is not None:
                parca.append(f"{hat_adi(hid[h])} hattı")
            self.lbl_aks_sec.config(text="Seçili: " + " · ".join(parca) if parca else
                                    "Seçili aks/hat: yok (üstteki Aks / Hat kutularından ya da kesitte tıklayarak seçin)")
            kodlar = ["(genel)", "(yok)"] + list(_TAKOZ_KOD)
            self.cb_takoz_hat.config(values=kodlar, state="readonly" if h is not None else "disabled")
            self._takoz_hat_var.set((self.model.get("takoz_hat") or {}).get(tuple(hid[h]), "(genel)") if h is not None
                                    else "(genel)")
        except (tk.TclError, AttributeError, IndexError):
            pass
        try:
            self._zincir_esitle()
        except (tk.TclError, AttributeError, KeyError):
            pass

    def _cift_odak(self, e):
        """Çift tık: tıklanan aks/hat detayı seçilir (turuncu), görünümde yalnız o aksın profili kalır ve ekrana
        sığdırılır. Boş yere çift tık: odağı kaldırır ve görünümü sıfırlar."""
        hedef = None
        for g in (self._vur.get("cephe") or []):
            if g.get("idx") is None:
                continue
            b = g["det"]["bbox"]
            xs = sorted((g["X"](b[0] + g["dx"]), g["X"](b[2] + g["dx"])))
            ys = sorted((g["Y"](b[1] + g["dy"]), g["Y"](b[3] + g["dy"])))
            if xs[0] <= e.x <= xs[1] and ys[0] <= e.y <= ys[1]:
                hedef = (g, xs, ys)
                break
        if hedef is None:
            self._odak = None
            return False
        g, xs, ys = hedef
        tekrar = getattr(self, "_odak", None) == (g["tur"], g["idx"])    # aynı aksa tekrar çift tık: daha da yaklaş
        gen0, yuk0 = max(xs[1] - xs[0], 1.0), max(ys[1] - ys[0], 1.0)
        fx, fy = (e.x - xs[0]) / gen0, (e.y - ys[0]) / yuk0              # tıklanan nokta, detay içindeki oran
        if g["tur"] == "dikey":
            self._aks_sec_ayarla(d=g["idx"], ciz=False)
        else:
            self._aks_sec_ayarla(h=g["idx"], ciz=False)
        self._odak = (g["tur"], g["idx"])
        gv = self.gor
        if not tekrar:
            self.ciz()                  # aks odağıyla yerleşim değişir (sığdırma yenilenir): önce çiz, sonra yakınlaştır
            for g2 in (self._vur.get("cephe") or []):
                if g2.get("idx") == g["idx"] and g2["tur"] == g["tur"]:
                    b2 = g2["det"]["bbox"]
                    xs = sorted((g2["X"](b2[0] + g2["dx"]), g2["X"](b2[2] + g2["dx"])))
                    ys = sorted((g2["Y"](b2[1] + g2["dy"]), g2["Y"](b2[3] + g2["dy"])))
                    break
        W, H = max(self.cv.winfo_width(), 50), max(self.cv.winfo_height(), 50)
        gen, yuk = max(xs[1] - xs[0], 1.0), max(ys[1] - ys[0], 1.0)
        ex_, ey_ = (xs[0] + fx * gen, ys[0] + fy * yuk) if not tekrar else (e.x, e.y)
        # ilk çift tık: detay ekrana sığdırılır ve ayrıca 2.2 kat yaklaşılır; aynı aksa her çift tık 2 kat daha yaklaştırır.
        # Yakınlaştırma tıklanan noktaya yapılır (ince ayar için çalışılan bölge ekranın ortasına gelir).
        f = 2.0 if tekrar else min(W * 0.8 / gen, H * 0.8 / yuk) * 2.2
        f = min(f, 1500.0 / gv.z)
        ox, oy = gv.fit[0] + gv.px, gv.fit[1] + gv.py
        gv.px = (W / 2 - (ex_ - ox) * f) - gv.fit[0]
        gv.py = (H / 2 - (ey_ - oy) * f) - gv.fit[1]
        gv.z *= f
        self.ciz()
        return True

    def _aks_git(self, tur=None):
        """Görünümü seçili plan (d) / kesit (h) detayına kaydırır (yakınlaştırma korunur)."""
        try:
            d, h = getattr(self, "_aks_d", None), getattr(self, "_aks_h", None)
            if tur is None:
                tur = "h" if h is not None else "d"
            hedef = None
            for g in self._vur.get("cephe") or []:
                if g.get("idx") is None:
                    continue
                if (tur == "d" and g["tur"] == "dikey" and g["idx"] == d) or \
                        (tur == "h" and g["tur"] == "yatay" and g["idx"] == h):
                    hedef = g
                    break
            if hedef is None:
                return
            b = hedef["det"]["bbox"]
            sx = (hedef["X"](b[0] + hedef["dx"]) + hedef["X"](b[2] + hedef["dx"])) / 2
            sy = (hedef["Y"](b[1] + hedef["dy"]) + hedef["Y"](b[3] + hedef["dy"])) / 2
            self.gor.px += self.cv.winfo_width() / 2 - sx
            self.gor.py += self.cv.winfo_height() / 2 - sy
            self.ciz()
        except (tk.TclError, KeyError, AttributeError, TypeError):
            pass

    def _takoz_hat_degisti(self):
        s = self.sonuc or {}
        hid = list(s.get("hat_id") or [])
        h = getattr(self, "_aks_h", None)
        if h is None or h >= len(hid):
            return
        v = self._takoz_hat_var.get()
        th = self.model.setdefault("takoz_hat", {})
        if v in ("", "(genel)"):
            th.pop(tuple(hid[h]), None)
        else:
            th[tuple(hid[h])] = v
        self._log(f"{hat_adi(hid[h])} hattı cam takozu: {v}")
        self.hesapla()

    def _takoz_hat_tumu(self):
        s = self.sonuc or {}
        hid = list(s.get("hat_id") or [])
        v = self._takoz_hat_var.get()
        th = self.model.setdefault("takoz_hat", {})
        for x in hid:
            if v in ("", "(genel)"):
                th.pop(tuple(x), None)
            else:
                th[tuple(x)] = v
        self._log(f"Tüm hatlar cam takozu: {v or '(genel)'}")
        self.hesapla()

    # ------------------------------------------------ mıknatıs: Shift+sürükle ile parçayı kenara oturt
    def _tasi_cb(self, anahtar, faz, e):
        gv = self.gor if anahtar == "cephe" else self.gor_k
        cv = self.cv if anahtar == "cephe" else self.cv_kesit
        if faz == "bas":
            kx, ky = self._kayma(anahtar)
            try:
                r = parca_vur(self._vur.get(anahtar) or [], e.x - kx, e.y - ky)
            except (ValueError, IndexError, KeyError, TypeError):
                r = None
            if not r or not r[1]["idx"] or r[1]["ornek"] == 9999:
                self._log("Taşıma: önce taşınacak bir parçanın (profil dışında) üstünde Shift'e basıp sürükleyin.", "uyari")
                return False
            g, pc = r
            if g.get("idx") is None:
                self._log("Taşıma: yalnız ana ekrandaki plan/kesit detaylarında (aks ya da hat başına) çalışır.", "uyari")
                return False
            kn_ = tasi_kenarlar(g["det"], pc["idx"])
            sc = abs(g["X"](1.0) - g["X"](0.0)) or 1.0
            self._tasi_d = {"a": anahtar, "g": g, "pc": pc, "x0": e.x, "y0": e.y, "sx": 0.0, "sy": 0.0,
                            "k": kn_, "sc": sc, "son": (e.x, e.y), "ax": 0.0, "ay": 0.0}
            self._secili = {"tur": g["tur"], "kod": pc["kod"], "ornek": pc["ornek"]}
            self._parca_goster(g, pc)
            return True
        d = getattr(self, "_tasi_d", None)
        if not d:
            return False
        g, pc = d["g"], d["pc"]
        X, Y = g["X"], g["Y"]
        ince = bool(getattr(e, "state", 0) & 0x4)            # Ctrl basılıyken ince ayar: fare hareketi 5 kat azaltılır
        kat_ = 0.2 if ince else 1.0
        d["ax"] += (e.x - d["son"][0]) * kat_
        d["ay"] += (e.y - d["son"][1]) * kat_
        d["son"] = (e.x, e.y)
        wdx = d["ax"] / ((X(1.0) - X(0.0)) or 1.0)
        wdy = d["ay"] / ((Y(1.0) - Y(0.0)) or 1.0)
        tol = 7.0 / d["sc"]
        ox, oy, nx, ny = d["k"]
        sx = tasi_yapis(ox, nx, wdx, tol)
        sy = tasi_yapis(oy, ny, wdy, tol)
        d["sx"], d["sy"] = (sx[0] if sx else wdx), (sy[0] if sy else wdy)
        cv.delete("tasi")
        kx, ky = self._kayma(anahtar)
        W, H = cv.winfo_width(), cv.winfo_height()
        det = g["det"]
        for i in pc["idx"]:
            pr = det["prims"][i]
            for lp, dp in zip(pr[1], pr[2]):
                q = [c for x, y in lp for c in (X(x + g["dx"] + d["sx"]), Y(y + g["dy"] + d["sy"]))]
                if len(q) >= 6:
                    cv.create_polygon(q, fill="#80deea" if dp % 2 == 0 else "", stipple="gray50" if dp % 2 == 0 else "",
                                      outline="#00838f", width=2, tags="tasi")
        if sx:
            xx = X(sx[1] + g["dx"])
            cv.create_line(xx, 0, xx, H, fill="#00acc1", dash=(4, 3), tags="tasi")
        if sy:
            yy = Y(sy[1] + g["dy"])
            cv.create_line(0, yy, W, yy, fill="#00acc1", dash=(4, 3), tags="tasi")
        cv.create_text(10, 10, anchor="nw", fill="#00838f", font=("Arial", 9, "bold"), tags="tasi",
                       text=f"{pc['kod']}: Δx {d['sx']:+.2f}  Δy {d['sy']:+.2f} mm" + ("  [yapıştı]" if (sx or sy) else "") + ("  [ince ayar ×0.2]" if ince else "  (Ctrl: ince ayar)"))
        if kx or ky:
            cv.move("tasi", kx, ky)
        return True

    def _aks_anahtari(self, tur, idx):
        """Plan/kesit detayının aks/hat anahtarı: dikey ('d', i) | yatay ('y', kat, hat)."""
        if idx is None:
            return None
        if tur == "dikey":
            return ("d", idx)
        hl = list((self.sonuc or {}).get("hat_id") or [])
        return ("y",) + tuple(hl[idx]) if idx < len(hl) else None

    def _aks_tip_adi(self, tur, idx):
        """Aksın/hattın (çoğunluğa göre) sistem tipi adı; aynı tipli akslara toplu uygulamada kullanılır."""
        return ""                      # sistem tipi ayrımı yok: aynı yöndeki tüm aks/hatlar aynı grup
        s = self.sonuc or {}
        try:
            if tur == "dikey":
                dyok, dt, dtp = s.get("dik_yok") or set(), s.get("dik_tip") or {}, s.get("dtip")
                sg = [j for j in range(len(s["rows"])) if (idx, j) not in dyok]
                say = Counter(dt.get((idx, j), dtp) for j in sg)
                return max(say, key=lambda a: (say[a], a == dtp)) if say else dtp
            hid = s["hat_id"][idx]
            yt = s.get("ytip") or []
            yad = yt[idx] if idx < len(yt) else None
            say = Counter(s.get("yat_tip", {}).get((hid[0], hid[1], i), yad) for i in range(len(s["cols"]))
                          if (hid[0], hid[1], i) not in (s.get("yat_yok") or set()))
            return max(say, key=lambda a: (say[a], a == yad)) if say else yad
        except (KeyError, IndexError, TypeError):
            return None

    def _tasi_birak(self, e, anahtar):
        d, self._tasi_d = getattr(self, "_tasi_d", None), None
        cv = self.cv if anahtar == "cephe" else self.cv_kesit
        cv.delete("tasi")
        if not d or (abs(d["sx"]) < 0.02 and abs(d["sy"]) < 0.02):
            return
        g, pc = d["g"], d["pc"]
        ak = self._aks_anahtari(g["tur"], g.get("idx"))
        if ak is None:
            return
        gr = g["det"]["grup"][pc["idx"][0]]
        orn = getattr(gr, "ornek", 0)
        kayma = self.model.setdefault("kayma", {})
        anah = ak + (_norm(getattr(gr, "blok", "")), 5000 if 5000 <= orn < 9000 else orn)
        eski = kayma.get(anah) or self._ogrenilen_ver(g["tur"], getattr(gr, "blok", ""), orn)
        yeni = (eski[0] + d["sx"], eski[1] + d["sy"])
        kayma[anah] = yeni
        self._ogrenilen_yaz(g["tur"], getattr(gr, "blok", ""), orn, yeni)
        ad_ = f"{g['idx'] + 1}. aks" if ak[0] == "d" else f"{hat_adi(tuple(ak[1:]))} hattı"
        self._log(f"{pc['kod']} konumu ({ad_}): Δx {yeni[0]:+.2f}, Δy {yeni[1]:+.2f} mm")
        self.hesapla()

    def _sap_karsilastir(self):
        """SAP2000 sonuçlarını uygulamanın ön analizi ile aynı birimlerde (kg/cm², cm) yan yana koyar; fark % ve işaret."""
        an = (self.sonuc or {}).get("analiz")
        if not an:
            messagebox.showinfo("SAP2000 karşılaştırma", "Önce rüzgar yükü girip Hesapla'ya basın (statik ön analiz gerekli).")
            return
        d, y = an.get("dikey") or {}, an.get("yatay") or {}
        kal = [("dik_sig", "Dikey · gerilme", "kg/cm²", d.get("sig")), ("dik_d", "Dikey · sehim", "cm", d.get("d")),
               ("yat_sig", "Yatay · gerilme", "kg/cm²", y.get("sig")), ("yat_dk", "Yatay · sehim (rüzgar)", "cm", y.get("d_k")),
               ("yat_dz", "Yatay · sehim (cam ağırlığı)", "cm", y.get("d_z"))]
        sap = self.model.setdefault("sap", {})
        pen = tk.Toplevel(self)
        pen.title("SAP2000 karşılaştırma")
        pen.geometry("760x360")
        ust = ttk.Frame(pen, padding=8)
        ust.pack(fill="x")
        ttk.Label(ust, text="SAP2000 değerlerini kg/cm² ve cm cinsinden girin (boş = karşılaştırma yok).  Tolerans %:").pack(side="left")
        tol_v = tk.StringVar(value=str(sap.get("_tol", 10)))
        ttk.Entry(ust, textvariable=tol_v, width=5).pack(side="left", padx=4)
        tr = ttk.Treeview(pen, columns=("ad", "app", "sap", "fark", "dur"), show="headings", height=7)
        for k, ad, w in (("ad", "Büyüklük", 220), ("app", "Cephe Metraj", 110), ("sap", "SAP2000", 110),
                         ("fark", "Fark %", 80), ("dur", "Durum", 160)):
            tr.heading(k, text=ad)
            tr.column(k, width=w, anchor="w")
        tr.pack(fill="both", expand=True, padx=8)
        tr.tag_configure("ok", foreground="#2e7d32")
        tr.tag_configure("uyari", foreground="#c62828")
        gir = ttk.Frame(pen, padding=8)
        gir.pack(fill="x")
        vs = {}
        for i, (k, ad, u, v) in enumerate(kal):
            ttk.Label(gir, text=f"{ad} ({u})").grid(row=i // 3, column=(i % 3) * 2, sticky="e", padx=(8, 2), pady=2)
            vs[k] = tk.StringVar(value=str(sap.get(k, "")))
            ttk.Entry(gir, textvariable=vs[k], width=9).grid(row=i // 3, column=(i % 3) * 2 + 1, sticky="w")

        def yenile(*_):
            try:
                tol = float(tol_v.get().replace(",", "."))
            except ValueError:
                tol = 10.0
            sap["_tol"] = tol
            for i in tr.get_children():
                tr.delete(i)
            for k, ad, u, v in kal:
                txt = vs[k].get().strip().replace(",", ".")
                try:
                    sv = float(txt) if txt else None
                except ValueError:
                    sv = None
                if sv is not None:
                    sap[k] = sv
                else:
                    sap.pop(k, None)
                if v is None:
                    tr.insert("", "end", values=(f"{ad} [{u}]", "-", txt or "-", "-", "uygulamada yok"))
                elif sv is None:
                    tr.insert("", "end", values=(f"{ad} [{u}]", f"{v:.2f}", "-", "-", "SAP değeri girilmedi"))
                else:
                    fark = (v - sv) / sv * 100 if abs(sv) > 1e-12 else 0.0
                    ok = abs(fark) <= tol
                    dur = "Uyumlu" if ok else ("Uygulama daha YÜKSEK (güvenli)" if fark > 0 else "Uygulama daha DÜŞÜK (kontrol!)")
                    tr.insert("", "end", values=(f"{ad} [{u}]", f"{v:.2f}", f"{sv:.2f}", f"{fark:+.1f}", dur),
                              tags=("ok" if ok else "uyari",))
        for v_ in list(vs.values()) + [tol_v]:
            v_.trace_add("write", yenile)
        yenile()

    def _sistem_denetim_ac(self):
        """Tüm sistemleri (yeni eklenenler dahil) denetler; sonucu not defteri benzeri pencerede gösterir."""
        pen = tk.Toplevel(self)
        pen.title("Sistem / kütüphane denetimi")
        pen.geometry("900x560")
        txt = tk.Text(pen, wrap="none", font=("Consolas", 10))
        sb = ttk.Scrollbar(pen, command=txt.yview)
        txt.config(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        txt.pack(fill="both", expand=True)
        txt.tag_configure("h", foreground="#c62828")
        txt.tag_configure("o", foreground="#2e7d32")
        txt.tag_configure("u", foreground="#e65100")
        try:
            sis = sorted(sistem_klasorleri())
        except Exception:
            sis = []
        if not sis:
            txt.insert("end", "Sistem bulunamadı.")
            return
        top = 0
        for ad in sis:
            txt.insert("end", "=" * 70 + "\n")
            try:
                sat, n = sistem_denetimi(ad)
            except Exception as e:
                sat, n = [f"[HATA] {e}"], 1
            top += n
            for l_ in sat:
                tg = "h" if l_.startswith(("[HATA]", "[EKSİK]", "[FARK]")) else ("u" if l_.startswith("[UYARI]") else
                                                                              ("o" if l_.startswith("[OK]") else ""))
                txt.insert("end", l_ + "\n", tg)
            txt.insert("end", f"=> {ad}: {'SORUN YOK' if not n else str(n) + ' sorun'}\n\n", "o" if not n else "h")
        txt.insert("end", f"Toplam {top} sorun.\n", "o" if not top else "h")
        txt.config(state="disabled")

    def _once_sonra(self):
        """Son değişiklikten önceki ve sonraki kesiti (seçili aks/hat; yoksa ilk detay) yan yana çizer."""
        eski = getattr(self, "_once_vur", None)
        yeni = [(g["tur"], g.get("idx"), g["det"]) for g in self._vur.get("cephe", []) if g.get("det")]
        if not eski or not yeni:
            messagebox.showinfo("Önce/Sonra", "Karşılaştırılacak önceki durum yok. Bir değişiklik yapıp (taşıma, katman, cam vb.) tekrar deneyin.")
            return
        a = getattr(self, "_pp_alt", None)
        hedef = (a["tur"], a.get("idx")) if a and a.get("idx") is not None else None

        def sec(liste):
            if hedef:
                for t, i, d in liste:
                    if (t, i) == hedef:
                        return t, i, d
            for t, i, d in liste:
                if i is not None:
                    return t, i, d
            return liste[0]
        t1, i1, d1 = sec(eski)
        t2, i2, d2 = sec(yeni)
        pen = tk.Toplevel(self)
        pen.title("Önce / Sonra kesit karşılaştırma")
        pen.geometry("980x560")
        cvs = []
        fr = ttk.Frame(pen)
        fr.pack(fill="both", expand=True)
        for k in range(2):
            c = tk.Canvas(fr, bg="white", highlightthickness=1, highlightbackground="#c8ccd0")
            c.pack(side="left", fill="both", expand=True, padx=2, pady=2)
            cvs.append(c)
        bb1, bb2 = d1["bbox"], d2["bbox"]
        degisti = (d1 is not d2) and (len(d1["prims"]) != len(d2["prims"]) or
                                      any(repr(x) != repr(y) for x, y in zip(d1["prims"], d2["prims"])))

        def ciz(_e=None):
            ortak = [min(bb1[0], bb2[0]), min(bb1[1], bb2[1]), max(bb1[2], bb2[2]), max(bb1[3], bb2[3])]
            for c, d, bas in ((cvs[0], d1, "ÖNCE"), (cvs[1], d2, "SONRA")):
                c.delete("all")
                W, H = max(c.winfo_width(), 200), max(c.winfo_height(), 200)
                w_, h_ = (ortak[2] - ortak[0]) or 1, (ortak[3] - ortak[1]) or 1
                sc = min((W - 40) / w_, (H - 70) / h_)
                ox = (W - w_ * sc) / 2 - ortak[0] * sc
                oy = 50 + (H - 70 + h_ * sc) / 2 + ortak[1] * sc - h_ * sc * 0
                X, Y = (lambda v, ox=ox, sc=sc: ox + v * sc), (lambda v, oy=oy, sc=sc: oy - v * sc)
                try:
                    ciz_detay(c, d, X, Y, sc, 0.0, 0.0, yazi=True)
                except Exception as ex:
                    c.create_text(W / 2, H / 2, text=f"Çizilemedi: {ex}")
                c.create_text(W / 2, 16, text=bas, font=("Arial", 12, "bold"), fill="#3d4851")
        for c in cvs:
            c.bind("<Configure>", ciz)
        ttk.Label(pen, text=("Seçili: " + (f"{i2 + 1}. aks" if t2 == "dikey" and i2 is not None else "hat/aks")) +
                  ("   — iki kesit farklı." if degisti else "   — kesitlerde fark yok (son işlem bu aksı etkilememiş olabilir)."),
                  foreground="#e65100" if degisti else "#7a858e").pack(anchor="w", padx=6, pady=(0, 6))

    def _ogrenilen_ver(self, tur, blok, orn):
        return _KAYMA.get(ogrenilen_anahtar(tur, blok, orn), (0.0, 0.0))

    def _ogrenilen_yaz(self, tur, blok, orn, deger):
        """Elle oturtulan konumu sistem kaydına da yazar: yeni projede ve diğer aks/hatlarda aynı parça aynı konumda gelir.
        deger None: öğrenileni siler."""
        k = ogrenilen_anahtar(tur, blok, orn)
        if deger is None or (abs(deger[0]) < 1e-9 and abs(deger[1]) < 1e-9):
            _KAYMA.pop(k, None)
            deger = None
        else:
            _KAYMA[k] = (float(deger[0]), float(deger[1]))
        try:
            sis_ = self._aktif_sistem()
            if sis_:
                sistem_kaydi(sis_, True)            # kayıt yoksa oluştur (öğrenilenler kalıcı olsun)
            kayma_yaz(sis_, k, deger)
        except Exception:
            pass

    def _ok_ayar(self, e, dx, dy):
        """Seçili parçayı ok tuşlarıyla kaydırır: ok 0,1 mm, Shift+ok 1 mm (ekranda yukarı = +y)."""
        try:
            if e.widget.winfo_class() in ("Entry", "TEntry", "Text", "TCombobox", "Spinbox", "TSpinbox"):
                return
        except Exception:
            pass
        a, sc_ = getattr(self, "_pp_alt", None), getattr(self, "_secili", None)
        if not a or not sc_:
            return "break"
        ak = self._aks_anahtari(a["tur"], a.get("idx"))
        if ak is None:
            return "break"
        adim = 1.0 if (getattr(e, "state", 0) & 0x1) else 0.1
        orn = sc_.get("ornek", 0)
        kayma = self.model.setdefault("kayma", {})
        anah = ak + (_norm(a.get("blok") or a["kod"]), 5000 if 5000 <= orn < 9000 else orn)
        eski = kayma.get(anah) or self._ogrenilen_ver(a["tur"], a.get("blok") or a["kod"], orn)
        yeni = (round(eski[0] + dx * adim, 3), round(eski[1] + dy * adim, 3))
        kayma[anah] = yeni
        self._ogrenilen_yaz(a["tur"], a.get("blok") or a["kod"], orn, yeni)
        self._log(f"{a['kod']} ok tuşu ayarı: Δx {yeni[0]:+.2f}, Δy {yeni[1]:+.2f} mm")
        self.hesapla()
        return "break"

    def _kayma_sifirla(self, tum=False):
        """Seçili parçanın (tum=True: aksın/hattın tüm elle ayarlarının: konumlar + katman zinciri) elle ayarını siler."""
        a = getattr(self, "_pp_alt", None)
        ak = self._aks_anahtari(a["tur"], a.get("idx")) if a else None
        if not a or ak is None:
            self._pp_durum.config(text="Önce ana ekrandaki plan/kesit detayından bir parça seçin.")
            return
        kayma = self.model.setdefault("kayma", {})
        n = len(ak)
        bl_ = _norm(a.get("blok") or a["kod"])
        sil = [k for k in kayma if tuple(k[:n]) == tuple(ak) and (tum or k[n] == bl_)]
        for k in sil:
            del kayma[k]
        zc = False
        if tum:
            zc = self.model.setdefault("zincir_hat", {}).pop(tuple(ak), None) is not None
            tur_ = a["tur"]
            for k_ in list(_KAYMA):                  # bu aks/hatta öğrenilen konumlar da uygulanmasın (yalnız bu aks)
                p_ = str(k_).split("|")
                if len(p_) == 3 and p_[0] == tur_:
                    kayma[tuple(ak) + (p_[1], int(p_[2]))] = (0.0, 0.0)
                    sil.append(k_)
        else:
            ogr_ = False
            for orn_ in {k[n + 1] for k in sil} | {self._secili.get("ornek", 0) if self._secili else 0}:
                kk_ = ogrenilen_anahtar(a["tur"], a.get("blok") or a["kod"], orn_)
                if kk_ in _KAYMA:
                    self._ogrenilen_yaz(a["tur"], a.get("blok") or a["kod"], orn_, None)     # öğrenileni de sil
                    ogr_ = True
            if ogr_:
                sil.append("ogr")
        self._pp_durum.config(text="Sıfırlandı." if (sil or zc) else "Bu aksta/hatta elle ayar yok.")
        if sil or zc:
            self.hesapla()
            self._secili = None
            self._parca_yenile()

    def _aks_ayari_tumune(self):
        """Seçili aksın/hattın elle ayarlarını (parça konumları + katman zinciri) aynı tipteki tüm akslara/hatlara uygular."""
        a = getattr(self, "_pp_alt", None)
        ak = self._aks_anahtari(a["tur"], a.get("idx")) if a else None
        if not a or ak is None:
            self._pp_durum.config(text="Önce ana ekrandaki plan/kesit detayından bir parça seçin.")
            return
        s = self.sonuc or {}
        tur, idx = a["tur"], a["idx"]
        tip = self._aks_tip_adi(tur, idx)
        n_h = len(s.get("cols") or []) + 1 if tur == "dikey" else len(s.get("hat_id") or [])
        kayma, zh = self.model.setdefault("kayma", {}), self.model.setdefault("zincir_hat", {})
        n = len(ak)
        kaynak = {k[n:]: v for k, v in kayma.items() if tuple(k[:n]) == tuple(ak)}
        zk = zh.get(tuple(ak))
        hedefler = [i for i in range(n_h) if i != idx and self._aks_tip_adi(tur, i) == tip]
        for i in hedefler:
            hk = self._aks_anahtari(tur, i)
            for k in [k for k in kayma if tuple(k[:n]) == tuple(hk)]:
                del kayma[k]
            for k_, v_ in kaynak.items():
                kayma[tuple(hk) + k_] = v_
            if zk:
                zh[tuple(hk)] = zk
            else:
                zh.pop(tuple(hk), None)
        self._log(f"{len(hedefler)} {'aks' if tur == 'dikey' else 'hat'} güncellendi (konumlar ve katman zinciri kopyalandı).")
        self.hesapla()
        self._pp_durum.config(text=f"{len(hedefler)} {'aks' if tur == 'dikey' else 'hat'} güncellendi.")

    def _fare_birak(self, e, anahtar):
        gv_ = self.gor if anahtar == "cephe" else self.gor_k
        if getattr(gv_, "_tasi", False):
            gv_._tasi = False
            self._bas_xy = None
            self._tasi_birak(e, anahtar)
            return
        b = self._bas_xy
        self._bas_xy = None
        if anahtar == "cephe" and getattr(self.gor, "_bant", None):
            bant, self.gor._bant = self.gor._bant, None
            self.cv.delete("bant")
            if abs(bant[0] - e.x) > 4 or abs(bant[1] - e.y) > 4:
                self._bant_sec(bant, (e.x, e.y))
                return
        if not b or abs(b[0] - e.x) > 4 or abs(b[1] - e.y) > 4:
            return                                  # sürükleme: tıklama değil
        kx, ky = self._kayma(anahtar)
        try:
            r = parca_vur(self._vur.get(anahtar) or [], e.x - kx, e.y - ky)
        except (ValueError, IndexError, KeyError, TypeError):
            r = None
        if anahtar == "cephe":
            h_ = self._cep_bul(e.x - kx, e.y - ky)
            ak_ = self._hit_anahtar(h_) if h_ else None
            if e.state & 0x0004 and ak_:                  # Ctrl+tık: seçime ekle / çıkar
                self._sec ^= {ak_}
                self._sec_ciz()
                return
            if self._sec:
                if ak_ in self._sec:                      # seçili öğeye tıkla: menü tüm seçime uygulanır
                    self._sel_menu(e)
                    return
                self._sec_temizle()
            if h_ and (not r or h_["tur"] != "zone"):
                self._cep_tikla(h_, e)
                return
            if h_ and not r:
                self._cep_tikla(h_, e)
                return
        if not r:
            self._secili = None
            self._sec_yenile()
            self._parca_goster(None, None)
            return
        g, pc = r
        if anahtar == "cephe" or g.get("idx") is not None:
            self._aks_tikla(g)
        self._secili = {"tur": g["tur"], "kod": pc["kod"], "ornek": pc["ornek"]}
        self._sec_yenile()
        self._parca_goster(g, pc)

    # ------------------------------------------------ cephe görünüşünde yerinde düzenleme
    def _cep_bul(self, x, y):
        """(x, y) ekran noktasındaki tıklanabilir alan (ölçü > aks balonu > cam bölgesi)."""
        en = None
        sira = {"olcu_col": 0, "olcu_row": 0, "olcu_seg": 0, "aks": 1, "kataks": 1, "hat": 1, "dik": 2, "yat": 2, "zone": 3}
        for h in getattr(self, "_cep_hit", []) or []:
            x1, y1, x2, y2 = h["r"]
            if x1 <= x <= x2 and y1 <= y <= y2:
                if en is None or sira[h["tur"]] < sira[en["tur"]]:
                    en = h
        return en

    def _yapi_oku(self):
        """Geçerli yapı: cols, rows, ek, tip (kopya listeler) | None (girdi hatalıysa uyarı verir)."""
        try:
            cols, rows, _p, ek, tip = self._oku()
        except ValueError as e:
            messagebox.showwarning("Girdi hatası", str(e))
            return None
        return list(cols), list(rows), [list(x) for x in ek], [list(x) for x in tip]

    def _yapi_yaz(self, cols, rows, ek, tip, kat_degisti=False):
        self.v["cols"].set(sikistir(cols))
        self.v["rows"].set(sikistir(rows))
        self.model["ek"], self.model["tip"] = ek, tip
        if kat_degisti:
            self.model["ytip"] = []          # hat sayısı değişti: hat tipleri varsayılana döner
        self.hesapla()

    def _cep_tikla(self, h, e):
        t = h["tur"]
        if t == "olcu_col":
            self._olcu_diyalog("col", h["i"])
        elif t == "olcu_row":
            self._olcu_diyalog("row", h["i"])
        elif t == "olcu_seg":
            self._seg_diyalog(h["i"])
        elif t == "aks":
            self._aks_sec_ayarla(d=h["i"])
            self._aks_menu(h["i"], e)
        elif t == "hat":
            self._aks_sec_ayarla(h=h["i"])
            self._hat_menu(h["i"], e)
        elif t == "kataks":
            try:
                self._aks_sec_ayarla(h=list((self.sonuc or {}).get("hat_id") or []).index((h["k"], 0)))
            except ValueError:
                pass
            self._kat_menu(h["k"], e)
        elif t == "zone":
            self._zone_menu(h, e)
        elif t in ("dik", "yat"):
            self._profil_menu(h, e)

    def _menu_ac(self, m, e):
        try:
            m.tk_popup(e.x_root, e.y_root)
        finally:
            m.grab_release()

    def _aks_menu(self, i, e):
        y = self._yapi_oku()
        if not y:
            return
        m = tk.Menu(self, tearoff=0)
        if i == 0:
            m.add_command(label="Soluna yeni aks aralığı ekle...", command=lambda: self._olcu_diyalog("col", 0, ekle=0))
        m.add_command(label=f"{i + 1}. aksın sağına yeni aks aralığı ekle...",
                      command=lambda: self._olcu_diyalog("col", min(i, len(y[0]) - 1), ekle=i))
        m.add_separator()
        self._yalanci_menu_ekle(m, ("d", i), 0 < i < len(y[0]))
        self._seg_menu_ekle(m, [("d", i, jj) for jj in range(len(y[1]))], f"{i + 1}. aksın dikmeleri")
        self._menu_ac(m, e)

    def _takoz_hat_ata(self, idx, v):
        self._aks_sec_ayarla(h=idx, ciz=False)
        self._takoz_hat_var.set(v)
        self._takoz_hat_degisti()

    def _hat_menu(self, idx, e):
        """Kesitteki hat balonuna tıklayınca: o hattın takozu, sistem tipi, parça çıkarma, kat ekleme."""
        y = self._yapi_oku()
        hid = list((self.sonuc or {}).get("hat_id") or [])
        if not y or idx >= len(hid):
            return
        cols, rows = y[0], y[1]
        h = hid[idx]
        m = tk.Menu(self, tearoff=0)
        m.add_command(label=f"{hat_adi(h)} hattı", state="disabled")
        m.add_separator()
        alt = tk.Menu(m, tearoff=0)
        mevcut = (self.model.get("takoz_hat") or {}).get(tuple(h), "(genel)")
        for v in ["(genel)", "(yok)"] + list(_TAKOZ_KOD):
            alt.add_command(label=("● " if v == mevcut else "") + v, command=lambda v_=v: self._takoz_hat_ata(idx, v_))
        m.add_cascade(label=f"Bu hattın cam takozu ▸ ({mevcut})", menu=alt)
        m.add_separator()
        if h[1] == 0 and h[0] <= len(rows):
            k = h[0]
            if k == 0:
                m.add_command(label="Altına yeni kat ekle...", command=lambda: self._olcu_diyalog("row", 0, ekle=0))
            m.add_command(label=f"{aks_adi(k)} hattının üstüne yeni kat ekle...",
                          command=lambda: self._olcu_diyalog("row", min(k, len(rows) - 1), ekle=k))
            m.add_separator()
        self._yalanci_menu_ekle(m, ("y", h[0], h[1]), 0 < idx < len(hid) - 1)
        self._dik_gecis_menu_ekle(m, h[0], h[1] == 0 and 0 < h[0] < len(rows))
        self._seg_menu_ekle(m, [("y", h[0], h[1], ii) for ii in range(len(cols))], f"{hat_adi(h)} hattının yatay profili")
        self._menu_ac(m, e)

    def _kat_menu(self, k, e):
        y = self._yapi_oku()
        if not y:
            return
        m = tk.Menu(self, tearoff=0)
        if k == 0:
            m.add_command(label="Altına yeni kat ekle...", command=lambda: self._olcu_diyalog("row", 0, ekle=0))
        m.add_command(label=f"{aks_adi(k)} hattının üstüne yeni kat ekle...",
                      command=lambda: self._olcu_diyalog("row", min(k, len(y[1]) - 1), ekle=k))
        m.add_separator()
        self._yalanci_menu_ekle(m, ("y", k, 0), 0 < k < len(y[1]))
        self._dik_gecis_menu_ekle(m, k, 0 < k < len(y[1]))
        self._seg_menu_ekle(m, [("y", k, 0, ii) for ii in range(len(y[0]))], f"{aks_adi(k)} hattının yatay profili")
        self._menu_ac(m, e)

    def _olcu_diyalog(self, tur, i, ekle=None, aks=None):
        """Aks aralığı / kat yüksekliği değiştir; yanına aralık/kat ekle; sil. `ekle` verilirse yalnız ekleme sorulur."""
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        liste = cols if tur == "col" else rows
        if i >= len(liste):
            return
        pen = tk.Toplevel(self)
        pen.title("Aks aralığı" if tur == "col" else "Kat yüksekliği")
        pen.transient(self)
        pen.resizable(False, False)
        fr = ttk.Frame(pen, padding=12)
        fr.pack()
        ad = (f"{i + 1}–{i + 2}. aks aralığı" if tur == "col" else f"{aks_adi(i)}–{aks_adi(i + 1)} kat yüksekliği")
        if ekle is not None:
            ttk.Label(fr, text="Yeni " + ("aks aralığı" if tur == "col" else "kat yüksekliği") + " (mm)").grid(
                row=0, column=0, sticky="w")
        else:
            ttk.Label(fr, text=f"{ad} (mm)").grid(row=0, column=0, sticky="w")
        v = tk.StringVar(value=f"{liste[i]:g}")
        en = ttk.Entry(fr, textvariable=v, width=10)
        en.grid(row=0, column=1, padx=8)
        en.focus_set()
        en.select_range(0, "end")

        def deger():
            try:
                x = float(v.get().replace(",", "."))
            except ValueError:
                messagebox.showwarning("Ölçü", "Sayı girin.", parent=pen)
                return None
            if x <= 0:
                messagebox.showwarning("Ölçü", "Pozitif olmalı.", parent=pen)
                return None
            return x

        def uygula():
            x = deger()
            if x is None:
                return
            if tur == "col":
                cols[i] = x
            else:
                rows[i] = x
                ek[i] = [q for q in ek[i] if q < x - 1.0]      # kısalan katta dışarıda kalan ek yataylar düşer
                tip[i] = (tip[i] + ["cam"] * (len(ek[i]) + 1))[:len(ek[i]) + 1]
            pen.destroy()
            self._yapi_yaz(cols, rows, ek, tip)

        def ekle_(n):
            x = deger()
            if x is None:
                return
            ovr_kaydir(self.model, "col_ekle" if tur == "col" else "row_ekle", n)
            if tur == "col":
                cols.insert(n, x)
            else:
                kopya = min(i, len(rows) - 1)
                rows.insert(n, x)
                ek.insert(n, [q for q in ek[kopya] if q < x - 1.0])
                tip.insert(n, (tip[kopya] + ["cam"] * (len(ek[n]) + 1))[:len(ek[n]) + 1])
            pen.destroy()
            self._yapi_yaz(cols, rows, ek, tip, kat_degisti=(tur == "row"))

        def sil():
            if len(liste) < 2:
                messagebox.showwarning("Sil", "En az bir aralık / kat kalmalı.", parent=pen)
                return
            ovr_kaydir(self.model, "col_sil" if tur == "col" else "row_sil", i)
            if tur == "col":
                cols.pop(i)
            else:
                rows.pop(i)
                ek.pop(i)
                tip.pop(i)
            pen.destroy()
            self._yapi_yaz(cols, rows, ek, tip, kat_degisti=(tur == "row"))
        bt = ttk.Frame(fr)
        bt.grid(row=1, column=0, columnspan=2, pady=(10, 0), sticky="w")
        if ekle is not None:
            ttk.Button(bt, text="Ekle", command=lambda: ekle_(ekle)).pack(side="left")
        else:
            ttk.Button(bt, text="Değeri uygula", command=uygula).pack(side="left")
            if tur == "col":
                ttk.Button(bt, text="Soluna ekle", command=lambda: ekle_(i)).pack(side="left", padx=4)
                ttk.Button(bt, text="Sağına ekle", command=lambda: ekle_(i + 1)).pack(side="left")
            else:
                ttk.Button(bt, text="Altına kat ekle", command=lambda: ekle_(i)).pack(side="left", padx=4)
                ttk.Button(bt, text="Üstüne kat ekle", command=lambda: ekle_(i + 1)).pack(side="left")
            ttk.Button(bt, text="Sil", command=sil).pack(side="left", padx=(12, 0))
            ttk.Label(fr, foreground="#7a858e",
                      text="Ekle: kutudaki değerde yeni aralık/kat eklenir.").grid(row=2, column=0, columnspan=2, sticky="w", pady=(6, 0))
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=(8, 0))
        pen.bind("<Return>", lambda _e: (ekle_(ekle) if ekle is not None else uygula()))
        pen.bind("<Escape>", lambda _e: pen.destroy())
        pen.grab_set()

    def _seg_diyalog(self, n):
        """Ek yatay hatlarla bölünmüş ara ölçülerden birini değiştir (ek yatay kayar ya da kat yüksekliği değişir)."""
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        satir = []                                   # (tür, kat, ek sırası, mutlak y)
        taban = 0.0
        for j, r in enumerate(rows):
            satir.append(("ax", j, None, taban))
            for q, e_ in enumerate(ek[j]):
                satir.append(("ek", j, q, taban + e_))
            taban += r
        satir.append(("ax", len(rows), None, taban))
        if n + 1 >= len(satir):
            return
        alt, ust = satir[n], satir[n + 1]
        mevcut = ust[3] - alt[3]
        pen = tk.Toplevel(self)
        pen.title("Ara ölçü")
        pen.transient(self)
        pen.resizable(False, False)
        fr = ttk.Frame(pen, padding=12)
        fr.pack()
        ttk.Label(fr, text="Ara ölçü (mm)").grid(row=0, column=0, sticky="w")
        v = tk.StringVar(value=f"{mevcut:g}")
        en = ttk.Entry(fr, textvariable=v, width=10)
        en.grid(row=0, column=1, padx=8)
        en.focus_set()
        en.select_range(0, "end")
        aciklama = ("Üstteki ek yatay profil kayar." if ust[0] == "ek" else
                    ("Kat yüksekliği değişir (alttaki ek yatay yerinde kalır)." if alt[0] == "ek"
                     else "Kat yüksekliği değişir."))
        ttk.Label(fr, text=aciklama, foreground="#7a858e").grid(row=1, column=0, columnspan=2, sticky="w", pady=(6, 0))

        def uygula():
            try:
                x = float(v.get().replace(",", "."))
            except ValueError:
                messagebox.showwarning("Ölçü", "Sayı girin.", parent=pen)
                return
            if x <= 0:
                messagebox.showwarning("Ölçü", "Pozitif olmalı.", parent=pen)
                return
            if ust[0] == "ek":
                j, q = ust[1], ust[2]
                yeni = alt[3] + x - sum(rows[:j])
                alt_sinir = ek[j][q - 1] if q > 0 else 0.0
                ust_sinir = ek[j][q + 1] if q + 1 < len(ek[j]) else rows[j]
                if not (alt_sinir + 1.0 < yeni < ust_sinir - 1.0):
                    messagebox.showwarning("Ölçü", f"Bu ek yatay {alt_sinir:g} – {ust_sinir:g} mm arasında kalmalı "
                                           f"(şu an hedef {yeni:g}).", parent=pen)
                    return
                ek[j][q] = round(yeni, 2)
            elif alt[0] == "ek":
                j = alt[1]
                rel = alt[3] - sum(rows[:j])
                rows[j] = round(rel + x, 2)
            else:
                rows[alt[1]] = x
            pen.destroy()
            self._yapi_yaz(cols, rows, ek, tip, kat_degisti=(ust[0] != "ek"))
        bt = ttk.Frame(fr)
        bt.grid(row=2, column=0, columnspan=2, pady=(10, 0), sticky="w")
        ttk.Button(bt, text="Uygula", command=uygula).pack(side="left")
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=8)
        pen.bind("<Return>", lambda _e: uygula())
        pen.bind("<Escape>", lambda _e: pen.destroy())
        pen.grab_set()

    # ------------------------------------------------ çoklu seçim, tip (kapaklı/silikon) ve parça çıkarma
    @staticmethod
    def _hit_anahtar(h):
        t = h["tur"]
        if t == "zone":
            return ("z", h["kat"], h["k"], h["col"])
        if t == "dik":
            return ("d", h["i"], h["j"])
        if t == "yat":
            return ("y", h["hid"][0], h["hid"][1], h["i"])
        return None

    def _sec_temizle(self):
        if self._sec:
            self._sec = set()
            self._sec_ciz()

    def _sec_ciz(self):
        cv = self.cv
        cv.delete("csel")
        if getattr(self, "lbl_sec", None):
            n_ = len(self._sec)
            self.lbl_sec.config(text=f"{n_} öğe seçili" if n_ else "")
        if not self._sec:
            return
        for h in getattr(self, "_cep_hit", []) or []:
            if self._hit_anahtar(h) in self._sec:
                x1, y1, x2, y2 = h["r"]
                cv.create_rectangle(x1, y1, x2, y2, outline="#e65100", width=2, fill="#ffb300",
                                    stipple="gray25", tags="csel")
        kx, ky = self._kayma("cephe")
        if kx or ky:
            cv.move("csel", kx, ky)

    def _bant_sec(self, a, b):
        """Ctrl+sürükle: bandın tamamen içindeki cam hücreleri ve profil parçaları seçime eklenir."""
        kx, ky = self._kayma("cephe")
        x1, x2 = sorted((a[0] - kx, b[0] - kx))
        y1, y2 = sorted((a[1] - ky, b[1] - ky))
        for h in getattr(self, "_cep_hit", []) or []:
            ak = self._hit_anahtar(h)
            if not ak:
                continue
            r = h["r"]
            if r[0] >= x1 and r[2] <= x2 and r[1] >= y1 and r[3] <= y2:
                self._sec.add(ak)
        self._sec_ciz()

    def _tip_adi(self, tur, ad):
        """Tür (yatay/dikey) tip listesinde adı eşleşen tip adı | None."""
        for t in (self.yatay_tipleri if tur == "yatay" else self.dikey_tipleri):
            if _norm(t["tip"]) == _norm(ad):
                return t["tip"]
        return None

    def _tum_tip_adlari(self):
        return []                      # sistem tipi ayrımı kaldırıldı
        out = []
        for t in list(self.yatay_tipleri) + list(self.dikey_tipleri):
            if t["tip"] not in out:
                out.append(t["tip"])
        return out

    def _hat_idx(self, hid):
        try:
            return list((self.sonuc or {}).get("hat_id") or []).index(tuple(hid))
        except ValueError:
            return None

    def _kenarlar(self, anahtarlar):
        """Seçilen öğelerin etkilediği profil parçaları: profil seçildiyse kendisi, cam hücresi seçildiyse 4 kenarı."""
        s = self.sonuc or {}
        hid = list(s.get("hat_id") or [])
        ek = s.get("ek") or []
        out = set()
        for a in anahtarlar:
            if a[0] in ("d", "y"):
                out.add(a)
                continue
            _t, j, k, i = a
            alt_h = (j, k)
            ust_h = (j, k + 1) if k + 1 <= len(ek[j]) else (j + 1, 0)
            for h_ in (alt_h, ust_h):
                if h_ in hid:
                    out.add(("y", h_[0], h_[1], i))
            out |= {("d", i, j), ("d", i + 1, j)}
        return out

    def _segler_tip(self, segler, ad):
        """Profil parçalarına tip ver (varsayılana eşitse özel ayar silinir)."""
        yt_ = list((self.sonuc or {}).get("ytip") or [])
        dt = self.model.get("dik_tip")
        yt = self.model.get("yat_tip")
        dvars = (self.sonuc or {}).get("dtip")
        for sg in segler:
            if sg[0] == "d":
                nm = self._tip_adi("dikey", ad)
                if not nm:
                    continue
                if nm == dvars:
                    dt.pop((sg[1], sg[2]), None)
                else:
                    dt[(sg[1], sg[2])] = nm
            else:
                nm = self._tip_adi("yatay", ad)
                hx = self._hat_idx((sg[1], sg[2]))
                if not nm or hx is None:
                    continue
                if hx < len(yt_) and nm == yt_[hx]:
                    yt.pop((sg[1], sg[2], sg[3]), None)
                else:
                    yt[(sg[1], sg[2], sg[3])] = nm
        self._tip_sadelestir()
        self.hesapla()

    def _tip_sadelestir(self):
        """Bir hattın (ya da tüm dikmelerin) bütün parçaları aynı tipe getirildiyse tek tek ayarlar silinip hat/sistem tipi olur."""
        s = self.sonuc or {}
        n = len(s.get("cols") or [])
        m = len(s.get("rows") or [])
        yt, dt = self.model.get("yat_tip"), self.model.get("dik_tip")
        ytl = self.model.get("ytip") or list(s.get("ytip") or [])
        for hx, hid in enumerate(s.get("hat_id") or []):
            if hx >= len(ytl) or not n:
                continue
            adlar = {yt.get((hid[0], hid[1], i), ytl[hx]) for i in range(n)}
            if len(adlar) == 1:
                ytl[hx] = adlar.pop()
                for i in range(n):
                    yt.pop((hid[0], hid[1], i), None)
        self.model["ytip"] = ytl
        dvars = s.get("dtip")
        adlar = {dt.get((i, j), dvars) for i in range(n + 1) for j in range(m)}
        if m and len(adlar) == 1:
            self.model["dtip"] = adlar.pop()
            dt.clear()

    def _detay_segler(self, g):
        """Plan/kesit detayının (g: vur girdisi) temsil ettiği profil parçaları. Dönüş: (segler, ad) | (None, "")."""
        y = self._yapi_oku()
        if not y or g.get("idx") is None:
            return None, ""
        cols, rows = y[0], y[1]
        if g["tur"] == "dikey":
            i = g["idx"]
            return [("d", i, jj) for jj in range(len(rows))], f"Plan – {i + 1}. aks"
        hid = list((self.sonuc or {}).get("hat_id") or [])
        if g["idx"] >= len(hid):
            return None, ""
        h = hid[g["idx"]]
        return [("y", h[0], h[1], ii) for ii in range(len(cols))], f"Kesit – {aks_adi(h[0])} hattı"

    def _pp_tip_uygula(self):
        g = getattr(self, "_pp_tip_g", None)
        tad = self._pp_tip_v.get()
        if not g or not tad:
            return
        segler, ad = self._detay_segler(g)
        if segler:
            self._segler_tip(segler, tad)

    def _detay_sag_tik(self, e, anahtar):
        """Plan/kesit detayına sağ tık: o aksın / hattın sistem tipini (kapaklı, silikon...) seç."""
        if anahtar != "cephe":
            return
        kx, ky = self._kayma(anahtar)
        mx, my = e.x - kx, e.y - ky
        en = None
        for g in self._vur.get(anahtar) or []:
            if g.get("idx") is None:
                continue
            b = g["det"]["bbox"]
            xs = sorted((g["X"](b[0] + g["dx"]), g["X"](b[2] + g["dx"])))
            ys = sorted((g["Y"](b[1] + g["dy"]), g["Y"](b[3] + g["dy"])))
            if xs[0] - 4 <= mx <= xs[1] + 4 and ys[0] - 4 <= my <= ys[1] + 4:
                ar = (xs[1] - xs[0]) * (ys[1] - ys[0])
                if en is None or ar < en[0]:
                    en = (ar, g)
        if not en:
            return
        segler, ad = self._detay_segler(en[1])
        if not segler:
            return
        m = tk.Menu(self, tearoff=0)
        m.add_command(label=ad, state="disabled")
        m.add_separator()
        self._seg_menu_ekle(m, segler, ad)
        self._menu_ac(m, e)

    def _yalanci_menu_ekle(self, m, anahtar, uygun=True):
        """Menüye: hattı yalancı yap (profil yok, iki yanındaki cam birleşik) / gerçek profile döndür."""
        if not uygun:
            return
        acik = anahtar in (self.model.get("yalanci") or set())
        m.add_command(label=("✔ Yalancı hat (profil durur, cam birleşik) — kaldır" if acik
                             else "Yalancı hat yap (profil durur, cam birleşik)"),
                      command=lambda: self._yalanci_degistir(anahtar))
        m.add_separator()

    def _dik_gecis_menu_ekle(self, m, k, uygun=True):
        if not uygun:
            return
        key = ("y", k, 0)
        acik = key in (self.model.get("dik_gecis") or set())
        m.add_command(label=("✔ Düşey bu hattan geçer (kesilmez) — kaldır" if acik
                             else "Düşey bu hattan geçsin (iki kat tek parça)"),
                      command=lambda: self._dik_gecis_degistir(key))
        self._dik_orta_menu_ekle(m, k)

    def _dik_orta_menu_ekle(self, m, j):
        """j. katın (j. hattan bir üst hatta kadar) düşey birleşim katı olarak işaretlenmesi."""
        if not (0 <= j < len(self._e_rows if hasattr(self, "_e_rows") and self._e_rows else (self.sonuc or {}).get("rows", []))):
            return
        key = ("y", j, 0)
        acik = key in (self.model.get("dik_orta") or set())
        m.add_command(label=("✔ Düşey bu katın ortasında birleşir — kaldır" if acik
                             else f"Düşey bu katın ortasında birleşsin ({aks_adi(j)}–{aks_adi(j + 1)} birleşim katı)"),
                      command=lambda: self._dik_orta_degistir(key))

    def _dik_orta_degistir(self, key):
        do = self.model.setdefault("dik_orta", set())
        if key in do:
            do.discard(key)
            self._log("Düşey birleşimi bu katın ortasından kaldırıldı.")
        else:
            do.add(key)
            self.model.setdefault("dik_gecis", set()).discard(key)
            self._log("Düşey bu katın ortasında birleşiyor: iki yandaki hatlar kesilmeden geçer, dilatasyon kat ortasında.")
        self.hesapla()

    def _dik_gecis_degistir(self, key):
        dg = self.model.setdefault("dik_gecis", set())
        if key in dg:
            dg.discard(key)
            self._log("Düşey bu kat hattında yeniden kesiliyor (dilatasyon boşluğu).")
        else:
            dg.add(key)
            self._log("Düşey bu kat hattından kesilmeden geçiyor: iki kat tek parça.")
        self.hesapla()

    def _yalanci_degistir(self, anahtar):
        yl = self.model.setdefault("yalanci", set())
        if anahtar in yl:
            yl.discard(anahtar)
            self._log("Yalancı hat kaldırıldı: profil geri geldi, cam ayrıldı.")
        else:
            yl.add(anahtar)
            self._log("Yalancı hat: profil durur, iki yanındaki cam birleşti. Kertilen gaga/fitil/kapak parçalarını "
                      "hat menüsündeki 'Parça çıkar / geri koy'dan seçebilirsiniz.")
        self.hesapla()

    def _seg_menu_ekle(self, m, segler, etiket="Kenar tipi"):
        """Menüye: seçili profil parçalarını kapaklı/silikonlu ... yap + parça çıkar girdileri."""
        if not segler:
            return
        m.add_command(label="Parça çıkar / geri koy (kapak, fitil ...)…", command=lambda: self._parca_dialog(segler))
        m.add_command(label="Sürekli parça boyu (her N aksta bir kes)…", command=lambda: self._grup_dialog(segler))

    def _sel_menu(self, e):
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        z = sorted(a for a in self._sec if a[0] == "z")
        d = sorted(a for a in self._sec if a[0] == "d")
        yy = sorted(a for a in self._sec if a[0] == "y")
        m = tk.Menu(self, tearoff=0)
        m.add_command(label=f"Seçili: {len(z)} hücre, {len(d)} dikme, {len(yy)} yatay parça", state="disabled")
        m.add_separator()
        if z:
            alt = tk.Menu(m, tearoff=0)
            for tid, tv in PANEL_TIPLERI.items():
                alt.add_command(label=tv["ad"], command=lambda t_=tid: self._sel_hucre_tip(z, t_, tip))
            m.add_cascade(label="Hücre tipi ▸", menu=alt)
        segler = self._kenarlar(self._sec)
        self._seg_menu_ekle(m, sorted(segler, key=str), "Çevre profil tipi (kapaklı/silikon)" if z else "Profil tipi")
        if d or yy:
            m.add_separator()
            m.add_command(label="Seçili profilleri boş yap", command=lambda: self._sel_bos(d, yy, True))
            m.add_command(label="Seçili profilleri geri getir", command=lambda: self._sel_bos(d, yy, False))
        m.add_separator()
        m.add_command(label="Seçimi temizle", command=self._sec_temizle)
        self._menu_ac(m, e)

    def _sel_hucre_tip(self, z, t, tip):
        hu = self.model.setdefault("hucre", {})
        for _a, j, k, i in z:
            if j >= len(tip) or k >= len(tip[j]):
                continue
            if t == tip[j][k]:
                hu.pop((j, k, i), None)
            else:
                hu[(j, k, i)] = t
        self.hesapla()

    def _sel_bos(self, d, yy, yok):
        dk = self.model.setdefault("dik_yok", set())
        yt = self.model.setdefault("yat_yok", set())
        for _a, i, j in d:
            (dk.add if yok else dk.discard)((i, j))
        for _a, j, q, i in yy:
            (yt.add if yok else yt.discard)((j, q, i))
        self.hesapla()

    def _parca_dialog(self, segler, baslik="Parça çıkar / geri koy"):
        """Seçili profil parçalarından belirli parçaları (kapak, fitil, baskı ...) çıkarır; işaretsiz olanlar geri gelir."""
        s = self.sonuc or {}
        kodlar = s.get("parca_kodlar") or {}
        pc = self.model.setdefault("parca_cikar", {})
        segler = list(segler)
        turler = [(t, [sg for sg in segler if sg[0] == ("d" if t == "dikey" else "y")]) for t in ("dikey", "yatay")]
        turler = [(t, sl) for t, sl in turler if sl]
        if not turler:
            return
        pen = tk.Toplevel(self)
        pen.title(baslik)
        pen.transient(self)
        fr = ttk.Frame(pen, padding=10)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, text="İşaretli parçalar seçili kısımlardan ÇIKARILIR (metraj/ağırlıktan düşer).\n"
                           "İşareti kaldırırsanız parça geri gelir. Karışık durumdaki parçalar ▪ ile gösterilir.",
                  foreground="#55606a").pack(anchor="w", pady=(0, 6))
        vars_ = {}
        for tur, sl in turler:
            lf = ttk.LabelFrame(fr, text=f"{tur.capitalize()} ({len(sl)} parça)", padding=6)
            lf.pack(fill="x", pady=4)
            liste = list(kodlar.get(tur) or [])
            if any(t_["silikon"] for t_ in (self.yatay_tipleri if tur == "yatay" else self.dikey_tipleri)):
                liste.append(("SILIKON", "Yapısal silikon", "silikon"))
            sat = []
            for kod, ad, sinif in liste:
                say = sum(1 for sg in sl if _norm(kod) in {_norm(x) for x in pc.get(sg, ())})
                v = tk.BooleanVar(value=say == len(sl))
                vars_[(tur, kod)] = (v, sl, say)
                etiket = (kod + ("  " + ad if ad and ad != kod else "") + f"   [{sinif}]" +
                          ("   ▪ karışık" if 0 < say < len(sl) else ""))
                cb = ttk.Checkbutton(lf, text=etiket, variable=v)
                cb.pack(anchor="w")
                sat.append((v, sinif))

            def hepsi(sat_=sat, sn=("conta",)):
                for v_, sin in sat_:
                    if sin in sn:
                        v_.set(True)
            ttk.Button(lf, text="Tüm fitilleri/contaları işaretle", command=hepsi).pack(anchor="w", pady=(4, 0))
        sonuc_ = {"ok": False}

        def uygula(temizle=False):
            for (tur, kod), (v, sl, say) in vars_.items():
                kn = _norm(kod)
                for sg in sl:
                    mevcut = {x for x in pc.get(sg, ()) if _norm(x) != kn}
                    if v.get() and not temizle:
                        mevcut.add(kod)
                    if mevcut:
                        pc[sg] = mevcut
                    else:
                        pc.pop(sg, None)
            self._log(f"Parça çıkarma güncellendi: {len(segler)} profil parçası"
                      + (" (hepsi geri konuldu)" if temizle else ""))
            pen.destroy()
            self.hesapla()
        bt = ttk.Frame(fr)
        bt.pack(anchor="e", pady=(8, 0))
        ttk.Button(bt, text="Uygula", command=uygula).pack(side="left", padx=4)
        ttk.Button(bt, text="Hepsini geri koy", command=lambda: uygula(True)).pack(side="left", padx=4)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=4)

    def _grup_dialog(self, segler):
        """Sürekli parça (kapak/baskı ...): her N aksta (yatay) / N katta (dikey) bir kesilen tek parça boyu.
        segler None: tüm sistem; aksi halde seçili profillerin hat/aksları."""
        s = self.sonuc or {}
        kodlar = s.get("parca_kodlar") or {}
        pg = self.model.setdefault("parca_grup", {})
        if segler is None:
            scopes = {"yatay": [None], "dikey": [None]}
            kapsam = "Tüm sistem"
        else:
            hats = sorted({(sg[1], sg[2]) for sg in segler if sg[0] == "y"})
            akslar = sorted({sg[1] for sg in segler if sg[0] == "d"})
            scopes = {"yatay": hats, "dikey": akslar}
            kapsam = f"Seçili: {len(hats)} yatay hat, {len(akslar)} dikme aksı"
        pen = tk.Toplevel(self)
        pen.title("Sürekli parça boyu")
        pen.transient(self)
        fr = ttk.Frame(pen, padding=10)
        fr.pack()
        ttk.Label(fr, text=f"{kapsam}\nN = kaç aks (yatay) / kaç kat (dikey) boyunca tek parça gideceği; boş/0 = her aralıkta ayrı "
                           "(şimdiki hesap).\nBoy = gruptaki aks aralıkları toplamı − uç düşümü. Kesim ve çubuk listesine girer.",
                  foreground="#55606a", justify="left").grid(row=0, column=0, columnspan=4, sticky="w", pady=(0, 6))
        satir, girdi = 1, []
        for tur in ("yatay", "dikey"):
            if not scopes[tur]:
                continue
            ttk.Label(fr, text=tur.capitalize() + " parçalar", font=("Arial", 9, "bold")).grid(row=satir, column=0, sticky="w", pady=(6, 0))
            ttk.Label(fr, text="N").grid(row=satir, column=1)
            ttk.Label(fr, text="Uç düşümü (mm)").grid(row=satir, column=2)
            satir += 1
            for kod, ad, sinif in kodlar.get(tur) or []:
                if sinif in ("silikon", "izolator"):
                    continue
                k_ = _norm(kod)
                kr = pg.get((tur, k_, scopes[tur][0]))
                vn = tk.StringVar(value=str(kr[0]) if kr and kr[0] else "")
                vd = tk.StringVar(value=f"{kr[1]:g}" if kr else "0")
                ttk.Label(fr, text=kod + ("  " + ad if ad and ad != kod else "")).grid(row=satir, column=0, sticky="w")
                ttk.Entry(fr, textvariable=vn, width=5).grid(row=satir, column=1, padx=4)
                ttk.Entry(fr, textvariable=vd, width=8).grid(row=satir, column=2, padx=4)
                girdi.append((tur, k_, vn, vd))
                satir += 1

        def uygula():
            for tur, k_, vn, vd in girdi:
                try:
                    n_ = int(float(vn.get().replace(",", ".") or 0))
                    d_ = float(vd.get().replace(",", ".") or 0)
                except ValueError:
                    messagebox.showwarning("Sürekli parça", "N tam sayı, düşüm sayı olmalı.", parent=pen)
                    return
                for sc in scopes[tur]:
                    if n_ > 0:
                        pg[(tur, k_, sc)] = (n_, d_)
                    else:
                        pg.pop((tur, k_, sc), None)
            ayarli = [f"{tur} {k_}: her {vn.get()} bir" + (f", düşüm {vd.get()}" if vd.get() not in ("", "0") else "")
                      for tur, k_, vn, vd in girdi if (vn.get() or "0") not in ("", "0")]
            self._log("Sürekli parça boyu güncellendi: " + ("; ".join(ayarli) if ayarli else
                      "hiçbir parçaya N girilmedi (N boş/0 = her aralıkta ayrı, kısa kalır)"), "" if ayarli else "uyari")
            pen.destroy()
            self.hesapla()
        bt = ttk.Frame(fr)
        bt.grid(row=satir, column=0, columnspan=4, sticky="e", pady=(8, 0))
        ttk.Button(bt, text="Uygula", command=uygula).pack(side="left", padx=4)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=4)

    def _tum_segler(self):
        s = self.sonuc or {}
        n, m = len(s.get("cols") or []), len(s.get("rows") or [])
        out = {("d", i, j) for i in range(n + 1) for j in range(m)}
        out |= {("y", h[0], h[1], i) for h in (s.get("hat_id") or []) for i in range(n)}
        return out

    def _sistem_tip_dialog(self):
        """Tüm sistemi kapaklıdan silikona (veya tersine) çevir; ya da tüm sistemden parça çıkar."""
        if not self.sonuc:
            return
        pen = tk.Toplevel(self)
        pen.title("Parça / boy ayarları")
        pen.transient(self)
        pen.resizable(False, False)
        fr = ttk.Frame(pen, padding=12)
        fr.pack()
        dk_adlar = yt_adlar = ["(değiştirme)"]
        vd = vy = tk.StringVar(value="(değiştirme)")

        def uygula():
            s = self.sonuc
            if vd.get() != dk_adlar[0]:
                self.model["dtip"] = vd.get()
                self.model["dik_tip"] = {}
            if vy.get() != yt_adlar[0]:
                self.model["ytip"] = [vy.get()] * len(s["cizgiler"])
                self.model["yat_tip"] = {}
            self._log(f"Tüm sistem tipi: dikey={vd.get()}, yatay={vy.get()}")
            pen.destroy()
            self.hesapla()

        def parca():
            pen.destroy()
            self._parca_dialog(sorted(self._tum_segler(), key=str), "Tüm sistemden parça çıkar / geri koy")
        bt = ttk.Frame(fr)
        bt.grid(row=4, column=0, columnspan=2, pady=(10, 0), sticky="e")
        ttk.Button(bt, text="Tüm sistemden parça çıkar…", command=parca).pack(side="left", padx=4)
        ttk.Button(bt, text="Sürekli parça boyu…", command=lambda: (pen.destroy(), self._grup_dialog(None))).pack(
            side="left", padx=4)
        ttk.Button(bt, text="Kapat", command=pen.destroy).pack(side="left", padx=4)

    def _zone_menu(self, h, e):
        """Cam / spandrel / sandviç / boş ... : yalnız tıklanan cam için ya da bölgenin tamamı (tüm akslar) için."""
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        j, k, i = h["kat"], h["k"], h["col"]
        if j >= len(tip) or k >= len(tip[j]):
            return
        varsayilan = tip[j][k]
        simdiki = h.get("tip", varsayilan)
        m = tk.Menu(self, tearoff=0)
        m.add_command(label=f"{aks_adi(j)}–{aks_adi(j + 1)} kat, {k + 1}. bölge, {i + 1}–{i + 2}. aks", state="disabled")
        m.add_separator()
        m.add_command(label="Yalnız bu cam için:", state="disabled")
        for tid, tv in PANEL_TIPLERI.items():
            m.add_command(label=("   ● " if tid == simdiki else "      ") + tv["ad"],
                          command=lambda t_=tid: self._hucre_tip(j, k, i, t_, varsayilan))
        m.add_separator()
        m.add_command(label="Bölgenin tamamı için (tüm akslar):", state="disabled")
        for tid, tv in PANEL_TIPLERI.items():
            m.add_command(label=("   ● " if tid == varsayilan else "      ") + tv["ad"],
                          command=lambda t_=tid: self._zone_tip(j, k, t_))
        m.add_separator()
        self._seg_menu_ekle(m, sorted(self._kenarlar({("z", j, k, i)}), key=str), "Bu camın çevre profili (kapaklı/silikon)")
        m.add_separator()
        m.add_command(label="Bu bölgeye ek yatay ekle (ortaya)", command=lambda: self._zone_bol(j, k, h["z"]))
        if k > 0:
            m.add_command(label="Alttaki ek yatayı kaldır (bölgeleri birleştir)", command=lambda: self._zone_birlestir(j, k))
        self._menu_ac(m, e)

    def _hucre_tip(self, j, k, i, t, varsayilan):
        hu = self.model.setdefault("hucre", {})
        if t == varsayilan:
            hu.pop((j, k, i), None)
        else:
            hu[(j, k, i)] = t
        self.hesapla()

    def _profil_menu(self, h, e):
        """Dikme / yatay profil parçasını boş yap ya da geri getir (parça ya da tüm hat/aks)."""
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        dk = self.model.setdefault("dik_yok", set())
        yt = self.model.setdefault("yat_yok", set())
        m = tk.Menu(self, tearoff=0)
        if h["tur"] == "dik":
            i, j = h["i"], h["j"]
            tum = {(i, jj) for jj in range(len(rows))}
            m.add_command(label=f"{i + 1}. aks dikmesi, {aks_adi(j)}–{aks_adi(j + 1)} kat", state="disabled")
            m.add_separator()
            if (i, j) in dk:
                m.add_command(label="Bu dikme parçasını geri getir", command=lambda: self._profil_yok(dk, {(i, j)}, False))
            else:
                m.add_command(label="Bu dikme parçasını boş yap", command=lambda: self._profil_yok(dk, {(i, j)}, True))
            m.add_command(label=f"{i + 1}. aksın tüm dikmesini boş yap", command=lambda: self._profil_yok(dk, tum, True))
            m.add_command(label=f"{i + 1}. aksın tüm dikmesini geri getir", command=lambda: self._profil_yok(dk, tum, False))
            dgs = self.model.get("dik_gecis") or set()
            m.add_separator()
            for kb_, yon_ in ((j, "alt"), (j + 1, "üst")):
                if 0 < kb_ < len(rows):
                    key_ = ("y", kb_, 0)
                    m.add_command(label=("✔ " if key_ in dgs else "") + f"Düşey {aks_adi(kb_)} hattından geçsin ({'alt' if yon_ == 'alt' else 'üst'} kata bağlansın)",
                                  command=lambda k_=key_: self._dik_gecis_degistir(k_))
            self._dik_orta_menu_ekle(m, j)
        else:
            (hj, hq), i = h["hid"], h["i"]
            tum = {(hj, hq, ii) for ii in range(len(cols))}
            m.add_command(label=f"Yatay profil, {i + 1}–{i + 2}. aks arası", state="disabled")
            m.add_separator()
            if (hj, hq, i) in yt:
                m.add_command(label="Bu yatay parçayı geri getir", command=lambda: self._profil_yok(yt, {(hj, hq, i)}, False))
            else:
                m.add_command(label="Bu yatay parçayı boş yap", command=lambda: self._profil_yok(yt, {(hj, hq, i)}, True))
            m.add_command(label="Bu hattın tamamını boş yap", command=lambda: self._profil_yok(yt, tum, True))
            m.add_command(label="Bu hattın tamamını geri getir", command=lambda: self._profil_yok(yt, tum, False))
        m.add_separator()
        if h["tur"] == "dik":
            self._seg_menu_ekle(m, [("d", h["i"], h["j"])], "Bu dikme parçasının tipi")
            self._seg_menu_ekle(m, [("d", h["i"], jj) for jj in range(len(rows))], f"{h['i'] + 1}. aksın tüm dikmesi")
        else:
            self._seg_menu_ekle(m, [("y", h["hid"][0], h["hid"][1], h["i"])], "Bu yatay parçanın tipi")
            self._seg_menu_ekle(m, [("y", h["hid"][0], h["hid"][1], ii) for ii in range(len(cols))], "Bu hattın tamamı")
        m.add_separator()
        if h["tur"] == "dik":
            self._yalanci_menu_ekle(m, ("d", h["i"]), 0 < h["i"] < len(cols))
        else:
            hl_ = list((self.sonuc or {}).get("hat_id") or [])
            hk_ = tuple(h["hid"])
            self._yalanci_menu_ekle(m, ("y",) + hk_, hk_ in hl_ and 0 < hl_.index(hk_) < len(hl_) - 1)
        m.add_command(label="Ctrl+tık ile çoklu seçime başla", command=lambda: self._sec_baslat(h))
        self._menu_ac(m, e)

    def _sec_baslat(self, h):
        ak = self._hit_anahtar(h)
        if ak:
            self._sec = {ak}
            self._sec_ciz()

    def _profil_yok(self, kume, anahtarlar, yok):
        if yok:
            kume |= anahtarlar
        else:
            kume -= anahtarlar
        self.hesapla()

    def _zone_tip(self, j, k, t):
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        tip[j][k] = t
        hu = self.model.get("hucre") or {}
        for anah in [a_ for a_ in hu if a_[0] == j and a_[1] == k]:
            del hu[anah]                       # bölgenin tamamı seçildi: tek tek hücre ayarları silinir
        self._yapi_yaz(cols, rows, ek, tip)

    def _zone_bol(self, j, k, z):
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        baz = sum(rows[:j])
        yeni = round((z["y0"] + z["y1"]) / 2 - baz, 1)
        if yeni in ek[j] or yeni <= 0 or yeni >= rows[j]:
            return
        ek[j] = sorted(ek[j] + [yeni])
        tip[j].insert(k, tip[j][k])
        ovr_kaydir(self.model, "zone_bol", j, k)
        self._yapi_yaz(cols, rows, ek, tip, kat_degisti=True)

    def _zone_birlestir(self, j, k):
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        ek[j].pop(k - 1)
        tip[j].pop(k - 1)
        ovr_kaydir(self.model, "zone_birlestir", j, k)
        self._yapi_yaz(cols, rows, ek, tip, kat_degisti=True)

    def _kayma(self, anahtar):
        g = self.gor if anahtar == "cephe" else self.gor_k
        return getattr(g, "kx", 0), getattr(g, "ky", 0)

    def _sec_esles(self, pc):
        s = self._secili
        if s["ornek"] == 9999:
            return pc["ornek"] == 9999
        return _sade(pc["kod"]) == _sade(s["kod"])

    def _sec_yenile(self):
        for cv, a in ((self.cv, "cephe"), (self.cv_kesit, "kesit")):
            cv.delete("sec")
            s = self._secili
            if not s:
                continue
            for g in self._vur.get(a, []):
                if g["tur"] != s["tur"]:
                    continue
                for pc in detay_parca_listesi(g["det"]):
                    if self._sec_esles(pc):
                        self._poly_ciz(cv, g, pc, "sec")
            kx, ky = self._kayma(a)
            if kx or ky:
                cv.move("sec", kx, ky)

    def _secili_bul(self):
        if not self._secili:
            return None
        for a in ("kesit", "cephe"):
            for g in self._vur.get(a, []):
                if g["tur"] != self._secili["tur"]:
                    continue
                for pc in detay_parca_listesi(g["det"]):
                    if self._sec_esles(pc):
                        return g, pc
        return None

    def _parca_yenile(self):
        r = self._secili_bul()
        if r:
            self._parca_goster(*r)
        else:
            self._parca_goster(None, None)

    def _sp_bul(self, kod):
        """Kütüphane sisteminin şablon parça kaydı (alternatifleriyle) | None."""
        sistem = self._aktif_sistem()
        if not sistem or not sistem_kaydi(sistem):
            return None
        anahtar = (sistem, tuple(sorted(_DEGISIM.items())))
        if getattr(self, "_sp_onb", (None,))[0] != anahtar:
            try:
                self._sp_onb = (anahtar, sistem_parcalari(sistem))
            except (ValueError, OSError):
                self._sp_onb = (anahtar, [])
        for p_ in self._sp_onb[1]:
            if _sade(p_["kod"]) == _sade(kod) or _sade(p_["orijinal"]) == _sade(kod):
                return p_
        return None

    def _parca_goster(self, g, pc):
        lb = self._pp_lb
        lb.delete(0, "end")
        self._pp_alt = None
        self._pp_durum.config(text="")
        self._bilgi_parca = pc["kod"] if pc else ""
        try:
            self._bilgi_ozet_yaz()
        except Exception:
            pass
        if not pc:
            self._pp_baslik.config(text="Kesitte ya da cephede bir parçaya tıklayın")
            self._pp_bilgi.config(text="")
            self._onizleme_planla()
            return
        tur, kod, det = g["tur"], pc["kod"], g["det"]
        b = pc["bbox"]
        sat = [f"Konum: {tur} profil kesiti", f"Ölçü: {b[2] - b[0]:.1f} × {b[3] - b[1]:.1f} mm"]
        alan = parca_alan(det, pc)
        if alan > 0:
            sat.append(f"Kesit alanı: {alan:.1f} mm²")
        bil = next((x for x in (self.parca.get(tur) or []) if _norm(x["blok"]) == pc["blok"]), None)
        if bil:
            sat.append(f"Sınıf: {bil['sinif']}   adet/hat: {bil['adet']}")
            if bil.get("kgm"):
                sat.append(f"Ağırlık: {bil['kgm']:.3f} kg/m")
        toplam_m = toplam_kg = 0.0
        for r_ in (self.sonuc or {}).get("parca", []):
            if _sade(str(r_[0])) == _sade(kod):
                try:
                    toplam_m += float(r_[4])
                    toplam_kg += float(r_[6])
                except (ValueError, TypeError, IndexError):
                    pass
        if toplam_m:
            sat.append(f"Projede: {toplam_m:.1f} m   {toplam_kg:.2f} kg")
        liste, mevcut, rol = [], None, None
        zidx = pc["ornek"] - 5000 if 5000 <= pc["ornek"] < 9000 else None     # izolatör zincirindeki katman sırası
        if pc["ornek"] == 9999:
            rol, liste, mevcut = "prof", [str(x) for x in self.cb[tur].cget("values")], self.cb[tur].get()
            self._pp_lb_et.config(text="Profil seçenekleri (katalog):")
        elif re.match(r"^02\.\d\d", kod):
            rol, liste, mevcut = "bariyer", [str(x) for x in self.cb_bariyer.cget("values")], self.v["bariyer_elle"].get()
            yd_ = (sistem_kaydi(self._aktif_sistem()) or {}).get("yon") or {}
            yb_ = next((v for k, v in yd_.items() if re.match(r"^02\.\d\d", k) and v), "")
            if yb_:
                sat.append("Yön: " + yon_adi(yb_))
            self._pp_lb_et.config(text="Isı bariyeri seçenekleri:")
            if zidx is not None:                 # zincirdeki tek katman: yalnız bu katman değişir
                liste, mevcut = [ZINCIR_YOK] + self._zincir_adaylari(), self._katman_adi(kod)
                self._pp_lb_et.config(text=f"Bu katmanın ({zidx + 1}.) yerine (klasörlerden seçin):")
        elif pc["ornek"] >= 5000 and any(_sade(v_["kod"]) == _sade(kod) for v_ in _FITIL_EK.values()):
            rol = "zincir"                   # izolatör zincirine eklenen fitil / adaptör: yalnız yön ayarlanır
            yd_ = (sistem_kaydi(self._aktif_sistem()) or {}).get("yon") or {}
            yz_ = next((v for k, v in yd_.items() if _sade(k) == _sade(kod)), "")
            sat.append("Zincir parçası. Yön: " + yon_adi(yz_))
            liste, mevcut = [ZINCIR_YOK] + self._zincir_adaylari(), self._katman_adi(kod)
            self._pp_lb_et.config(text=f"Bu katmanın ({zidx + 1}.) yerine (klasörlerden seçin):")
        else:
            ak_g = self._aks_anahtari(tur, g.get("idx"))
            sp = self._sp_hat(kod, ak_g)
            if sp:
                rol = "kut"
                sat.append(f"Klasör: {sp['klasor']}")
                yd = dict((sistem_kaydi(self._aktif_sistem()) or {}).get("yon") or {})
                if ak_g is not None:
                    yd.update(zk_coz((self.model.get("zincir_hat") or {}).get(tuple(ak_g)))[2])
                yy = next((v for k, v in yd.items() if _sade(k) == _sade(sp["orijinal"])), "")
                if yy:
                    sat.append("Yön: " + yon_adi(yy))
                if _sade(sp["kod"]) != _sade(sp["orijinal"]):
                    sat.append(f"Orijinal: {sp['orijinal']} (değiştirildi)")
                    liste.append(sp["orijinal"])
                liste += [a for a in sp["alt"] if _sade(a) != _sade(sp["kod"]) and a not in liste]
                self._pp_lb_et.config(text="Aynı klasördeki alternatifler:")
            else:
                self._pp_lb_et.config(text="Alternatif yok (bu sistemde şablondan gelmiyor)")
        self._pp_baslik.config(text=kod)
        self._pp_bilgi.config(text="\n".join(sat))
        for a in liste:
            lb.insert("end", a)
        if mevcut in liste:
            i = liste.index(mevcut)
            lb.selection_set(i)
            lb.see(i)
        elif liste:
            lb.selection_set(0)
        self._pp_alt = {"rol": rol, "kod": kod, "tur": tur, "blok": pc.get("blok") or kod, "idx": g.get("idx"),
                        "zidx": zidx if rol in ("bariyer", "zincir") else None,
                        "tip": det.get("tip_adi", ""), "taban": bool(det.get("tip_taban"))}
        try:
            segler_, ad_ = self._detay_segler(g)
            self._pp_tip_g = g if segler_ else None
            self._pp_tip_cb.config(values=self._tum_tip_adlari(), state="readonly" if segler_ else "disabled")
            self._pp_tip_v.set("")
            self._pp_tip_et.config(text=(ad_ + " tipi:") if segler_ else "Bu detayın sistem tipi:")
        except Exception:
            self._pp_tip_g = None
        self._onizleme_planla()

    def _parca_cikar_btn(self, yok):
        """Sağ panel. yok=True: seçili parçayı tüm sistemden çıkar | "bu": yalnız seçili detayın aksından/hattından çıkar |
        "bu_geri": o aks/hattaki çıkarmaları geri koy | None: tüm çıkarılanları geri koy."""
        pc = self.model.setdefault("parca_cikar", {})
        if yok is None:
            n = len(pc)
            pc.clear()
            self._log("Çıkarılan tüm parçalar geri konuldu." if n else "Çıkarılmış parça yok.")
            self.hesapla()
            self._pp_durum.config(text="Çıkarılan parçalar geri konuldu." if n else "Çıkarılmış parça yok.")
            return
        a = getattr(self, "_pp_alt", None)
        if not a or a.get("rol") == "prof":
            self._pp_durum.config(text="Önce çizimden çıkarılacak bir parça (kapak, baskı, fitil...) seçin; "
                                       "ana profil çıkarılamaz (boş yap menüsünü kullanın).")
            return
        harf = "d" if a["tur"] == "dikey" else "y"
        kn = _norm(a.get("blok") or a["kod"])
        kod = a.get("blok") or a["kod"]
        s = self.sonuc or {}
        n_c = len(s.get("cols") or [])
        n_r = len(s.get("rows") or [])
        if yok in ("bu", "bu_geri"):
            idx = a.get("idx")
            if idx is None:
                self._pp_durum.config(text="Bu düğme için parçayı plan (aks) ya da kesit (hat) detayından seçin.")
                return
            if harf == "d":
                hedef = {("d", idx, j) for j in range(n_r)}
                ad_ = f"{idx + 1}. aks"
            else:
                hl = list(s.get("hat_id") or [])
                if idx >= len(hl):
                    return
                hedef = {("y", hl[idx][0], hl[idx][1], i) for i in range(n_c)}
                ad_ = f"{idx + 1}. hat"
            if yok == "bu_geri":
                for sg in hedef:
                    pc.pop(sg, None)
                self._log(f"{ad_}: çıkarılan parçalar geri konuldu.")
                self.hesapla()
                self._pp_durum.config(text=f"{ad_}: çıkarılanlar geri konuldu.")
                return
        else:
            hedef = {sg for sg in self._tum_segler() if sg[0] == harf}
            ad_ = f"tüm {a['tur']} profiller"
        for sg in hedef:
            mevcut = {x for x in pc.get(sg, ()) if _norm(x) != kn}
            mevcut.add(kod)
            pc[sg] = mevcut
        self._secili = None
        self._log(f"{kod} çıkarıldı: {ad_}")
        self.hesapla()
        self._pp_durum.config(text=f"{kod} {ad_} için çıkarıldı.")

    def _parca_ayar_yenile(self):
        try:
            pen = getattr(self, "_ayar_pen", None)
            if pen is not None and pen.winfo_exists():
                self._ayar_yenile()
        except tk.TclError:
            pass

    def _onizleme_planla(self):
        try:
            self.after_cancel(self._onz_id)
        except (AttributeError, ValueError, tk.TclError):
            pass
        self._onz_id = self.after(150, self._onizleme_ciz)

    def _onizleme_ciz(self):
        """Listede seçili alternatif parçanın, yuvaya otomatik oturtulmuş halini küçük tuvalde gösterir (uygulamadan önce)."""
        cv = self._pp_onz
        cv.delete("all")
        W = max(cv.winfo_width(), 200)
        H = max(cv.winfo_height(), 120)

        def yazi(m):
            cv.create_text(W / 2, H / 2, text=m, fill="#9aa4ad", width=W - 20, justify="center")
        a = getattr(self, "_pp_alt", None)
        sel = self._pp_lb.curselection()
        if not a or a.get("rol") != "kut" or not sel:
            yazi("Önizleme: listeden bir alternatif seçin")
            return
        aday = self._pp_lb.get(sel[0])
        sp = self._sp_bul(a["kod"])
        kay = self.detay_kaynak.get(a["tur"])
        if not sp or not kay or len(kay) < 3 or not kay[2]:
            yazi("Bu parça için önizleme yok")
            return
        eski_d, eski_y = dict(_DEGISIM), dict(_YON)
        try:
            if _sade(aday) == _sade(sp["orijinal"]):
                _DEGISIM.pop(_sade(sp["orijinal"]), None)
            else:
                _DEGISIM[_sade(sp["orijinal"])] = aday
            _YON.pop(_sade(sp["orijinal"]), None)
            self._cam_ui_uygula()
            _k, det, _p = profil_sablonlu(kay[2][0], kay[2][1], kay[0], kay[1], a["tur"])
        except (ValueError, OSError, IndexError, KeyError) as e:
            yazi(f"Önizleme üretilemedi: {e}")
            return
        finally:
            _DEGISIM.clear()
            _DEGISIM.update(eski_d)
            _YON.clear()
            _YON.update(eski_y)
        pcs = [x for x in detay_parca_listesi(det) if _sade(x["kod"]) == _sade(aday)]
        vur = set(i for x in pcs for i in x["idx"])
        if pcs:
            bb = [min(x["bbox"][0] for x in pcs), min(x["bbox"][1] for x in pcs),
                  max(x["bbox"][2] for x in pcs), max(x["bbox"][3] for x in pcs)]
        else:
            bb = det["bbox"]
        cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
        yarim = max(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 22
        sc = min(W, H) / (2 * yarim)

        def P(q):
            return (W / 2 + (q[0] - cx) * sc, H / 2 - (q[1] - cy) * sc)
        for i, pr in enumerate(det["prims"]):
            if pr[0] == "fill":
                loops = sorted(pr[1], key=lambda lp: -abs(_alan(lp)) if len(lp) > 2 else 0)
                for j, lp in enumerate(loops):
                    if len(lp) < 3:
                        continue
                    pts = [c_ for q in lp for c_ in P(q)]
                    if j == 0:
                        cv.create_polygon(pts, fill="#f0a030" if i in vur else "#7d838a", outline="#c8ccd0", width=1)
                    else:
                        cv.create_polygon(pts, fill="#1e2226", outline="")
            elif pr[0] == "poly" and len(pr[1]) > 1:
                cv.create_line([c_ for q in pr[1] for c_ in P(q)], fill="#4f565d")
        cv.create_text(6, 6, anchor="nw", text=f"{aday}", fill="#f0a030", font=("Segoe UI", 8, "bold"))

    def _zincir_adaylari(self):
        """Zincirdeki bir katmanın yerine konabilecek tüm parçalar: ısı bariyerleri + FITIL + ADAPTOR ('KLASÖR | kod')."""
        liste = [self._katman_adi(b["kod"]) for b in sorted(self.bariyerler or [], key=lambda b: b["ara"])]
        liste += [self._katman_adi(f["kod"]) for f in sorted(_FITIL_EK.values(), key=lambda f: (f["klasor"], f["kod"]))]
        return liste

    def _hat_ak(self):
        a = getattr(self, "_pp_alt", None) or {}
        return self._aks_anahtari(a.get("tur"), a.get("idx")) if a.get("idx") is not None else None

    def _sp_hat(self, kod, ak):
        """Şablon parça kaydı; bu aks/hatta parça değiştirilmişse yeni koddan özgün kayda ulaşır."""
        sp = self._sp_bul(kod)
        if ak is not None:
            _z, dg, _y = zk_coz((self.model.get("zincir_hat") or {}).get(tuple(ak)))
            o_ = next((o for o, n in dg.items() if _sade(n) == _sade(kod)), None)
            if o_:
                sp0 = self._sp_bul(o_)
                if sp0:
                    sp = dict(sp0, kod=kod)
        return sp

    def _hat_yaz(self, ak, zc, deg, yon):
        zh = self.model.setdefault("zincir_hat", {})
        v = zk_yaz(zc, deg, yon)
        if v:
            zh[tuple(ak)] = v
        else:
            zh.pop(tuple(ak), None)

    def _hat_parca_degis(self, ak, a, yeni):
        sp = self._sp_hat(a["kod"], ak)
        if not sp:
            self._pp_durum.config(text="Bu parça şablondan gelmiyor.")
            return
        orj = sp["orijinal"]
        yol = kutuphane_parca_bul(_KUT_KOK, yeni) if _KUT_KOK else None
        if _sade(yeni) != _sade(orj) and not yol:
            self._pp_durum.config(text=f"Kütüphanede '{yeni}' parçası bulunamadı.")
            return
        zc, d, y = zk_coz((self.model.get("zincir_hat") or {}).get(tuple(ak)))
        for k in [k for k in d if _sade(k) == _sade(orj)]:
            del d[k]
        for k in [k for k in y if _sade(k) == _sade(orj)]:
            del y[k]
        if _sade(yeni) != _sade(orj):
            d[orj] = os.path.splitext(os.path.basename(yol))[0]
        self._hat_yaz(ak, zc, d, y)
        self.hesapla()
        self._pp_durum.config(text=f"Yalnız bu aks/hat: {orj} → {d.get(orj, orj)}")

    def _hat_parca_yon(self, ak, a, eylem):
        rol = a["rol"]
        if rol == "bariyer":
            anah = list({_sade(x["orijinal"]): x["orijinal"] for x in sistem_parcalari(self._aktif_sistem()) if x["bariyer"]}.values())
        elif rol == "zincir":
            anah = [a["kod"]]
        else:
            sp = self._sp_hat(a["kod"], ak)
            anah = [sp["orijinal"]] if sp else []
        if not anah:
            self._pp_durum.config(text="Bu parça için yön ayarı yok.")
            return
        zc, d, y = zk_coz((self.model.get("zincir_hat") or {}).get(tuple(ak)))
        gy = (sistem_kaydi(self._aktif_sistem()) or {}).get("yon") or {}
        son = ""
        for orj in anah:
            kh = next((k for k in y if _sade(k) == _sade(orj)), None)
            kg = next((k for k in gy if _sade(k) == _sade(orj)), None)
            mev = y[kh] if kh is not None else (gy.get(kg, "") if kg is not None else "")
            yeni = yon_donustur(mev, eylem)
            if yeni is None:
                self._pp_durum.config(text="Yön: x | y | 90 | 180 | sıfırla")
                return
            if kh is not None:
                del y[kh]
            y[orj] = yeni
            son = yeni
        self._hat_yaz(ak, zc, d, y)
        self.hesapla()
        self._pp_durum.config(text="Yalnız bu aks/hat: yön " + yon_adi(son))

    def _zincir_katman_ata(self, kod, yeni):
        """Zincirde kodu `kod` olan katmanı `yeni` ile değiştirir (ZINCIR_YOK: katmanı kaldırır)."""
        sec = (self.sonuc or {}).get("cam_secim") or {}
        a = getattr(self, "_pp_alt", None) or {}
        ak = self._aks_anahtari(a.get("tur"), a.get("idx")) if a.get("idx") is not None else None
        zh = self.model.setdefault("zincir_hat", {})
        mevcut = zh.get(tuple(ak)) if ak else None
        zc0, deg0, yon0 = zk_coz(mevcut)
        zincir = [x.strip() for x in ((zc0 or sec.get("pvc")) or "").split("+") if x.strip()]
        i = next((k for k, x in enumerate(zincir) if _norm(x) == _norm(kod)), None)
        if i is None:
            self._pp_durum.config(text="Bu parça seçili zincirde bulunamadı.")
            return False
        if yeni == ZINCIR_YOK:
            if len(zincir) <= 1:
                self._pp_durum.config(text="Zincirin son katmanı kaldırılamaz.")
                return False
            del zincir[i]
        else:
            zincir[i] = yeni.split(" | ")[-1].strip()
        if ak:                       # yalnız bu aksın / hattın zinciri değişir (genel zincir ve diğer akslar etkilenmez)
            zh[tuple(ak)] = zk_yaz("+".join(zincir), deg0, yon0)
            self.hesapla()
            self._pp_durum.config(text="Bu aks/hat zinciri: " + " + ".join(zincir))
            return True
        self.v["bariyer_elle"].set("+".join(zincir))
        self._zincir_esitle()
        self.hesapla()
        self._pp_durum.config(text="Zincir: " + " + ".join(zincir))
        return True

    def _parca_degistir(self):
        a = getattr(self, "_pp_alt", None)
        sel = self._pp_lb.curselection()
        if not a or not a["rol"] or not sel:
            return
        yeni = self._pp_lb.get(sel[0])
        try:
            if a.get("zidx") is not None:
                self._zincir_katman_ata(a["kod"], yeni)
                self._secili = None
                self._parca_yenile()
                return
            if a["rol"] == "kut" and self._hat_ak() is not None:      # yalnız seçili aks/hat
                self._hat_parca_degis(self._hat_ak(), a, yeni)
                self._secili = None
                self._parca_yenile()
                return
            if a["rol"] == "kut":
                cikti, yen = ayar_komut(self._aktif_sistem(), f"parca {a['kod']} {yeni}")
                self._pp_durum.config(text=cikti)
                if yen:
                    if self._secili:
                        self._secili["kod"] = yeni
                    self._ayar_sonrasi(yen)
                    self._parca_ayar_yenile()
            elif a["rol"] == "prof":
                self.cb[a["tur"]].set(yeni)
                self._profil_sec(a["tur"])
            elif a["rol"] == "bariyer":
                self.v["bariyer_elle"].set(yeni)
                self.hesapla()
        except Exception as e:
            self._pp_durum.config(text=f"Hata: {e}")
            self._log(f"Parça işlemi hatası: {e}", "hata")
            return
        self._parca_yenile()

    def _parca_yon(self, eylem):
        a = getattr(self, "_pp_alt", None)
        if not a or a["rol"] not in ("kut", "bariyer", "zincir"):
            self._pp_durum.config(text="Yön yalnızca şablondan gelen parçalar (fitil, kapak, baskı, izolatör...) için değiştirilir.")
            return
        if self._hat_ak() is not None:
            try:
                self._hat_parca_yon(self._hat_ak(), a, eylem)
            except Exception as e:
                self._pp_durum.config(text=f"Hata: {e}")
                self._log(f"Parça işlemi hatası: {e}", "hata")
                return
            self._secili = None
            self._parca_yenile()
            return
        try:
            hedef = "bariyer" if a["rol"] == "bariyer" else a["kod"]
            cikti, yen = ayar_komut(self._aktif_sistem(), f"parca yon {hedef} {eylem}")
            self._pp_durum.config(text=cikti)
            if yen:
                self._ayar_sonrasi(yen)
        except Exception as e:
            self._pp_durum.config(text=f"Hata: {e}")
            self._log(f"Parça işlemi hatası: {e}", "hata")
            return
        self._parca_yenile()
        self._pp_durum.config(text=cikti)

    def _parca_orijinal(self):
        a = getattr(self, "_pp_alt", None)
        if not a or not a["rol"]:
            return
        ak_o = self._hat_ak()
        if ak_o is not None:                          # yalnız bu aks/hat: parça değişimi ve yönü özgün haline döner
            zc, d, y = zk_coz((self.model.get("zincir_hat") or {}).get(tuple(ak_o)))
            if a["rol"] == "kut":
                sp = self._sp_hat(a["kod"], ak_o)
                orj = sp["orijinal"] if sp else a["kod"]
                d = {k: v for k, v in d.items() if _sade(k) != _sade(orj)}
                y = {k: v for k, v in y.items() if _sade(k) != _sade(orj)}
            elif a["rol"] == "zincir":
                y = {k: v for k, v in y.items() if _sade(k) != _sade(a["kod"])}
            else:
                zc = ""
                y = {k: v for k, v in y.items() if not re.match(r"^02\.\d\d", k)}
            self._hat_yaz(ak_o, zc, d, y)
            self.hesapla()
            self._secili = None
            self._parca_yenile()
            self._pp_durum.config(text="Bu aks/hat için özgün haline döndü.")
            return
        try:
            if a["rol"] == "kut":
                sp = self._sp_bul(a["kod"])
                cikti, yen = ayar_komut(self._aktif_sistem(), f"parca sifirla {a['kod']}")
                self._pp_durum.config(text=cikti)
                if yen:
                    if self._secili and sp:
                        self._secili["kod"] = sp["orijinal"]
                    self._ayar_sonrasi(yen)
                    self._parca_ayar_yenile()
            elif a["rol"] in ("bariyer", "zincir"):
                self.v["bariyer_elle"].set(BARIYER_OTO)
                self._zincir_esitle()
                self.hesapla()
        except Exception as e:
            self._pp_durum.config(text=f"Hata: {e}")
            self._log(f"Parça işlemi hatası: {e}", "hata")
            return
        self._parca_yenile()

    def _cephe_aynala(self):
        genel_ayar_yaz("cephe_ayna", not genel_ayar("cephe_ayna"))
        try:
            self._uc_sifirla()                               # 3B de görünüşün baktığı tarafa döner
        except Exception:
            pass
        self.ciz()

    def _kesit_aynala(self):
        genel_ayar_yaz("kesit_ayna", not genel_ayar("kesit_ayna"))
        self.ciz_kesit()

    def _genel_degisti(self, anahtar):
        genel_ayar_yaz(anahtar, self._gv[anahtar].get())
        if anahtar != "teker_ters":
            self.ciz_kesit()
            if anahtar == "blok_renk":
                self.ciz()
                self._renk_ornek_guncelle()
            elif anahtar == "yon_merkez":
                self._ayar_sonrasi("hafif")

    def _renk_anahtar(self):
        """Seçili satırın ayar anahtarı: katman adı ya da 'cam:<tür>'."""
        return getattr(self, "_rk_harita", {}).get(self._rk_cb.get())

    def _renk_liste_yenile(self):
        h = {}
        for tp in CAM_RENK:
            h[f"Cam: {tp}"] = "cam:" + tp
        for kat in sorted(KATMAN_RENK):
            if kat not in ("0", "defpoints"):
                h[f"Katman: {kat}"] = kat
        self._rk_harita = h
        self._rk_cb.config(values=list(h))
        if h and not self._rk_cb.get():
            self._rk_cb.set(next(iter(h)))
        self._renk_ornek_guncelle()

    def _renk_gecerli(self, anahtar):
        if anahtar and anahtar.startswith("cam:"):
            return cam_renk(anahtar[4:])[0]
        return katman_renk(anahtar, "#c9d0d5")

    def _renk_ornek_guncelle(self):
        a = self._renk_anahtar()
        try:
            self._rk_ornek.config(bg=self._renk_gecerli(a) if a else "#ffffff")
        except tk.TclError:
            pass

    def _renk_sec(self):
        a = self._renk_anahtar()
        if not a:
            return
        _, hx = colorchooser.askcolor(color=self._renk_gecerli(a), parent=self._ayar_pen, title="Renk seç")
        if hx:
            renk_yaz(a, hx)
            self._renk_yenile_ciz()

    def _renk_sifirla(self):
        a = self._renk_anahtar()
        if a:
            renk_yaz(a, None)
            self._renk_yenile_ciz()

    def _renk_yenile_ciz(self):
        self._renk_ornek_guncelle()
        self.ciz_kesit()
        self.ciz()

    def _ayar_yaz(self, metin):
        t = self._ayar_log
        t.config(state="normal")
        t.insert("end", metin + "\n")
        t.see("end")
        t.config(state="disabled")

    def _ayar_tazele(self):
        try:
            pen = getattr(self, "_ayar_pen", None)
            if pen is not None and pen.winfo_exists():
                self._ayar_yenile()
        except tk.TclError:
            pass

    def _ayar_yenile(self):
        sistem = self._aktif_sistem()
        kay = sistem_kaydi(sistem) if sistem else None
        self._ayar_baslik.config(text=f"Sistem: {sistem}" if kay else
                                 f"Sistem: {sistem} (CSV'li sistem; komutlar için kütüphane sistemi seçin)")
        t = self._ayar_ozet
        t.config(state="normal")
        t.delete("1.0", "end")
        if kay:
            t.insert("end", ayar_komut(sistem, "ayar")[0])
        t.config(state="disabled")
        for i in self._ayar_tr.get_children():
            self._ayar_tr.delete(i)
        self._parcalar = []
        if kay:
            try:
                self._parcalar = sistem_parcalari(sistem)
            except (ValueError, OSError) as e:
                self._ayar_yaz(f"Parça listesi okunamadı: {e}")
        for p_ in self._parcalar:
            dg = p_["orijinal"] if _sade(p_["kod"]) != _sade(p_["orijinal"]) else ""
            self._ayar_tr.insert("", "end", values=(p_["tur"], p_["kod"], p_["adet"], p_["klasor"], dg))
        self._ayar_cb.config(values=())
        self._ayar_cb.set("")

    def _ayar_satir_sec(self, _e=None):
        sel = self._ayar_tr.selection()
        if not sel:
            return
        p_ = self._parcalar[self._ayar_tr.index(sel[0])]
        alt = ([p_["orijinal"]] if _sade(p_["kod"]) != _sade(p_["orijinal"]) else []) + \
              [a for a in p_["alt"] if _sade(a) != _sade(p_["kod"])]
        self._ayar_cb.config(values=alt)
        self._ayar_cb.set(alt[0] if alt else "")

    def _ayar_parca_uygula(self):
        sel = self._ayar_tr.selection()
        yeni = self._ayar_cb.get()
        if not sel or not yeni:
            return
        p_ = self._parcalar[self._ayar_tr.index(sel[0])]
        self._komut_calistir(f"parca {p_['kod']} {yeni}")

    def _komut_gonder(self):
        satir = self._komut_v.get()
        self._komut_v.set("")
        self._komut_calistir(satir)

    # ---------------------------------------------------------------- proje komutları (betik)
    PROJE_KOMUTLARI = ("proje", "aks", "dusey", "ek", "bolge", "yalanci", "cam", "stok", "takoz", "zincir", "cikar", "betik")

    def _hesapla_k(self):
        """Betik çalışırken ara hesap yapılmaz (yarım ayarlarda hata penceresi çıkmasın); betik sonunda bir kez hesaplanır."""
        if not getattr(self, "_betik", False):
            self.hesapla()

    def _harf_sira(self, n):
        return {aks_adi(k).upper(): k for k in range(n + 1)}

    def _model_sifirla_yapi(self, kat_degisti=True):
        for k_ in ("hucre", "kayma", "zincir_hat", "dik_tip", "yat_tip", "parca_cikar"):
            self.model[k_] = {}
        self.model["dik_yok"], self.model["yat_yok"], self.model["yalanci"] = set(), set(), set()
        if kat_degisti:
            self.model["dik_gecis"], self.model["dik_orta"] = set(), set()
        self.model["parca_grup"] = {k_: v_ for k_, v_ in (self.model.get("parca_grup") or {}).items() if k_[2] is None}
        self._sec = set()

    @staticmethod
    def _kv_oku(arg, bilinen, ad):
        kv = {_norm(k): v for k, v in re.findall(r"(\w+)\s*=\s*(\S+)", arg)}
        fazla = set(kv) - set(bilinen)
        if fazla:
            raise ValueError(f"{ad}: bilinmeyen alan {', '.join(sorted(fazla))}. Alanlar: {', '.join(bilinen)}")
        return kv

    def _proje_komut(self, ad, arg):
        """Proje komutları (günlük satırından ya da 'betik' penceresinden). Dönüş: çıktı metni."""
        arg = arg.strip()
        if ad == "betik":
            self._betik_penceresi()
            return "Betik penceresi açıldı."
        if ad == "proje":
            if not arg:
                return "Mevcut projenin betiği (kopyalayıp 'betik' penceresine yapıştırabilirsiniz):\n" + self._betik_uret()
            kv = self._kv_oku(arg, ("ad", "sistem"), "proje")
            if "ad" in kv:
                self.v["proje_adi"].set(kv["ad"].replace("_", " "))
            if "sistem" in kv:
                self.v["sistem_adi"].set(kv["sistem"].replace("_", " "))
            return "Proje adı/sistem güncellendi."
        y = self._yapi_oku()
        if not y:
            return "Girdiler geçerli değil."
        cols, rows, ek, tip = y
        n = len(rows)
        if ad == "aks":
            yeni = parse_olculer(arg.replace(",", ";"), "aks")
            if len(yeni) != len(cols):
                self._model_sifirla_yapi(kat_degisti=False)
                self.model["ytip"] = self.model.get("ytip") or []
            self.v["cols"].set(sikistir(yeni))
            self._hesapla_k()
            return f"{len(yeni)} aks aralığı: {sikistir(yeni)}"
        if ad == "ek":
            if _norm(arg) == "sifirla":
                ek = [[] for _ in rows]
                tip = [["cam"] for _ in rows]
            else:
                harf = self._harf_sira(n)
                for tok in arg.split():
                    h, _, v = tok.partition("=")
                    h = h.strip().upper()
                    if h not in harf or harf[h] >= n:
                        raise ValueError(f"ek: '{h}' katı yok (A–{aks_adi(n - 1)}).")
                    j = harf[h]
                    ek[j] = sorted({float(x.replace(",", ".")) for x in re.split(r"[;]+", v.replace(",", ";")) if x.strip()}) if v else []
                    eski = list(tip[j])
                    tip[j] = (eski + ["cam"] * (len(ek[j]) + 1))[:len(ek[j]) + 1]
            self.model["ek"], self.model["tip"] = ek, tip
            self._hesapla_k()
            return "Ek yatay profiller güncellendi."
        if ad == "bolge":
            ad2tip = {_norm(v["ad"]): k for k, v in PANEL_TIPLERI.items()}
            ad2tip.update({k: k for k in PANEL_TIPLERI})
            harf = self._harf_sira(n)
            for tok in arg.split():
                h, _, v = tok.partition("=")
                h = h.strip().upper()
                if h not in harf or harf[h] >= n:
                    raise ValueError(f"bolge: '{h}' katı yok.")
                j = harf[h]
                liste = [ad2tip.get(_norm(x)) for x in v.split(",") if x.strip()]
                if None in liste or len(liste) != len(ek[j]) + 1:
                    raise ValueError(f"bolge {h}: {len(ek[j]) + 1} bölge tipi gerekir ({', '.join(PANEL_TIPLERI)}).")
                tip[j] = liste
            self.model["tip"] = tip
            self._hesapla_k()
            return "Bölge tipleri güncellendi."
        if ad == "yalanci":
            if _norm(arg) == "sifirla" or not arg:
                self.model["yalanci"] = set()
            else:
                harf = self._harf_sira(n)
                yl = set()
                for tok in re.split(r"[,;\s]+", arg):
                    t = tok.strip().upper()
                    if not t:
                        continue
                    if t.startswith("D") and t[1:].isdigit():
                        yl.add(("d", int(t[1:]) - 1))
                    elif t in harf:
                        yl.add(("y", harf[t], 0))
                    else:
                        raise ValueError(f"yalanci: '{tok}' anlaşılamadı (hat harfi ya da D2 gibi aks).")
                self.model["yalanci"] = yl
            self._hesapla_k()
            return "Yalancı hat/aks güncellendi."
        if ad in ("zincir", "cikar"):
            return self._zincir_cikar_komut(ad, arg, cols, rows)
        if ad == "cam":
            kv = self._kv_oku(arg, ("yapi", "pvb", "aks_d", "aks_y", "oturma", "payi", "payi_y"), "cam")
            esl = {"yapi": "cam_yapi", "pvb": "pvb", "aks_d": "cam_aks_d", "aks_y": "cam_aks_y",
                   "oturma": "cam_oturma", "payi": "cam_payi", "payi_y": "cam_payi_y"}
            for k_, v_ in kv.items():
                self.v[esl[k_]].set("" if v_ in ("-", "bos") else v_)
            self._cam_ui_uygula()
            self._hesapla_k()
            return "Cam ayarları güncellendi."
        if ad == "stok":
            kv = self._kv_oku(arg, ("cubuk", "testere", "liste", "ek"), "stok")
            if "ek" in kv:
                float(kv["ek"].replace(",", "."))
                self.v["siparis_ek"].set(kv["ek"].replace(",", "."))
            if "cubuk" in kv:
                self.v["cubuk"].set(kv["cubuk"].replace(",", "."))
            if "testere" in kv:
                self.v["testere"].set(kv["testere"].replace(",", "."))
            if "liste" in kv:
                yeni = []
                if _norm(kv["liste"]) not in ("temizle", "bos"):
                    for tok in kv["liste"].split(","):
                        p_ = tok.split(":")
                        pr = {"dikey": "dikey", "yatay": "yatay", "tum": "tum", "tumu": "tum"}.get(_norm(p_[0]))
                        if pr is None or len(p_) < 2:
                            raise ValueError(f"stok liste: '{tok}' anlaşılamadı. Biçim: dikey:7650:7000-  (profil:boy[:en_az-en_çok])")
                        e_ = {"profil": pr, "boy": float(p_[1]), "adet": None, "min": None, "max": None}
                        if len(p_) > 2 and "-" in p_[2]:
                            a_, _, b_ = p_[2].partition("-")
                            e_["min"] = float(a_) if a_ else None
                            e_["max"] = float(b_) if b_ else None
                        yeni.append(e_)
                self.stoklar = yeni
                _ayar_db().setdefault("genel", {})["cubuk_stok"] = [dict(e) for e in self.stoklar]
                ayar_kaydet()
                self._cubuk_yenile()
            self._hesapla_k()
            return "Stok ayarları güncellendi."
        if ad == "takoz":
            v_ = arg.strip()
            if _norm(v_) in ("otomatik", "oto"):
                v_ = ZINCIR_OTO
            elif _norm(v_) == "yok":
                v_ = ZINCIR_YOK
            self.v["takoz_elle"].set(v_)
            self._hesapla_k()
            return f"Cam takozu: {v_}"
        if ad == "dusey":
            return self._dusey_komut(arg, (cols, rows, ek, tip))
        return "Bilinmeyen proje komutu."

    def _hedef_coz(self, txt, cols, rows, komut):
        """'D1,D3,B,dikey,yatay' -> [("d", i) | ("y", kat, 0)]; D<n> = n. aks, harf = kat hattı."""
        harf = self._harf_sira(len(rows))
        out = []
        for tok in re.split(r"[,;]+", txt):
            t = tok.strip().upper()
            if not t:
                continue
            if t in ("DIKEY", "DİKEY"):
                out += [("d", i) for i in range(len(cols) + 1)]
            elif t == "YATAY":
                out += [("y", k, 0) for k in range(len(rows) + 1)]
            elif t.startswith("D") and t[1:].isdigit() and 1 <= int(t[1:]) <= len(cols) + 1:
                out.append(("d", int(t[1:]) - 1))
            elif t in harf:
                out.append(("y", harf[t], 0))
            else:
                raise ValueError(f"{komut}: '{tok}' anlaşılamadı (D1.. aks, A.. hat harfi, dikey, yatay).")
        return out

    def _zincir_cikar_komut(self, ad, arg, cols, rows):
        """zincir D1,D2=02.01.09+02.01.09 degis=01.05.01>01.05.02 yon=E50R04:xy   (aks/hat başına katman zinciri)
        zincir sifirla | cikar dikey=R50P03 | cikar B,C=R50P16 | cikar sifirla   (aks/hatta özel parça çıkarma)"""
        if _norm(arg) == "sifirla":
            self.model["zincir_hat" if ad == "zincir" else "parca_cikar"] = {}
            self._hesapla_k()
            return "Sıfırlandı."
        ts = arg.split()
        if not ts or "=" not in ts[0]:
            raise ValueError(f"{ad}: biçim '{ad} D1,D2=değer' (örnek: zincir D1=02.01.09+02.01.09).")
        hed, _, deger = ts[0].partition("=")
        ek_ = {}
        for tok in ts[1:]:
            k_, _, v_ = tok.partition("=")
            ek_[_norm(k_)] = v_
        hedefler = self._hedef_coz(hed, cols, rows, ad)
        if ad == "zincir":
            deg, yon = {}, {}
            for t_ in [x for x in ek_.get("degis", "").split(";") if x.strip()]:
                a_, _, b_ = t_.partition(">")
                if not b_:
                    raise ValueError("zincir degis: biçim ESKI>YENI (birden çoksa ; ile ayırın).")
                deg[a_.strip()] = b_.strip()
            for t_ in [x for x in ek_.get("yon", "").split(";") if x.strip()]:
                a_, _, b_ = t_.partition(":")
                yon[a_.strip()] = b_.strip()
            zc = "" if _norm(deger) in ("-", "yok", "bos") else deger.strip()
            zh = self.model.setdefault("zincir_hat", {})
            for h_ in hedefler:
                if zc or deg or yon:
                    zh[h_] = zk_yaz(zc, deg, yon)
                else:
                    zh.pop(h_, None)
            self._hesapla_k()
            return f"{len(hedefler)} aks/hat için zincir güncellendi."
        kodlar = {x.strip() for x in re.split(r"[+,;]+", deger) if x.strip()}
        pc = self.model.setdefault("parca_cikar", {})
        for h_ in hedefler:
            anahtarlar = ([("d", h_[1], j) for j in range(len(rows))] if h_[0] == "d"
                          else [("y", h_[1], 0, i) for i in range(len(cols))])
            for k_ in anahtarlar:
                pc.setdefault(k_, set()).update(kodlar)
        self._hesapla_k()
        return f"{len(hedefler)} aks/hattan {', '.join(sorted(kodlar))} çıkarıldı."

    def _betik_uret(self):
        """Mevcut projenin ayarlarını yapıştırılabilir betik olarak üretir (her satır bir komut)."""
        y = self._yapi_oku()
        if not y:
            return "# girdiler geçerli değil"
        cols, rows, ek, tip = y
        f = lambda v: f"{v:g}"
        satirlar = ["# Cephe Metraj betiği — satırlar sırayla çalışır, # ile başlayanlar açıklamadır"]
        satirlar.append(f"proje ad={self.v['proje_adi'].get().strip().replace(' ', '_') or 'Proje'} sistem={self.v['sistem_adi'].get().strip().replace(' ', '_') or 'Sistem'}")
        satirlar.append("aks " + ",".join(f(c) for c in cols))
        satirlar.append(self._dusey_komut("", (cols, rows, ek, tip), sadece_uret=True))
        eks = " ".join(f"{aks_adi(j)}=" + ",".join(f(h) for h in e) for j, e in enumerate(ek) if e)
        if eks:
            satirlar.append("ek " + eks)
        bol = " ".join(f"{aks_adi(j)}=" + ",".join(t) for j, t in enumerate(tip) if any(x != "cam" for x in t))
        if bol:
            satirlar.append("bolge " + bol)
        yl = sorted(self.model.get("yalanci") or (), key=str)
        if yl:
            satirlar.append("yalanci " + ",".join(f"D{k_[1] + 1}" if k_[0] == "d" else aks_adi(k_[1]) for k_ in yl))
        for h_, v_ in sorted((self.model.get("zincir_hat") or {}).items(), key=str):
            zc_, dg_, yn_ = zk_coz(v_)
            if h_[0] == "d" and len(h_) == 2:
                hd_ = f"D{h_[1] + 1}"
            elif h_[0] == "y" and len(h_) == 3 and h_[2] == 0:
                hd_ = aks_adi(h_[1])
            else:
                continue
            satirlar.append(f"zincir {hd_}={zc_ or '-'}"
                            + (" degis=" + ";".join(f"{a_}>{b_}" for a_, b_ in sorted(dg_.items())) if dg_ else "")
                            + (" yon=" + ";".join(f"{a_}:{b_}" for a_, b_ in sorted(yn_.items())) if yn_ else ""))
        g = lambda a: self.v[a].get().strip().replace(" ", "") or "-"
        satirlar.append(f"cam yapi={g('cam_yapi')} pvb={g('pvb')} aks_d={g('cam_aks_d')} aks_y={g('cam_aks_y')} oturma={g('cam_oturma')} payi={g('cam_payi')} payi_y={g('cam_payi_y')}")
        lst = ",".join(f"{e.get('profil', 'tum')}:{f(e['boy'])}" + (f":{f(e['min']) if e.get('min') else ''}-{f(e['max']) if e.get('max') not in (None, '') else ''}"
                                                                   if (e.get('min') or e.get('max') not in (None, '')) else "") for e in self.stoklar)
        satirlar.append(f"stok cubuk={g('cubuk')} testere={g('testere')} ek={(self.v['siparis_ek'].get().strip() if 'siparis_ek' in self.v else '') or '0'} liste={lst or 'temizle'}")
        tk_ = self.v["takoz_elle"].get() if "takoz_elle" in self.v else ""
        if tk_:
            satirlar.append("takoz " + {ZINCIR_OTO: "otomatik", ZINCIR_YOK: "yok"}.get(tk_, tk_))
        return "\n".join(satirlar)

    def _betik_calistir(self, metin):
        """Betiği satır satır çalıştırır; hata veren satır atlanır, sonunda tek hesap yapılır."""
        self._betik = True
        hatalar = 0
        try:
            for ln in metin.splitlines():
                t = ln.strip()
                if not t or t.startswith("#"):
                    continue
                parca = t.split(None, 1)
                ad = _norm(parca[0])
                if ad not in self.PROJE_KOMUTLARI or ad == "betik":
                    self._log(f"Atlandı (proje komutu değil): {t}", "uyari")
                    hatalar += 1
                    continue
                try:
                    self._log("› " + t, "komut")
                    cik = self._proje_komut(ad, parca[1] if len(parca) > 1 else "")
                    if cik:
                        self._log(cik.splitlines()[0])
                except Exception as e:
                    hatalar += 1
                    self._log(f"Hata ({t.split()[0]}): {e}", "hata")
        finally:
            self._betik = False
        self.hesapla()
        self._log("Betik tamamlandı" + (f" ({hatalar} satır uygulanamadı)." if hatalar else "."))

    def _betik_penceresi(self):
        pen = tk.Toplevel(self)
        pen.title("Betik yapıştır")
        pen.transient(self)
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, text="Komut satırlarını yapıştırın (her satır bir komut; # açıklamadır). 'Mevcudu getir' şu anki projenin betiğini yazar."
                  ).pack(anchor="w")
        txt = tk.Text(fr, width=100, height=18, font=("Consolas", 10), wrap="none")
        txt.pack(fill="both", expand=True, pady=6)
        txt.focus_set()

        def calistir():
            m = txt.get("1.0", "end")
            pen.destroy()
            self._betik_calistir(m)
        bt = ttk.Frame(fr)
        bt.pack(anchor="w")
        ttk.Button(bt, text="Çalıştır", style="Ana.TButton", command=calistir).pack(side="left")
        ttk.Button(bt, text="Mevcudu getir", command=lambda: (txt.delete("1.0", "end"), txt.insert("1.0", self._betik_uret()))).pack(side="left", padx=8)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left")
        pen.bind("<Escape>", lambda _e: pen.destroy())

    def _dusey_komut(self, arg, yapi, sadece_uret=False):
        """dusey kat=90,323,3600,3510,90,3600,3510 alt=25 ust=35 dilatasyon=20 gecis=B,C,D,G orta=E
        Hat harfleri Katlar tablosundaki gibidir (A = en alt hat). gecis: düşeyin kesilmeden geçtiği hatlar;
        orta: kat ortasında birleşim yapılan katın alt hattı (E = E–F katı)."""
        cols, rows, ek, tip = yapi

        def mevcut_komut():
            n = len(rows)
            gec = sorted(int(k_[1]) for k_ in (self.model.get("dik_gecis") or ()))
            ort = sorted(int(k_[1]) for k_ in (self.model.get("dik_orta") or ()))
            f = lambda v: f"{v:g}"
            z = (f"dusey kat={','.join(f(r) for r in rows)} alt={self.v['dikey_alt'].get()} ust={self.v['dikey_ust'].get()}"
                 f" dilatasyon={self.v['dilatasyon'].get()}")
            if gec:
                z += " gecis=" + ",".join(aks_adi(k) for k in gec if k <= n)
            if ort:
                z += " orta=" + ",".join(aks_adi(k) for k in ort if k < n)
            return z
        if sadece_uret:
            return mevcut_komut()
        if not arg:
            return "Şu anki düşey ayarı:\n" + mevcut_komut()
        if _norm(arg) == "sifirla":
            self.model["dik_gecis"], self.model["dik_orta"] = set(), set()
            self._hesapla_k()
            return "Düşey geçiş/birleşim işaretleri temizlendi (her kat ayrı düşey)."
        kv = self._kv_oku(arg, ("kat", "alt", "ust", "dilatasyon", "gecis", "orta"), "dusey")
        yeni_rows = parse_olculer(kv["kat"].replace(",", ";"), "kat") if "kat" in kv else rows
        n = len(yeni_rows)
        harf = self._harf_sira(n)
        uyar = []

        def hat_listesi(metin, ad):
            out = set()
            for tok in re.split(r"[,;]+", metin):
                tok = tok.strip().upper().split("-")[0]
                if not tok:
                    continue
                if tok not in harf:
                    raise ValueError(f"{ad}: '{tok}' hattı yok (A–{aks_adi(n)} arası).")
                out.add(harf[tok])
            return out
        gec = hat_listesi(kv["gecis"], "gecis") if "gecis" in kv else None
        ort = hat_listesi(kv["orta"], "orta") if "orta" in kv else None
        for ad_, v_ in (("alt", "dikey_alt"), ("ust", "dikey_ust"), ("dilatasyon", "dilatasyon")):
            if ad_ in kv:
                float(kv[ad_].replace(",", "."))
                self.v[v_].set(kv[ad_].replace(",", "."))
        if "kat" in kv and list(yeni_rows) != list(rows):
            if len(yeni_rows) != len(rows):
                self._model_sifirla_yapi()
                ek, tip = [[] for _ in yeni_rows], [["cam"] for _ in yeni_rows]
                self.model["ytip"] = []
                uyar.append("kat sayısı değişti: ek yataylar, parça çıkarma ve hücre tipleri sıfırlandı")
            self.v["rows"].set(sikistir(yeni_rows))
            self.model["ek"], self.model["tip"] = ek, tip
        if gec is not None:
            self.model["dik_gecis"] = {("y", k, 0) for k in gec if 0 < k < n}
            if any(not (0 < k < n) for k in gec):
                uyar.append("kenar hatlar (A ve en üst) 'gecis' olamaz, atlandı")
        if ort is not None:
            self.model["dik_orta"] = {("y", k, 0) for k in ort if 0 <= k < n}
            self.model["dik_gecis"] = {k_ for k_ in (self.model.get("dik_gecis") or set()) if k_ not in self.model["dik_orta"]}
        self._hesapla_k()
        return "Düşey ayarı uygulandı." + ("  (" + "; ".join(uyar) + ")" if uyar else "")

    def _komut_calistir(self, satir):
        if not satir.strip():
            return
        self._ayar_yaz("> " + satir)
        try:
            cikti, yen = ayar_komut(self._aktif_sistem(), satir)
        except Exception as e:      # komut hatası programı düşürmesin
            cikti, yen = f"Hata: {e}", ""
        if cikti:
            self._ayar_yaz(cikti)
        if yen:
            try:
                self._ayar_sonrasi(yen)
            except Exception as e:
                self._ayar_yaz(f"Yenileme hatası: {e}")
        self._ayar_yenile()

    def _cam_ui_uygula(self):
        """Cam–aks mesafesi (dikey/yatay) ve oturma payı alanlarını kesit üretimine bildirir. Dönüş: değişti mi."""
        def f_(a, vs):
            try:
                t = self.v[a].get().strip().replace(",", ".")
                return float(t) if t else vs
            except (KeyError, ValueError):
                return vs
        yeni = {"aks_d": f_("cam_aks_d", CAM_AKS_VARSAYILAN), "aks_y": f_("cam_aks_y", CAM_AKS_VARSAYILAN),
                "oturma": f_("cam_oturma", None)}
        degisti = yeni != _CAM_UI
        _CAM_UI.update(yeni)
        return degisti

    def _detay_kaynaktan(self, tur):
        """Profil kutusu boşsa (ör. proje açıldı) detayı kayıtlı şablon/profil kaynağından yeniden üretir."""
        kay = self.detay_kaynak.get(tur)
        if not kay or len(kay) < 3 or not kay[2]:
            return False
        try:
            _kes, det, parca = profil_sablonlu(kay[2][0], kay[2][1], kay[0], kay[1], tur)
        except (ValueError, OSError, IndexError, KeyError) as e:
            self._log(f"Detay yenilenemedi ({tur}): {e}", "hata")
            return False
        self.detay[tur] = det
        self.parca[tur] = parca
        return True

    def _cam_ui_degisti(self):
        if self._cam_ui_uygula():
            self._log(f"Cam–aks: dikey {_CAM_UI['aks_d']:g}, yatay {_CAM_UI['aks_y']:g} mm; oturma "
                      + (f"{_CAM_UI['oturma']:g} mm" if _CAM_UI['oturma'] is not None else "sistem ayarı"))
            self._ayar_sonrasi("hafif")

    def _ayar_sonrasi(self, yen):
        """Komuttan sonra: sistem listesi / kütüphane / parça değişimlerini uygular, seçili profilleri yeniden üretir."""
        if yen == "sistem":
            self.sistem_yollari = sistem_klasorleri()
            self.cb["sistem"].config(values=sorted(self.sistem_yollari))
            ad = self._aktif_sistem()
            if not any(_norm(a) == _norm(ad) for a in self.sistem_yollari) and self.sistem_yollari:
                self.katalog_yukle(self.sistem_yollari[sorted(self.sistem_yollari)[0]])
            return
        sec = {t: self.cb[t].get() for t in ("dikey", "yatay")}
        yenilendi = False
        if yen == "tam":
            self.katalog_yukle(self.katalog_yol)
        else:
            klasor = os.path.dirname(self.katalog_yol)
            kay = sistem_kaydi(os.path.basename(klasor))
            degisim_kur(kutuphane_klasoru(klasor), (kay or {}).get("degisim"), (kay or {}).get("yon"), (kay or {}).get("kayma"))
            self._tip_onb = {}
        for t, e in sec.items():
            if e and ((t, e) in self._etiket or e in [str(x) for x in self.cb[t].cget("values")]):
                self.cb[t].set(e)
                try:
                    self._profil_sec(t)
                except Exception as ex:         # sessizce yutulmasın: günlüğe yaz
                    self._log(f"Profil yenilenemedi ({t}): {ex}", "hata")
            elif self._detay_kaynaktan(t):
                yenilendi = True
        if yenilendi:
            self.hesapla()

    def _sistem_degisti(self, _e=None, yukle=True):
        s = self.cb["sistem"].get()
        if yukle and s in getattr(self, "sistem_yollari", {}) \
                and os.path.abspath(self.sistem_yollari[s]) != self.katalog_yol:
            self.katalog_yukle(self.sistem_yollari[s])         # seçilen sistemin klasörü ve tabloları yüklenir
            return
        s = ""
        self._etiket = {}
        for tur in ("dikey", "yatay"):
            etiketler = []
            for k in self.katalog:
                if k["tur"] != tur or (s not in ("", "(Tümü)") and k["sistem"] != s):
                    continue
                e = f"{k['kod']} - {k['ad']}" if k["kod"] else k["ad"]
                if (tur, e) in self._etiket:
                    e = f"{e} ({len(etiketler) + 1})"
                self._etiket[(tur, e)] = k
                etiketler.append(e)
            self.cb[tur].config(values=etiketler)
            self.cb[tur].set("")

    def _derinlik_denetle(self, tur, kes, sablonlu, k):
        """Yatay profil düşey profilden derin olamaz. Aykırıysa hata verir, seçimi geri alır, False döner."""
        d = kesit_derinlik(kes, tur, sablonlu)
        diger = "yatay" if tur == "dikey" else "dikey"
        dd = getattr(self, "derinlik", {}).get(diger)
        if dd is None:
            return True
        dik, yat = (d, dd) if tur == "dikey" else (dd, d)
        if yat <= dik + 0.5:
            return True
        messagebox.showerror(
            "Profil seçimi geçersiz",
            f"Yatay profil düşey profilden uzun olamaz.\n\n"
            f"Düşey: {dik:.1f} mm\nYatay: {yat:.1f} mm\n\n"
            f"Seçiminiz ({k['ad']}) geri alındı.")
        onceki = getattr(self, "_cb_onceki", {}).get(tur, "")
        self.cb[tur].set(onceki)
        return False

    def _profil_sec(self, tur):
        self._cam_ui_uygula()
        k = self._etiket.get((tur, self.cb[tur].get()))
        if not k:
            return
        ad = f"{k['kod']} {k['ad']}".strip() if k["kod"] else k["ad"]
        self.v[f"{tur}_ad"].set(ad)
        if k.get("sistem"):
            self.v["sistem_adi"].set(k["sistem"])
        self.kesit[tur] = None
        self.detay[tur] = None
        self._kesit_not.pop(tur, None)
        if k.get("dosya") and k.get("sablon_yol"):
            try:
                kes, det, parca = profil_sablonlu(k["dosya_yol"], k["blok"], k["sablon_yol"], k["sablon_blok"], tur)
            except (ValueError, OSError, IndexError, KeyError) as e:
                messagebox.showwarning("Profil detayı oluşturulamadı", f"{k['ad']}: {e}")
            else:
                if not self._derinlik_denetle(tur, kes, True, k):
                    return
                self._kesit_uygula(tur, kes, k["g"], k["kg"], k["yuzey"], None,
                                   onceden=(det, parca, k["sablon_yol"], k["sablon_blok"], k["dosya_yol"], k["blok"]))
                return
        if k.get("dosya"):
            try:
                kes = kesit_yukle(k["dosya_yol"], k["blok"] or None)
            except (ValueError, OSError) as e:
                messagebox.showwarning("Kesit okunamadı", f"{k['ad']}: {e}")
            else:
                if not self._derinlik_denetle(tur, kes, False, k):
                    return
                self._kesit_uygula(tur, kes, k["g"], k["kg"], k["yuzey"], k["dosya_yol"])
                return
        getattr(self, "derinlik", {}).pop(tur, None)
        if k["g"] is not None:
            self.v[f"{tur}_g"].set(f"{k['g']:g}")
        if k["kg"] is not None:
            self.v[f"{tur}_kg"].set(f"{k['kg']:g}")
        self._kesit_etiket_yaz()
        self.hesapla()

    # ------------------------------------------------------------ kesit
    def _kesit_uygula(self, tur, kes, g=None, kg=None, yuzey="auto", yol=None, hesapla_et=True, onceden=None):
        """Kesiti yükler; g/kg katalogdan geldiyse onları, yoksa kesitten hesaplananı kullanır."""
        self.kesit[tur] = kes
        if not hasattr(self, "derinlik"):
            self.derinlik = {}
            self._cb_onceki = {}
        self.derinlik[tur] = kesit_derinlik(kes, tur, bool(onceden))
        try:
            self._cb_onceki[tur] = self.cb[tur].get()
        except Exception:
            pass
        self.detay[tur] = None
        self.parca[tur] = None
        self.detay_kaynak.pop(tur, None)
        if onceden:
            det, parca, s_yol, s_blok, k_yol, k_blok = onceden
            self.detay[tur] = det
            self.parca[tur] = parca
            self.detay_kaynak[tur] = (os.path.abspath(s_yol), s_blok.lower(), (os.path.abspath(k_yol), k_blok))
            if hesapla_et:
                self._kural_kal = self._cam_kalinlik()
        elif yol:
            try:
                det = detay_yukle(yol)
                det["ref"] = ((kes["xmin"] + kes["xmax"]) / 2, (kes["ymin"] + kes["ymax"]) / 2)
                det["pbox"] = (kes["xmin"], kes["ymin"], kes["xmax"], kes["ymax"])
                self.detay[tur] = det
                self.parca[tur] = dxf_parcalar(yol, kes["ad"])
                self.detay_kaynak[tur] = (os.path.abspath(yol), kes["ad"].lower())
                if hesapla_et:                 # elle/katalogdan seçildi: kural bu kalınlıkta tekrar değiştirmesin
                    self._kural_kal = self._cam_kalinlik()
            except (ValueError, OSError, IndexError, KeyError) as e:
                messagebox.showwarning("Detay çizilemedi", f"{e}\nYalnızca profil kesiti gösterilecek.")
        hes_g = kesit_yuzey(kes, yuzey)
        hes_kg = kesit_kgm(kes)
        not_ = (f"{tur.capitalize()}: {kes['ad']} | alan {kes['alan']:.1f} mm² | "
                f"kesitten {hes_kg:.2f} kg/m")
        if kg is not None and abs(hes_kg - kg) / kg > 0.03:
            not_ += f" | UYARI: katalog {kg:g} kg/m (fark %{abs(hes_kg - kg) / kg * 100:.0f})"
        self._kesit_not[tur] = not_
        self.v[f"{tur}_g"].set(f"{(g if g is not None else hes_g):.2f}".rstrip("0").rstrip("."))
        self.v[f"{tur}_kg"].set(f"{(kg if kg is not None else hes_kg):.3f}".rstrip("0").rstrip("."))
        self._kesit_etiket_yaz()
        if hesapla_et:
            self.hesapla()

    # --------------------------------------------------------- proje dosyası
    PROJE_SURUM = 1
    UYARLAMA_SURUM = 2        # her yeni özellikte artırılır: bundan eski kaydedilmiş projeler için "Uyarla" önerilir

    def _yol_kaydi(self, yol, klasor):
        k = {"yol": os.path.abspath(yol)}
        try:
            k["goreli"] = os.path.relpath(yol, klasor)
        except ValueError:          # farklı sürücü
            pass
        return k

    @staticmethod
    def _yol_coz(k, klasor):
        """Önce mutlak yol, bulunamazsa proje dosyasına göreli yol."""
        if not k:
            return None
        adaylar = [k.get("yol")]
        if k.get("goreli"):
            adaylar.append(os.path.normpath(os.path.join(klasor, k["goreli"])))
        for a in adaylar:
            if a and os.path.isfile(a):
                return a
        return None

    def proje_verisi(self, klasor):
        """Projeyi JSON'a yazılabilir sözlüğe çevirir (girdiler, grid, kesit/detay ve katalog kaynakları)."""
        veri = {"surum": self.PROJE_SURUM, "uygulama": "Cephe Metraj", "uyarlama": self.UYARLAMA_SURUM,
                "tarih": datetime.datetime.now().isoformat(timespec="seconds"),
                "girdi": {k: v.get() for k, v in self.v.items()},
                "ek": [list(map(float, e)) for e in self.model["ek"]],
                "tip": [list(t) for t in self.model["tip"]],
                "ytip": list(self.model.get("ytip") or []),
                "hucre": [[j, k, i, t] for (j, k, i), t in sorted((self.model.get("hucre") or {}).items())],
                "dik_yok": sorted([i, j] for i, j in (self.model.get("dik_yok") or ())),
                "yat_yok": sorted([j, q, i] for j, q, i in (self.model.get("yat_yok") or ())),
                "yalanci": sorted([list(k_) for k_ in (self.model.get("yalanci") or ())], key=str),
                "dik_gecis": sorted(int(k_[1]) for k_ in (self.model.get("dik_gecis") or ())),
                "dik_orta": sorted(int(k_[1]) for k_ in (self.model.get("dik_orta") or ())),
                "kayma": [list(k_) + [v_[0], v_[1]] for k_, v_ in sorted((self.model.get("kayma") or {}).items(), key=str)],
                "zincir_hat": [list(k_) + [v_] for k_, v_ in sorted((self.model.get("zincir_hat") or {}).items(), key=str)],
                "dtip": self.model.get("dtip") or "",
                "cephe_tipleri": self.cephe_tipleri,
                "ilerleme": sorted([j, i] for j, i in (self.model.get("ilerleme") or ())),
                "dik_tip": [[i, j, t] for (i, j), t in sorted((self.model.get("dik_tip") or {}).items())],
                "yat_tip": [[j, q, i, t] for (j, q, i), t in sorted((self.model.get("yat_tip") or {}).items())],
                "takoz_hat": [[j, q, t] for (j, q), t in sorted((self.model.get("takoz_hat") or {}).items())],
                "parca_grup": [[t_, k_, sc_, n_, d_] for (t_, k_, sc_), (n_, d_) in
                               sorted((self.model.get("parca_grup") or {}).items(), key=lambda x: str(x[0]))],
                "parca_cikar": [[list(k), sorted(v)] for k, v in sorted((self.model.get("parca_cikar") or {}).items(),
                                                                          key=lambda x: str(x[0]))],
                "sistem_secimi": self.cb["sistem"].get() if "sistem" in self.cb else "",
                "profil_secimi": {t: self.cb[t].get() for t in ("dikey", "yatay") if t in self.cb},
                "katalog": self._yol_kaydi(self.katalog_yol, klasor) if self.katalog_yol else None,
                "ek_malzeme": [dict(x) for x in self.ek_malzeme],
                "cubuk_stok": [dict(e) for e in self.stoklar],
                "siparis_not": self._sip_not.get("1.0", "end").strip() if hasattr(self, "_sip_not") else "",
                "kesit": {}}
        for tur in ("dikey", "yatay"):
            kay = self.detay_kaynak.get(tur)
            if kay:
                d = self._yol_kaydi(kay[0], klasor)
                d["blok"] = self.kesit[tur]["ad"] if self.kesit.get(tur) else kay[1]
                if len(kay) > 2 and kay[2]:           # kütüphane profili: yol/blok şablonun, profil ayrı
                    d["blok"] = kay[1]
                    d["profil"] = self._yol_kaydi(kay[2][0], klasor)
                    d["profil"]["blok"] = kay[2][1]
                veri["kesit"][tur] = d
        return veri

    def proje_uygula(self, veri, klasor):
        """Proje verisini arayüze yükler. Dönüş: uyarı metinleri listesi."""
        if not isinstance(veri, dict) or "girdi" not in veri:
            raise ValueError("Bu dosya bir Cephe Metraj projesi değil.")
        self._gecmis_sifirla()
        if veri.get("surum", 1) > self.PROJE_SURUM:
            raise ValueError("Proje dosyası bu programdan daha yeni bir sürümle kaydedilmiş.")
        uyari = []
        kat = self._yol_coz(veri.get("katalog"), klasor)
        if not kat and veri.get("katalog"):          # klasör taşınmış (ör. dist\\sistemler -> şimdiki sistemler): ada göre bul
            ad_ = os.path.basename(os.path.dirname(str(veri["katalog"].get("yol") or "").replace("\\", "/")))
            for sa_, sy_ in (self.sistem_yollari or {}).items():
                if ad_ and _norm(sa_) == _norm(ad_):
                    kat = sy_
                    break
        if kat:
            if os.path.abspath(kat) != self.katalog_yol:
                self.katalog_yukle(kat)
        elif veri.get("katalog"):
            uyari.append("Profil kataloğu bulunamadı: " + str(veri["katalog"].get("yol")))
        try:
            if veri.get("sistem_secimi") and veri["sistem_secimi"] in self.cb["sistem"].cget("values"):
                self.cb["sistem"].set(veri["sistem_secimi"])
                self._sistem_degisti()
        except Exception:
            pass
        for a_ in ("cam_aks_d", "cam_aks_y", "cam_oturma"):       # kesit üretiminden önce (cam–aks mesafesi detaya girer)
            if a_ in self.v and a_ in (veri.get("girdi") or {}):
                self.v[a_].set(veri["girdi"][a_])
        self._cam_ui_uygula()
        for tur in ("dikey", "yatay"):
            self.kesit[tur] = None
            self.detay[tur] = None
            self.parca[tur] = None
            self.detay_kaynak.pop(tur, None)
            k = (veri.get("kesit") or {}).get(tur)
            if not k:
                continue
            yol = self._yol_coz(k, klasor)
            if not yol:
                uyari.append(f"{tur.capitalize()} detay DXF'i bulunamadı: {k.get('yol')}")
                continue
            if k.get("profil"):
                kyol = self._yol_coz(k["profil"], klasor)
                if not kyol:
                    uyari.append(f"{tur.capitalize()} profil kütüphanesi bulunamadı: {k['profil'].get('yol')}")
                    continue
                try:
                    kes, det, parca = profil_sablonlu(kyol, k["profil"]["blok"], yol, k.get("blok", ""), tur)
                except (ValueError, OSError, IndexError, KeyError) as e:
                    uyari.append(f"{tur.capitalize()} profil detayı oluşturulamadı: {e}")
                    continue
                self._kesit_uygula(tur, kes, hesapla_et=False,
                                   onceden=(det, parca, yol, k.get("blok", ""), kyol, k["profil"]["blok"]))
                continue
            try:
                kes = kesit_yukle(yol, k.get("blok") or None)
            except (ValueError, OSError) as e:
                uyari.append(f"{tur.capitalize()} kesiti okunamadı: {e}")
                continue
            self._kesit_uygula(tur, kes, yol=yol, hesapla_et=False)
            self.derinlik.pop(tur, None)      # yalnız şablon detayı: uzun-kenar tahmini derinlik denetimi için güvenilmez
        for ad, deger in (veri.get("girdi") or {}).items():       # kesit yüklemesinden sonra: projedeki değerler geçerli
            if ad in self.v:
                self.v[ad].set(deger)
        for tur in ("dikey", "yatay"):          # profil kutularındaki seçim (kayıtlı ya da profil bloğundan bulunur)
            et_ = (veri.get("profil_secimi") or {}).get(tur) or ""
            if not (et_ and (tur, et_) in self._etiket):
                blok_ = (((veri.get("kesit") or {}).get(tur) or {}).get("profil") or {}).get("blok", "")
                et_ = next((e for (t_, e), kk_ in self._etiket.items()
                            if t_ == tur and blok_ and _norm(str(kk_.get("blok", ""))) == _norm(blok_)), "")
            if et_ and tur in self.cb:
                self.cb[tur].set(et_)
                if hasattr(self, "_cb_onceki"):
                    self._cb_onceki[tur] = et_
        n = len(parse_olculer(self.v["rows"].get(), "Kat yükseklikleri"))
        ek = veri.get("ek") or []
        tip = veri.get("tip") or []
        self.model["ek"] = [list(ek[j]) if j < len(ek) else [] for j in range(n)]
        self.model["tip"] = [list(tip[j]) if j < len(tip) else [] for j in range(n)]
        self.model["ytip"] = list(veri.get("ytip") or [])
        try:
            self.model["hucre"] = {(int(j), int(k), int(i)): str(t) for j, k, i, t in veri.get("hucre") or []}
            self.model["dik_yok"] = {(int(i), int(j)) for i, j in veri.get("dik_yok") or []}
            self.model["yat_yok"] = {(int(j), int(q), int(i)) for j, q, i in veri.get("yat_yok") or []}
            self.model["yalanci"] = {(str(k_[0]),) + tuple(int(x) for x in k_[1:]) for k_ in veri.get("yalanci") or []}
            self.model["dik_gecis"] = {("y", int(k_), 0) for k_ in veri.get("dik_gecis") or []}
            self.model["dik_orta"] = {("y", int(k_), 0) for k_ in veri.get("dik_orta") or []}
            self.model["kayma"] = {}
            for k_ in veri.get("kayma") or []:             # ["d", i, blok, örnek, dx, dy] | ["y", j, q, blok, örnek, dx, dy]
                n_ = 2 if k_[0] == "d" else 3
                self.model["kayma"][(str(k_[0]),) + tuple(int(x) for x in k_[1:n_]) + (str(k_[n_]), int(k_[n_ + 1]))] = \
                    (float(k_[n_ + 2]), float(k_[n_ + 3]))
            self.model["zincir_hat"] = {}
            for k_ in veri.get("zincir_hat") or []:        # ["d", i, zincir] | ["y", j, q, zincir]
                n_ = 2 if k_[0] == "d" else 3
                self.model["zincir_hat"][(str(k_[0]),) + tuple(int(x) for x in k_[1:n_])] = str(k_[n_])
            self.model["dtip"] = str(veri.get("dtip") or "")
            self.model["ilerleme"] = {(int(k_[0]), int(k_[1])) for k_ in veri.get("ilerleme") or []}
            self.cephe_tipleri = list(veri.get("cephe_tipleri") or [])
            self.model["dik_tip"] = {(int(i), int(j)): str(t) for i, j, t in veri.get("dik_tip") or []}
            self.model["yat_tip"] = {(int(j), int(q), int(i)): str(t) for j, q, i, t in veri.get("yat_tip") or []}
            self.model["parca_cikar"] = {tuple([k[0]] + [int(x) for x in k[1:]]): set(map(str, v))
                                         for k, v in veri.get("parca_cikar") or []}
            self.model["parca_grup"] = {(str(t_), str(k_), (tuple(sc_) if isinstance(sc_, list) else sc_)): (int(n_), float(d_))
                                        for t_, k_, sc_, n_, d_ in veri.get("parca_grup") or []}
            self.model["takoz_hat"] = {(int(j_), int(q_)): str(t_) for j_, q_, t_ in veri.get("takoz_hat") or []}
        except (ValueError, TypeError, IndexError):
            self.model["takoz_hat"] = {}
            self.model["parca_grup"] = {}
            self.model["hucre"], self.model["dik_yok"], self.model["yat_yok"] = {}, set(), set()
            self.model["yalanci"] = set()
            self.model["dik_gecis"] = set()
            self.model["dik_orta"] = set()
            self.model["kayma"], self.model["zincir_hat"] = {}, {}
            self.model["dtip"], self.model["dik_tip"], self.model["yat_tip"], self.model["parca_cikar"] = "", {}, {}, {}
        self._sec = set()
        self._kural_kal = self._cam_kalinlik()
        self._kesit_etiket_yaz()
        self.ek_malzeme = []
        for x in veri.get("ek_malzeme") or []:
            try:
                self.ek_malzeme.append({"kod": str(x.get("kod", "")), "ad": str(x.get("ad", "")),
                                        "birim": str(x.get("birim", "adet")), "miktar": float(x["miktar"]),
                                        "kg": float(x["kg"]) if x.get("kg") not in (None, "") else None,
                                        "not": str(x.get("not", ""))})
            except (KeyError, ValueError, TypeError):
                continue
        if hasattr(self, "_sip_not"):
            self._sip_not.delete("1.0", "end")
            self._sip_not.insert("1.0", veri.get("siparis_not") or "")
        if "cubuk_stok" in veri:
            self.stoklar = [dict(e) for e in veri.get("cubuk_stok") or [] if isinstance(e, dict) and e.get("boy")]
        self._cubuk_yenile()
        self._ek_yenile()
        self.hesapla()
        return uyari

    def proje_kaydet(self, farkli=False):
        """Proje yolu biliniyorsa doğrudan üzerine yazar; yoksa ya da farkli=True ise dosya sorar."""
        yol = ""
        if not farkli and self.proje_yolu and os.path.isdir(os.path.dirname(os.path.abspath(self.proje_yolu))):
            yol = self.proje_yolu
        else:
            yol = self._proje_yolu_sor()
        if not yol:
            return
        self._proje_yaz(yol, sessiz=(yol == self.proje_yolu))

    def _proje_yolu_sor(self):
        return self._proje_yolu_sor_()

    def _proje_yolu_sor_(self):
        yol = filedialog.asksaveasfilename(
            title="Projeyi kaydet", defaultextension=".cephe",
            initialfile=os.path.basename(self.proje_yolu) if self.proje_yolu else
            ((self.v["proje_adi"].get().strip() or "cephe_projesi") + ".cephe"),
            initialdir=os.path.dirname(self.proje_yolu) if self.proje_yolu else None,
            filetypes=[("Cephe projesi", "*.cephe"), ("JSON", "*.json")])
        return yol

    def _proje_yaz(self, yol, sessiz=False):
        try:
            veri = self.proje_verisi(os.path.dirname(os.path.abspath(yol)))
            yeni_metin = json.dumps(veri, ensure_ascii=False, indent=1)
            self._surum_sakla(yol, yeni_metin)
            with open(yol, "w", encoding="utf-8") as f:
                f.write(yeni_metin)
        except (OSError, TypeError, ValueError) as e:
            messagebox.showerror("Kaydedilemedi", str(e))
            return
        self.proje_yolu = yol
        self._son_proje_ekle(yol)
        self.title(f"Cephe Metraj - {os.path.basename(yol)}")
        self._kayit_isaretle()
        if sessiz:
            self.title(f"Cephe Metraj - {os.path.basename(yol)}  ✓ kaydedildi")
            self.after(2500, lambda: self.title(f"Cephe Metraj - {os.path.basename(yol)}"))
        else:
            messagebox.showinfo("Kaydedildi", f"Proje kaydedildi:\n{yol}")

    SURUM_SAYISI = 20

    @staticmethod
    def _surum_klasoru(yol):
        yol = os.path.abspath(yol)
        ad = os.path.splitext(os.path.basename(yol))[0]
        return os.path.join(os.path.dirname(yol), ad + "_surumler"), ad

    def _surum_sakla(self, yol, yeni_metin):
        """Kayıttan önce mevcut dosya farklıysa <proje>_surumler\\ klasörüne tarih damgalı kopyası alınır (son 20 sürüm)."""
        try:
            if not os.path.isfile(yol):
                return
            with open(yol, encoding="utf-8") as f:
                eski = f.read()
            if eski == yeni_metin:
                return
            klasor, ad = self._surum_klasoru(yol)
            os.makedirs(klasor, exist_ok=True)
            damga = datetime.datetime.fromtimestamp(os.path.getmtime(yol)).strftime("%Y%m%d_%H%M%S")
            hedef = os.path.join(klasor, f"{ad}_{damga}.cephe")
            if not os.path.exists(hedef):
                with open(hedef, "w", encoding="utf-8") as f:
                    f.write(eski)
            vs = sorted(x for x in os.listdir(klasor) if x.startswith(ad + "_") and x.endswith(".cephe"))
            for x in vs[:-self.SURUM_SAYISI]:
                try:
                    os.remove(os.path.join(klasor, x))
                except OSError:
                    pass
        except OSError:
            pass                                # sürüm saklanamazsa kaydetmeyi engelleme

    def _surumler_ac(self):
        """Projenin önceki sürümlerini listeler; seçileni açar (kayıtlı dosya, siz kaydedene kadar değişmez)."""
        yol = getattr(self, "proje_yolu", None)
        if not yol or not os.path.isfile(yol):
            messagebox.showinfo("Sürümler", "Önce projeyi kaydedin; her kayıtta önceki hâli sürüm olarak saklanır.")
            return
        klasor, ad = self._surum_klasoru(yol)
        vs = sorted((x for x in (os.listdir(klasor) if os.path.isdir(klasor) else [])
                     if x.startswith(ad + "_") and x.endswith(".cephe")), reverse=True)
        pen = tk.Toplevel(self)
        pen.title("Proje sürümleri — " + os.path.basename(yol))
        pen.transient(self)
        try:
            pen.geometry("520x380")
        except tk.TclError:
            pass
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, text=f"{len(vs)} önceki sürüm (her kayıtta önceki hâl saklanır, en çok {self.SURUM_SAYISI}).",
                  font=("Segoe UI", 10, "bold")).pack(anchor="w")
        tr = ttk.Treeview(fr, columns=("Tarih", "Boyut"), show="headings", height=10, selectmode="browse")
        tr.heading("Tarih", text="Kaydedildiği an")
        tr.heading("Boyut", text="Boyut")
        tr.column("Tarih", width=260)
        tr.column("Boyut", width=100)
        tr.pack(fill="both", expand=True, pady=8)
        for i, x in enumerate(vs):
            m = re.search(r"_(\d{8})_(\d{6})\.cephe$", x)
            t = (f"{m.group(1)[6:8]}.{m.group(1)[4:6]}.{m.group(1)[:4]}  {m.group(2)[:2]}:{m.group(2)[2:4]}:{m.group(2)[4:]}"
                 if m else x)
            try:
                bt_ = f"{os.path.getsize(os.path.join(klasor, x)) / 1024:.0f} KB"
            except OSError:
                bt_ = ""
            tr.insert("", "end", iid=str(i), values=(t, bt_))
        if vs:
            tr.selection_set("0")

        def ac():
            sec = tr.selection()
            if not sec:
                return
            if not messagebox.askyesno("Sürümü aç", "Seçili sürüm açılacak; şu anki kaydedilmemiş değişiklikler kaybolur.\n"
                                       "(Kayıtlı dosya, siz kaydedene kadar değişmez.)"):
                return
            v_yol = os.path.join(klasor, vs[int(sec[0])])
            pen.destroy()
            self.proje_ac(v_yol)
            self.proje_yolu = yol                 # kaydedince asıl dosyaya yazılır
            self.title(f"Cephe Metraj - {os.path.basename(yol)}  (eski sürüm açık)")
        bt = ttk.Frame(fr)
        bt.pack(fill="x")
        ttk.Button(bt, text="Bu sürümü aç", command=ac).pack(side="left")
        ttk.Button(bt, text="Klasörü göster", command=lambda: dosya_ac(klasor) if os.path.isdir(klasor) else None).pack(
            side="left", padx=6)
        ttk.Button(bt, text="Kapat", command=pen.destroy).pack(side="right")

    def _kayit_isaretle(self):
        """Şu anki durumu 'kayıtlı' say (kapatırken değişiklik sorusu bununla karşılaştırır)."""
        try:
            self._kayitli = self._durum_al()
        except Exception:
            self._kayitli = None

    def _degisti_mi(self):
        try:
            return getattr(self, "_kayitli", None) is not None and self._durum_al() != self._kayitli
        except Exception:
            return False

    def _kapat(self):
        if self._degisti_mi():
            c = messagebox.askyesnocancel("Cephe Metraj", "Projede kaydedilmemiş değişiklikler var.\n"
                                          "Çıkmadan önce kaydedilsin mi?")
            if c is None:
                return
            if c:
                self.proje_kaydet()
                if self._degisti_mi():           # kaydetme iptal edildi ya da başarısız oldu: çıkma
                    return
        self.destroy()

    def _son_projeler(self):
        l_ = _ayar_db().setdefault("genel", {}).get("son_projeler") or []
        return [y for y in l_ if isinstance(y, str)][:5]

    def _son_proje_ekle(self, yol):
        yol = os.path.abspath(yol)
        l_ = [y for y in self._son_projeler() if os.path.normcase(y) != os.path.normcase(yol)]
        _ayar_db().setdefault("genel", {})["son_projeler"] = ([yol] + l_)[:5]
        ayar_kaydet()

    def _son_projeler_menu(self):
        m = tk.Menu(self, tearoff=0)
        liste = self._son_projeler()
        if not liste:
            m.add_command(label="(son proje yok)", state="disabled")
        for y in liste:
            ok = os.path.isfile(y)
            m.add_command(label=f"{os.path.basename(y)}   —   {os.path.dirname(y)}" + ("" if ok else "  (bulunamadı)"),
                          command=lambda y=y: self.proje_ac(y))
        b = self._son_btn
        m.update_idletasks()
        m.tk_popup(b.winfo_rootx(), max(0, b.winfo_rooty() - m.winfo_reqheight()))      # düğmenin üstünde açılır

    def proje_ac(self, yol=None):
        if not yol:
            yol = filedialog.askopenfilename(
                title="Proje aç", filetypes=[("Cephe projesi", "*.cephe *.json"), ("Tüm dosyalar", "*.*")],
                initialdir=os.path.dirname(self._son_projeler()[0]) if self._son_projeler() and
                os.path.isdir(os.path.dirname(self._son_projeler()[0])) else None)
        if not yol:
            return
        try:
            with open(yol, encoding="utf-8") as f:
                veri = json.load(f)
            uyari = self.proje_uygula(veri, os.path.dirname(os.path.abspath(yol)))
        except (OSError, ValueError) as e:       # json.JSONDecodeError de ValueError
            messagebox.showerror("Proje açılamadı", str(e))
            return
        self.proje_yolu = yol
        self._son_proje_ekle(yol)
        self.title(f"Cephe Metraj - {os.path.basename(yol)}")
        self.after(300, self._kayit_isaretle)
        if uyari:
            messagebox.showwarning("Proje açıldı, bazı dosyalar eksik", "\n".join(uyari))
        if int(veri.get("uyarlama", 0) or 0) < self.UYARLAMA_SURUM:
            self._log("Bu proje programın eski bir sürümüyle kaydedilmiş: güncel özelliklere uyarlamak için "
                      "üstteki «⟲ Uyarla» düğmesine basın (Geri ile alınabilir).", "uyari")

    def proje_uyarla(self):
        """Açık projeyi güncel programa uyarlar: kaldırılan özelliklerin kayıtlarını temizler, kütüphane ve katalogu
        yeniden okur, artık geçerli olmayan aks/hat/parça/zincir ayarlarını ayıklar, her şeyi yeniden hesaplar.
        Yaptığı her değişiklik raporlanır; ↶ Geri ile tek adımda alınır."""
        rapor = []
        m = self.model
        try:
            if m.get("ytip") or m.get("dtip") or m.get("dik_tip") or m.get("yat_tip"):
                m.update({"ytip": [], "dtip": "", "dik_tip": {}, "yat_tip": {}})
                rapor.append("Sistem tipi (kapaklı/silikonlu) seçimleri kaldırıldı: artık kullanılmıyor.")
            _PC_ONB.clear()
            self._tip_onb = {}
            self._sp_onb = (None,)
            self._ayar_sonrasi("tam")                 # kütüphane, katalog ve şablonlar yeniden okunur
            self.hesapla()
            s = self.sonuc or {}
            hid = [tuple(x) for x in (s.get("hat_id") or [])]
            hset = set(hid)
            n_aks = len(s.get("cols") or []) + 1

            def aks_ok(k):
                return (k[0] == "d" and 0 <= k[1] < n_aks) or (k[0] == "y" and tuple(k[1:3]) in hset)
            # 1) aks/hat başına zincir, parça değişimi ve yön
            zh = m.setdefault("zincir_hat", {})
            for k in list(zh):
                if not aks_ok(k):
                    del zh[k]
                    rapor.append(f"{k}: aks/hat artık yok, ayarı silindi.")
                    continue
                zc, dg, yn = zk_coz(zh[k])
                kodlar, eksik = bariyer_coz(list(self.bariyerler) + list(_FITIL_EK.values()), zc) if zc else ([], [])
                if eksik:
                    rapor.append(f"{k}: zincirde bulunmayan kod(lar) çıkarıldı: {', '.join(eksik)}.")
                    zc = "+".join(kodlar)
                for orj, yeni in list(dg.items()):
                    if _sade(orj) != _sade(yeni) and not (_KUT_KOK and kutuphane_parca_bul(_KUT_KOK, yeni)):
                        del dg[orj]
                        rapor.append(f"{k}: {yeni} parçası kütüphanede yok, {orj} özgün haline döndü.")
                v = zk_yaz(zc, dg, yn)
                if v:
                    zh[k] = v
                else:
                    del zh[k]
            # 2) elle oturtulan parça konumları
            sy = None
            try:
                tw_, th_ = sum(s["cols"]), sum(s["rows"])
                s["kesit_kol"] = None
                sy = sayfa_yerlesim(s, max(100.0, max(tw_, th_) / 45))
            except Exception:
                sy = None
            ky = m.setdefault("kayma", {})
            sil = 0
            for k in list(ky):
                n = 2 if k[0] == "d" else 3
                ak = tuple(k[:n])
                gecerli = aks_ok(ak) and (abs(ky[k][0]) > 1e-9 or abs(ky[k][1]) > 1e-9)
                if gecerli and sy:
                    try:
                        det = (sy["plan"]["hat_detay"][ak[1]] if ak[0] == "d" else sy["kesit"]["hat_detay"][hid.index(tuple(ak[1:]))])
                        var = {(_norm(p["blok"]), 5000 if 5000 <= p["ornek"] < 9000 else p["ornek"]) for p in detay_parca_listesi(det)}
                        gecerli = (_norm(k[n]), 5000 if 5000 <= k[n + 1] < 9000 else k[n + 1]) in var
                    except (KeyError, IndexError, ValueError, TypeError):
                        pass
                if not gecerli:
                    del ky[k]
                    sil += 1
            if sil:
                rapor.append(f"Artık yerinde olmayan {sil} parça konumu ayarı temizlendi.")
            # 3) parça çıkarma, takoz, yalancı hat
            pc = m.setdefault("parca_cikar", {})
            for k in list(pc):
                ok = (k[0] == "d" and k[1] < n_aks) or (k[0] == "y" and tuple(k[1:3]) in hset)
                if not ok:
                    del pc[k]
                    rapor.append(f"Parça çıkarma kaydı {k}: aks/hat yok, silindi.")
            th = m.setdefault("takoz_hat", {})
            for k in list(th):
                if tuple(k) not in hset or (th[k] not in ("(yok)",) and th[k] not in _TAKOZ_KOD):
                    del th[k]
                    rapor.append(f"Hat takozu {k}: geçersiz, genele döndü.")
            yl = m.get("yalanci") or set()
            gec = {k for k in yl if aks_ok(tuple(k))}
            if gec != yl:
                m["yalanci"] = gec
                rapor.append("Artık olmayan yalancı hat kayıtları silindi.")
            # 4) genel ısı bariyeri zinciri
            el = self.v["bariyer_elle"].get()
            if el != BARIYER_OTO:
                _k, eksik = bariyer_coz(list(self.bariyerler) + list(_FITIL_EK.values()), el)
                if eksik:
                    self.v["bariyer_elle"].set(BARIYER_OTO)
                    rapor.append(f"Genel zincirdeki kod(lar) kataloğda yok ({', '.join(eksik)}): otomatiğe döndü.")
            self._secili = None
            self._aks_d = self._aks_h = None
            self._odak = None
            self.hesapla()
            self.ciz()
            self.ciz_kesit()
        except Exception as e:
            self._log(f"Uyarlama hatası: {type(e).__name__}: {e}", "hata")
            messagebox.showerror("Uyarla", f"Uyarlama tamamlanamadı:\n{type(e).__name__}: {e}")
            return
        if not rapor:
            rapor.append("Değişiklik gerekmedi: proje güncel özelliklerle uyumlu.")
        for r in rapor:
            self._log("Uyarla: " + r)
        messagebox.showinfo("Uyarla", "\n".join(rapor[:25]) + (f"\n… (+{len(rapor) - 25} satır, günlüğe bakın)" if len(rapor) > 25 else "")
                            + "\n\nİstemediğin bir sonuç olursa ↶ Geri ile alabilirsin.")

    def _cam_kalinlik(self):
        try:
            return cam_coz(self.v["cam_yapi"].get(), self._pvb(), self.v["ilk_ic"].get())["kalinlik"]
        except ValueError:
            return None

    def _pvb(self):
        try:
            return float(self.v["pvb"].get().replace(",", "."))
        except ValueError:
            raise ValueError("PVB kalınlığı: sayı girin (0,76 ya da 1,52).")

    def _kural_uygula(self):
        """Cam kalınlığı değiştiyse kural tablosundan uygun detay DXF'lerini yükler."""
        self._kural_not = ""
        if not (self.v["kural_oto"].get() and self.kurallar):
            return
        kal = self._cam_kalinlik()
        if kal is None:
            return
        k = kural_bul(self.kurallar, self.v["sistem_adi"].get().strip(), kal)
        if not k:
            self._kural_not = f"Kural tablosunda {kal:.2f} mm için detay yok."
            return
        if self._kural_kal is not None and abs(self._kural_kal - kal) < 0.005:
            self._kural_not = f"Kural: {k['min']:g}–{k['max']:g} mm aralığındaki detay kullanılıyor."
            return
        self._kural_kal = kal
        degisti = []
        for tur in ("dikey", "yatay"):
            if not k.get(tur):
                continue
            yol, blok = k[tur]
            mevcut = self.detay_kaynak.get(tur)
            if mevcut and mevcut[0] == os.path.abspath(yol) and (not blok or mevcut[1] == blok.lower()):
                continue
            lib = mevcut[2] if (mevcut and len(mevcut) > 2) else None
            if lib:                    # seçili kütüphane profili kalır, montaj şablonu bu kalınlığın detayı olur
                try:
                    kes, det, parca = profil_sablonlu(lib[0], lib[1], yol, blok, tur)
                except (ValueError, OSError, IndexError, KeyError) as e:
                    messagebox.showwarning("Kural detayı uygulanamadı", f"{os.path.basename(yol)}: {e}")
                    continue
                self._kesit_uygula(tur, kes, hesapla_et=False, onceden=(det, parca, yol, blok, lib[0], lib[1]))
                degisti.append(tur)
                continue
            try:
                kes = kesit_yukle(yol, blok or None)
            except (ValueError, OSError) as e:
                messagebox.showwarning("Kural detayı okunamadı", f"{os.path.basename(yol)}: {e}")
                continue
            self.v[f"{tur}_ad"].set(kes["ad"])
            self._kesit_uygula(tur, kes, yol=yol, hesapla_et=False)
            self.derinlik.pop(tur, None)      # yalnız şablon detayı: uzun-kenar tahmini derinlik denetimi için güvenilmez
            degisti.append(tur)
        self._kural_not = (f"Kural: {k['min']:g}–{k['max']:g} mm detayı seçildi"
                           + (f" ({', '.join(degisti)} değişti)." if degisti else "."))

    def _kesit_etiket_yaz(self):
        self.lbl_kesit.config(text="\n".join(self._kesit_not[t] for t in ("dikey", "yatay")
                                             if t in self._kesit_not))

    def dxf_kesit_al(self, tur):
        yol = filedialog.askopenfilename(
            title=f"{tur.capitalize()} profil kesiti (DXF)",
            filetypes=[("DXF", "*.dxf"), ("Tüm dosyalar", "*.*")])
        if not yol:
            return
        try:
            kesitler, hatalar = dxf_bloklar(yol)
        except (ValueError, OSError) as e:
            messagebox.showwarning("DXF okunamadı", str(e))
            return
        if not kesitler:
            ayrinti = "; ".join(f"{a}: {m}" for a, m in hatalar.items()) \
                or "Dolgulu (HATCH) profil bloğu bulunamadı."
            messagebox.showwarning("Kesit bulunamadı", ayrinti)
            return
        ad = self._blok_sec(kesitler)
        if not ad:
            return
        self.v[f"{tur}_ad"].set(ad)
        self._kesit_uygula(tur, kesitler[ad], yol=yol)

    def _blok_sec(self, kesitler):
        pencere = tk.Toplevel(self)
        pencere.title("Kesit bloğunu seç")
        pencere.transient(self)
        pencere.grab_set()
        ttk.Label(pencere, text="Profil kesitini seçin:", padding=8).pack(anchor="w")
        adlar = sorted(kesitler, key=lambda a: -kesitler[a]["alan"])
        liste = tk.Listbox(pencere, width=72, height=min(12, len(adlar)), exportselection=False)
        for a in adlar:
            k = kesitler[a]
            liste.insert("end", f"{a}   |   alan {k['alan']:.1f} mm²   |   {k['w']:.1f} x {k['h']:.1f} mm")
        liste.selection_set(0)
        liste.pack(padx=8, pady=4)
        secim = {"ad": None}

        def tamam(_e=None):
            s = liste.curselection()
            if s:
                secim["ad"] = adlar[s[0]]
            pencere.destroy()
        liste.bind("<Double-Button-1>", tamam)
        ttk.Button(pencere, text="Seç", command=tamam).pack(pady=8)
        self.wait_window(pencere)
        return secim["ad"]

    def _detay_ya_da_kesit(self, tur):
        """Kesit sekmesi için çizilecek nesne: tüm detay, yoksa yalnızca profil kesiti."""
        k = self.kesit.get(tur)
        if not k:
            return None
        sy_ = getattr(self, "_kesit_sayfa", None)
        if sy_:                                  # seçili aks / hat varsa: o aksın kendi detayı (zincir, parça, konum ayarlarıyla)
            try:
                if tur == "dikey" and getattr(self, "_aks_d", None) is not None:
                    return sy_["plan"]["hat_detay"][self._aks_d]
                if tur == "yatay" and getattr(self, "_aks_h", None) is not None:
                    return sy_["kesit"]["hat_detay"][self._aks_h]
            except (KeyError, IndexError, TypeError) as e_:
                self._kesit_hata = f"aks detayı bulunamadı ({type(e_).__name__}: {e_})"
        d = ((self.sonuc or {}).get("detay") or {}).get(tur) or self.detay.get(tur)
        if d:
            return d
        return {"prims": [("fill", k["donguler"], k["derin"], "#8d99a3")],
                "bbox": (k["xmin"], k["ymin"], k["xmax"], k["ymax"]), "desteklenmeyen": {}}

    def _kesit_guncelle(self, hepsi=True):
        """Kesit detayı sekmesi: cephedeki birbirinden farklı tüm düşey akslar ve yatay hatlar (hepsi=True) ya da tek detay."""
        self._kesit_hepsi = bool(hepsi)
        self.gor_k.z, self.gor_k.px, self.gor_k.py = 1.0, 0.0, 0.0
        self.hesapla() if hepsi else None        # güncel sonuçla çiz
        self.ciz_kesit()

    def ciz_kesit(self):
        cv = self._cv_tema(self.cv_kesit)
        cv.delete("all")
        vur = []
        if self.etkilesim:
            self._vur["kesit"] = vur
            self._hv_son = None
        W, H = cv.winfo_width(), cv.winfo_height()
        if W < 250 or H < 200:
            return
        self._kesit_sayfa = None
        self._kesit_hata = ""
        s_ = self.sonuc
        if s_ and (getattr(self, "_aks_d", None) is not None or getattr(self, "_aks_h", None) is not None):
            try:
                tw_, th_ = sum(s_["cols"]), sum(s_["rows"])
                dd_ = getattr(self, "_aks_d", None)
                s_["kesit_kol"] = None if dd_ is None else min(dd_, len(s_["cols"]) - 1)
                self._kesit_sayfa = sayfa_yerlesim(s_, max(100.0, max(tw_, th_) / 45))
            except Exception as e_:
                self._kesit_sayfa = None
                self._kesit_hata = f"aks detayı hesaplanamadı ({type(e_).__name__}: {e_})"
        etk_ = {}
        try:
            if getattr(self, "_aks_d", None) is not None:
                etk_["dikey"] = f"{self._aks_d + 1}. aks"
            if getattr(self, "_aks_h", None) is not None:
                etk_["yatay"] = f"{hat_adi(s_['hat_id'][self._aks_h])} hattı"
        except (KeyError, IndexError, TypeError):
            etk_ = {}
        oge = []                                   # çizilecek detaylar: {tur, k, d, etk, idx, r}
        hepsi = bool(getattr(self, "_kesit_hepsi", False)) and bool(s_)
        if hepsi:                                  # ⟳ Güncelle: cephedeki birbirinden FARKLI tüm aks/hatlar
            try:
                tw_, th_ = sum(s_["cols"]), sum(s_["rows"])
                s_["kesit_kol"] = None
                sy_ = sayfa_yerlesim(s_, max(100.0, max(tw_, th_) / 45))
                hid_ = [tuple(x) for x in (s_.get("hat_id") or [])]

                yal_ = self.model.get("yalanci") or set()

                def yal_mi(tur_, i_):
                    try:
                        return (("d", i_) if tur_ == "dikey" else ("y",) + hid_[i_]) in yal_
                    except (IndexError, TypeError):
                        return False

                def grupla(hd, tur_):
                    gr = {}
                    for i_, d_ in enumerate(hd):
                        gr.setdefault((_prim_anahtar(d_["prims"]), yal_mi(tur_, i_)), []).append(i_)
                    return list(gr.values()), hd

                def adlar(idx_, tur_):
                    ad_ = [f"{i_ + 1}" if tur_ == "dikey" else hat_adi(hid_[i_]) for i_ in idx_]
                    if len(ad_) > 6:
                        ad_ = ad_[:5] + [f"… +{len(ad_) - 5}"]
                    return ", ".join(ad_) + (". aks" if tur_ == "dikey" else " hattı")
                for tur_, anah_, r_ in (("dikey", "plan", 0), ("yatay", "kesit", 1)):
                    if getattr(self, "_kesit_tur", None) and tur_ != self._kesit_tur:
                        continue
                    if not self.kesit.get(tur_) or not (sy_.get(anah_) or {}).get("hat_detay"):
                        continue
                    gl_, hd_ = grupla(sy_[anah_]["hat_detay"], tur_)
                    for idx_ in gl_:
                        oge.append({"tur": tur_, "k": self.kesit[tur_], "d": hd_[idx_[0]], "etk": adlar(idx_, tur_) + (" (yalancı — cam devam eder)" if yal_mi(tur_, idx_[0]) else ""),
                                    "yal": yal_mi(tur_, idx_[0]), "idx": idx_[0], "r": 0 if getattr(self, "_kesit_tur", None) else r_})
            except Exception as e_:
                oge = []
                self._kesit_hata = f"tüm akslar hesaplanamadı ({type(e_).__name__}: {e_})"
                hepsi = False
        if not oge:
            for t_ in ("dikey", "yatay"):
                if self.kesit.get(t_):
                    sec_ = getattr(self, "_aks_d" if t_ == "dikey" else "_aks_h", None)
                    yl_ = False
                    try:
                        if sec_ is not None and t_ in etk_:
                            yl_ = (("d", sec_) if t_ == "dikey" else ("y",) + tuple(s_["hat_id"][sec_])) in (self.model.get("yalanci") or set())
                    except (KeyError, IndexError, TypeError):
                        yl_ = False
                    oge.append({"tur": t_, "k": self.kesit[t_], "d": self._detay_ya_da_kesit(t_),
                                "etk": etk_.get(t_, "") + (" (yalancı — cam devam eder)" if yl_ else ""),
                                "yal": yl_, "idx": sec_ if t_ in etk_ else None, "r": 0})
        self._kesit_oge_n = len(oge)
        self._kesit_oge_etk = [o_.get("etk", "") for o_ in oge]
        ks_ = getattr(self, "_kesit_sadece", None)           # detay kitapçığı: yalnız i. detay çizilir
        if ks_ is not None and hepsi:
            oge = [oge[ks_]] if 0 <= ks_ < len(oge) else []
            for o_ in oge:
                o_["r"] = 0
        if not oge:
            cv.create_text(W / 2, H / 2, fill="#7a858e", font=("Arial", 10), justify="center",
                           text="Kesit yüklenmedi.\nKatalogda 'dosya' sütununu kullanın ya da\n"
                                "profil satırındaki 'Kesit...' düğmesiyle DXF seçin.")
            return
        # dünya yerleşimi: satırlar (hepsi: 1. satır düşeyler, 2. satır yataylar), her satırda detaylar yan yana
        for o in oge:
            o["w"] = o["d"]["bbox"][2] - o["d"]["bbox"][0]
            o["h"] = o["d"]["bbox"][3] - o["d"]["bbox"][1]
        if hepsi:                                  # kalabalık satırı böl: en çok 2 detay yan yana (okunaklı ölçek)
            _say = {}
            for o in oge:
                _n = _say.get(o["r"], 0)
                _say[o["r"]] = _n + 1
                o["r"] = (o["r"], _n // 2)
        bosluk = (1.0 if hepsi else 0.35) * max(o["w"] for o in oge)
        gapy = (0.9 if hepsi else 0.0) * max(o["h"] for o in oge)
        satirlar = {}
        for o in oge:
            satirlar.setdefault(o["r"], []).append(o)
        rs = sorted(satirlar)
        tw_r = {r: sum(o["w"] for o in satirlar[r]) + bosluk * (len(satirlar[r]) - 1) for r in rs}
        hm_r = {r: max(o["h"] for o in satirlar[r]) for r in rs}
        tw = max(tw_r.values())
        yb, taban = 0.0, {}
        for r in reversed(rs):                    # ilk satır üstte
            taban[r] = yb
            yb += hm_r[r] + gapy
        hmax = yb - gapy
        for r in rs:
            x = (tw - tw_r[r]) / 2
            for o in satirlar[r]:
                o["dx"] = x - o["d"]["bbox"][0]
                o["dy"] = taban[r] + (hm_r[r] - o["h"]) / 2 - o["d"]["bbox"][1]
                x += o["w"] + bosluk
        mL, mR, mT, mB = 40, 40, (100 if hepsi else 90), (90 if hepsi else 50)
        sc0 = min((W - mL - mR) / tw, (H - mT - mB) / hmax)
        if sc0 <= 0:
            return
        ox0 = mL + ((W - mL - mR) - tw * sc0) / 2
        oy0 = mT + ((H - mT - mB) + hmax * sc0) / 2
        self.gor_k.fit = (ox0, oy0, sc0)
        self.gor_k.kx = self.gor_k.ky = 0
        ox, oy, sc = self.gor_k.donustur()
        X = lambda v: ox + v * sc
        Y = lambda v: oy - v * sc
        dim, F = "#55606a", ("Arial", 9)
        yok = {}
        kontrol_say = 0
        ayna = bool(genel_ayar("kesit_ayna"))     # tek tıkla yatay ayna: her detay kendi merkezine göre çevrilir
        for o in oge:
            tur, k, d, dx, dy, w, h = o["tur"], o["k"], o["d"], o["dx"], o["dy"], o["w"], o["h"]
            cxd = d["bbox"][0] + dx + w / 2
            Xd = (lambda v, c=cxd: X(2 * c - v)) if ayna else X
            for x1, y1, x2, y2, tp in detay_cam_dikdortgenleri(
                    d, tur, (self.sonuc or {}).get("cam_yapi"), surekli=bool(o.get("yal"))):
                dolgu, cizgi = cam_renk(tp)
                cv.create_rectangle(Xd(x1 + dx), Y(y2 + dy), Xd(x2 + dx), Y(y1 + dy),
                                    fill=dolgu, outline=cizgi)
            ciz_detay(cv, d, Xd, Y, sc, dx, dy, yazi=True)
            vur.append({"det": d, "dx": dx, "dy": dy, "X": Xd, "Y": Y, "tur": tur, "idx": o["idx"]})
            try:
                uy_ = detay_kontrol(d, tur)
            except Exception:
                uy_ = []
            if uy_:
                yy_ = Y(d["bbox"][1] + dy) + 52      # alt etiketlerin (kod/ölçü) altına
                gw_ = max(160, (w + bosluk * 0.6) * sc)
                for ln_ in uy_[:4]:
                    cv.create_text(X(d["bbox"][0] + dx + w / 2), yy_, anchor="n", width=gw_, justify="center",
                                   text="! " + (o["etk"].split(" (")[0] + ": " if hepsi else "") + ln_,
                                   fill="#c0392b", font=("Arial", 8))
                    yy_ += 12 * (1 + int(len(ln_) * 5.2 // gw_))
                if len(uy_) > 4:
                    cv.create_text(X(d["bbox"][0] + dx + w / 2), yy_, anchor="n", text=f"+{len(uy_) - 4} uyarı daha", fill="#c0392b", font=("Arial", 8))
                kontrol_say += len(uy_)
            try:
                if genel_ayar("parca_kod"):
                    etiket_ciz(cv, d, Xd, Y, dx, dy, (0, 40, W, H - 28), bool(genel_ayar("parca_olcu")))
            except (ValueError, IndexError, KeyError):
                pass                       # etiket yerleşimi çizimi asla engellemesin
            mx = X(d["bbox"][0] + dx + w / 2)
            if hepsi:
                ust_ = min(Y(q["d"]["bbox"][3] + q["dy"]) for q in oge if q["r"] == o["r"])   # satırın en üstü
                cv.create_text(mx, ust_ - 46, anchor="s", font=("Arial", 9, "bold"), fill="#3d4851",
                               width=max(120, (w + bosluk * 0.6) * sc), justify="center",
                               text=f"{tur.capitalize()}: {k['ad']}  —  {o['etk']}")
            else:
                cv.create_text(mx, 22, text=f"{tur.capitalize()}: {k['ad']}" + (f"  —  {o['etk']}" if o["etk"] else ""),
                               font=("Arial", 10, "bold"), fill="#3d4851")
                cv.create_text(mx, 42, font=F, fill=dim,
                               text=f"profil {k['w']:.1f} x {k['h']:.1f} mm   |   alan {k['alan']:.1f} mm²"
                                    f"   |   {kesit_kgm(k):.2f} kg/m")
            for t_, n_ in d.get("desteklenmeyen", {}).items():
                yok[t_] = yok.get(t_, 0) + n_
        alt = "Detay (ölçüler mm)"
        if hepsi:
            alt += f"   |   cephedeki farklı akslar: {sum(1 for o in oge if o['tur'] == 'dikey')} düşey, {sum(1 for o in oge if o['tur'] == 'yatay')} yatay"
        elif getattr(self, "_aks_d", None) is None and getattr(self, "_aks_h", None) is None:
            alt += "   |   genel detay (aks/hat seçilmedi)"
        if kontrol_say:
            alt += f"   |   kontrol: {kontrol_say} uyarı (kırmızı)"
        if getattr(self, "_kesit_hata", ""):
            alt += "   |   " + self._kesit_hata
        if self.etkilesim:
            alt += "   |   tekerlek: yakınlaştır, sürükle: kaydır, çift tık: sıfırla"
        if yok:
            alt += "   |   çizilemeyen: " + ", ".join(f"{n_} {t_}" for t_, n_ in yok.items())
        cv.create_text(12, H - 12, anchor="sw", fill=dim, font=F, text=alt)
        if self.etkilesim:
            self._sec_yenile()

    # ------------------------------------------------------------ hesap
    def _oku(self):
        def sayi(anahtar, ad):
            try:
                return float(self.v[anahtar].get().replace(",", "."))
            except ValueError:
                raise ValueError(f"{ad}: sayı girin.")
        def sayi_bos(anahtar, ad):
            t = self.v[anahtar].get().strip()
            return sayi(anahtar, ad) if t else 0.0
        cols = parse_olculer(self.v["cols"].get(), "Aks aralıkları")
        rows = parse_olculer(self.v["rows"].get(), "Kat yükseklikleri")
        p = {
            "dikey_ad": self.v["dikey_ad"].get().strip() or "Dikey",
            "yatay_ad": self.v["yatay_ad"].get().strip() or "Yatay",
            "dikey_g": sayi("dikey_g", "Dikey profil genişliği"),
            "yatay_g": sayi("yatay_g", "Yatay profil genişliği"),
            "dikey_kg": sayi("dikey_kg", "Dikey kg/m"),
            "yatay_kg": sayi("yatay_kg", "Yatay kg/m"),
            "cubuk": sayi("cubuk", "Çubuk boyu"),
            "stoklar": [dict(e) for e in self.stoklar],
            "testere": sayi("testere", "Testere payı"),
            "siparis_ek": sayi_bos("siparis_ek", "Sipariş eki") if "siparis_ek" in self.v else 0.0,
            "cam_payi": sayi("cam_payi", "Cam payı (dikey)"),
            "cam_payi_y": sayi("cam_payi_y", "Cam payı (yatay)") if self.v["cam_payi_y"].get().strip()
            else sayi("cam_payi", "Cam payı (dikey)"),
            "dilatasyon": sayi_bos("dilatasyon", "Dilatasyon") if "dilatasyon" in self.v else 20.0,
            "dik_gecis": set(self.model.get("dik_gecis") or ()),
            "dik_orta": set(self.model.get("dik_orta") or ()),
            "zincir_hat": dict(self.model.get("zincir_hat") or {}),
            "dikey_alt": sayi("dikey_alt", "Dikey alt uzantı"),
            "dikey_ust": sayi("dikey_ust", "Dikey üst uzantı"),
            "ruzgar_kn": sayi_bos("ruzgar_kn", "Rüzgar yükü"),
            "dik_mesnet": next((k_ for k_, v_ in MESNET.items() if v_[3] == self.v["dik_mesnet"].get()), "basit"),
            "ankraj_mm": sayi_bos("ankraj_mm", "Ankraj aralığı"),
            "f0": sayi_bos("f0", "Karakteristik gerilme") or F0_VARSAYILAN,
            "cam_kg": sayi_bos("cam_kg", "Cam ağırlığı"),
            "cam_yapi": self.v["cam_yapi"].get().strip(),
            "spandrel_yapi": self.v["spandrel_yapi"].get().strip(),
            "pvb": self._pvb(),
            "ilk_ic": bool(self.v["ilk_ic"].get()),
        }
        _d = getattr(self, "derinlik", {})
        if _d.get("dikey") and _d.get("yatay") and _d["yatay"] > _d["dikey"] + 0.5:
            raise ValueError(f"Yatay profil düşey profilden uzun olamaz "
                             f"(yatay {_d['yatay']:.1f} mm > düşey {_d['dikey']:.1f} mm).")
        if p["dikey_ad"] == p["yatay_ad"]:
            raise ValueError("Dikey ve yatay profil adları farklı olmalı.")
        n = len(rows)
        ek = [list(self.model["ek"][j]) if j < len(self.model["ek"]) else [] for j in range(n)]
        tip = []
        for j in range(n):
            t = list(self.model["tip"][j]) if j < len(self.model["tip"]) else []
            m = len(ek[j]) + 1
            tip.append((t + ["cam"] * m)[:m])
        return cols, rows, p, ek, tip

    def _panel_uygula(self):
        """Arayüzdeki sandviç/levha kalınlık ve ağırlık girdilerini panel tiplerine yazar."""
        for tk_ in ("sandvic", "levha"):
            for alan, anahtar in (("kal", "kal"), ("kg", "kg_m2")):
                v = self.v.get(f"pn_{tk_}_{alan}")
                if v is None or not v.get().strip():
                    continue
                try:
                    x = float(v.get().replace(",", "."))
                except ValueError:
                    raise ValueError(f"{PANEL_TIPLERI[tk_]['ad']}: {alan} için sayı girin.")
                if x <= 0:
                    raise ValueError(f"{PANEL_TIPLERI[tk_]['ad']}: {alan} pozitif olmalı.")
                PANEL_TIPLERI[tk_][anahtar] = x

    def _katman_adi(self, kod):
        """Katman kutusu metni: 'KLASÖR | kod'."""
        e = _FITIL_EK.get(_norm(kod))
        return f"{(e or {}).get('klasor', 'ISI_BARIYERI')} | {kod}"

    def _zincir_hedef(self):
        """Seçili hat (yoksa seçili aks) anahtarı: varsa katman kutuları yalnız onun zincirini değiştirir."""
        s_ = self.sonuc or {}
        hid = list(s_.get("hat_id") or [])
        h, d = getattr(self, "_aks_h", None), getattr(self, "_aks_d", None)
        if h is not None and h < len(hid):
            return ("y",) + tuple(hid[h])
        if d is not None and d < len(s_.get("cols") or []) + 1:
            return ("d", d)
        return None

    def _zincir_degisti(self):
        """Katman kutularından 'a+b+c' dizisini kurar ve hesaplar."""
        try:
            z = [self.v[f"z{i}"].get() for i in range(1, 6)]
        except KeyError:
            return
        kod = [x.split(" | ")[-1].strip() for x in z if x not in (ZINCIR_OTO, ZINCIR_YOK)]
        hk = self._zincir_hedef()
        if hk is not None:                    # yalnız seçili aks/hat; genel zincir ve diğer akslar değişmez
            zc, dg, yn = zk_coz((self.model.get("zincir_hat") or {}).get(hk))
            self._hat_yaz(hk, "+".join(kod), dg, yn)
            self.hesapla()
            return
        self.v["bariyer_elle"].set("+".join(kod) if kod else BARIYER_OTO)
        self.hesapla()

    def _zincir_esitle(self):
        """Katman kutularının listelerini ve değerlerini bariyer_elle ile eşitler."""
        if not hasattr(self, "_zincir_cb"):
            return
        liste = [self._katman_adi(b["kod"]) for b in sorted(self.bariyerler or [], key=lambda b: b["ara"])]
        liste += [self._katman_adi(f["kod"]) for f in sorted(_FITIL_EK.values(), key=lambda f: (f["klasor"], f["kod"]))]
        self._zincir_cb["z1"].config(values=[ZINCIR_OTO] + liste)
        for i in range(2, 6):
            self._zincir_cb[f"z{i}"].config(values=[ZINCIR_YOK] + liste)
        el = self.v["bariyer_elle"].get()
        hk = self._zincir_hedef()
        try:
            if hk is not None:
                zc_ = zk_coz((self.model.get("zincir_hat") or {}).get(hk))[0]
                el = zc_ or el
                hid_ = list((self.sonuc or {}).get("hat_id") or [])
                ad_ = f"{hat_adi(hid_[self._aks_h])} hattı" if hk[0] == "y" else f"{hk[1] + 1}. aks"
                self.lbl_katman.config(text=f"Katmanlar — YALNIZ {ad_} (seçimi kaldırınca genel zincir):")
            else:
                self.lbl_katman.config(text="Katmanlar — tüm sistem (profil gagasından dışa doğru)")
        except (tk.TclError, AttributeError, IndexError):
            pass
        z = {f"z{i}": (ZINCIR_OTO if i == 1 else ZINCIR_YOK) for i in range(1, 6)}
        if el != BARIYER_OTO:
            kat = {_norm(x.split(" | ")[-1]): x for x in liste}
            kl = [kat[_norm(t.strip())] for t in el.split("+") if _norm(t.strip()) in kat]
            for i, v in enumerate(kl[:5], 1):
                z[f"z{i}"] = v
        for k, v in z.items():
            if self.v[k].get() != v:
                self.v[k].set(v)
        if hasattr(self, "cb_takoz"):
            self.cb_takoz.config(values=[ZINCIR_OTO, ZINCIR_YOK] + list(_TAKOZ_KOD))
            if self.v["takoz_elle"].get() not in [ZINCIR_OTO, ZINCIR_YOK] + list(_TAKOZ_KOD):
                self.v["takoz_elle"].set(ZINCIR_OTO)

    def _zincir_bilgi(self):
        """Katman kutularının altına: seçili zincir, toplam ara, boşluk ve uyarı; takoz bilgisi."""
        if not hasattr(self, "lbl_zincir"):
            return
        s = self.sonuc or {}
        sec = s.get("cam_secim") or {}
        yp = s.get("cam_yapi")
        if not yp or not sec.get("pvc"):
            self.lbl_zincir.config(text="")
        else:
            kod = [x.strip() for x in sec["pvc"].split("+") if x.strip()]
            top = bariyer_toplam(self.bariyerler, [k for k in kod if not (_FITIL_EK.get(_norm(k)) or {}).get("fitil")])
            bos = yp["kalinlik"] - top
            t = f"Zincir: {' + '.join(kod)}  |  toplam {top:.1f} mm, cam {yp['kalinlik']:.2f} mm, boşluk {bos:.1f} mm"
            if bos < BARIYER_PENCERE[0] - 1e-9:
                t += f"\nUyarı: boşluk {BARIYER_PENCERE[0]:g} mm'den küçük; zincir köprü/baskı fitiline girer."
            elif bos > BARIYER_PENCERE[1] + 1e-9:
                t += f"\nUyarı: boşluk {BARIYER_PENCERE[1]:g} mm'den büyük; zincirle köprü fitili arasında açıklık kalır."
            self.lbl_zincir.config(text=t)
        if hasattr(self, "lbl_takoz"):
            self.lbl_takoz.config(text=s.get("takoz_not") or "")

    def _takoz_kural_diyalog(self):
        """Cam takozu ağırlık kuralları: her satır 'en az kg; en çok kg; takoz kodu'."""
        sis = self._aktif_sistem()
        if not sis:
            messagebox.showinfo("Takoz kuralları", "Önce bir sistem seçin.")
            return
        pen = tk.Toplevel(self)
        pen.title("Cam takozu kuralları")
        pen.transient(self)
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, wraplength=420, foreground="#7a858e", justify="left",
                  text="Her satır: en az kg ; en çok kg ; takoz kodu. Ağırlık, projedeki en büyük cam panelin ağırlığıdır "
                       "(cam kg/m² x en geniş aks x en yüksek kat). Örnek: 0;120;E50S10\n"
                       f"Klasördeki takozlar: {', '.join(_TAKOZ_KOD) or '(yok)'}").pack(anchor="w")
        tx = tk.Text(fr, width=44, height=10)
        tx.pack(fill="both", expand=True, pady=6)
        tx.insert("1.0", "\n".join(f"{k['min']:g};{k['max']:g};{k['kod']}" for k in takoz_kurallari(sis)))
        durum = ttk.Label(fr, text="", foreground="#b0533f")
        durum.pack(anchor="w")

        def kaydet():
            out = []
            for ln in tx.get("1.0", "end").splitlines():
                if not ln.strip():
                    continue
                pr = [x.strip().replace(",", ".") for x in ln.split(";")]
                try:
                    out.append({"min": float(pr[0]), "max": float(pr[1]), "kod": pr[2]})
                except (ValueError, IndexError):
                    durum.config(text=f"Satır anlaşılmadı: {ln}")
                    return
            takoz_kurallari_yaz(sis, out)
            pen.destroy()
            self.hesapla()
        bt = ttk.Frame(fr)
        bt.pack(pady=(6, 0))
        ttk.Button(bt, text="Kaydet", command=kaydet).pack(side="left", padx=4)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left", padx=4)

    def _bariyer_uygula(self):
        """Isı bariyeri seçeneklerini (bariyer + bariyer çiftleri) günceller; elle seçimi cam satırına yazar."""
        oto_satir = [r for r in self.cam_tablo if r.get("oto")]
        kurallar_ = cam_kurallari(self._aktif_sistem())
        for r in self.cam_tablo:
            r["sabit"] = kurallar_              # Katalog kuralları sekmesi: bu sistemin sabit bariyer kuralları
        durum = "readonly" if oto_satir else "disabled"
        if oto_satir and self.bariyerler:
            try:
                kal = cam_coz(self.v["cam_yapi"].get(), self._pvb(), self.v["ilk_ic"].get())["kalinlik"]
            except ValueError:
                kal = None
            sec = [BARIYER_OTO]
            tek = sorted(self.bariyerler, key=lambda b: b["ara"])
            adaylar = [(b["kod"], b["ara"]) for b in tek]
            for i, a in enumerate(tek):
                for b in tek[i:]:
                    adaylar.append((f"{a['kod']}+{b['kod']}", a["ara"] + b["ara"]))
            fit_ = [(f"{a['kod']}+{f['kod']}", a["ara"] + f["ara"]) for a in tek for f in _FITIL_EK.values()]
            fit_ += [(f"{a['kod']}+{b['kod']}+{f['kod']}", a["ara"] + b["ara"] + f["ara"])
                     for i, a in enumerate(tek) for b in tek[i:] for f in _FITIL_EK.values()]
            adaylar += fit_
            if kal is not None:      # cama uyan (boşluk penceresine giren) kombinasyonlar önce
                uy = [k for k, t in adaylar if BARIYER_PENCERE[0] - 1e-9 <= kal - t <= BARIYER_PENCERE[1] + 1e-9]
                sec += sorted(uy, key=lambda k: (k.count("+"), k))
            sec += sorted({k for k, _t in fit_} - set(sec))      # silikon altlıklı zincirler (elle)
            if tuple(self.cb_bariyer.cget("values")) != tuple(sec):
                self.cb_bariyer.config(values=sec)
            el_ = self.v["bariyer_elle"].get()
            if el_ not in sec:
                kz_, ez_ = bariyer_coz(list(self.bariyerler) + list(_FITIL_EK.values()), el_)
                if ez_ or not kz_:                 # katalogda olmayan kod varsa otomatiğe dön; elle kurulan zincir kalır
                    self.v["bariyer_elle"].set(BARIYER_OTO)
        self.cb_bariyer.config(state=durum)
        try:
            self._zincir_esitle()
        except Exception:
            pass
        el = self.v["bariyer_elle"].get()
        for r in oto_satir:
            r["elle"] = "" if el == BARIYER_OTO else el
        tk_el = self.v["takoz_elle"].get() if "takoz_elle" in self.v else ZINCIR_OTO
        tkk = takoz_kurallari(self._aktif_sistem())
        for r in self.cam_tablo:
            r["takoz_elle"], r["takoz_kural"] = tk_el, tkk

    def _detaylar_yeniden(self, tur, mevcut):
        """Geçerli _DEGISIM/_YON ile taban ve tip detaylarını şablondan yeniden üretir (aks/hat'a özel parça ayarı için)."""
        kay = self.detay_kaynak.get(tur)
        lib = kay[2] if (kay and len(kay) > 2) else None
        if not lib:
            return mevcut
        getattr(self, "_cam_ui_uygula", lambda: None)()
        out = dict(mevcut)

        def uret(*a):
            try:
                return profil_sablonlu(*a)[1]
            except (ValueError, OSError, IndexError, KeyError):
                return None
        det = uret(lib[0], lib[1], kay[0], kay[1], tur)
        if det is not None and mevcut.get(""):
            for k_, v_ in mevcut[""].items():
                det.setdefault(k_, v_)
            out[""] = det
        for t in (self.yatay_tipleri if tur == "yatay" else self.dikey_tipleri):
            if t.get("sablon") and mevcut.get(t["tip"]):
                yol, blok, ayna = t["sablon"]
                d2 = uret(lib[0], lib[1], yol, blok, tur, ayna)
                if d2 is not None:
                    for k_, v_ in mevcut[t["tip"]].items():
                        d2.setdefault(k_, v_)
                    out[t["tip"]] = d2
        return out

    def _tip_varyantlari(self, tur="yatay"):
        """Kendi şablonu olan tipleri (silikonlu ...) için seçili kütüphane profiliyle detay üretir (tur: yatay | dikey).
        Dönüş: (tipler [ekle/çıkar şablon farkıyla güncel], {tip: detay})"""
        kay = self.detay_kaynak.get(tur)
        lib = kay[2] if (kay and len(kay) > 2) else None
        getattr(self, "_cam_ui_uygula", lambda: None)()
        if not hasattr(self, "_tip_onb"):
            self._tip_onb, self._tip_uyari = {}, set()
        taban = {_norm(pr["blok"]): pr for pr in (self.parca.get(tur) or [])}
        out, vdet = [], {}
        for t in (self.yatay_tipleri if tur == "yatay" else self.dikey_tipleri):
            t2 = dict(t)
            if t.get("sablon") and lib:
                yol, blok, ayna = t["sablon"]
                key = (lib, yol, blok, ayna, tur)
                try:
                    if key not in self._tip_onb:
                        self._tip_onb[key] = profil_sablonlu(lib[0], lib[1], yol, blok, tur, ayna)
                    _kes, det_v, parca_v = self._tip_onb[key]
                except (ValueError, OSError, IndexError, KeyError) as e:
                    if key not in self._tip_uyari:
                        self._tip_uyari.add(key)
                        messagebox.showwarning(f"{tur.capitalize()} tip şablonu", f"{t['tip']}: {e}")
                    out.append(t2)
                    continue
                var = {_norm(pr["blok"]): pr for pr in parca_v}
                skip = ("conta", "izolator")
                t2["cikar"] = list(t["cikar"]) + [k for k, pr in taban.items()
                                                  if k not in var and pr["sinif"] not in skip]
                t2["ekle"] = list(t["ekle"]) + [(pr["blok"], pr["adet"], pr["kgm"]) for k, pr in var.items()
                                                if k not in taban and pr["sinif"] not in skip]
                vdet[t["tip"]] = det_v
            out.append(t2)
        return out, vdet

    # ------------------------------------------------ geri al / ileri al (en çok 50 adım)
    GECMIS_SINIR = 50

    def _durum_al(self):
        return {"v": {k: v.get() for k, v in self.v.items()}, "model": copy.deepcopy(self.model),
                "ek": copy.deepcopy(self.ek_malzeme), "st": copy.deepcopy(self.stoklar)}

    def _durum_ver(self, d):
        for k, val in d["v"].items():
            if k in self.v:
                self.v[k].set(val)
        self.model.clear()
        self.model.update(copy.deepcopy(d["model"]))
        self.ek_malzeme = copy.deepcopy(d["ek"])
        self.stoklar = copy.deepcopy(d["st"])
        self._sec = set()
        try:
            self._cubuk_yenile()
            self._ek_yenile()
        except (tk.TclError, AttributeError):
            pass

    # proje girdileri dışında kalanlar (profil/sistem/üretim/cam ayarları): "Yeni proje"de korunur
    _YENI_KORU = ("dikey_ad", "yatay_ad", "dikey_g", "yatay_g", "dikey_kg", "yatay_kg", "sistem_adi", "cubuk",
                  "testere", "cam_payi", "cam_payi_y", "cam_aks_d", "cam_aks_y", "cam_oturma")

    def yeni_proje(self):
        """Girdileri, cephe modelini ve ek malzemeleri varsayılana döndürür; sistem/profil seçimi korunur."""
        if not messagebox.askyesno("Yeni proje", "Açık proje kapatılacak; aks/kat, tip, parça çıkarma ve ek malzeme "
                                   "girdileri varsayılana dönecek.\nSistem ve profil seçimi korunur. Devam edilsin mi?"):
            return
        ilk = getattr(self, "_v_ilk", None) or {}
        for k, val in ilk.items():
            if k in self.v and k not in self._YENI_KORU:
                self.v[k].set(val)
        try:
            n = len(parse_olculer(self.v["rows"].get(), "Kat yükseklikleri"))
        except ValueError:
            n = 0
        self.model.clear()
        self.model.update({"ek": [[] for _ in range(n)], "tip": [[] for _ in range(n)], "ytip": [], "hucre": {},
                           "dik_yok": set(), "yat_yok": set(), "yalanci": set(), "dik_gecis": set(), "dik_orta": set(), "kayma": {}, "zincir_hat": {}, "dtip": "", "dik_tip": {}, "yat_tip": {},
                           "parca_cikar": {}, "parca_grup": {}, "takoz_hat": {}, "ilerleme": set()})
        self.cephe_tipleri = []
        self._aks_d = self._aks_h = None
        self._sec = set()
        self._secili = None
        self.ek_malzeme = []
        if hasattr(self, "_sip_not"):
            self._sip_not.delete("1.0", "end")
        self.proje_yolu = ""
        self.title("Cephe Metraj")
        self.after(500, self._kayit_isaretle)
        try:
            self._cubuk_yenile()
            self._ek_yenile()
        except Exception:
            pass
        self._gecmis_sifirla()
        self._kural_kal = self._cam_kalinlik()
        self.hesapla()
        self._log("Yeni proje başlatıldı.")

    def gorunum_yenile(self):
        """Önbellekleri temizleyip profil detaylarını yeniden üretir; cephe/kesit görüntüsünü verilerle eşleştirir."""
        try:
            _PC_ONB.clear()
            _OTURMA_ONB.clear()
            _ZT_ONB.clear()
            _YON_ONB.clear()
            self._tip_onb = {}
            self._sp_onb = (None,)
            self._il_ab = (0.0, 0.5)
            _ilerle_g(self, 0.05)
            self._sec_yenile() if self._secili else None
            self._ayar_sonrasi("hafif")          # profil detayları + hesap + çizim
            self._il_ab = (0.5, 1.0)
            self.hesapla()
            self._il_ab = (0.9, 1.0)
            self.ciz()
            self.ciz_kesit()
            self._log("Görünüm verilerle eşleştirildi (yenilendi).")
        except Exception as e:
            self._log(f"Yenileme hatası: {e}", "hata")
        finally:
            _ilerle_g(self, None)

    def _gecmis_sifirla(self):
        if not hasattr(self, "_v_ilk"):
            try:
                self._v_ilk = {k: v.get() for k, v in self.v.items()}      # açılıştaki varsayılan girdiler
            except (AttributeError, tk.TclError):
                pass
        self._geri_yigin, self._ileri_yigin, self._son_durum = [], [], None
        if not hasattr(self, "_gerial_mod"):
            self._gerial_mod = False

    def _gerial_ileri(self, geri=True):
        kaynak = self._geri_yigin if geri else self._ileri_yigin
        hedef = self._ileri_yigin if geri else self._geri_yigin
        if not kaynak:
            self._log("Geri alınacak işlem yok." if geri else "İleri alınacak işlem yok.", "uyari")
            return
        hedef.append(self._son_durum if self._son_durum is not None else self._durum_al())
        d = kaynak.pop()
        self._gerial_mod = True
        try:
            self._durum_ver(d)
            self.hesapla()
        finally:
            self._gerial_mod = False
        self._log(("Geri alındı" if geri else "İleri alındı") + f" (geri: {len(self._geri_yigin)}, ileri: {len(self._ileri_yigin)})")

    def hesapla(self):
        try:
            vv_ = [(g["tur"], g.get("idx"), g["det"]) for g in self._vur.get("cephe", []) if g.get("det")]
            if vv_:
                self._once_vur = vv_
        except Exception:
            pass
        if not hasattr(self, "_geri_yigin"):
            self._gecmis_sifirla()
        try:
            self._cam_ui_uygula()
        except Exception:
            pass
        try:
            cur = self._durum_al()
        except (AttributeError, KeyError, tk.TclError):
            cur = None
        if cur is not None and not self._gerial_mod and self._son_durum is not None and cur != self._son_durum:
            self._geri_yigin.append(self._son_durum)
            del self._geri_yigin[:-self.GECMIS_SINIR]
            self._ileri_yigin.clear()
        self._adimlar, self._adim_t0 = [], time.time()
        _ilerle_g(self, 0.02)
        try:
            self._hesapla_ic()
        finally:
            if getattr(self, "_il_ab", (0.0, 1.0)) == (0.0, 1.0):
                _ilerle_g(self, None)
        try:
            self._son_durum = self._durum_al()
        except (AttributeError, KeyError, tk.TclError):
            pass

    def _hesapla_ic(self):
        try:
            self._kural_uygula()
            cols, rows, p, ek, tip = self._oku()
            parca = {t: self.parca[t] for t in ("dikey", "yatay") if self.parca.get(t)}
            self._adim("Girdiler okundu ve kurallar uygulandı",
                       f"Aks aralıkları: {len(cols)} adet, toplam {sum(cols):g} mm\n"
                       f"Kat yükseklikleri: {len(rows)} adet, toplam {sum(rows):g} mm\n"
                       f"Dikey profil: {p.get('dikey_ad', '-')}   Yatay profil: {p.get('yatay_ad', '-')}\n"
                       f"Rüzgar yükü: {(p.get('ruzgar_kn') or 0):g} kN/m²")
            _ilerle_g(self, 0.06)
            self._panel_uygula()
            self._bariyer_uygula()
            self._adim("Parça ve ısı bariyeri ayarları uygulandı",
                       f"Bariyer kombinasyon sayısı: {len(self.bariyerler or [])}")
            _ilerle_g(self, 0.12)
            # Sistem tipi (kapaklı / silikonlu ...) ayrımı yok: her aks/hat aynı şablondan kurulur; kapak çıkarma,
            # fitil ekleme vb. aks/hat başına elle yapılır.
            self.yatay_tipleri = list(YATAY_TIP_VARSAYILAN)
            self.dikey_tipleri = list(YATAY_TIP_VARSAYILAN)
            self.model.update({"ytip": [], "dtip": "", "dik_tip": {}, "yat_tip": {}})
            ytipler, vdet = self._tip_varyantlari("yatay")
            dtipler, vdd = self._tip_varyantlari("dikey")
            _ilerle_g(self, 0.22)
            self.sonuc = hesapla(cols, rows, p, ek, tip, parca, self.parca_kat, self.cam_tablo, self.bariyerler,
                                 self.model.get("ytip"), ytipler, hucre=self.model.get("hucre"),
                                 dik_yok=self.model.get("dik_yok"), yat_yok=self.model.get("yat_yok"),
                                 yalanci=self.model.get("yalanci"),
                                 dtip=self.model.get("dtip"), dtipler=dtipler, dik_tip=self.model.get("dik_tip"),
                                 yat_tip=self.model.get("yat_tip"), parca_cikar=self.model.get("parca_cikar"),
                                 parca_grup=self.model.get("parca_grup"), takoz_hat=self.model.get("takoz_hat"))
            _s0 = self.sonuc
            _o0, _pg0 = _s0.get("ozet", {}), _s0.get("agirlik", {})
            self._adim("Modül, profil kesimi, çubuk ve cam hesabı",
                       f"{_o0.get('aks', '-')} aks · {_o0.get('kat', '-')} kat · {_o0.get('modul', '-')} modül\n"
                       f"Kesim kalemi: {len(_s0.get('kesim') or [])}   Çubuk kalemi: {len(_s0.get('cubuk') or [])}   "
                       f"Cam kalemi: {len(_s0.get('cam') or [])}\n"
                       f"Alüminyum toplamı: {_pg0.get('alu_toplam_kg', 0):.1f} kg")
            for _c in (_s0.get("cubuk_uyari") or [])[:5]:
                self._adim("   Uyarı", _c)
            _ilerle_g(self, 0.45)
            self.sonuc["kesit"] = dict(self.kesit)
            self.sonuc["detay"] = detay_uyarla(self.detay, self.sonuc["cam_yapi"],
                                               self.sonuc.get("cam_secim"), self.cam_tablo, self.bariyerler)
            _cy = self.sonuc.get("cam_yapi") or {}
            _sc = self.sonuc.get("cam_secim") or {}
            _d0 = (self.sonuc.get("detay") or {})
            self._adim("Cam yapısı ve detay (kesit) uyarlaması",
                       f"Cam yapısı: {_cy.get('ad', _cy.get('yapi', '-'))}   kalınlık: {_cy.get('kalinlik', '-')} mm\n"
                       f"Seçilen kural/bariyer: {_sc.get('pvc', '-')}\n"
                       f"Detay: " + ", ".join(f"{k}: {len((v or {}).get('prims', []) or [])} çizim" for k, v in _d0.items() if isinstance(v, dict)))
            _ilerle_g(self, 0.58)
            self.sonuc["detay_tip"] = {}
            for ad_t, det_v in vdet.items():
                r_ = detay_uyarla({"yatay": det_v}, self.sonuc["cam_yapi"], self.sonuc.get("cam_secim"),
                                  self.cam_tablo, self.bariyerler)
                self.sonuc["detay_tip"][ad_t] = r_["yatay"]
            self.sonuc["detay_tip_d"] = {}
            for ad_t, det_v in vdd.items():
                r_ = detay_uyarla({"dikey": det_v}, self.sonuc["cam_yapi"], self.sonuc.get("cam_secim"),
                                  self.cam_tablo, self.bariyerler)
                if r_.get("dikey"):
                    self.sonuc["detay_tip_d"][ad_t] = r_["dikey"]
            self._adim("Tip varyantları için detaylar hesaplandı",
                       f"Yatay varyant: {len(self.sonuc['detay_tip'])}   Dikey varyant: {len(self.sonuc['detay_tip_d'])}")
            _ilerle_g(self, 0.68)
            # aks / hat başına elle seçilen katman zinciri ve elle oturtulan parça konumları
            self.sonuc["kayma"] = dict(self.model.get("kayma") or {})
            self.sonuc["zincir_hat"] = dict(self.model.get("zincir_hat") or {})
            self.sonuc["detay_zincir"] = {}
            sec_z = self.sonuc.get("cam_secim")
            kaynak_onb = {}
            for (tur_z, zv_) in {("dikey" if k_[0] == "d" else "yatay", v_) for k_, v_ in self.sonuc["zincir_hat"].items()}:
                zc_, deg_z, yon_z = zk_coz(zv_)
                zc_ = zc_ or (sec_z or {}).get("pvc") or ""
                if not sec_z:
                    continue
                with _parca_gecici(deg_z, yon_z):
                    kaynak_z = {"": (self.detay or {}).get(tur_z)}
                    kaynak_z.update(vdd if tur_z == "dikey" else vdet)
                    if deg_z or yon_z:
                        kaynak_z = self._detaylar_yeniden(tur_z, kaynak_z)
                    for ad_z, det_z in kaynak_z.items():
                        if not det_z:
                            continue
                        r_z = detay_uyarla({tur_z: det_z}, self.sonuc["cam_yapi"], dict(sec_z, pvc=zc_),
                                           self.cam_tablo, self.bariyerler)
                        if r_z.get(tur_z):
                            self.sonuc["detay_zincir"][(tur_z, ad_z, zv_)] = r_z[tur_z]
            self._adim("Elle seçilen katman zincirleri uygulandı",
                       f"Zincir seçilen hat sayısı: {len(self.sonuc['zincir_hat'])}   Uyarlanan detay: {len(self.sonuc['detay_zincir'])}")
            _ilerle_g(self, 0.78)
            self.sonuc["analiz"] = on_analiz(self.sonuc)
            _an0 = self.sonuc["analiz"]
            self._adim("Statik ön analiz",
                       "Rüzgar yükü girilmedi, statik kontrol yapılmadı" if not _an0 else "\n".join(analiz_satirlari(_an0)))
            try:
                self._zincir_bilgi()
            except Exception:
                pass
            self.sonuc["ek_malzeme"] = [dict(x) for x in self.ek_malzeme]
            self.sonuc["siparis"] = self.siparis_bilgisi()
        except ValueError as e:
            self._log(f"Girdi hatası: {e}", "hata")
            messagebox.showwarning("Girdi hatası", str(e))
            return
        try:
            o_, pg_ = self.sonuc["ozet"], self.sonuc["agirlik"]
            self._log(f"Hesaplandı: {o_['aks']} aks, {o_['kat']} kat, {o_['modul']} modül | alüminyum {pg_['alu_toplam_kg']:.0f} kg"
                      + (f" | silikon {pg_['silikon_m']:.1f} m" if pg_.get("silikon_m") else ""))
            for u_ in (self.sonuc.get("cubuk_uyari") or [])[:3]:
                self._log(u_, "uyari")
        except (KeyError, TypeError):
            pass
        try:
            self._uc_ciz()
        except Exception:
            pass
        self.model["ek"], self.model["tip"] = ek, tip
        self.model["ytip"] = list(self.sonuc["ytip"])
        self.model["hucre"] = dict(self.sonuc["hucre"])
        self.model["dik_yok"] = set(self.sonuc["dik_yok_ham"])
        self.model["yat_yok"] = set(self.sonuc["yat_yok_ham"])
        self.model["yalanci"] = set(self.sonuc["yalanci"])
        self.model["dtip"] = self.sonuc["dtip"]
        self.model["dik_tip"] = dict(self.sonuc["dik_tip"])
        self.model["yat_tip"] = dict(self.sonuc["yat_tip"])
        self.model["parca_cikar"] = {k: set(v) for k, v in self.sonuc["parca_cikar"].items()}
        s = self.sonuc
        _ilerle_g(self, 0.84)
        for tr, satirlar in ((self.tr_kesim, s["kesim"]), (self.tr_cubuk, s["cubuk"]),
                             (self.tr_cam, s["cam"]), (self.tr_parca, s["parca"])):
            tr.delete(*tr.get_children())
            for r in satirlar:
                tr.insert("", "end", values=r)
            ek_ = s.get("parca_kesim") if tr is self.tr_kesim else s.get("parca_cubuk") if tr is self.tr_cubuk else None
            if ek_:
                tr.insert("", "end", values=("— Sürekli parçalar (kapak, baskı ...) —", "", "", "", ""))
                for r in ek_:
                    tr.insert("", "end", values=r)
        self.tr_mal.delete(*self.tr_mal.get_children())
        self.tr_mal.tag_configure("grup", background="#dfe5ea")
        self.tr_mal.tag_configure("toplam", background="#f1f3f5")
        for baslik, satirlar, top in malzeme_listesi(s):
            self.tr_mal.insert("", "end", values=(baslik, "", "", "", ""), tags=("grup",))
            for r in satirlar:
                self.tr_mal.insert("", "end", values=r)
            if any(top):
                self.tr_mal.insert("", "end", values=top, tags=("toplam",))
        an = analiz_satirlari(s.get("analiz"))
        self.lbl_analiz.config(text="\n".join(an) if an else "")
        try:
            self._statik_ciz()
        except Exception:
            pass
        try:
            self._mh_yenile()
        except Exception as ex:
            self._log(f"Hesaplar sekmesi yenilenemedi: {ex}")
        self._adim("Tablolar, malzeme listesi ve hesaplar sekmesi dolduruldu",
                   f"Malzeme grubu: {len(malzeme_listesi(s))}")
        _ilerle_g(self, 0.9)
        self._bilgi_ozet_yaz()
        self._editor_kur()
        self._cam_etiket_yaz()
        self._ozet_yaz()
        self._kural_yenile()
        self._adim("Kontrol uyarıları değerlendirildi")
        _ilerle_g(self, 0.94)
        self.ciz()
        self._adim("Cephe görünüşü çizildi")
        _ilerle_g(self, 0.97)
        self.ciz_kesit()
        self._adim("Kesit çizildi — hesap tamamlandı")

    def _sema_kur(self, ana):
        """Sağ panelde 'Değer şeması': tıklanan girdi alanının ne anlama geldiğini gösteren şematik çizim."""
        self._sema_fr = ttk.LabelFrame(ana, text=" Değer şeması ", padding=6)
        self._sema_fr.pack(fill="x", pady=(0, 8))
        self._sema_cv = tk.Canvas(self._sema_fr, width=236, height=132, bg="white", highlightthickness=1,
                                  highlightbackground="#c5ccd1")
        self._sema_cv.pack()
        self._sema_bsl = ttk.Label(self._sema_fr, text="Bir girdi alanına tıklayın: ne anlama geldiği burada çizilir.",
                                   font=("Segoe UI", 9, "bold"), wraplength=236, justify="left")
        self._sema_bsl.pack(anchor="w", pady=(4, 0))
        self._sema_ack = ttk.Label(self._sema_fr, text="", foreground="#7a858e", wraplength=236, justify="left")
        self._sema_ack.pack(anchor="w")
        self._sema_son = None
        for ev in ("<FocusIn>", "<KeyRelease>", "<<ComboboxSelected>>"):
            self.bind_all(ev, self._sema_olay, add="+")

    def _sema_olay(self, e):
        w = e.widget
        try:
            ad = str(w.cget("textvariable"))
        except (tk.TclError, AttributeError):
            return
        if not ad:
            return
        for k_, v_ in self.v.items():
            if str(v_) == ad and k_ in SEMA:
                self._sema_son = k_
                self._sema_ciz()
                return

    def _sema_ciz(self):
        k = getattr(self, "_sema_son", None)
        cv = getattr(self, "_sema_cv", None)
        if not k or cv is None or k not in SEMA:
            return
        bsl, ack, fn, ek = SEMA[k]
        cv.delete("all")
        try:
            fn(cv, self.v[k].get(), **ek)
        except Exception as ex:
            cv.create_text(118, 66, text=f"çizilemedi: {ex}", fill="#c0392b", width=220)
        self._sema_bsl.config(text=bsl)
        self._sema_ack.config(text=ack)

    def _cam_panel_girdi_kur(self):
        """Sağ paneldeki 'Cam bilgisi' kutusuna girdi alanları: Cam sekmesindeki değişkenlerle ortaktır (biri değişince
        diğeri de değişir); Enter ya da başka alana geçince hesap yenilenir."""
        fr = getattr(self, "_cp_giris", None)
        if fr is None:
            return
        fr.columnconfigure(1, weight=1)
        v = self.v

        def alan(satir, et, an, aks=False):
            ttk.Label(fr, text=et).grid(row=satir, column=0, sticky="w", pady=1)
            e = ttk.Entry(fr, textvariable=v[an], width=11)
            e.grid(row=satir, column=1, sticky="we", padx=(6, 0), pady=1)
            son = {"v": v[an].get()}

            def uygula(_e=None):
                if v[an].get() == son["v"]:
                    return
                son["v"] = v[an].get()
                self._cam_ui_degisti() if aks else self.hesapla()
            e.bind("<Return>", uygula)
            e.bind("<FocusOut>", uygula)
            return e
        alan(0, "Cam yapısı (mm)", "cam_yapi")
        ttk.Label(fr, text="PVB (mm)").grid(row=1, column=0, sticky="w", pady=1)
        cb = ttk.Combobox(fr, textvariable=v["pvb"], values=("0,76", "1,52"), width=8)
        cb.grid(row=1, column=1, sticky="w", padx=(6, 0), pady=1)
        cb.bind("<<ComboboxSelected>>", lambda _e: self.hesapla())
        cb.bind("<Return>", lambda _e: self.hesapla())
        ttk.Checkbutton(fr, text="İlk katman iç yüzde", variable=v["ilk_ic"], command=self.hesapla).grid(
            row=2, column=0, columnspan=2, sticky="w")
        alan(3, "Cam payı dikey", "cam_payi")
        alan(4, "Cam payı yatay", "cam_payi_y")
        alan(5, "Cam–aks dikey", "cam_aks_d", True)
        alan(6, "Cam–aks yatay", "cam_aks_y", True)
        alan(7, "Oturma payı", "cam_oturma", True)

    def _cam_panel_yaz(self):
        """Sağ paneldeki 'Cam bilgisi': yapı, toplam kalınlık, katmanlar, ağırlık, cam alanı, bariyer, paylar."""
        s = self.sonuc or {}
        y = s.get("cam_yapi")
        if not y:
            self._cp_yapi.config(text="Cam yapısı tanımsız")
            self._cp_bilgi.config(text="")
            self._cp_uyari.config(text="")
            return
        ad_ = {"cam": "Cam", "hava": "Hava", "pvb": "PVB"}
        kat = " | ".join(f"{ad_.get(t, t)} {v:g}" for t, v in y["katman"])
        v = self.v
        satir = [f"Toplam kalınlık: {y['kalinlik']:.2f} mm (PVB dahil)",
                 f"Katmanlar (dıştan içe): {kat}" if not v["ilk_ic"].get() else f"Katmanlar (içten dışa): {kat}",
                 f"Ağırlık: {y['kg_m2']:.1f} kg/m²"]
        o = s.get("ozet") or {}
        if o.get("cam_adet"):
            satir.append(f"Cam: {o['cam_adet']} adet, {o['cam_m2']:.2f} m², {o.get('cam_kg', 0):.0f} kg")
        if str(v["spandrel_yapi"].get()).strip():
            satir.append(f"Spandrel: {v['spandrel_yapi'].get().strip()}")
        satir += cam_secim_metni(s)
        if getattr(self, "_kural_not", None):
            satir.append(self._kural_not)
        self._cp_yapi.config(text=f"{y['ad']}  (PVB {self._pvb():g})")
        self._cp_bilgi.config(text="\n".join(satir))
        uy = [u for u in cam_uyarilari(s.get("detay"), y)]
        self._cp_uyari.config(text="\n".join("UYARI: " + u for u in uy))

    def _cam_etiket_yaz(self):
        try:
            self._cam_panel_yaz()
        except Exception as ex:
            self._log(f"Cam bilgisi paneli yazılamadı: {ex}")
        y = self.sonuc.get("cam_yapi")
        if not y:
            self.lbl_cam.config(text="")
            return
        satir = [f"{y['ad']} (PVB {self._pvb():g}) = {y['kalinlik']:.2f} mm, {y['kg_m2']:.1f} kg/m²"]
        if self._kural_not:
            satir.append(self._kural_not)
        satir += cam_secim_metni(self.sonuc)
        satir += ["UYARI: " + u for u in cam_uyarilari(self.sonuc.get("detay"), y)]
        self.lbl_cam.config(text="\n".join(satir))

    def _ozet_yaz(self):
        o = self.sonuc["ozet"]
        L = [f"{e_:<17}: {d_}" for e_, d_ in (self.sonuc.get("siparis") or []) if e_ != "Not"]
        if L:
            L.append("")
        L += [
            f"Cephe ölçüsü     : {o['olcu'][0]:g} x {o['olcu'][1]:g} mm",
            f"Dikey aks sayısı : {o['aks']}   |   Kat sayısı: {o['kat']}   |   Ek yatay hat: {o['ek_hat']}",
            f"Bölge sayısı     : {o['modul']}",
            "",
        ]
        for ad, adet, fire in o["cubuk_ozet"]:
            L.append(f"{ad}: {adet} çubuk, fire %{fire:.1f}")
        for u_ in self.sonuc.get("cubuk_uyari") or []:
            L.append("UYARI: " + u_)
        L += ["", f"Cam              : {o['cam_adet']} adet, {o['cam_m2']:.2f} m²"]
        if o["sp_adet"]:
            L.append(f"Panel/Spandrel   : {o['sp_adet']} adet, {o['sp_m2']:.2f} m²")
        L.append(f"Sipariş profil   : {o['siparis_kg']:.1f} kg (çubuk bazlı)")
        y = self.sonuc.get("cam_yapi")
        if y:
            L.append(f"Cam yapısı       : {y['ad']} (PVB), {y['kalinlik']:.2f} mm, {y['kg_m2']:.1f} kg/m²")
        an = analiz_satirlari(self.sonuc.get("analiz"))
        if an:
            L += ["", "STATİK ÖN HESAP (kg, cm, kg/cm²)"] + an + [""] + self.sonuc["analiz"]["not"]
            for baslik, satirlar in statik_bolumleri(self.sonuc["analiz"]):
                L += ["", baslik]
                L += [f"  {ad:<46} {dg:>12} {br}" for ad, dg, br in satirlar]
        a = self.sonuc["agirlik"]
        L += ["", "AĞIRLIK ÖZETİ (teorik, kesim boylarından)",
              f"Ana profiller    : {a['ana_kg']:.1f} kg",
              f"Yardımcı alüm.   : {a['yard_alu_kg']:.1f} kg",
              f"Toplam alüminyum : {a['alu_toplam_kg']:.1f} kg",
              f"Conta            : {a['conta_m']:.1f} m ({a['conta_kg']:.1f} kg)",
              f"İzolatör         : {a['izolator_m']:.1f} m",
              f"Cam              : {a['cam_kg']:.1f} kg"]
        self.txt.delete("1.0", "end")
        self.txt.insert("1.0", "\n".join(L))

    # ----------------------------------------------------------- grid editörü
    def _editor_arayuz(self, nb):
        dis = ttk.Frame(nb)
        nb.add(dis, text="Grid düzenle")
        kv = tk.Canvas(dis, highlightthickness=0, bg=self.ARKA)
        ks = ttk.Scrollbar(dis, orient="vertical", command=kv.yview)
        kv.configure(yscrollcommand=ks.set)
        ks.pack(side="right", fill="y")
        kv.pack(side="left", fill="both", expand=True)
        fr = ttk.Frame(kv, padding=12)
        pen_ = kv.create_window((0, 0), window=fr, anchor="nw")
        fr.bind("<Configure>", lambda _e: kv.configure(scrollregion=kv.bbox("all")))
        kv.bind("<Configure>", lambda e: kv.itemconfigure(pen_, width=e.width))

        def tekerlek(e):
            # genel bağ (add="+"): yan panellerin tekerlek bağını bozmaz; yalnız imleç bu sekmenin üstündeyse kaydırır
            w = self.winfo_containing(e.x_root, e.y_root)
            while w is not None and w is not dis:
                w = w.master
            if w is None:
                return
            if kv.bbox("all") and kv.bbox("all")[3] > kv.winfo_height():
                kv.yview_scroll(-1 if (getattr(e, "delta", 0) > 0 or getattr(e, "num", 0) == 4) else 1, "units")
        for ev_ in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
            self.bind_all(ev_, tekerlek, add="+")
        ust = ttk.LabelFrame(fr, text=" Dikey profil (kat bazında, birleşimde dilatasyon) ", padding=8)
        ust.pack(fill="x")
        for i, (k, et) in enumerate((("dikey_alt", "Aks altı (mm)"),
                                      ("dikey_ust", "Aks üstü (mm)"))):
            ttk.Label(ust, text=et).grid(row=0, column=2 * i, sticky="w",
                                         padx=(0 if i == 0 else 18, 6))
            self.v[k] = tk.StringVar(value="25")
            e = ttk.Entry(ust, textvariable=self.v[k], width=8)
            e.grid(row=0, column=2 * i + 1)
            e.bind("<Return>", lambda _e: self._editor_uygula())
        ttk.Label(ust, text="Dilatasyon (mm)").grid(row=1, column=0, sticky="w", pady=(6, 0))
        self.v["dilatasyon"] = tk.StringVar(value="20")
        e = ttk.Entry(ust, textvariable=self.v["dilatasyon"], width=8)
        e.grid(row=1, column=1, pady=(6, 0))
        e.bind("<Return>", lambda _e: self._editor_uygula())
        ttk.Label(ust, foreground="#7a858e",
                  text="Alt: ilk hattın aşağısı, üst: son hattın yukarısı. Dilatasyon: kat birleşimlerinde iki düşey arası boşluk. "
                       "Düşey iki kat geçecekse kat hattı menüsünden 'düşey geçsin' seçin."
                  ).grid(row=2, column=0, columnspan=4, sticky="w", pady=(4, 0))
        self.f_aks = ttk.LabelFrame(fr, text=" Aks aralıkları (soldan sağa, mm) ", padding=8)
        self.f_aks.pack(fill="x", pady=8)
        self.f_kat = ttk.LabelFrame(fr, text=" Katlar (alttan yukarı) ", padding=8)
        self.f_kat.pack(fill="x")
        self.f_yt = ttk.LabelFrame(fr, text=" Yatay hatlar (tip: kapaklı / silikonlu ...) ", padding=8)
        # sistem tipi ayrımı kaldırıldı: tip kutuları gösterilmez
        bf = ttk.Frame(fr)
        bf.pack(fill="x", pady=10)
        ttk.Button(bf, text="Uygula", style="Ana.TButton",
                   command=self._editor_uygula).pack(side="left")
        ttk.Button(bf, text="Listeden yapıştır...", command=self._liste_yapistir).pack(side="left", padx=(8, 0))
        ttk.Label(bf, foreground="#7a858e", wraplength=620, justify="left",
                  text="  Değeri değiştirip Enter'a basın ya da Uygula'ya tıklayın. Ek yatay profil: "
                       "kat içine alttan ölçülerle eklenir (örn. 900; 2100). Her bölgeyi Cam ya da "
                       "Boş, Sandviç panel, Levha ya da Spandrel yapabilirsiniz."
                  ).pack(side="left", padx=8)

    def _liste_yapistir(self):
        """Hazır ölçü listesini (Excel/metin) aks aralıkları ya da kat yükseklikleri olarak yükler."""
        y = self._yapi_oku()
        if not y:
            return
        cols, rows, ek, tip = y
        pen = tk.Toplevel(self)
        pen.title("Listeden ölçü yükle")
        pen.transient(self)
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ttk.Label(fr, text="Ölçü listesini yapıştırın (her satırda bir ölçü; '1. 1310.3' gibi sıra numaralı olabilir):"
                  ).pack(anchor="w")
        txt = tk.Text(fr, width=44, height=16, font=("Consolas", 10), wrap="none")
        txt.pack(fill="both", expand=True, pady=6)
        txt.focus_set()
        hedef = tk.StringVar(value="cols")
        rf = ttk.Frame(fr)
        rf.pack(anchor="w")
        ttk.Radiobutton(rf, text="Aks aralıkları (yatay, soldan sağa)", variable=hedef, value="cols").pack(side="left")
        ttk.Radiobutton(rf, text="Kat yükseklikleri (alttan yukarı)", variable=hedef, value="rows").pack(side="left", padx=10)
        durum = ttk.Label(fr, text="", foreground="#7a858e")
        durum.pack(anchor="w", pady=(4, 0))

        def oku():
            try:
                return olcu_listesi_oku(txt.get("1.0", "end"))
            except ValueError as e:
                durum.config(text=str(e), foreground="#b03a2e")
                return None

        def onizle(_e=None):
            try:
                v = olcu_listesi_oku(txt.get("1.0", "end"))
                durum.config(text=f"{len(v)} ölçü, toplam {sum(v):g} mm", foreground="#7a858e")
            except ValueError:
                durum.config(text="", foreground="#7a858e")
        txt.bind("<KeyRelease>", onizle)

        def ters():
            """Listeyi sondan başa çevirir (sıra numaraları atılır, her satırda bir ölçü kalır)."""
            v = oku()
            if v is None:
                return
            txt.delete("1.0", "end")
            txt.insert("1.0", "\n".join(f"{x:g}" for x in reversed(v)))
            onizle()

        def uygula():
            v = oku()
            if v is None:
                return
            if hedef.get() == "cols":
                yeni_c, yeni_r, yeni_e, yeni_t = v, rows, ek, tip
            else:
                yeni_c, yeni_r = cols, v
                yeni_e = [[] for _ in v]
                yeni_t = [["cam"] for _ in v]
            if len(yeni_c) != len(cols) or len(yeni_r) != len(rows):
                self.model["hucre"], self.model["dik_yok"], self.model["yat_yok"] = {}, set(), set()
                self.model["yalanci"] = set()
                self.model["kayma"], self.model["zincir_hat"] = {}, {}
                self.model["dik_tip"], self.model["yat_tip"], self.model["parca_cikar"] = {}, {}, {}
                self.model["parca_grup"] = {k_: v_ for k_, v_ in (self.model.get("parca_grup") or {}).items() if k_[2] is None}
                self._sec = set()
            pen.destroy()
            self._yapi_yaz(yeni_c, yeni_r, yeni_e, yeni_t, kat_degisti=(hedef.get() == "rows"))
        bt = ttk.Frame(fr)
        bt.pack(anchor="w", pady=(8, 0))
        ttk.Button(bt, text="Uygula", style="Ana.TButton", command=uygula).pack(side="left")
        ttk.Button(bt, text="Listeyi ters çevir", command=lambda: ters()).pack(side="left", padx=8)
        ttk.Button(bt, text="Vazgeç", command=pen.destroy).pack(side="left")
        ttk.Label(bt, foreground="#7a858e", text="  Kat yüksekliği seçilirse ek yataylar sıfırlanır.").pack(side="left")
        pen.bind("<Escape>", lambda _e: pen.destroy())
        pen.grab_set()

    def _editor_kur(self):
        """Editör kutularını mevcut hesaptan (self.sonuc) yeniden kurar."""
        s = self.sonuc
        if not s:
            return
        for w in self.f_aks.winfo_children():
            w.destroy()
        for w in self.f_kat.winfo_children():
            w.destroy()
        self._e_cols, self._e_rows, self._e_ek, self._e_tip = [], [], [], []
        for i, c in enumerate(s["cols"]):
            r_, k_ = divmod(i, 8)
            blok = ttk.Frame(self.f_aks)
            blok.grid(row=r_, column=k_, padx=4, pady=2)
            ttk.Label(blok, text=f"{i + 1}–{i + 2}", foreground="#7a858e").pack()
            sv = tk.StringVar(value=f"{c:g}")
            e = ttk.Entry(blok, textvariable=sv, width=7)
            e.pack()
            e.bind("<Return>", lambda _e: self._editor_uygula())
            bt = ttk.Frame(blok)
            bt.pack()
            ttk.Button(bt, text="+", width=2, command=lambda i=i: self._yapi_degis("aks_ekle", i)).pack(side="left")
            ttk.Button(bt, text="×", width=2, command=lambda i=i: self._yapi_degis("aks_sil", i)).pack(side="left")
            self._e_cols.append(sv)
        for j, bas in enumerate(("Kat", "Yükseklik (mm)", "Ek yatay profiller (alttan, mm)",
                                 "Bölgeler (alttan yukarı)", "", "Düşey profil (tıkla: kat sınırında birleştir / ayır)")):
            ttk.Label(self.f_kat, text=bas, foreground="#7a858e").grid(
                row=0, column=j, sticky="w", padx=4)
        for j, r in enumerate(s["rows"]):
            ttk.Label(self.f_kat, text=f"{aks_adi(j)}–{aks_adi(j + 1)}").grid(
                row=j + 1, column=0, sticky="w", padx=4, pady=2)
            sv_r = tk.StringVar(value=f"{r:g}")
            e = ttk.Entry(self.f_kat, textvariable=sv_r, width=9)
            e.grid(row=j + 1, column=1, padx=4)
            e.bind("<Return>", lambda _e: self._editor_uygula())
            sv_e = tk.StringVar(value="; ".join(f"{h:g}" for h in s["ek"][j]))
            e2 = ttk.Entry(self.f_kat, textvariable=sv_e, width=22)
            e2.grid(row=j + 1, column=2, padx=4)
            e2.bind("<Return>", lambda _e: self._editor_uygula())
            zon = ttk.Frame(self.f_kat)
            zon.grid(row=j + 1, column=3, sticky="w", padx=4)
            tipler = []
            for tp in s["tip"][j]:
                sv_t = tk.StringVar(value=PANEL_TIPLERI.get(tp, PANEL_TIPLERI["cam"])["ad"])
                cb = ttk.Combobox(zon, textvariable=sv_t, values=[v["ad"] for v in PANEL_TIPLERI.values()],
                                  state="readonly", width=9)
                cb.pack(side="left", padx=2)
                cb.bind("<<ComboboxSelected>>", lambda _e: self._editor_uygula())
                tipler.append(sv_t)
            bt = ttk.Frame(self.f_kat)
            bt.grid(row=j + 1, column=4, padx=6)
            ttk.Button(bt, text="+ kat", width=6, command=lambda j=j: self._yapi_degis("kat_ekle", j)).pack(side="left")
            ttk.Button(bt, text="×", width=2, command=lambda j=j: self._yapi_degis("kat_sil", j)).pack(side="left")
            self._e_rows.append(sv_r)
            self._e_ek.append(sv_e)
            self._e_tip.append(tipler)
        try:
            self._dikey_onizleme(s)
        except Exception as e_:
            self._log(f"Düşey önizleme çizilemedi: {e_}", "uyari")
        # yatay hat tipleri
        for w in self.f_yt.winfo_children():
            w.destroy()
        self._e_ytip = []
        adlar = [t["tip"] for t in self.yatay_tipleri]
        yt = s.get("ytip") or []
        ttk.Label(self.f_yt, text="Tüm dikmeler", foreground="#7a858e").grid(row=0, column=0, sticky="w", padx=(10, 4), pady=2)
        self._e_dtip = tk.StringVar(value=s.get("dtip") or self.dikey_tipleri[0]["tip"])
        cbd = ttk.Combobox(self.f_yt, textvariable=self._e_dtip, values=[t["tip"] for t in self.dikey_tipleri],
                           state="readonly", width=14)
        cbd.grid(row=0, column=1, pady=2)
        cbd.bind("<<ComboboxSelected>>", lambda _e: self._editor_uygula())
        if s.get("dik_tip"):
            ttk.Label(self.f_yt, text=f"({len(s['dik_tip'])} dikme parçası özel)", foreground="#b8860b").grid(
                row=0, column=2, columnspan=2, sticky="w")
        yat_say = Counter((k_[0], k_[1]) for k_ in (s.get("yat_tip") or {}))
        for k, (y, ek_) in enumerate(s["cizgiler"]):
            r_, k_ = divmod(k, 3)
            r_ += 1
            hid_k = (s.get("hat_id") or [(0, 0)] * (k + 1))[k]
            ttk.Label(self.f_yt, text=f"{k + 1}. hat  {y:g} mm" + (" (ek)" if ek_ else "")
                      + (" (karışık)" if yat_say.get(hid_k) else ""),
                      foreground="#7a858e").grid(row=r_, column=2 * k_, sticky="w", padx=(10, 4), pady=2)
            sv_y = tk.StringVar(value=yt[k] if k < len(yt) else adlar[0])
            cb = ttk.Combobox(self.f_yt, textvariable=sv_y, values=adlar, state="readonly", width=14)
            cb.grid(row=r_, column=2 * k_ + 1, pady=2)
            cb.bind("<<ComboboxSelected>>", lambda _e: self._editor_uygula())
            self._e_ytip.append(sv_y)

    def _dikey_onizleme(self, s):
        """Katlar tablosunun yanında şematik düşey profil: hangi katların tek parça geçtiği, boyları. Tıklama: satırın
        üst/alt çeyreği = o kat sınırında 'düşey geçsin', orta yarısı = kat ortasında birleşim."""
        rows = s["rows"]
        n = len(rows)
        p = s.get("p") or {}
        dilat = float(p.get("dilatasyon", 0.0) or 0.0)
        gec = {int(k_[1]) for k_ in (self.model.get("dik_gecis") or ()) if 0 < int(k_[1]) < n}
        orta = {int(k_[1]) for k_ in (self.model.get("dik_orta") or ()) if 0 <= int(k_[1]) < n}
        parcalar = dikey_parcalar(rows, s.get("dikey_alt", 0.0), s.get("dikey_ust", 0.0), dilat, gec, orta)
        cum = [0.0]
        for r in rows:
            cum.append(cum[-1] + r)
        renk = ("#4f8fc0", "#c9803f", "#5aa469", "#a06cc4", "#c25a6a", "#8d8f3a")
        sat_h = 31
        try:
            zem_ = ttk.Style().lookup("TLabelframe", "background") or ttk.Style().lookup("TFrame", "background") or self.ARKA
        except Exception:
            zem_ = self.ARKA
        yazi_r = "#cfd6db" if self.tema == "koyu" else "#3d4851"
        for j in range(n):
            cv = tk.Canvas(self.f_kat, width=200, height=sat_h, highlightthickness=0, bg=zem_, cursor="hand2")
            cv.grid(row=j + 1, column=5, sticky="ns", padx=(12, 0))
            lo, hi = cum[j], cum[j + 1]
            for pi, (a_, b_, boy) in enumerate(parcalar):
                if b_ <= lo + 1e-6 or a_ >= hi - 1e-6:
                    continue
                c_ = renk[pi % len(renk)]
                y0 = 0 if a_ <= lo + 1e-6 else (sat_h * (a_ - lo) / (hi - lo) + 2)
                y1 = sat_h if b_ >= hi - 1e-6 else (sat_h * (b_ - lo) / (hi - lo) - 2)
                if a_ <= 1e-6:
                    y0 = 3
                if b_ >= cum[-1] - 1e-6:
                    y1 = sat_h - 3
                # parçanın başladığı/bittiği hat satırında küçük boşluk (dilatasyon): kesilen hattı geçen parça tam boy
                if a_ <= lo + 1e-6 and lo > 0 and any(abs(b2 - a_) < 1e-6 for _a2, b2, _x in parcalar):
                    y0 = 3
                if b_ >= hi - 1e-6 and hi < cum[-1] and any(abs(a2 - b_) < 1e-6 for a2, _b2, _x in parcalar):
                    y1 = sat_h - 3
                cv.create_rectangle(24, y0, 42, max(y0 + 1, y1), fill=c_, outline=c_)
                mid_ = (a_ + b_) / 2
                if lo <= mid_ < hi or (j == n - 1 and mid_ >= hi):
                    cv.create_text(52, sat_h // 2, anchor="w", fill=yazi_r, font=("Arial", 9, "bold"),
                                   text=f"{boy:g} mm")
            if j in orta:
                cv.create_text(150, sat_h // 2, anchor="w", fill="#d35400", font=("Arial", 8), text="birleşim katı")
            cv.bind("<Button-1>", lambda e, j=j, h=sat_h: self._dik_gecis_tikla(j, e.y))

    def _dik_gecis_tikla(self, j, y, h=31):
        """Satır çeyrekleri: üst = üstteki kat sınırı, alt = alttaki kat sınırı, orta yarısı = kat ortası birleşimi."""
        n = len(self._e_rows)
        if y < h * 0.25:
            b = j
        elif y > h * 0.75:
            b = j + 1
        else:
            self._dik_orta_degistir(("y", j, 0))
            return
        if 0 < b < n:
            self._dik_gecis_degistir(("y", b, 0))

    @staticmethod
    def _say_e(metin, ad):
        try:
            v = float(metin.strip().replace(",", "."))
        except ValueError:
            raise ValueError(f"{ad}: sayı girin.")
        if v <= 0:
            raise ValueError(f"{ad}: pozitif olmalı.")
        return v

    @staticmethod
    def _ek_oku(metin, ad):
        out = []
        for tok in re.split(r"[;\s]+", metin.strip()):
            if tok:
                try:
                    out.append(float(tok.replace(",", ".")))
                except ValueError:
                    raise ValueError(f"{ad}: '{tok}' sayı değil.")
        return sorted(set(out))

    def _editor_uygula(self):
        try:
            cols = [self._say_e(sv.get(), f"Aks {i + 1}–{i + 2}") for i, sv in enumerate(self._e_cols)]
            rows = [self._say_e(sv.get(), f"Kat {aks_adi(j)}–{aks_adi(j + 1)}")
                    for j, sv in enumerate(self._e_rows)]
            ek = [self._ek_oku(sv.get(), f"Kat {aks_adi(j)}–{aks_adi(j + 1)} ek yatay")
                  for j, sv in enumerate(self._e_ek)]
        except ValueError as e:
            messagebox.showwarning("Girdi hatası", str(e))
            return
        tip = []
        for j, tl in enumerate(self._e_tip):
            m = len(ek[j]) + 1
            tip.append(([panel_id(sv.get()) for sv in tl] + ["cam"] * m)[:m])
        self.v["cols"].set(sikistir(cols))
        self.v["rows"].set(sikistir(rows))
        self.model["ek"], self.model["tip"] = ek, tip
        yeni_yt = [sv.get() for sv in getattr(self, "_e_ytip", [])]
        eski_yt = list((self.sonuc or {}).get("ytip") or [])
        hid_l = list((self.sonuc or {}).get("hat_id") or [])
        if len(eski_yt) == len(yeni_yt) == len(hid_l):
            for a_, b_, h_ in zip(eski_yt, yeni_yt, hid_l):          # hat tipi değişti: o hattaki özel parça tipleri silinir
                if a_ != b_:
                    for k_ in [k_ for k_ in self.model.get("yat_tip", {}) if (k_[0], k_[1]) == h_]:
                        del self.model["yat_tip"][k_]
        self.model["ytip"] = yeni_yt
        dt_ = getattr(self, "_e_dtip", None)
        if dt_ is not None and dt_.get() != (self.sonuc or {}).get("dtip"):
            self.model["dtip"], self.model["dik_tip"] = dt_.get(), {}
        self.hesapla()

    def _yapi_degis(self, op, i):
        """Aks / kat ekle-sil. Ekle: i. aralığın kopyası hemen sonrasına eklenir."""
        try:
            cols = [self._say_e(sv.get(), f"Aks {n + 1}–{n + 2}") for n, sv in enumerate(self._e_cols)]
            rows = [self._say_e(sv.get(), f"Kat {aks_adi(j)}–{aks_adi(j + 1)}") for j, sv in enumerate(self._e_rows)]
            ek = [self._ek_oku(sv.get(), "Ek yatay") for sv in self._e_ek]
        except ValueError as e:
            messagebox.showwarning("Girdi hatası", str(e))
            return
        tip = []
        for j, tl in enumerate(self._e_tip):
            m = len(ek[j]) + 1
            tip.append(([panel_id(sv.get()) for sv in tl] + ["cam"] * m)[:m])
        if op == "aks_ekle":
            ovr_kaydir(self.model, "col_ekle", i + 1)
            cols.insert(i + 1, cols[i])
        elif op == "aks_sil":
            if len(cols) < 2:
                messagebox.showwarning("Aks", "En az bir aks aralığı kalmalı.")
                return
            ovr_kaydir(self.model, "col_sil", i)
            cols.pop(i)
        elif op == "kat_ekle":
            ovr_kaydir(self.model, "row_ekle", i + 1)
            rows.insert(i + 1, rows[i])
            ek.insert(i + 1, list(ek[i]))
            tip.insert(i + 1, list(tip[i]))
        elif op == "kat_sil":
            if len(rows) < 2:
                messagebox.showwarning("Kat", "En az bir kat kalmalı.")
                return
            ovr_kaydir(self.model, "row_sil", i)
            rows.pop(i)
            ek.pop(i)
            tip.pop(i)
        self.v["cols"].set(sikistir(cols))
        self.v["rows"].set(sikistir(rows))
        self.model["ek"], self.model["tip"] = ek, tip
        if op.startswith("kat"):
            self.model["ytip"] = []          # hat sayısı değişti: tipler varsayılana döner (uçlar kapaklı, ara silikonlu)
        self.hesapla()

    # ------------------------------------------------------------ çizim
    def _cv_tema(self, cv):
        return TemaCanvas(cv) if self.tema == "koyu" else cv

    def ciz(self):
        self._ciz_ic()
        if getattr(self, "etkilesim", True) and hasattr(self, "_olcular"):
            self._olcu_ciz()

    def _ciz_ic(self):
        cv, s = self._cv_tema(self.cv), self.sonuc
        cv.delete("all")
        vur = []
        hit = []                       # cephe görünüşünde tıklanabilir alanlar (ölçü, aks balonu, cam bölgesi)
        if self.etkilesim:
            self._vur["cephe"] = vur
            self._cep_hit = hit
            self._hv_son = None
        if not s:
            return
        W, H = cv.winfo_width(), cv.winfo_height()
        if W < 250 or H < 250:
            return
        cols, rows, vw, hw = s["cols"], s["rows"], s["vw"], s["hw"]
        TW, TH = sum(cols), sum(rows)
        alt, ust = s["dikey_alt"], s["dikey_ust"]
        ek_var = any(e for _y, e in s["cizgiler"])
        th = max(100.0, max(TW, TH) / 45)
        _d_ = getattr(self, "_aks_d", None)
        s["kesit_kol"] = None if _d_ is None else min(_d_, len(cols) - 1)
        sayfa = sayfa_yerlesim(s, th)
        ybot, ytop = min(-alt, -hw / 2), max(TH + ust, TH + hw / 2)
        x0s, x1s, y0s, y1s = 0.0, TW, ybot, ytop
        for nm in ("plan", "kesit"):
            if sayfa.get(nm):
                bx0, by0, bx1, by1 = sayfa[nm]["bbox"]
                x0s, x1s = min(x0s, bx0), max(x1s, bx1)
                y0s, y1s = min(y0s, by0), max(y1s, by1)
        mL, mR, mT, mB = 80, (125 if ek_var else 105), 65, 100
        sw, sh = x1s - x0s, y1s - y0s
        BR = 9                                           # aks balonu yarıçapı (px)
        ax_ = [0.0]
        for c_ in cols:
            ax_.append(ax_[-1] + c_)
        ay_ = [0.0]
        for r_ in rows:
            ay_.append(ay_[-1] + r_)
        for _tur in range(2):                            # sıkışık akslarda balonlar kademelenir: kenar payı büyür
            sc0 = min((W - mL - mR) / sw, (H - mT - mB) / sh)
            if sc0 <= 0:
                return
            if _tur == 0:
                lc = balon_seviye([x * sc0 for x in ax_], BR)
                lr = balon_seviye([y * sc0 for y in ay_], BR)
                mT += max(lc) * (2 * BR + 3)
                mL += max(lr) * (2 * BR + 3)
        ox0 = mL + ((W - mL - mR) - sw * sc0) / 2 - x0s * sc0
        oy0 = mT + ((H - mT - mB) - sh * sc0) / 2 + y1s * sc0
        self.gor.fit = (ox0, oy0, sc0)
        self.gor.kx = self.gor.ky = 0
        ox, oy, sc = self.gor.donustur()
        cx, cy = [0], [0]
        for c in cols:
            cx.append(cx[-1] + c)
        for r in rows:
            cy.append(cy[-1] + r)
        ys_h = [y for y, _ in s["cizgiler"]]
        X = lambda v: ox + v * sc
        Y = lambda v: oy - v * sc
        F = ("Arial", 8)
        ayna = bool(genel_ayar("cephe_ayna"))          # karşı taraftan bakış: görünüş ve plan yatay çevrilir
        XM = (lambda v: X(TW - v)) if ayna else X

        # bölgeler: cam / spandrel
        hucre_ = s.get("hucre") or {}
        dik_yok_ = s.get("dik_yok") or set()
        yat_yok_ = s.get("yat_yok") or set()
        hat_id_ = s.get("hat_id") or [(0, 0)] * len(s["cizgiler"])
        birlesik_ = set()                                  # yalancı hatla birleşen hücreler: tek parça çizilir
        for g_ in s.get("cam_gruplari") or []:
            if len(g_["hucreler"]) < 2:
                continue
            za_, zb_ = s["bolgeler"][g_["z0"]], s["bolgeler"][g_["z1"]]
            for zi_, ci_ in g_["hucreler"]:
                birlesik_.add((s["bolgeler"][zi_]["kat"], s["bolgeler"][zi_].get("k", 0), ci_))
            pg_ = PANEL_TIPLERI[g_["tip"]]
            gx1, gx2 = sorted((XM(cx[g_["i0"]] + vw / 2), XM(cx[g_["i1"] + 1] - vw / 2)))
            gy1, gy2 = Y(zb_["y1"] - hw / 2), Y(za_["y0"] + hw / 2)
            if pg_.get("bos"):
                cv.create_rectangle(gx1, gy1, gx2, gy2, fill="", outline="#9aa5ad", dash=(4, 3))
            else:
                dg_, cg_ = ("#dce9f1", "#8fa6b5") if g_["tip"] == "cam" else pg_.get("renk", ("#d8cfbd", "#a89f8a"))
                cv.create_rectangle(gx1, gy1, gx2, gy2, fill=dg_, outline=cg_)
        for z in s["bolgeler"]:
            zk_ = z.get("k", 0)
            for i in range(len(cols)):
                tp_ = hucre_.get((z["kat"], zk_, i), z["tip"])
                pt_ = PANEL_TIPLERI[tp_]
                cam_ = tp_ == "cam"
                x1, x2 = sorted((XM(cx[i] + vw / 2), XM(cx[i + 1] - vw / 2)))
                hit.append({"tur": "zone", "r": (x1, Y(z["y1"] - hw / 2), x2, Y(z["y0"] + hw / 2)),
                            "kat": z["kat"], "k": zk_, "col": i, "z": z, "tip": tp_,
                            "ipucu": f"{pt_['ad']}: tıklayın, tipini değiştirin"})
                if (z["kat"], zk_, i) in birlesik_:
                    continue
                if pt_.get("bos"):
                    cv.create_rectangle(x1, Y(z["y1"] - hw / 2), x2, Y(z["y0"] + hw / 2),
                                        fill="", outline="#9aa5ad", dash=(4, 3))
                    if x2 - x1 > 50:
                        cv.create_text((x1 + x2) / 2, Y((z["y0"] + z["y1"]) / 2), text="BOŞ", font=F, fill="#9aa5ad")
                    continue
                dolgu, cizgi = ("#dce9f1", "#8fa6b5") if cam_ else pt_.get("renk", ("#d8cfbd", "#a89f8a"))
                cv.create_rectangle(x1, Y(z["y1"] - hw / 2), x2, Y(z["y0"] + hw / 2), fill=dolgu, outline=cizgi)
                if not cam_ and x2 - x1 > 70:
                    cv.create_text((x1 + x2) / 2, Y((z["y0"] + z["y1"]) / 2), text=pt_["ad"].upper(),
                                   font=F, fill="#8a7f68")
        # yatay profiller (kat eksenleri + ek hatlar)
        yt_ = s.get("ytip") or []
        yat_tip_, dik_tip_ = s.get("yat_tip") or {}, s.get("dik_tip") or {}
        pcik_ = s.get("parca_cikar") or {}
        sil_y = {t["tip"] for t in self.yatay_tipleri if t["silikon"]}
        sil_d = {t["tip"] for t in self.dikey_tipleri if t["silikon"]}
        dtip_ = s.get("dtip")
        for k_, y in enumerate(ys_h):
            hid_ = hat_id_[k_]
            for i in range(len(cols)):
                sil_ = yat_tip_.get((hid_[0], hid_[1], i), yt_[k_] if k_ < len(yt_) else None) in sil_y
                xa, xb = sorted((XM(cx[i] + vw / 2), XM(cx[i + 1] - vw / 2)))
                yok_ = (hid_[0], hid_[1], i) in yat_yok_
                if yok_:
                    cv.create_rectangle(xa, Y(y + hw / 2), xb, Y(y - hw / 2), fill="", outline="#c4ccd2", dash=(2, 3))
                else:
                    cv.create_rectangle(xa, Y(y + hw / 2), xb, Y(y - hw / 2),
                                        fill="#cfd9b0" if sil_ else "#b3bec6",
                                        outline="#8e9a66" if sil_ else "#7d8a93")
                    if pcik_.get(("y", hid_[0], hid_[1], i)):
                        cv.create_line(xa + 2, Y(y), xb - 2, Y(y), fill="#e0861a", width=2, dash=(3, 2))
                yc_ = Y(y)
                hy_ = max((Y(y - hw / 2) - Y(y + hw / 2)) / 2, 4)
                hit.append({"tur": "yat", "r": (xa, yc_ - hy_, xb, yc_ + hy_), "hid": hid_, "i": i, "yok": yok_,
                            "ipucu": "Yatay profil" + (" (boş)" if yok_ else "") + ": tıklayın"})
            if k_ < len(yt_) and len(self.yatay_tipleri) > 1:
                ads_ = []
                for i in range(len(cols)):
                    a_ = yat_tip_.get((hid_[0], hid_[1], i), yt_[k_])
                    if a_ not in ads_:
                        ads_.append(a_)
                cv.create_text(X(cx[-1]) + 34, Y(y), text="/".join(ads_[:3]), font=F, fill="#4a5560", anchor="w")
        # dikey profiller (alt/üst uzantılı)
        for i in range(len(cols) + 1):
            xa, xb = sorted((XM(cx[i] - vw / 2), XM(cx[i] + vw / 2)))
            ycs = [(-alt if j == 0 else cy[j], TH + ust if j == len(rows) - 1 else cy[j + 1]) for j in range(len(rows))]
            j = 0
            durum_ = lambda jj: ((i, jj) in dik_yok_, dik_tip_.get((i, jj), dtip_) in sil_d)
            while j < len(rows):
                yok_, sild_ = durum_(j)
                j2 = j
                while j2 + 1 < len(rows) and durum_(j2 + 1) == (yok_, sild_):
                    j2 += 1                       # aynı durumdaki ardışık parçalar tek dikdörtgen
                ya, yb = ycs[j][0], ycs[j2][1]
                if yok_:
                    cv.create_rectangle(xa, Y(yb), xb, Y(ya), fill="", outline="#c4ccd2", dash=(2, 3))
                else:
                    cv.create_rectangle(xa, Y(yb), xb, Y(ya), fill="#a3b57f" if sild_ else "#8d99a3",
                                        outline="#76874f" if sild_ else "#66727b")
                    for jj in range(j, j2 + 1):
                        if pcik_.get(("d", i, jj)):
                            cv.create_line((xa + xb) / 2, Y(ycs[jj][1]) + 2, (xa + xb) / 2, Y(ycs[jj][0]) - 2,
                                           fill="#e0861a", width=2, dash=(3, 2))
                j = j2 + 1
            xc_ = (xa + xb) / 2
            hx_ = max((xb - xa) / 2, 4)
            for j in range(len(rows)):
                hit.append({"tur": "dik", "r": (xc_ - hx_, Y(ycs[j][1]), xc_ + hx_, Y(ycs[j][0])), "i": i, "j": j,
                            "yok": (i, j) in dik_yok_,
                            "ipucu": f"{i + 1}. aks dikme" + (" (boş)" if (i, j) in dik_yok_ else "") + ": tıklayın"})

        # yatay profil, boş dikmenin üzerinden devam eder: kesişimde boş olan yarıyı yatay profil doldurur
        for k_, y in enumerate(ys_h):
            hid_ = hat_id_[k_]
            j_ = hid_[0]
            if hid_[1] != 0:
                continue
            sil_h = (yt_[k_] if k_ < len(yt_) else None) in sil_y
            for a_ in range(len(cols) + 1):
                ust_ = j_ < len(rows) and (a_, j_) in dik_yok_
                alt_ = j_ > 0 and (a_, j_ - 1) in dik_yok_
                if not (ust_ or alt_):
                    continue
                kom_ = [i for i in (a_ - 1, a_) if 0 <= i < len(cols) and (j_, 0, i) not in yat_yok_]
                if not kom_:
                    continue
                xa, xb = sorted((XM(cx[a_] - vw / 2), XM(cx[a_] + vw / 2)))
                y1_ = Y(y + hw / 2) if ust_ else Y(y)
                y2_ = Y(y - hw / 2) if alt_ else Y(y)
                cv.create_rectangle(xa, y1_, xb, y2_, fill="#cfd9b0" if sil_h else "#b3bec6",
                                    outline="#8e9a66" if sil_h else "#7d8a93")
        # sürekli parça boyları (kapak/baskı ...): her parçanın başı-sonu ve boyu
        pb_ = s.get("parca_boy_cizim") or []
        if pb_:
            pal_ = ["#e0861a", "#c2410c", "#7c3aed", "#0e9f6e", "#0284c7", "#be185d"]
            kodlar_ = sorted({(p_[0], p_[1]) for p_ in pb_})
            for p_ in pb_:
                tur_p, kod_p, sc_p, i0, i1, L_p = p_
                ci_ = kodlar_.index((tur_p, kod_p))
                col_ = pal_[ci_ % len(pal_)]
                if tur_p == "yatay":
                    if sc_p not in hat_id_:
                        continue
                    yy_ = Y(ys_h[hat_id_.index(sc_p)]) + max(abs(Y(0) - Y(hw)) / 2, 4) + 4 + ci_ * 5
                    xa, xb = sorted((XM(cx[i0]), XM(cx[i1 + 1])))
                    cv.create_line(xa, yy_, xb, yy_, fill=col_, width=2)
                    for xx_ in (xa, xb):
                        cv.create_line(xx_, yy_ - 4, xx_, yy_ + 4, fill=col_, width=2)
                    if xb - xa >= 46:
                        cv.create_text((xa + xb) / 2, yy_ - 7, text=f"{L_p:g}", font=("Arial", 7), fill=col_)
                else:
                    xx_ = XM(cx[sc_p]) + max(abs(XM(cx[0] + vw / 2) - XM(cx[0] - vw / 2)) / 2, 4) + 4 + ci_ * 5
                    ya_ = -alt if i0 == 0 else cy[i0]
                    yb_ = TH + ust if i1 == len(rows) - 1 else cy[i1 + 1]
                    cv.create_line(xx_, Y(ya_), xx_, Y(yb_), fill=col_, width=2)
                    for yy2_ in (Y(ya_), Y(yb_)):
                        cv.create_line(xx_ - 4, yy2_, xx_ + 4, yy2_, fill=col_, width=2)
                    if abs(Y(ya_) - Y(yb_)) >= 60:
                        cv.create_text(xx_ + 8, (Y(ya_) + Y(yb_)) / 2, text=f"{L_p:g}", font=("Arial", 7), fill=col_, angle=90)
            for n_, (tur_p, kod_p) in enumerate(kodlar_):
                cv.create_text(12, 30 + n_ * 12, anchor="nw", font=("Arial", 8), fill=pal_[n_ % len(pal_)],
                               text=f"━ {kod_p} ({tur_p}) sürekli boy")

        akscol = "#c97b63"
        adim = 2 * BR + 3
        lev_c = balon_seviye([XM(x) for x in cx], BR)
        lev_r = balon_seviye([Y(y) for y in cy], BR)
        sel_d, sel_h = getattr(self, "_aks_d", None), getattr(self, "_aks_h", None)
        sel_kat = hat_id_[sel_h][0] if (sel_h is not None and sel_h < len(hat_id_) and hat_id_[sel_h][1] == 0) else None
        secr = "#e65100"
        for i, x in enumerate(cx):                        # önce çizgiler, sonra balonlar (balon çizgiyi örter)
            cv.create_line(XM(x), Y(ytop) - 34 - 2 * BR - lev_c[i] * adim, XM(x), Y(ybot) + 8, dash=(6, 4),
                           fill=secr if i == sel_d else akscol, width=3 if i == sel_d else 1)
        for k, y in enumerate(cy):
            cv.create_line(X(0) - 40 - 2 * BR - lev_r[k] * adim, Y(y), X(TW) + 8, Y(y), dash=(6, 4),
                           fill=secr if k == sel_kat else akscol, width=3 if k == sel_kat else 1)
        for i, x in enumerate(cx):
            by_ = Y(ytop) - 34 - BR - lev_c[i] * adim
            cv.create_oval(XM(x) - BR, by_ - BR, XM(x) + BR, by_ + BR, outline=secr if i == sel_d else akscol,
                           fill="#ffe0b2" if i == sel_d else "white", width=2 if i == sel_d else 1)
            cv.create_text(XM(x), by_, text=str(i + 1), font=("Arial", 7 if i + 1 >= 10 else 8), fill="#4a5560")
            hit.append({"tur": "aks", "r": (XM(x) - BR - 1, by_ - BR - 1, XM(x) + BR + 1, by_ + BR + 1), "i": i,
                        "ipucu": f"{i + 1}. aks: tıklayın, yanına aks ekleyin"})
        for k, y in enumerate(cy):
            bx_ = X(0) - 40 - BR - lev_r[k] * adim
            cv.create_oval(bx_ - BR, Y(y) - BR, bx_ + BR, Y(y) + BR, outline=secr if k == sel_kat else akscol,
                           fill="#ffe0b2" if k == sel_kat else "white", width=2 if k == sel_kat else 1)
            cv.create_text(bx_, Y(y), text=aks_adi(k), font=F, fill="#4a5560")
            hit.append({"tur": "kataks", "r": (bx_ - BR - 1, Y(y) - BR - 1, bx_ + BR + 1, Y(y) + BR + 1), "k": k,
                        "ipucu": f"{aks_adi(k)} hattı: tıklayın, kat ekleyin"})
        for k_h, y in enumerate(ys_h):               # ek hatlar: ince noktalı çizgi
            if y not in cy:
                cv.create_line(X(0) - 40, Y(y), X(TW) + 8, Y(y), dash=(2, 4), fill=secr if k_h == sel_h else "#b9a99a",
                               width=3 if k_h == sel_h else 1)

        dim = "#55606a"

        def zincir_yatay(vals, pos, yd, tur=None):
            for p_ in pos:
                cv.create_line(XM(p_) - 4, yd + 4, XM(p_) + 4, yd - 4, fill=dim)
            cv.create_line(XM(pos[0]), yd, XM(pos[-1]), yd, fill=dim)
            for n_, (a, b, v) in enumerate(zip(pos, pos[1:], vals)):
                if tur:
                    xa, xb = sorted((XM(a), XM(b)))
                    hit.append({"tur": tur, "r": (xa + 2, yd - 20, xb - 2, yd + 8), "i": n_, "ipucu": f"{v:g} mm: tıklayın, değiştirin"})
                if (b - a) * sc >= 28:
                    cv.create_text((XM(a) + XM(b)) / 2, yd - 9, text=f"{v:g}",
                                   font=F, fill=dim)
                elif (b - a) * sc >= 7.5:             # dar aralık: ölçü dik yazılır (tam sayıya yuvarlanır)
                    t_ = f"{v:.0f}"
                    cv.create_text((XM(a) + XM(b)) / 2, yd - 5 - len(t_) * 2.4, text=t_,
                                   font=("Arial", 6), fill=dim, angle=90)

        def zincir_dikey(vals, pos, xd, aci=0, tur=None):
            for p_ in pos:
                cv.create_line(xd - 4, Y(p_) + 4, xd + 4, Y(p_) - 4, fill=dim)
            cv.create_line(xd, Y(pos[0]), xd, Y(pos[-1]), fill=dim)
            for n_, (a, b, v) in enumerate(zip(pos, pos[1:], vals)):
                if tur:
                    ya, yb = sorted((Y(a), Y(b)))
                    hit.append({"tur": tur, "r": (xd - 18, ya + 2, xd + (10 if aci else 34), yb - 2), "i": n_, "ipucu": f"{v:g} mm: tıklayın, değiştirin"})
                if aci:
                    if abs(Y(a) - Y(b)) >= 28:
                        cv.create_text(xd - 9, (Y(a) + Y(b)) / 2, text=f"{v:g}",
                                       font=F, fill=dim, angle=aci)
                else:
                    cv.create_text(xd + 7, (Y(a) + Y(b)) / 2, text=f"{v:g}",
                                   font=F, fill=dim, anchor="w")

        zincir_yatay(cols, cx, Y(ybot) + 32, "olcu_col")
        zincir_yatay([TW], [0, TW], Y(ybot) + 60)
        if ek_var:
            zincir_dikey([b - a for a, b in zip(ys_h, ys_h[1:])], ys_h, X(TW) + 26, aci=90, tur="olcu_seg")
            zincir_dikey(rows, cy, X(TW) + 58, tur="olcu_row")
            zincir_dikey([TH], [0, TH], X(TW) + 108, aci=90)
        else:
            zincir_dikey(rows, cy, X(TW) + 32, tur="olcu_row")
            zincir_dikey([TH], [0, TH], X(TW) + 82, aci=90)

        # plan (altta) ve kesit (sağda): katalog detayı her aks / yatay hatta, cam/spandrel bantlarıyla
        for nm, baslik in (("plan", "Plan"), ("kesit", "Kesit")):
            g = sayfa.get(nm)
            if not g:
                continue
            odak_ = getattr(self, "_odak", None)
            if odak_ and ("dikey" if nm == "plan" else "yatay") != odak_[0]:
                continue                                 # aks odağı: diğer sayfa (plan/kesit) gizli
            if not ayna:
                Xg = X
            elif nm == "plan":
                Xg = XM                                  # plan: görünüşle birlikte aynalanır
            else:                                        # kesit: kendi merkezine göre çevrilir
                cxg = (g["bbox"][0] + g["bbox"][2]) / 2
                Xg = lambda v, c=cxg: X(2 * c - v)
            m = g.get("mullion") if not odak_ else None
            if m:                # kesilmeyen dikey profil: arkada silüet, alt/üst uzantı ölçüleriyle
                cv.create_rectangle(Xg(m["x1"]), Y(m["y2"]), Xg(m["x2"]), Y(m["y1"]),
                                    fill="#cfd5d9", outline="#8d99a3")
                xd = min(Xg(m["x1"]), Xg(m["x2"])) - 16
                for ya, yb in ((m["y1"], 0.0), (m["TH"], m["y2"])):
                    if abs(ya - yb) < 0.5:
                        continue
                    cv.create_line(xd, Y(ya), xd, Y(yb), fill="#55606a")
                    for yy in (ya, yb):
                        cv.create_line(xd - 4, Y(yy) + 4, xd + 4, Y(yy) - 4, fill="#55606a")
                    if abs(Y(ya) - Y(yb)) >= 28:
                        cv.create_text(xd - 9, (Y(ya) + Y(yb)) / 2, text=f"{abs(ya - yb):g}",
                                       font=("Arial", 8), fill="#55606a", angle=90)
            for x1, y1, x2, y2, tp in ([] if odak_ else g["cam"]):
                dolgu, cizgi = cam_renk(tp)
                cv.create_rectangle(Xg(x1), Y(y2), Xg(x2), Y(y1), fill=dolgu, outline=cizgi)
            for k_, (dx, dy) in enumerate(g["ofset"]):
                if odak_ and k_ != odak_[1]:
                    continue                             # aks odağı: yalnız seçili aksın profili
                hd = (g.get("hat_detay") or [])
                dd_ = hd[k_] if k_ < len(hd) else g["detay"]
                ciz_detay(cv, dd_, Xg, Y, sc, dx, dy)
                vur.append({"det": dd_, "dx": dx, "dy": dy, "X": Xg, "Y": Y, "idx": k_,
                            "tur": "dikey" if nm == "plan" else "yatay"})
                try:        # hangi aks / hat olduğu: ad etiketi; seçiliyse çerçeve
                    b_a = dd_["bbox"]
                    ex_a = sorted((Xg(b_a[0] + dx), Xg(b_a[2] + dx)))
                    ey_a = sorted((Y(b_a[1] + dy), Y(b_a[3] + dy)))
                    if nm == "plan":
                        ad_a, sec_a = f"{k_ + 1}. aks", sel_d == k_
                    else:
                        ad_a = f"{hat_adi(hat_id_[k_])} hattı" if k_ < len(hat_id_) else ""
                        sec_a = sel_h == k_
                    if sec_a:
                        cv.create_rectangle(ex_a[0] - 4, ey_a[0] - 4, ex_a[1] + 4, ey_a[1] + 4, outline=secr, width=2,
                                            dash=(5, 3))
                    if ad_a and ex_a[1] - ex_a[0] >= 20:
                        cv.create_text(ex_a[0], ey_a[0] - 6, anchor="sw", text=ad_a, font=("Arial", 9, "bold"),
                                       fill=secr if sec_a else "#3d4851")
                    rf_a = dd_.get("ref")                      # aks çizgisi + balon (görünüştekiyle aynı); balona tıklanır
                    if rf_a and ex_a[1] - ex_a[0] >= 20:
                        ac_ = secr if sec_a else akscol
                        if nm == "plan":
                            xa_ = Xg(rf_a[0] + dx)
                            y2_ = ey_a[1] + 26
                            cv.create_line(xa_, ey_a[0] - 10, xa_, y2_, dash=(10, 3, 2, 3), fill=ac_, width=2 if sec_a else 1)
                            cv.create_oval(xa_ - BR, y2_, xa_ + BR, y2_ + 2 * BR, outline=ac_, fill="#ffe0b2" if sec_a else "white",
                                           width=2 if sec_a else 1)
                            cv.create_text(xa_, y2_ + BR, text=str(k_ + 1), font=("Arial", 7 if k_ + 1 >= 10 else 8), fill="#4a5560")
                            hit.append({"tur": "aks", "r": (xa_ - BR - 1, y2_ - 1, xa_ + BR + 1, y2_ + 2 * BR + 1), "i": k_,
                                        "ipucu": f"{k_ + 1}. aks: tıklayın, seçenekler"})
                        elif k_ < len(hat_id_):
                            ya_ = Y(rf_a[1] + dy)
                            x1_ = ex_a[0] - 26
                            cv.create_line(x1_, ya_, ex_a[1] + 10, ya_, dash=(10, 3, 2, 3), fill=ac_, width=2 if sec_a else 1)
                            cv.create_oval(x1_ - 2 * BR, ya_ - BR, x1_, ya_ + BR, outline=ac_, fill="#ffe0b2" if sec_a else "white",
                                           width=2 if sec_a else 1)
                            cv.create_text(x1_ - BR, ya_, text=hat_adi(hat_id_[k_]), font=("Arial", 7), fill="#4a5560")
                            if ("y", hat_id_[k_][0], 0) in ((getattr(self, "model", None) or {}).get("dik_gecis") or ()) and hat_id_[k_][1] == 0:
                                cv.create_text(x1_ - 2 * BR - 4, ya_, anchor="e", text="düşey geçer", font=("Arial", 8, "bold"), fill="#d35400")
                            elif ("y", hat_id_[k_][0], 0) in ((getattr(self, "model", None) or {}).get("dik_orta") or ()) and hat_id_[k_][1] == 0:
                                cv.create_text(x1_ - 2 * BR - 4, ya_, anchor="e", text="düşey bu katın ortasında birleşir", font=("Arial", 8, "bold"), fill="#d35400")
                            hit.append({"tur": "hat", "r": (x1_ - 2 * BR - 1, ya_ - BR - 1, x1_ + 1, ya_ + BR + 1), "i": k_,
                                        "ipucu": f"{hat_adi(hat_id_[k_])} hattı: tıklayın, seçenekler"})
                except (ValueError, IndexError, KeyError, TypeError):
                    pass
                if genel_ayar("parca_kod"):
                    try:        # yakınlaşınca parça kodu/ölçüsü: yalnız ekranda görünen ve yeterince büyük detaylarda
                        b_ = dd_["bbox"]
                        ex = sorted((Xg(b_[0] + dx), Xg(b_[2] + dx)))
                        ey = sorted((Y(b_[1] + dy), Y(b_[3] + dy)))
                        if ex[1] - ex[0] >= 110 and ex[1] > 0 and ex[0] < W and ey[1] > 0 and ey[0] < H:
                            etiket_ciz(cv, dd_, Xg, Y, dx, dy, (0, 0, W, H), bool(genel_ayar("parca_olcu")))
                    except (ValueError, IndexError, KeyError, TypeError):
                        pass
            cv.create_text(X(g["bbox"][0]), Y(g["bbox"][1]) + 16, anchor="w",
                           text=baslik, font=("Arial", 9, "bold"), fill="#3d4851")

        if self.etkilesim:
            self._sec_yenile()
            self._sec_ciz()
            self._bilgi_ozet_yaz()
            try:
                self._aks_ui_yenile()
            except Exception:
                pass

    # -------------------------------------------------------------- CSV
    def csv_kaydet(self):
        if not self.sonuc:
            return
        klasor = filedialog.askdirectory(title="CSV dosyalarının kaydedileceği klasör")
        if not klasor:
            return
        s = self.sonuc
        s["siparis"] = self.siparis_bilgisi()
        ek_dosyalar = []
        if s["siparis"]:
            ek_dosyalar.append(("cephe_siparis_bilgisi.csv", ["Alan", "Değer"], [list(r) for r in s["siparis"]]))
        if s.get("ek_malzeme"):
            ek_dosyalar.append(("cephe_ek_malzeme.csv", ["Kod", "Tanım", "Birim", "Miktar", "kg/birim", "Toplam kg", "Not"],
                                [[e["kod"], e["ad"], e["birim"], f"{e['miktar']:g}",
                                  "" if not e.get("kg") else f"{e['kg']:g}",
                                  "" if not e.get("kg") else f"{e['miktar'] * e['kg']:.2f}", e.get("not", "")]
                                 for e in s["ek_malzeme"]]))
        dosyalar = (
            ("cephe_kesim_listesi.csv",
             ["Profil", "Boy (mm)", "Adet", "Toplam boy (m)", "Ağırlık (kg)"], s["kesim"]),
            ("cephe_cubuk_plani.csv",
             ["Profil", "Çubuk boyu (mm)", "Çubuk adedi", "Kesimler (mm)", "Kalan (mm)"], s["cubuk"]),
            ("cephe_cam_listesi.csv", ["Tip", "Ölçü (mm)", "Adet", "m²"], s["cam"]),
            ("cephe_malzeme_listesi.csv", ["Grup"] + [k[0] for k in MAL_KOLON],
             [(b,) + tuple(r) for b, rows_, top in malzeme_listesi(s) for r in list(rows_) + ([top] if any(top) else [])]),
            ("cephe_parca_listesi.csv",
             ["Parça", "Hat", "Sınıf", "Adet/hat", "Toplam (m)", "kg/m", "kg"], s["parca"]),
            ("cephe_surekli_parca_kesim.csv",
             ["Parça", "Boy (mm)", "Adet", "Toplam boy (m)", "Ağırlık (kg)"], s.get("parca_kesim") or []),
        ) + tuple(ek_dosyalar)
        try:
            for ad, baslik, satirlar in dosyalar:
                with open(os.path.join(klasor, ad), "w", newline="",
                          encoding="utf-8-sig") as f:
                    w = csv.writer(f, delimiter=";")
                    w.writerow(baslik)
                    w.writerows(satirlar)
        except OSError as e:
            messagebox.showerror("Kaydedilemedi", str(e))
            return
        messagebox.showinfo("Kaydedildi", f"{len(dosyalar)} CSV dosyası kaydedildi:\n{klasor}")


    def _siparis_karsilastir_ac(self):
        """Sipariş dosyasını (Excel/CSV) seçtirir; metraj listesiyle kod bazında adet farkını gösterir."""
        if not self.sonuc:
            messagebox.showinfo("Siparişle karşılaştır", "Önce hesaplayın.")
            return
        yol = filedialog.askopenfilename(title="Sipariş dosyası (Excel / CSV)",
                                         filetypes=[("Excel / CSV", "*.xlsx *.xlsm *.csv *.txt"), ("Tümü", "*.*")])
        if not yol:
            return
        try:
            satirlar = siparis_dosyasi_oku(yol)
        except (OSError, ValueError, KeyError, Exception) as e:
            messagebox.showerror("Okunamadı", f"{type(e).__name__}: {e}")
            return
        satirlar = [r for r in satirlar if any(str(x).strip() for x in r)]
        if len(satirlar) < 2:
            messagebox.showinfo("Siparişle karşılaştır", "Dosyada başlık ve en az bir satır olmalı.")
            return
        prog = []
        for _bsl, rows, _top in malzeme_listesi(self.sonuc):
            for r in rows:
                prog.append((r[0], r[1], r[2], r[3]))
        baslik = [str(x).strip() for x in satirlar[0]]
        n_kol = max(len(r) for r in satirlar)
        baslik += [""] * (n_kol - len(baslik))
        sec = [f"{i + 1}: {b or '(boş)'}" for i, b in enumerate(baslik)]

        def tahmin(anahtarlar, vars_):
            for i, b in enumerate(baslik):
                if any(a in _norm(b) for a in anahtarlar):
                    return i
            return vars_
        pen = tk.Toplevel(self)
        pen.title("Siparişle karşılaştır — " + os.path.basename(yol))
        pen.transient(self)
        try:
            pen.geometry("860x560")
        except tk.TclError:
            pass
        fr = ttk.Frame(pen, padding=12)
        fr.pack(fill="both", expand=True)
        ust = ttk.Frame(fr)
        ust.pack(fill="x")
        ttk.Label(ust, text="Kod sütunu:").pack(side="left")
        kv = tk.StringVar(value=sec[min(tahmin(("kod", "parca", "profil", "malzeme", "urun", "kalem"), 0), n_kol - 1)])
        ttk.Combobox(ust, textvariable=kv, values=sec, state="readonly", width=22).pack(side="left", padx=(4, 14))
        ttk.Label(ust, text="Adet sütunu:").pack(side="left")
        av = tk.StringVar(value=sec[min(tahmin(("adet", "miktar", "qty", "siparis", "cubuk"), 1), n_kol - 1)])
        ttk.Combobox(ust, textvariable=av, values=sec, state="readonly", width=22).pack(side="left", padx=(4, 14))
        ozet = ttk.Label(fr, text="", font=("Segoe UI", 10, "bold"))
        ozet.pack(anchor="w", pady=(8, 4))
        kol = ("Kod / kalem", "Programda", "Siparişte", "Fark", "Durum")
        gv = ttk.Frame(fr)
        gv.pack(fill="both", expand=True)
        tr = ttk.Treeview(gv, columns=kol, show="headings")
        for k_, w_ in zip(kol, (300, 110, 110, 90, 150)):
            tr.heading(k_, text=k_)
            tr.column(k_, width=w_, anchor="w")
        sb = ttk.Scrollbar(gv, orient="vertical", command=tr.yview)
        tr.configure(yscrollcommand=sb.set)
        tr.pack(side="left", fill="both", expand=True)
        sb.pack(side="left", fill="y")
        tr.tag_configure("eksik", foreground="#d0453b")
        tr.tag_configure("fazla", foreground="#d9822b")
        tr.tag_configure("yok", foreground="#7a858e")
        tr.tag_configure("eşit", foreground="#2e7d32")
        durum = {"sonuc": []}

        def g(v):
            return "" if v is None else (f"{v:g}")

        def calistir(_e=None):
            kc, ac = int(kv.get().split(":")[0]) - 1, int(av.get().split(":")[0]) - 1
            sonuc = siparis_karsilastir(prog, satirlar, kc, ac)
            durum["sonuc"] = sonuc
            tr.delete(*tr.get_children())
            say = Counter(r[4] for r in sonuc)
            for ad, pm, sm, f, d in sorted(sonuc, key=lambda r: (r[4] == "eşit", r[0])):
                tag = "eksik" if d == "eksik" else "fazla" if d == "fazla" else "eşit" if d == "eşit" else "yok"
                tr.insert("", "end", tags=(tag,), values=(ad, g(pm), g(sm), "" if f is None else f"{f:+g}", d))
            ozet.config(text=f"{say['eşit']} eşit  |  {say['eksik']} siparişte eksik  |  {say['fazla']} siparişte fazla  |  "
                             f"{say['siparişte yok']} siparişte yok  |  {say['programda yok']} programda yok")

        def kopyala():
            satir = ["\t".join(kol)] + ["\t".join(g(x) if not isinstance(x, str) else x for x in r)
                                         for r in durum["sonuc"]]
            self.clipboard_clear()
            self.clipboard_append("\n".join(satir))
        bt = ttk.Frame(fr)
        bt.pack(fill="x", pady=(8, 0))
        ttk.Button(bt, text="Karşılaştır", command=calistir).pack(side="left")
        ttk.Button(bt, text="Sonucu kopyala", command=kopyala).pack(side="left", padx=6)
        ttk.Label(bt, text="Programdaki miktar: profilde çubuk adedi, diğer kalemlerde listedeki adet / metre.",
                  foreground="#7a858e").pack(side="left", padx=8)
        ttk.Button(bt, text="Kapat", command=pen.destroy).pack(side="right")
        calistir()

    # ------------------------------------------------------------------ ölçü aracı
    def _olcu_degistir(self):
        if getattr(self, "_olcu_acik", False):
            self._olcu_kapat()
            return
        self._olcu_acik, self._olcu_ilk = True, None
        self._olcu_btn.config(text="📏 Ölç ●")
        self.cv.config(cursor="crosshair")
        self._log("Ölçü: iki noktaya tıklayın (köşelere yapışır). Esc: aracı kapat, Backspace: son ölçüyü sil, "
                  "Delete: hepsini sil.", "bilgi")
        self.cv.focus_set()

    def _olcu_kapat(self):
        self._olcu_acik, self._olcu_ilk = False, None
        try:
            self._olcu_btn.config(text="📏 Ölç")
            self.cv.config(cursor="")
        except tk.TclError:
            pass
        self.cv.delete("olcu_gez")

    def _olcu_temizle(self):
        """Ekrandaki tüm ölçüleri siler (yarım kalan ölçü dahil); Ölç aracı açıksa açık kalır."""
        n = len(self._olcular)
        self._olcular.clear()
        self._olcu_ilk = None
        try:
            self.cv.delete("olcu_gez")
        except tk.TclError:
            pass
        self.ciz()
        self._log(f"{n} ölçü temizlendi." if n else "Temizlenecek ölçü yok.", "bilgi")

    def _olcu_sil(self, hepsi=False):
        if hepsi:
            self._olcular.clear()
        elif self._olcular:
            self._olcular.pop()
        self._olcu_ilk = None
        self.ciz()

    def _olcu_nokta(self, x, y):
        """Ekran noktası -> (cephe mm koordinatı, yapışılan ekran noktası): yakındaki profil köşesine 9 px içinde yapışır."""
        gv = self.gor
        if not gv.fit:
            return None
        ox, oy, sc = gv.donustur()
        kx, ky = self._kayma("cephe")
        px, py = x - kx, y - ky
        en, en_d = None, 81.0
        for g in (self._vur.get("cephe") or []):
            if g.get("idx") is None:
                continue
            b = g["det"]["bbox"]
            x0, x1 = sorted((g["X"](b[0] + g["dx"]), g["X"](b[2] + g["dx"])))
            y0, y1 = sorted((g["Y"](b[1] + g["dy"]), g["Y"](b[3] + g["dy"])))
            if not (x0 - 12 <= px <= x1 + 12 and y0 - 12 <= py <= y1 + 12):
                continue
            for pr in g["det"]["prims"]:
                if pr[0] != "fill" or not pr[1]:
                    continue
                for lp in pr[1]:
                    for vx, vy in lp:
                        sx, sy = g["X"](vx + g["dx"]), g["Y"](vy + g["dy"])
                        d2 = (sx - px) ** 2 + (sy - py) ** 2
                        if d2 < en_d:
                            en, en_d = (sx, sy), d2
        if en:
            px, py = en
        return ((px - (ox - kx)) / sc, ((oy - ky) - py) / sc), bool(en)      # çizildiği andaki dönüşüme göre

    def _olcu_tikla(self, e):
        if not getattr(self, "_olcu_acik", False):
            return False
        r = self._olcu_nokta(e.x, e.y)
        if not r:
            return True
        p, _ys = r
        if self._olcu_ilk is None:
            self._olcu_ilk = p
        else:
            self._olcular.append((self._olcu_ilk, p))
            self._olcu_ilk = None
        self.ciz()
        return True

    def _olcu_hareket(self, e):
        return bool(getattr(self, "_olcu_acik", False))

    def _olcu_gez(self, e):
        """İlk nokta seçiliyken fareyi izleyen önizleme çizgisi."""
        if not getattr(self, "_olcu_acik", False):
            return
        cv = self.cv
        cv.delete("olcu_gez")
        r = self._olcu_nokta(e.x, e.y)
        gv = self.gor
        if not r or not gv.fit:
            return
        ox, oy, sc = gv.donustur()
        (mx, my), yap = r
        sx, sy = ox + mx * sc, oy - my * sc
        cv.create_oval(sx - 4, sy - 4, sx + 4, sy + 4, outline="#e91e63" if yap else "#9aa5ad", width=2, tags="olcu_gez")
        if self._olcu_ilk is not None:
            ax, ay = self._olcu_ilk
            cv.create_line(ox + ax * sc, oy - ay * sc, sx, sy, fill="#e91e63", dash=(4, 3), tags="olcu_gez")
            d = math.hypot(mx - ax, my - ay)
            cv.create_text(sx + 10, sy - 10, anchor="sw", fill="#e91e63", font=("Arial", 9, "bold"),
                           text=f"{d:.2f} mm", tags="olcu_gez")

    def _olcu_ciz(self):
        gv = self.gor
        if not gv.fit or not self._olcular and self._olcu_ilk is None:
            return
        ox, oy, sc = gv.donustur()
        cv = self.cv
        for (ax, ay), (bx, by) in self._olcular:
            x1, y1, x2, y2 = ox + ax * sc, oy - ay * sc, ox + bx * sc, oy - by * sc
            cv.create_line(x1, y1, x2, y2, fill="#e91e63", width=2, tags="olcu")
            cv.create_line(x1, y1, x2, y1, fill="#e91e63", dash=(3, 3), tags="olcu")
            cv.create_line(x2, y1, x2, y2, fill="#e91e63", dash=(3, 3), tags="olcu")
            for px_, py_ in ((x1, y1), (x2, y2)):
                cv.create_oval(px_ - 3, py_ - 3, px_ + 3, py_ + 3, fill="#e91e63", outline="white", tags="olcu")
            dx, dy = bx - ax, by - ay
            t = f"L {math.hypot(dx, dy):.2f}   Δx {dx:+.2f}   Δy {dy:+.2f} mm"
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            tid = cv.create_text(mx + 8, my - 8, anchor="sw", fill="#e91e63", font=("Arial", 9, "bold"), text=t, tags="olcu")
            try:
                bb = cv.bbox(tid)
                if bb:
                    r_ = cv.create_rectangle(bb[0] - 2, bb[1] - 1, bb[2] + 2, bb[3] + 1, fill="white", outline="#e91e63",
                                             tags="olcu")
                    cv.tag_lower(r_, tid)
            except tk.TclError:
                pass
        if self._olcu_ilk is not None:
            ax, ay = self._olcu_ilk
            cv.create_oval(ox + ax * sc - 4, oy - ay * sc - 4, ox + ax * sc + 4, oy - ay * sc + 4, outline="#e91e63",
                           width=2, tags="olcu")

    def detay_kitapcigi_kaydet(self):
        """Her farklı aks/hat kesitini ayrı sayfada gösteren PDF."""
        if not self.sonuc:
            return
        yol = filedialog.asksaveasfilename(
            title="Detay kitapçığı", defaultextension=".pdf", initialfile="cephe_detay_kitapcigi.pdf",
            filetypes=[("PDF", "*.pdf")])
        if not yol:
            return
        self.sonuc["siparis"] = self.siparis_bilgisi()
        bilgi = {"proje": self.v["proje_adi"].get().strip(),
                 "sistem": self.v["sistem_adi"].get().strip(),
                 "tarih": self.v["sip_tarih"].get().strip() or datetime.date.today().strftime("%d.%m.%Y")}
        try:
            detay_kitapcigi_olustur(self.sonuc, bilgi).kaydet(yol)
        except Exception as e:
            messagebox.showerror("PDF oluşturulamadı", f"{type(e).__name__}: {e}")
            return
        if genel_ayar("pdf_ac") and dosya_ac(yol):
            return
        messagebox.showinfo("Kaydedildi", f"Detay kitapçığı kaydedildi:\n{yol}")

    def pdf_kaydet(self):
        if not self.sonuc:
            return
        yol = filedialog.asksaveasfilename(
            title="PDF rapor", defaultextension=".pdf", initialfile="cephe_rapor.pdf",
            filetypes=[("PDF", "*.pdf")])
        if not yol:
            return
        self.sonuc["siparis"] = self.siparis_bilgisi()
        bilgi = {"proje": self.v["proje_adi"].get().strip(),
                 "sistem": self.v["sistem_adi"].get().strip(),
                 "tarih": self.v["sip_tarih"].get().strip() or datetime.date.today().strftime("%d.%m.%Y")}
        try:
            rapor_olustur(self.sonuc, bilgi).kaydet(yol)
        except Exception as e:
            messagebox.showerror("PDF oluşturulamadı", f"{type(e).__name__}: {e}")
            return
        if genel_ayar("pdf_ac") and dosya_ac(yol):
            return                                  # kaydedilen PDF varsayılan okuyucuda açıldı
        messagebox.showinfo("Kaydedildi", f"PDF rapor kaydedildi:\n{yol}")

    def dxf_kaydet(self):
        if not self.sonuc:
            return
        yol = filedialog.asksaveasfilename(
            title="DXF olarak kaydet", defaultextension=".dxf",
            initialfile="cephe.dxf", filetypes=[("DXF çizim", "*.dxf")])
        if not yol:
            return
        self.sonuc["siparis"] = self.siparis_bilgisi()
        try:
            dxf_yaz(self.sonuc, yol)
        except OSError as e:
            messagebox.showerror("Kaydedilemedi", str(e))
            return
        messagebox.showinfo("Kaydedildi", f"DXF kaydedildi (birim: mm):\n{yol}")


def _log_sarmala():
    """Kullanıcı işlemlerini (ekleme/silme/değiştirme/kaydetme) işlem günlüğüne yazar (işlem sonrası)."""
    et = {"_hucre_tip": "Cam hücresi tipi değiştirildi", "_zone_tip": "Bölge tipi değiştirildi",
          "_zone_bol": "Bölgeye ek yatay eklendi", "_zone_birlestir": "Ek yatay kaldırıldı (bölgeler birleşti)",
          "_profil_yok": "Profil parçası boş yapıldı / geri getirildi", "_segler_tip": "Profil tipi değiştirildi",
          "_sel_hucre_tip": "Seçili hücrelerin tipi değiştirildi", "_sel_bos": "Seçili profiller boş yapıldı / geri getirildi",
          "_parca_cikar_btn": "Parça çıkarma (sağ panel)", "_yapi_yaz": "Aks / kat yapısı değiştirildi",
          "proje_kaydet": "Proje kaydet", "proje_ac": "Proje aç", "csv_kaydet": "CSV kaydet", "pdf_kaydet": "PDF rapor kaydet",
          "dxf_kaydet": "DXF kaydet", "katalog_yukle": "Katalog yüklendi", "_cephe_aynala": "Cephe aynalandı",
          "_kesit_aynala": "Kesit aynalandı", "_tema_degistir": "Tema değiştirildi", "_sec_baslat": "Çoklu seçim başlatıldı",
          "_parca_degistir": "Parça değiştirildi (sağ panel)", "_parca_orijinal": "Parça orijinaline döndürüldü",
          "_parca_yon": "Parça yönü değiştirildi"}

    def sar(ad, etiket):
        orijinal = getattr(Uygulama, ad)

        def w(self, *a, **k):
            r = orijinal(self, *a, **k)
            try:
                self._log(etiket + (f" ({', '.join(str(x) for x in a if not isinstance(x, (dict, list, set)))[:60]})"
                                    if a and ad in ("_hucre_tip", "_zone_tip", "_zone_bol", "_zone_birlestir",
                                                    "_parca_yon") else ""))
            except Exception:
                pass
            return r
        w.__name__ = orijinal.__name__
        setattr(Uygulama, ad, w)
    for ad, e_ in et.items():
        if hasattr(Uygulama, ad):
            sar(ad, e_)


_log_sarmala()


def _tam_ekran(pencere):
    """Pencereyi ekranı kaplayacak şekilde büyütür (Windows: zoomed; Linux: -zoomed)."""
    try:
        pencere.state("zoomed")
    except tk.TclError:
        try:
            pencere.attributes("-zoomed", True)
        except tk.TclError:
            w, h = pencere.winfo_screenwidth(), pencere.winfo_screenheight()
            pencere.geometry(f"{w}x{h}+0+0")


class _Sayfa:
    """Uygulama.ciz / ciz_kesit'i PDF tuvaline çizdirmek için hafif vekil nesne."""
    etkilesim = False
    _detay_ya_da_kesit = Uygulama._detay_ya_da_kesit

    def __init__(self, tuval, s):
        self.cv = self.cv_kesit = tuval
        self.sonuc = s
        self.kesit = s.get("kesit") or {}
        self.detay = s.get("detay") or {}
        self.gor = self.gor_k = _SabitGorunum()
        self.yatay_tipleri = list(s.get("ytipler") or YATAY_TIP_VARSAYILAN)
        self.dikey_tipleri = list(s.get("dtipler") or YATAY_TIP_VARSAYILAN)
        self._sec = set()
        p_ = s.get("p") or {}
        self.model = {"yalanci": set(s.get("yalanci") or ()), "dik_gecis": set(p_.get("dik_gecis") or ()),
                      "dik_orta": set(p_.get("dik_orta") or ())}

    def _cv_tema(self, cv):
        return cv


if __name__ == "__main__":
    Uygulama().mainloop()
