"""Derin Mavi gerçek görseller: derin-mavi/ham/ içindeki fotoğrafları oyuna hazırlar.
Balık fotoğrafı  : <tür>.jpg  (palyaco, cerrah, melek, orkinos, ucan, yelken, fener, balta, kurdele, buz, yavru)
                   Balık SAĞA bakmalı; sola bakıyorsa adın sonuna -sol ekle (palyaco-sol.jpg).
                   Arka planı otomatik silinir, kırpılır → derin-mavi/gorsel/<tür>.webp
Arka plan        : arka-resif.jpg, arka-acik.jpg, arka-derin.jpg → derin-mavi/gorsel/arka-<alan>.jpg
Sonunda derin-mavi/gorsel.json yeniden yazılır; oyun yalnızca orada listelenenleri yükler."""
import json, sys
from pathlib import Path
from PIL import Image, ImageOps

KOK = Path(__file__).resolve().parents[2] / 'derin-mavi'
HAM, CIKTI = KOK / 'ham', KOK / 'gorsel'
TURLER = ['palyaco', 'cerrah', 'melek', 'orkinos', 'ucan', 'yelken', 'fener', 'balta', 'kurdele', 'buz', 'yavru']
ALANLAR = ['resif', 'acik', 'derin']
UZANTI = {'.jpg', '.jpeg', '.png', '.webp'}

def balik(yol, tur, cevir, oturum):
    from rembg import remove
    im = ImageOps.exif_transpose(Image.open(yol)).convert('RGB')
    im.thumbnail((1400, 1400))
    kes = remove(im, session=oturum, post_process_mask=True)
    kutu = kes.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    if not kutu: print('  ! balık bulunamadı:', yol.name); return False
    kes = kes.crop(kutu)
    if cevir: kes = ImageOps.mirror(kes)
    kes.thumbnail((720, 720))
    kes.save(CIKTI / f'{tur}.webp', 'WEBP', quality=88, method=6)
    print(f'  ✓ {yol.name} → gorsel/{tur}.webp {kes.size}'); return True

def arka(yol, alan):
    im = ImageOps.exif_transpose(Image.open(yol)).convert('RGB')
    im.thumbnail((1920, 1920))
    im.save(CIKTI / f'arka-{alan}.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
    print(f'  ✓ {yol.name} → gorsel/arka-{alan}.jpg {im.size}')

def main():
    CIKTI.mkdir(parents=True, exist_ok=True); oturum = None
    for yol in sorted(HAM.iterdir()) if HAM.exists() else []:
        if yol.suffix.lower() not in UZANTI: continue
        ad = yol.stem.lower(); cevir = ad.endswith('-sol'); ad = ad[:-4] if cevir else ad
        if ad.startswith('arka-') and ad[5:] in ALANLAR: arka(yol, ad[5:])
        elif ad in TURLER:
            if oturum is None:
                from rembg import new_session; oturum = new_session('u2net')
            balik(yol, ad, cevir, oturum)
        else: print('  ? tanınmayan ad, atlandı:', yol.name)
    liste = {'balik': {}, 'arka': {}}
    for f in sorted(CIKTI.iterdir()):
        if f.suffix == '.webp' and f.stem in TURLER:
            with Image.open(f) as im: liste['balik'][f.stem] = {'d': f.name, 'en': im.width, 'boy': im.height}
        elif f.name.startswith('arka-') and f.suffix == '.jpg': liste['arka'][f.stem[5:]] = f.name
    (KOK / 'gorsel.json').write_text(json.dumps(liste, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('gorsel.json:', liste)

if __name__ == '__main__': sys.exit(main())
