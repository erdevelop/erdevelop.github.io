"""Sahte dil modeli: OpenAI uyumlu, kurallı (her seferinde aynı) yanıt veren küçük bir sunucu.
n8n akışlarını gerçek bir model ve API anahtarı olmadan denemek ve otomatik test etmek içindir.
Kurallar basittir: metindeki malzeme kodunu, tarihleri ve sayıları bulur; sınıflandırmada kategori
açıklamalarıyla en çok ortak kelimeyi taşıyanı seçer; araç listesi varsa ilk aracı koda göre çağırır.
Kullanım: python3 sahte_model.py [port]   (varsayılan 8899)
n8n'de OpenAI kimlik bilgisi: API Key herhangi bir metin, Base URL http://127.0.0.1:8899/v1"""
import json, re, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer

KOD = re.compile(r"\b[A-Z]{3}-\d{2}\b")

TARIH = re.compile(r"\b(\d{2})\.(\d{2})\.(\d{4})\b")


def kokler(metin):
    return {w[:5] for w in re.findall(r"\w+", metin.lower()) if len(w) >= 4}


def yapilandir(sema, metin):
    ozellik = sema.get("properties", {})
    if ozellik and all(v.get("type") == "boolean" for v in ozellik.values()):
        k = kokler(metin)
        puan = {ad: len(kokler(v.get("description", "").split("(description:")[-1]) & k) for ad, v in ozellik.items() if ad != "fallback"}
        en = max(puan, key=puan.get) if puan else None
        sonuc = {ad: False for ad in ozellik}
        if en and puan[en] > 0:
            sonuc[en] = True
        elif "fallback" in sonuc:
            sonuc["fallback"] = True
        return sonuc
    sonuc = {}
    temiz = TARIH.sub(" ", KOD.sub(" ", metin))
    for ad, v in ozellik.items():
        t = v.get("type")
        if "kod" in ad.lower():
            m = KOD.search(metin); sonuc[ad] = m.group(0) if m else None
        elif "tarih" in ad.lower() or v.get("format") == "date":
            ts = TARIH.findall(metin); sonuc[ad] = "{2}-{1}-{0}".format(*ts[-1]) if ts else None
        elif t in ("number", "integer"):
            m = re.search(r"\b(\d+(?:[.,]\d+)?)\s*(?:m2|m²|adet|TL|kartuş|m\b)", temiz)
            m = m or re.search(r"\b(\d+(?:[.,]\d+)?)\b", temiz)
            sonuc[ad] = float(m.group(1).replace(",", ".")) if m else None
            if sonuc[ad] is not None and sonuc[ad] == int(sonuc[ad]):
                sonuc[ad] = int(sonuc[ad])
        elif t == "boolean":
            sonuc[ad] = bool(kokler(v.get("description", "")) & kokler(metin))
        else:
            sonuc[ad] = metin[:60]
    return {ad: d for ad, d in sonuc.items() if d is not None}     # bilinmeyen alanı yazma


def yanit(govde):
    mesajlar = govde.get("messages", [])
    araclar = govde.get("tools") or []
    son = mesajlar[-1] if mesajlar else {}
    metin = lambda m: m["content"] if isinstance(m.get("content"), str) else " ".join(p.get("text", "") for p in (m.get("content") or []) if isinstance(p, dict))
    if son.get("role") == "tool":
        return {"role": "assistant", "content": "Sonuç: " + metin(son)}
    kullanici = next((metin(m) for m in reversed(mesajlar) if m.get("role") == "user"), "")
    if araclar:
        k = KOD.search(kullanici)
        if k:
            ad = araclar[0]["function"]["name"]
            return {"role": "assistant", "content": None, "tool_calls": [{"id": "call_1", "type": "function",
                    "function": {"name": ad, "arguments": json.dumps({"kod": k.group(0)})}}]}
        return {"role": "assistant", "content": "Hangi malzeme kodunu soruyorsunuz?"}
    tum = " ".join(metin(m) for m in mesajlar)
    sema = re.search(r"```json\s*(\{.*?\})\s*```", tum, re.S)
    if sema:
        try:
            return {"role": "assistant", "content": "```json\n" + json.dumps(yapilandir(json.loads(sema.group(1)), kullanici), ensure_ascii=False) + "\n```"}
        except Exception as e:
            open("sahte_model.log", "a", encoding="utf-8").write("ŞEMA HATASI " + repr(e) + "\n")
    if "JSON" in tum or "json" in tum:
        return {"role": "assistant", "content": json.dumps({"ozet": kullanici[:40]}, ensure_ascii=False)}
    return {"role": "assistant", "content": "Özet: " + kullanici[:60]}

def responses(govde):
    mesajlar = []
    for o in govde.get("input", []):
        if o.get("type") == "function_call_output":
            mesajlar.append({"role": "tool", "content": o.get("output") if isinstance(o.get("output"), str) else json.dumps(o.get("output"), ensure_ascii=False)})
        elif o.get("type") == "function_call":
            mesajlar.append({"role": "assistant", "content": ""})
        else:
            c = o.get("content")
            if isinstance(c, list):
                c = " ".join(p.get("text", "") for p in c if isinstance(p, dict))
            mesajlar.append({"role": o.get("role", "user"), "content": c or ""})
    if govde.get("instructions"):
        mesajlar.insert(0, {"role": "system", "content": govde["instructions"]})
    araclar = [{"function": {"name": t.get("name")}} for t in govde.get("tools") or [] if t.get("type") == "function"]
    fmt = (govde.get("text") or {}).get("format") or {}
    if fmt.get("type") == "json_schema" and not araclar:
        mesajlar.append({"role": "user", "content": "JSON"})
    m = yanit({"messages": mesajlar, "tools": araclar})
    if m.get("tool_calls"):
        tc = m["tool_calls"][0]
        cikti = [{"type": "function_call", "id": "fc_1", "call_id": tc["id"], "name": tc["function"]["name"], "arguments": tc["function"]["arguments"], "status": "completed"}]
    else:
        cikti = [{"type": "message", "id": "msg_1", "role": "assistant", "status": "completed",
                  "content": [{"type": "output_text", "text": m["content"], "annotations": []}]}]
    return {"id": "resp_1", "object": "response", "created_at": int(time.time()), "status": "completed", "model": govde.get("model", "sahte"),
            "output": cikti, "usage": {"input_tokens": 10, "output_tokens": 5, "total_tokens": 15}}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        self._yaz({"object": "list", "data": [{"id": "sahte-model", "object": "model"}]})
    def do_POST(self):
        govde = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        open("sahte_model.log", "a", encoding="utf-8").write(self.path + " " + json.dumps(govde, ensure_ascii=False)[:3000] + "\n")
        if self.path.endswith("/responses"):
            return self._yaz(responses(govde))
        m = yanit(govde)
        self._yaz({"id": "x", "object": "chat.completion", "created": int(time.time()), "model": govde.get("model", "sahte"),
                   "choices": [{"index": 0, "message": m, "finish_reason": "tool_calls" if m.get("tool_calls") else "stop"}],
                   "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}})
    def _yaz(self, d):
        b = json.dumps(d, ensure_ascii=False).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8899), H).serve_forever()
