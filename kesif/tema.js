/* erdevelop · keşif sayfaları ortak yardımcıları */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (n, d = 0) => n == null || !isFinite(n) ? '–' : Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
const store = { get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
  json(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const TM = {
  mode: store.get('erdevelop-mode', 'dark'), fns: [],
  apply() { document.documentElement.dataset.mode = TM.mode; const b = $('modeBtn'); if (b) b.textContent = TM.mode === 'dark' ? 'LIGHT' : 'DARK'; TM.fns.forEach(f => f(TM.mode)); },
  onMode(f) { TM.fns.push(f); },
  css: k => getComputedStyle(document.documentElement).getPropertyValue(k).trim(),
  toast(m, ms = 2400) { let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(TM._t); TM._t = setTimeout(() => t.classList.remove('on'), ms); },
  /* zaman aşımlı JSON isteği; hata mesajı Türkçe */
  async json(url, opt = {}, ms = 15000) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, { ...opt, signal: c.signal }); if (r.status === 429) throw new Error('Servis çok fazla istek aldı, biraz bekleyip yeniden dene.'); if (!r.ok) throw new Error('Servis yanıt vermedi (' + r.status + ').'); return await r.json(); }
    catch (e) { if (e.name === 'AbortError') throw new Error('Servis zamanında yanıt vermedi.'); if (e instanceof TypeError) throw new Error('Servise ulaşılamadı. İnternet bağlantını kontrol et.'); throw e; }
    finally { clearTimeout(t); }
  },
  /* Leaflet haritası, temaya göre açık/koyu altlık */
  map(el, opt = {}) {
    const m = L.map(el, { zoomControl: true, attributionControl: true, worldCopyJump: true, ...opt });
    const url = mode => `https://{s}.basemaps.cartocdn.com/${mode === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`;
    const tl = L.tileLayer(url(TM.mode), { maxZoom: 19, subdomains: 'abcd', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(m);
    TM.onMode(md => tl.setUrl(url(md)));
    return m;
  },
  ago(t) { const s = (Date.now() - t) / 1000; if (s < 60) return 'az önce'; if (s < 3600) return Math.floor(s / 60) + ' dk önce'; if (s < 86400) return Math.floor(s / 3600) + ' sa önce'; return Math.floor(s / 86400) + ' gün önce'; },
  download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
};
TM.apply();
document.addEventListener('DOMContentLoaded', () => { TM.apply(); const b = $('modeBtn'); if (b) b.addEventListener('click', () => { TM.mode = TM.mode === 'dark' ? 'light' : 'dark'; store.set('erdevelop-mode', TM.mode); TM.apply(); }); });
