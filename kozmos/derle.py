#!/usr/bin/env python3
"""Kozmos'un JavaScript'i kozmos/kaynak/ içindeki parçalarda durur; oyun yine tek dosyadır (kozmos.html).

  python3 kozmos/derle.py            parçaları birleştirip kozmos.html içindeki ana betiği günceller
  python3 kozmos/derle.py --kontrol  parçalar ile kozmos.html aynı mı? (aynı değilse 1 ile çıkar; testler bunu çalıştırır)
  python3 kozmos/derle.py --ayir     kozmos.html içindeki betiği yeniden parçalara böler (kozmos.html doğrudan düzenlendiyse)
  python3 kozmos/derle.py --satir N  kozmos.html'deki N. satır hangi parçanın kaçıncı satırı? (hata raporlarını okumak için)

Çıktı, parçaların sırayla uç uca eklenmesidir; başka hiçbir dönüşüm yapılmaz.
"""
import pathlib, re, sys

KOK = pathlib.Path(__file__).resolve().parent.parent
SAYFA = KOK / 'kozmos.html'
KAYNAK = KOK / 'kozmos' / 'kaynak'
# Her parça, betikte bu başlık satırıyla başlar (ilk parça betiğin başından başlar). --ayir bu sınırları kullanır.
PARCALAR = [
    ('01-cekirdek.js', None),
    ('02-ses-durum.js', 'ses'),
    ('03-giris-guncelle.js', 'giriş'),
    ('04-cizim.js', 'çizim'),
    ('05-ucus-liman.js', 'otopilot'),
    ('06-tehlike-techizat.js', 'tehlike: hasar, korsanlar, olaylar'),
    ('07-yuzey-kodeks.js', 'yüzey keşfi: araç, maden, yaşam, gayzer'),
    ('08-savas.js', 'ana silahlar'),
    ('09-evren-olaylari.js', 'pilot kartı'),
    ('10-istasyon-koloni.js', 'kendi istasyonun'),
    ('11-pencereler-topluluk.js', 'ambar ve arşiv penceresi'),
    ('12-dunya.js', 'dinamik olaylar: süpernova, solucan deliği, istila'),
    ('13-ek-cizim-kokpit.js', 'kuyruklu yıldızlar ve nebulalar'),
    ('14-hikaye-meta.js', 'Umut-7 hikâyesi'),
    ('15-gelistirici-canli.js', 'geliştirici konsolu'),
    ('16-rehber-ag.js', 'kaptan rehberi'),
    ('16b-derinlik.js', 'derinlik: kontratlar, albüm, defter, gazete, zorluk'),
    ('17-harita-menu-dongu.js', 'liman sahnesi (iniş)'),
]
DESEN = re.compile(r'<script>\n([\s\S]*?)</script>')
baslik = lambda ad: '/* ================= %s ================= */' % ad


def betik(sayfa):
    m = DESEN.search(sayfa)
    if not m:
        sys.exit('kozmos.html içinde ana betik bulunamadı')
    return m


def birlestir():
    eksik = [d for d, _ in PARCALAR if not (KAYNAK / d).exists()]
    if eksik:
        sys.exit('Eksik parça: ' + ', '.join(eksik))
    fazla = sorted(p.name for p in KAYNAK.glob('*.js') if p.name not in {d for d, _ in PARCALAR})
    if fazla:
        sys.exit('PARCALAR listesinde olmayan dosya: ' + ', '.join(fazla) + ' (derle.py içindeki listeye ekle)')
    return ''.join((KAYNAK / d).read_text(encoding='utf-8') for d, _ in PARCALAR)


def ayir(govde):
    satirlar = govde.split('\n')
    sinir = []
    for dosya, ad in PARCALAR:
        if ad is None:
            sinir.append(0)
            continue
        yer = [i for i, s in enumerate(satirlar) if s == baslik(ad)]
        if len(yer) != 1:
            sys.exit('"%s" başlığı betikte %d kez geçiyor; tam bir kez olmalı' % (ad, len(yer)))
        sinir.append(yer[0])
    if sinir != sorted(sinir):
        sys.exit('Başlıkların sırası PARCALAR listesiyle uyuşmuyor')
    sinir.append(len(satirlar))
    KAYNAK.mkdir(parents=True, exist_ok=True)
    for (dosya, _), a, b in zip(PARCALAR, sinir, sinir[1:]):
        parca = '\n'.join(satirlar[a:b]) + ('\n' if b < len(satirlar) else '')
        (KAYNAK / dosya).write_text(parca, encoding='utf-8')
        print('%-28s %5d satır' % (dosya, b - a))


def main():
    sayfa = SAYFA.read_text(encoding='utf-8')
    m = betik(sayfa)
    if '--ayir' in sys.argv:
        ayir(m.group(1))
        if birlestir() != m.group(1):
            sys.exit('Bölme sonrası parçalar betikle aynı değil (olmamalıydı)')
        return
    if '--satir' in sys.argv:
        n = int(sys.argv[sys.argv.index('--satir') + 1])
        ilk = sayfa[:m.start(1)].count('\n') + 1
        k = n - ilk
        for dosya, _ in PARCALAR:
            uz = (KAYNAK / dosya).read_text(encoding='utf-8').count('\n')
            if k < uz:
                print('kozmos/kaynak/%s satır %d' % (dosya, k + 1))
                return
            k -= uz
        print('Bu satır ana betiğin dışında')
        return
    govde = birlestir()
    if '--kontrol' in sys.argv:
        if govde != m.group(1):
            a, b = govde.split('\n'), m.group(1).split('\n')
            i = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
            sys.exit('kozmos/kaynak ile kozmos.html uyuşmuyor (betiğin %d. satırı civarı).\n'
                     'Parçaları düzenlediysen:        python3 kozmos/derle.py\n'
                     'kozmos.html\'i düzenlediysen:    python3 kozmos/derle.py --ayir' % (i + 1))
        print('kozmos/kaynak ile kozmos.html aynı')
        return
    if govde == m.group(1):
        print('Değişiklik yok')
        return
    SAYFA.write_text(sayfa[:m.start(1)] + govde + sayfa[m.end(1):], encoding='utf-8')
    print('kozmos.html güncellendi (%d satır betik)' % govde.count('\n'))


if __name__ == '__main__':
    main()
