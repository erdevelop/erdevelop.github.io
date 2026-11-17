"""Bir n8n iş akışı JSON dosyasını komut satırından bir kez çalıştırır, düğümlerin çıktısını yazdırır.
Kullanım: python3 n8n_calistir.py akis.json [düğüm adı ...]"""
import hashlib, json, os, subprocess, sys

yol = sys.argv[1]
akis = json.load(open(yol, encoding="utf-8"))
akis["id"] = akis.get("id") or hashlib.md5(yol.encode()).hexdigest()[:16]
akis["active"] = False
gecici = yol + ".ice.json"
json.dump(akis, open(gecici, "w", encoding="utf-8"))

ortam = dict(os.environ, N8N_DIAGNOSTICS_ENABLED="false", N8N_RUNNERS_ENABLED="false")
subprocess.run(["n8n", "import:workflow", f"--input={gecici}"], env=ortam, capture_output=True, check=True)
r = subprocess.run(["n8n", "execute", f"--id={akis['id']}", "--rawOutput"], env=ortam, capture_output=True, text=True)
os.remove(gecici)
sonuc, _ = json.JSONDecoder().raw_decode(r.stdout[r.stdout.find("{"):])
veri = sonuc["data"]["resultData"]
if veri.get("error"):
    sys.exit("HATA: " + veri["error"].get("message", ""))
dugumler = sys.argv[2:] or [veri["lastNodeExecuted"]]
for dugum in dugumler:
    if len(dugumler) > 1:
        print(f"== {dugum}")
    calismalar = veri["runData"].get(dugum, [])
    if not calismalar:
        print("(çalışmadı)")
    elif "main" in calismalar[-1]["data"]:      # normal düğüm: son çalışmanın çıkışları
        cikislar = calismalar[-1]["data"]["main"]
        for no, cikis in enumerate(cikislar):
            for oge in cikis or []:
                print((f"[{no}] " if len(cikislar) > 1 else "") + json.dumps(oge["json"], ensure_ascii=False))
    else:                                       # araç, model gibi alt düğüm: her çağrı
        for c in calismalar:
            for cikis in next(iter(c["data"].values())):
                for oge in cikis or []:
                    print(json.dumps(oge["json"], ensure_ascii=False))
