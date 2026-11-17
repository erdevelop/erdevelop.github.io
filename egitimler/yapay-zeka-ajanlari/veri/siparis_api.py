"""Küçük bir sipariş servisi (ERP ya da tablo yerine). Veriyi siparis_db.json dosyasında tutar.
GET  /siparisler          -> bütün siparişler
POST /guncelle {kod, yeni_tarih} -> teslim tarihini günceller, gecikmeyi hesaplar
Kullanım: python3 siparis_api.py [port]   (varsayılan 8000)"""
import json, sys
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer

DB = "siparis_db.json"
BASLANGIC = [
    {"kod": "CAM-01", "proje": "P-101", "adet": 120, "teslim": "2026-11-17", "ihtiyac": "2026-11-20"},
    {"kod": "SLK-01", "proje": "P-101", "adet": 60, "teslim": "2026-11-05", "ihtiyac": "2026-11-15"},
    {"kod": "ANK-01", "proje": "P-101", "adet": 96, "teslim": "2026-11-28", "ihtiyac": "2026-12-01"},
    {"kod": "PRF-01", "proje": "P-102", "adet": 310, "teslim": "2026-11-19", "ihtiyac": "2026-11-21"},
]


def oku():
    try:
        return json.load(open(DB, encoding="utf-8"))
    except FileNotFoundError:
        return [dict(s) for s in BASLANGIC]


class Servis(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _yanit(self, veri, kod=200):
        b = json.dumps(veri, ensure_ascii=False).encode()
        self.send_response(kod)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        self._yanit(oku())

    def do_POST(self):
        istek = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        siparisler = oku()
        s = next((x for x in siparisler if x["kod"] == istek.get("kod")), None)
        if s is None:
            return self._yanit({"hata": f"{istek.get('kod')} bulunamadı"})
        eski = s["teslim"]
        s["teslim"] = istek["yeni_tarih"]
        json.dump(siparisler, open(DB, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        gecikme = (date.fromisoformat(s["teslim"]) - date.fromisoformat(s["ihtiyac"])).days
        self._yanit({"kod": s["kod"], "proje": s["proje"], "eski_teslim": eski, "yeni_teslim": s["teslim"],
                     "ihtiyac": s["ihtiyac"], "gecikme_gun": max(0, gecikme)})


HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8000), Servis).serve_forever()
