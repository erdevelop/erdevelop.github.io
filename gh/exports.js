/* dışa aktarma biçimleri */
'use strict';
/* ================= v5 exports ================= */
const LIBS = {
  rhino: 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js',
  gltf: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js'
};
const libP = {};
function loadScript(src) { return libP[src] || (libP[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete libP[src]; no(new Error('Kütüphane yüklenemedi (internet bağlantısı?)')); }; document.head.appendChild(s); })); }
let RH = null;
async function rhinoLib() { if (RH) return RH; await loadScript(LIBS.rhino); RH = await window.rhino3dm(); return RH; }

/* zip (store) with optional data alignment (USDZ needs 64) */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files, align = 0, type = 'application/zip') {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  for (const f of files) {
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, nm = enc.encode(f.name), crc = crc32(data);
    let ex = new Uint8Array(0);
    if (align) { let pad = (align - ((off + 30 + nm.length + 4) % align)) % align; ex = new Uint8Array(4 + pad); const dv = new DataView(ex.buffer); dv.setUint16(0, 12345, true); dv.setUint16(2, pad, true); }
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, ex.length, true);
    parts.push(new Uint8Array(h.buffer), nm, ex, data); cen.push({ nm, crc, size: data.length, off, ex }); off += 30 + nm.length + ex.length + data.length;
  }
  const cs = off;
  for (const c of cen) { const h = new DataView(new ArrayBuffer(46)); h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(14, 0x21, true); h.setUint32(16, c.crc, true); h.setUint32(20, c.size, true); h.setUint32(24, c.size, true); h.setUint16(28, c.nm.length, true); h.setUint32(42, c.off, true); parts.push(new Uint8Array(h.buffer), c.nm); off += 46 + c.nm.length; }
  const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, cen.length, true); e.setUint16(10, cen.length, true); e.setUint32(12, off - cs, true); e.setUint32(16, cs, true); parts.push(new Uint8Array(e.buffer));
  return new Blob(parts, { type });
}
const xesc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const ff = (v, d = 6) => { let s = (+v).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s === '-0' || s === '' ? '0' : s; };
function triMesh(g) { // -> {v:[[x,y,z]], t:[[a,b,c]]} with shared vertices
  const v = [], t = [], m = new Map(), id = p => { const k = p.map(x => x.toFixed(7)).join(','); let i = m.get(k); if (i === undefined) { i = v.length; v.push(p); m.set(k, i); } return i; };
  for (const tr of triangles(g)) { const a = id(tr[0]), b = id(tr[1]), c = id(tr[2]); if (a !== b && b !== c && a !== c) t.push([a, b, c]); }
  return { v, t };
}
function geoItems() { const it = collectGeo(); if (!it.length) toast('Dışa aktarılacak görünür geometri yok'); return it; }
const hexRGB = h => hex2rgb(h || '#9e2a2a');

/* ---- 3DM ---- */
async function export3dm() {
  const items = geoItems(); if (!items.length) return; toast('Rhino kütüphanesi yükleniyor…');
  let r; try { r = await rhinoLib(); } catch (e) { toast(e.message); return; }
  const f = new r.File3dm(); f.settings().modelUnitSystem = r.UnitSystem.Meters; const layers = new Map(); let n = 0;
  const layerOf = (name, col) => { if (layers.has(name)) return layers.get(name); const L = new r.Layer(); L.name = name; const c = hexRGB(col); L.color = { r: c[0], g: c[1], b: c[2], a: 255 }; const i = f.layers().add(L); layers.set(name, i); return i; };
  for (const { g, layer, col, name } of items) {
    const at = new r.ObjectAttributes(); at.layerIndex = layerOf(layer, col); if (name) at.name = name;
    if (g.t === 'pt') f.objects().add(new r.Point([g.x, g.y, g.z]), at);
    else if (g.t === 'tag') f.objects().add(new r.TextDot(g.s, g.p), at);
    else if (g.t === 'crv') { const q = crvPoly(g), pl = new r.Polyline(q.length); q.forEach(p => pl.add(p[0], p[1], p[2])); f.objects().add(new r.PolylineCurve(pl), at); }
    else if (g.t === 'srf' || g.t === 'mesh') { const m = new r.Mesh(), F = faces(g), vm = new Map(), vid = p => { const k = p.join(','); let i = vm.get(k); if (i === undefined) { i = m.vertices().add(p[0], p[1], p[2]); vm.set(k, i); } return i; };
      for (const fc of F) { const ix = fc.map(vid); if (ix.length === 3) m.faces().addTriFace(ix[0], ix[1], ix[2]); else if (ix.length === 4) m.faces().addQuadFace(ix[0], ix[1], ix[2], ix[3]); else for (let k = 1; k < ix.length - 1; k++) m.faces().addTriFace(ix[0], ix[k], ix[k + 1]); }
      m.normals().computeNormals(); m.compact(); f.objects().add(m, at); }
    else continue;
    n++;
  }
  download(`mini-gh-${stamp()}.3dm`, new Blob([f.toByteArray()], { type: 'application/octet-stream' })); toast(`3DM · ${n} nesne · ${layers.size} katman`);
}

/* ---- IFC4 ---- */
function ifcGuid() { const A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'; let s = A[Math.floor(Math.random() * 4)]; for (let i = 0; i < 21; i++) s += A[Math.floor(Math.random() * 64)]; return s; }
const ifcStr = s => "'" + String(s).replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/[^\x20-\x7e]/g, ch => '\\X2\\' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') + '\\X0\\') + "'";
const ifcF = v => { let s = ff(v); if (!s.includes('.') && !s.includes('E')) s += '.'; return s; };
function exportIFC() {
  const items = geoItems().filter(x => x.g.t === 'srf' || x.g.t === 'mesh'); if (!items.length) { toast('IFC için yüzey/mesh yok'); return; }
  const L = []; let id = 0; const E = s => { L.push(`#${++id}=${s};`); return '#' + id; };
  const per = E("IFCPERSON($,$,'erdevelop',$,$,$,$,$)"), org = E("IFCORGANIZATION($,'erdevelop',$,$,$)"), po = E(`IFCPERSONANDORGANIZATION(${per},${org},$)`), app = E(`IFCAPPLICATION(${org},'4','Mini Grasshopper','MGH')`);
  const oh = E(`IFCOWNERHISTORY(${po},${app},$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)})`);
  const dx = E('IFCDIRECTION((1.,0.,0.))'), dz = E('IFCDIRECTION((0.,0.,1.))'), o = E('IFCCARTESIANPOINT((0.,0.,0.))'), ax = E(`IFCAXIS2PLACEMENT3D(${o},${dz},${dx})`);
  const ctx = E(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${ax},$)`), body = E(`IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${ctx},$,.MODEL_VIEW.,$)`);
  const u = [E('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)'), E('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)'), E('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)'), E('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)')], ua = E(`IFCUNITASSIGNMENT((${u.join(',')}))`);
  const proj = E(`IFCPROJECT('${ifcGuid()}',${oh},'Mini Grasshopper',$,$,$,$,(${ctx}),${ua})`);
  const lp0 = E(`IFCLOCALPLACEMENT($,${ax})`), site = E(`IFCSITE('${ifcGuid()}',${oh},'Arsa',$,$,${lp0},$,$,.ELEMENT.,$,$,$,$,$)`);
  const lp1 = E(`IFCLOCALPLACEMENT(${lp0},${ax})`), bld = E(`IFCBUILDING('${ifcGuid()}',${oh},'Bina',$,$,${lp1},$,$,.ELEMENT.,$,$,$)`);
  const lp2 = E(`IFCLOCALPLACEMENT(${lp1},${ax})`), sty = E(`IFCBUILDINGSTOREY('${ifcGuid()}',${oh},'Kat 0',$,$,${lp2},$,$,.ELEMENT.,0.)`);
  E(`IFCRELAGGREGATES('${ifcGuid()}',${oh},$,$,${proj},(${site}))`); E(`IFCRELAGGREGATES('${ifcGuid()}',${oh},$,$,${site},(${bld}))`); E(`IFCRELAGGREGATES('${ifcGuid()}',${oh},$,$,${bld},(${sty}))`);
  const styles = new Map(), styleOf = col => { if (styles.has(col)) return styles.get(col); const c = hexRGB(col).map(x => x / 255), rgb = E(`IFCCOLOURRGB($,${ifcF(c[0])},${ifcF(c[1])},${ifcF(c[2])})`), sh = E(`IFCSURFACESTYLESHADING(${rgb},0.)`), ss = E(`IFCSURFACESTYLE($,.BOTH.,(${sh}))`); styles.set(col, ss); return ss; };
  const elems = [], cnt = { plate: 0, member: 0, proxy: 0 };
  items.forEach(({ g, col, type, name }, i) => {
    const tm = triMesh(g); if (!tm.t.length) return;
    const pl = E(`IFCCARTESIANPOINTLIST3D((${tm.v.map(p => `(${p.map(ifcF).join(',')})`).join(',')}))`), fs = E(`IFCTRIANGULATEDFACESET(${pl},$,$,(${tm.t.map(t => `(${t.map(k => k + 1).join(',')})`).join(',')}),$)`);
    E(`IFCSTYLEDITEM(${fs},(${styleOf(col)}),$)`);
    const sr = E(`IFCSHAPEREPRESENTATION(${body},'Body','Tessellation',(${fs}))`), pds = E(`IFCPRODUCTDEFINITIONSHAPE($,$,(${sr}))`), lp = E(`IFCLOCALPLACEMENT(${lp2},${ax})`);
    const area = triangles(g).reduce((s, [a, b, c]) => s + vlen(vcross(vsub(b, a), vsub(c, a))) / 2, 0);
    let el; const nm = ifcStr(name || `${type}-${i + 1}`);
    if (type === 'mullion') { el = E(`IFCMEMBER('${ifcGuid()}',${oh},${nm},$,$,${lp},${pds},$,.MULLION.)`); cnt.member++; }
    else if (g.t === 'srf' || (g.t === 'mesh' && g.f.length <= 2)) { el = E(`IFCPLATE('${ifcGuid()}',${oh},${nm},$,$,${lp},${pds},$,.CURTAIN_PANEL.)`); cnt.plate++; }
    else { el = E(`IFCBUILDINGELEMENTPROXY('${ifcGuid()}',${oh},${nm},$,$,${lp},${pds},$,$)`); cnt.proxy++; }
    const p1 = E(`IFCPROPERTYSINGLEVALUE('Alan',$,IFCAREAMEASURE(${ifcF(area)}),$)`), p2 = E(`IFCPROPERTYSINGLEVALUE('Kaynak',$,IFCLABEL(${ifcStr(type)}),$)`), ps = E(`IFCPROPERTYSET('${ifcGuid()}',${oh},'Pset_MiniGrasshopper',$,(${p1},${p2}))`);
    E(`IFCRELDEFINESBYPROPERTIES('${ifcGuid()}',${oh},$,$,(${el}),${ps})`); elems.push(el);
  });
  E(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${ifcGuid()}',${oh},$,$,(${elems.join(',')}),${sty})`);
  const name = `mini-gh-${stamp()}.ifc`, now = new Date().toISOString().slice(0, 19);
  const txt = ['ISO-10303-21;', 'HEADER;', "FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');", `FILE_NAME('${name}','${now}',('erdevelop'),('erdevelop'),'Mini Grasshopper 3D','Mini Grasshopper 3D','');`, "FILE_SCHEMA(('IFC4'));", 'ENDSEC;', 'DATA;', ...L, 'ENDSEC;', 'END-ISO-10303-21;'].join('\n');
  download(name, new Blob([txt], { type: 'application/x-step' })); toast(`IFC · ${cnt.plate} panel, ${cnt.member} dikme/kayıt, ${cnt.proxy} diğer`);
}

/* ---- DXF with layer table + polyface meshes ---- */
const ACI = [[1, [255, 0, 0]], [2, [255, 255, 0]], [3, [0, 255, 0]], [4, [0, 255, 255]], [5, [0, 0, 255]], [6, [255, 0, 255]], [7, [255, 255, 255]], [8, [128, 128, 128]], [9, [192, 192, 192]], [30, [255, 127, 0]], [40, [255, 191, 0]], [140, [0, 127, 255]], [150, [0, 63, 255]], [190, [127, 0, 255]], [210, [255, 0, 191]], [12, [127, 0, 0]], [94, [0, 127, 0]], [174, [0, 0, 127]]];
const aciOf = hex => { const c = hexRGB(hex); let b = 7, bd = Infinity; for (const [i, r] of ACI) { const d = (r[0] - c[0]) ** 2 + (r[1] - c[1]) ** 2 + (r[2] - c[2]) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
const dxfTxt = s => String(s).replace(/[ğĞıİşŞçÇöÖüÜ]/g, ch => ({ ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ş: 's', Ş: 'S', ç: 'c', Ç: 'C', ö: 'o', Ö: 'O', ü: 'u', Ü: 'U' })[ch]).replace(/[^\x20-\x7e]/g, '?');
function exportDXF2() {
  const items = geoItems(); if (!items.length) return;
  const lay = new Map(); items.forEach(x => { if (!lay.has(x.layer)) lay.set(x.layer, aciOf(x.col)); });
  const L = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', String(lay.size)];
  for (const [n, c] of lay) L.push('0', 'LAYER', '2', n, '70', '0', '62', String(c), '6', 'CONTINUOUS');
  L.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'); let nM = 0, nC = 0;
  for (const { g, layer } of items) {
    if (g.t === 'pt') L.push('0', 'POINT', '8', layer, '10', ff(g.x), '20', ff(g.y), '30', ff(g.z));
    else if (g.t === 'tag') L.push('0', 'TEXT', '8', layer, '10', ff(g.p[0]), '20', ff(g.p[1]), '30', ff(g.p[2]), '40', ff(g.h), '1', dxfTxt(g.s));
    else if (g.t === 'crv') { L.push('0', 'POLYLINE', '8', layer, '66', '1', '70', String(8 | (g.c ? 1 : 0)), '10', '0', '20', '0', '30', '0'); g.p.forEach(p => L.push('0', 'VERTEX', '8', layer, '10', ff(p[0]), '20', ff(p[1]), '30', ff(p[2]), '70', '32')); L.push('0', 'SEQEND', '8', layer); nC++; }
    else if (g.t === 'srf' || g.t === 'mesh') {
      const F = faces(g), v = [], m = new Map(), vid = p => { const k = p.join(','); let i = m.get(k); if (i === undefined) { i = v.length; v.push(p); m.set(k, i); } return i; };
      const fs = []; for (const fc of F) { const ix = fc.map(vid); if (ix.length <= 4) fs.push(ix); else for (let k = 1; k < ix.length - 1; k++) fs.push([ix[0], ix[k], ix[k + 1]]); }
      if (v.length > 32000 || fs.length > 32000) continue;
      L.push('0', 'POLYLINE', '8', layer, '66', '1', '70', '64', '71', String(v.length), '72', String(fs.length), '10', '0', '20', '0', '30', '0');
      v.forEach(p => L.push('0', 'VERTEX', '8', layer, '10', ff(p[0]), '20', ff(p[1]), '30', ff(p[2]), '70', '192'));
      fs.forEach(f => { L.push('0', 'VERTEX', '8', layer, '10', '0', '20', '0', '30', '0', '70', '128'); f.forEach((k, j) => L.push(String(71 + j), String(k + 1))); });
      L.push('0', 'SEQEND', '8', layer); nM++;
    }
  }
  L.push('0', 'ENDSEC', '0', 'EOF');
  download(`mini-gh-${stamp()}.dxf`, new Blob([L.join('\r\n')], { type: 'application/dxf' })); toast(`DXF · ${lay.size} katman · ${nM} mesh, ${nC} eğri`);
}

/* ---- GLB (three.js GLTFExporter) ---- */
async function exportGLB() {
  if (!prev.children.length) { toast('Görünür geometri yok'); return; } toast('GLB hazırlanıyor…');
  try { await loadScript(LIBS.gltf); } catch (e) { toast(e.message); return; }
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2;
  prev.traverse(o => { if ((o.isMesh || o.isLineSegments || o.isPoints) && !o.isSprite) { const c = o.clone(); c.material = o.material.clone(); if (c.material.transparent && c.material.opacity < 0.6) c.material.opacity = 0.6; c.material.depthWrite = true; root.add(c); } });
  root.updateMatrixWorld(true);
  new THREE.GLTFExporter().parse(root, res => { download(`mini-gh-${stamp()}.glb`, new Blob([res], { type: 'model/gltf-binary' })); toast('GLB indirildi'); }, { binary: true });
}

/* ---- color groups of triangles (USDZ, 3MF, PLY) ---- */
function colorGroups() {
  const by = new Map(); for (const { g, col } of collectGeo()) { if (g.t !== 'srf' && g.t !== 'mesh') continue; const T = triangles(g); if (!T.length) continue; const k = col || '#9e2a2a'; (by.get(k) || by.set(k, []).get(k)).push(...T); }
  return [...by.entries()].map(([col, T]) => { const v = [], t = [], m = new Map(), id = p => { const k = p.map(x => x.toFixed(6)).join(','); let i = m.get(k); if (i === undefined) { i = v.length; v.push(p); m.set(k, i); } return i; }; for (const tr of T) { const a = id(tr[0]), b = id(tr[1]), c = id(tr[2]); if (a !== b && b !== c && a !== c) t.push([a, b, c]); } return { col, v, t }; });
}
function exportUSDZ() {
  const G = colorGroups(); if (!G.length) { toast('USDZ için yüzey/mesh yok'); return; }
  const L = ['#usda 1.0', '(', '    defaultPrim = "Root"', '    metersPerUnit = 1', '    upAxis = "Z"', ')', '', 'def Xform "Root"', '{', '    def Scope "Materials"', '    {'];
  G.forEach((g, i) => { const c = hexRGB(g.col).map(x => ff(x / 255, 4)); L.push(`        def Material "Mat${i}"`, '        {', `            token outputs:surface.connect = </Root/Materials/Mat${i}/Shader.outputs:surface>`, '            def Shader "Shader"', '            {', '                uniform token info:id = "UsdPreviewSurface"', `                color3f inputs:diffuseColor = (${c.join(', ')})`, '                float inputs:roughness = 0.55', '                float inputs:metallic = 0', '                token outputs:surface', '            }', '        }'); });
  L.push('    }');
  G.forEach((g, i) => { L.push(`    def Mesh "Mesh${i}" (`, '        prepend apiSchemas = ["MaterialBindingAPI"]', '    )', '    {', `        int[] faceVertexCounts = [${g.t.map(() => 3).join(', ')}]`, `        int[] faceVertexIndices = [${g.t.flat().join(', ')}]`, `        point3f[] points = [${g.v.map(p => `(${p.map(x => ff(x, 5)).join(', ')})`).join(', ')}]`, '        uniform token subdivisionScheme = "none"', '        uniform bool doubleSided = 1', `        rel material:binding = </Root/Materials/Mat${i}>`, '    }'); });
  L.push('}', '');
  download(`mini-gh-${stamp()}.usdz`, zipStore([{ name: 'model.usda', data: L.join('\n') }], 64, 'model/vnd.usdz+zip')); toast('USDZ indirildi · iPhone/iPad\'de AR olarak açılır');
}
function export3MF() {
  const G = colorGroups(); if (!G.length) { toast('3MF için yüzey/mesh yok'); return; }
  const objs = G.map((g, i) => `<object id="${i + 2}" type="model" pid="1" pindex="${i}"><mesh><vertices>${g.v.map(p => `<vertex x="${ff(p[0])}" y="${ff(p[1])}" z="${ff(p[2])}"/>`).join('')}</vertices><triangles>${g.t.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('')}</triangles></mesh></object>`).join('');
  const model = `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="meter" xml:lang="tr-TR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">Mini Grasshopper 3D</metadata><resources><basematerials id="1">${G.map((g, i) => `<base name="Renk ${i + 1}" displaycolor="${g.col.toUpperCase()}"/>`).join('')}</basematerials>${objs}</resources><build>${G.map((g, i) => `<item objectid="${i + 2}"/>`).join('')}</build></model>`;
  download(`mini-gh-${stamp()}.3mf`, zipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', data: model }], 0, 'model/3mf')); toast('3MF indirildi');
}
function exportPLY() {
  const G = colorGroups(); if (!G.length) { toast('PLY için yüzey/mesh yok'); return; }
  const nv = G.reduce((s, g) => s + g.v.length, 0), nf = G.reduce((s, g) => s + g.t.length, 0), L = ['ply', 'format ascii 1.0', 'comment Mini Grasshopper 3D', `element vertex ${nv}`, 'property float x', 'property float y', 'property float z', 'property uchar red', 'property uchar green', 'property uchar blue', `element face ${nf}`, 'property list uchar int vertex_indices', 'end_header'];
  let base = 0; const F = []; for (const g of G) { const c = hexRGB(g.col).join(' '); g.v.forEach(p => L.push(`${ff(p[0])} ${ff(p[1])} ${ff(p[2])} ${c}`)); g.t.forEach(t => F.push(`3 ${t[0] + base} ${t[1] + base} ${t[2] + base}`)); base += g.v.length; }
  download(`mini-gh-${stamp()}.ply`, new Blob([L.concat(F).join('\n') + '\n'], { type: 'text/plain' })); toast(`PLY · ${nf} üçgen`);
}

/* ---- PNG hi-res ---- */
function exportPNG(scale = 3) {
  const pr = renderer.getPixelRatio(), w = viewEl.clientWidth, h = viewEl.clientHeight;
  renderer.setPixelRatio(scale); renderer.setSize(w, h, false); renderer.render(scene, cam);
  renderer.domElement.toBlob(b => { download(`mini-gh-${stamp()}.png`, b); toast(`PNG · ${w * scale}×${h * scale} px (arka plan saydam)`); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); }, 'image/png');
}

/* ---- SVG: plan, ön ve yan görünüş ---- */
function exportSVG() {
  const items = geoItems(); if (!items.length) return;
  const views = [['ÜST (plan)', p => [p[0], -p[1]]], ['ÖN', p => [p[0], -p[2]]], ['SAĞ YAN', p => [p[1], -p[2]]]];
  const segs = []; // [view-independent] list of [a, b, col]
  const pts0 = [], texts = [];
  for (const { g, col } of items) {
    if (g.t === 'pt') pts0.push([[g.x, g.y, g.z], col]);
    else if (g.t === 'tag') texts.push([g.p, g.s, g.h, col]);
    else if (g.t === 'crv') { const q = crvPoly(g); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], col]); }
    else if (g.t === 'srf' || g.t === 'mesh') { const seen = new Set(); for (const f of faces(g)) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = [a.join(), b.join()].sort().join('|'); if (!seen.has(k)) { seen.add(k); segs.push([a, b, col]); } } }
  }
  if (segs.length > 400000) { toast('Çok fazla çizgi (SVG için)'); return; }
  let out = [], x0 = 20; const H = 600;
  for (const [title, pr] of views) {
    const all = [...segs.flatMap(s => [s[0], s[1]]), ...pts0.map(p => p[0]), ...texts.map(t => t[0])].map(pr); if (!all.length) continue;
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), sc = Math.min(H / ((maxy - miny) || 1), 900 / ((maxx - minx) || 1));
    const T = p => { const q = pr(p); return [x0 + (q[0] - minx) * sc, 50 + (q[1] - miny) * sc]; }, wv = (maxx - minx) * sc;
    out.push(`<g><text x="${x0}" y="30" font-family="Arial" font-size="16" font-weight="bold">${title}</text>`);
    const byCol = new Map(); for (const [a, b, c] of segs) { const A = T(a), B = T(b); (byCol.get(c) || byCol.set(c, []).get(c)).push(`M${A[0].toFixed(2)} ${A[1].toFixed(2)}L${B[0].toFixed(2)} ${B[1].toFixed(2)}`); }
    for (const [c, d] of byCol) out.push(`<path d="${d.join('')}" stroke="${c || '#333'}" stroke-width="0.6" fill="none"/>`);
    pts0.forEach(([p, c]) => { const q = T(p); out.push(`<circle cx="${q[0].toFixed(2)}" cy="${q[1].toFixed(2)}" r="1.5" fill="${c || '#333'}"/>`); });
    texts.forEach(([p, s, h]) => { const q = T(p); out.push(`<text x="${q[0].toFixed(2)}" y="${q[1].toFixed(2)}" font-family="Arial" font-size="${Math.max(4, h * sc).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${xesc(s)}</text>`); });
    out.push('</g>'); x0 += wv + 60;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(x0)}" height="${H + 80}" viewBox="0 0 ${Math.ceil(x0)} ${H + 80}"><rect width="100%" height="100%" fill="#fff"/>${out.join('')}</svg>`;
  download(`mini-gh-gorunusler-${stamp()}.svg`, new Blob([svg], { type: 'image/svg+xml' })); toast('SVG görünüşler indirildi');
}

/* ---- dönen video ---- */
let REC = null;
function exportVideo() {
  if (REC) return; if (!window.MediaRecorder || !renderer.domElement.captureStream) { toast('Bu tarayıcı video kaydını desteklemiyor'); return; }
  const mime = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m)); if (!mime) { toast('Video biçimi desteklenmiyor'); return; }
  const stream = renderer.domElement.captureStream(30), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), chunks = [];
  const tg = controls.target.clone(), off = cam.position.clone().sub(tg), r = Math.hypot(off.x, off.y), a0 = Math.atan2(off.y, off.x);
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => { download(`mini-gh-${stamp()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`, new Blob(chunks, { type: mime.split(';')[0] })); toast('Video indirildi'); };
  REC = { t0: performance.now(), dur: 8000, step: t => { const a = a0 + 2 * Math.PI * Math.min(1, t); cam.position.set(tg.x + Math.cos(a) * r, tg.y + Math.sin(a) * r, tg.z + off.z); cam.lookAt(tg); } };
  rec.start(); toast('Video kaydediliyor (8 sn)…');
  setTimeout(() => { REC = null; rec.stop(); stream.getTracks().forEach(t => t.stop()); }, 8100);
}

/* ---- Excel (xlsx) ---- */
function exportXLSX() {
  const sheets = [];
  for (const n of doc.nodes) {
    const inf = info[n.id] || {};
    if ((n.type === 'paneldata' || n.type === 'unroll') && inf.pdata) sheets.push({ name: `${nickOf(n)} panel`, rows: [['Panel', `Genişlik (${n.st.unit})`, `Yükseklik (${n.st.unit})`, `Alan (${n.st.unit}²)`, `Çevre (${n.st.unit})`], ...inf.pdata.map(r => [r.name, r.w, r.h, r.a, r.per ?? ''])] });
    if (n.type === 'mullion' && inf.mrows) sheets.push({ name: `${nickOf(n)} profil`, rows: [['Tür', 'Boy (mm)', 'Adet'], ...inf.mrows.map(r => [r.kind, r.len, r.n])] });
    if (n.type === 'glassw' && inf.gdata) sheets.push({ name: `${nickOf(n)} cam`, rows: [['Dizilim', n.st.mix], ['kg/m²', inf.gdata.kgm], [], ['Panel', 'Alan (m²)', 'Ağırlık (kg)'], ...inf.gdata.rows.map((r, i) => [i + 1, r.a * (mmOf(n) / 1000) ** 2, inf.gdata.W[i]])] });
    if (n.type === 'schedule' && inf.sched) sheets.push({ name: `${nickOf(n)} tipler`, rows: [['Tip', 'Adet', 'Genişlik', 'Yükseklik', 'Alan (tek)'], ...inf.sched.rows.map(r => [r.name, r.n, r.w, r.h, r.area])] });
    if (n.type === 'anchors' && inf.arows) sheets.push({ name: `${nickOf(n)} ankraj`, rows: [['No', 'Kat', 'X', 'Y', 'Z'], ...inf.arows.map(r => [r.name, r.floor, r.p[0], r.p[1], r.p[2]])] });
    if (n.type === 'units' && inf.urows) sheets.push({ name: `${nickOf(n)} üniteler`, rows: [['Ünite', 'Panel', 'Alan'], ...inf.urows.map(r => [r.name, r.n, r.a])] });
  }
  if (!sheets.length) { toast('Liste yok · Panel Data, Mullions, Glass Weight, Panel Schedule, Anchors ya da Units bileşeni ekle'); return; }
  const used = new Set(); sheets.forEach(s => { let b = s.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28), nm = b, k = 2; while (used.has(nm)) nm = b.slice(0, 26) + ' ' + k++; used.add(nm); s.name = nm; });
  const col = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const sheetXml = rows => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${(r || []).map((v, j) => v === '' || v == null ? '' : typeof v === 'number' && isFinite(v) ? `<c r="${col(j)}${i + 1}"${i === 0 ? ' s="1"' : ''}><v>${+v.toFixed(6)}</v></c>` : `<c r="${col(j)}${i + 1}" t="inlineStr"${i === 0 ? ' s="1"' : ''}><is><t>${xesc(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s.rows) }))];
  download(`mini-gh-listeler-${stamp()}.xlsx`, zipStore(files, 0, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')); toast(`Excel · ${sheets.length} sayfa`);
}

/* ---- imalat paftası (PDF) ---- */
function pdfFromJpegs(pages, pw, ph, title) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const add = x => { const u = typeof x === 'string' ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const n = pages.length, Wp = (pw * 72 / 25.4).toFixed(2), Hp = (ph * 72 / 25.4).toFixed(2), obj = (id, body) => { offs[id] = len; add(`${id} 0 obj\n`); body(); add('\nendobj\n'); };
  add('%PDF-1.4\n%âãÏÓ\n'); obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>')); obj(2, () => add(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${n} >>`));
  pages.forEach((pg, i) => { const pid = 3 + i * 3, bin = atob(pg.data.split(',')[1]), img = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) img[j] = bin.charCodeAt(j);
    obj(pid, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${Wp} ${Hp}] /Resources << /XObject << /Im0 ${pid + 1} 0 R >> >> /Contents ${pid + 2} 0 R >>`));
    obj(pid + 1, () => { add(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`); add(img); add('\nendstream'); });
    const cs = `q ${Wp} 0 0 ${Hp} 0 0 cm /Im0 Do Q`; obj(pid + 2, () => add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`)); });
  const inf = 3 + n * 3; obj(inf, () => add(`<< /Title (${title.replace(/[^\x20-\x7e]/g, '?')}) /Producer (Mini Grasshopper 3D) >>`));
  const x = len; add(`xref\n0 ${inf + 1}\n0000000000 65535 f \n`); for (let i = 1; i <= inf; i++) add(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
  add(`trailer\n<< /Size ${inf + 1} /Root 1 0 R /Info ${inf} 0 R >>\nstartxref\n${x}\n%%EOF\n`); return new Blob(parts, { type: 'application/pdf' });
}
async function exportPafta() {
  const src = doc.nodes.filter(n => n.type === 'paneldata' && info[n.id] && info[n.id].pdata && info[n.id].pdata.length);
  if (!src.length) { toast('Pafta için "Panel Data" bileşeni gerekli (Cephe sekmesi)'); return; }
  const rows = src.flatMap(n => info[n.id].pdata.map(r => ({ ...r, unit: n.st.unit }))); if (rows.length > 400) { toast('En fazla 400 pafta'); return; }
  const gw = doc.nodes.find(n => n.type === 'glassw' && info[n.id] && info[n.id].gdata), kgm = gw ? info[gw.id].gdata.kgm : null, mix = gw ? gw.st.mix : '';
  toast(`Pafta hazırlanıyor · ${rows.length} sayfa…`); await new Promise(r => setTimeout(r, 30));
  const PW = 297, PH = 210, px = 4.4, W = Math.round(PW * px), H = Math.round(PH * px), mm = v => v * px, pages = [], date = new Date().toLocaleDateString('tr-TR'), font = (w, pt, f = 'Arial') => `${w} ${pt * px * 0.3528}px ${f}, sans-serif`;
  rows.forEach((r, pi) => {
    const k = UNITS[r.unit] || 1000, poly = unroll2D(r.o).map(p => [p[0] * k, p[1] * k]), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.strokeStyle = '#222'; x.lineWidth = 2; x.strokeRect(mm(8), mm(8), mm(PW - 16), mm(PH - 16));
    // title block
    const tb = [PW - 8 - 110, PH - 8 - 42]; x.strokeRect(mm(tb[0]), mm(tb[1]), mm(110), mm(42));
    [[10], [20], [30]].forEach(([dy]) => { x.beginPath(); x.moveTo(mm(tb[0]), mm(tb[1] + dy)); x.lineTo(mm(tb[0] + 110), mm(tb[1] + dy)); x.stroke(); });
    x.fillStyle = '#111'; x.font = font('bold', 15); x.textBaseline = 'middle'; x.fillText(`PANEL ${r.name}`, mm(tb[0] + 3), mm(tb[1] + 5));
    x.font = font('normal', 9); x.fillText(`Ölçü: ${Math.round(r.w * k)} × ${Math.round(r.h * k)} mm   ·   Alan: ${(r.a * (k / 1000) ** 2).toFixed(3)} m²`, mm(tb[0] + 3), mm(tb[1] + 15));
    x.fillText(`Çevre: ${Math.round((r.per || 0) * k)} mm${kgm ? `   ·   Cam ${mix}: ${(r.a * (k / 1000) ** 2 * kgm).toFixed(1)} kg` : ''}`, mm(tb[0] + 3), mm(tb[1] + 25));
    x.fillText(`Mini Grasshopper 3D · ${date}`, mm(tb[0] + 3), mm(tb[1] + 36)); x.textAlign = 'right'; x.fillText(`Pafta ${pi + 1} / ${rows.length}`, mm(tb[0] + 107), mm(tb[1] + 36)); x.textAlign = 'left';
    // drawing
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), bx = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], area = [mm(30), mm(22), mm(PW - 60 - 110 + 50), mm(PH - 22 - 40)];
    const sc = Math.min(area[2] / ((bx[2] - bx[0]) || 1), area[3] / ((bx[3] - bx[1]) || 1)), ox = area[0] + (area[2] - (bx[2] - bx[0]) * sc) / 2, oy = area[1] + (area[3] + (bx[3] - bx[1]) * sc) / 2, T = p => [ox + (p[0] - bx[0]) * sc, oy - (p[1] - bx[1]) * sc];
    const ctr = T([(bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2]);
    x.fillStyle = '#e8f0f7'; x.beginPath(); poly.forEach((p, i) => { const q = T(p); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.closePath(); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 3; x.stroke();
    if (poly.length === 4) { x.setLineDash([10, 6]); x.strokeStyle = '#888'; x.lineWidth = 1.5; [[0, 2], [1, 3]].forEach(([a, b], j) => { const A = T(poly[a]), B = T(poly[b]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); const L = Math.hypot(poly[b][0] - poly[a][0], poly[b][1] - poly[a][1]); x.fillStyle = '#555'; x.font = font('normal', 8); x.textAlign = 'center'; const t = 0.3 + j * 0.4; x.fillText(`K${j + 1} ${Math.round(L)}`, A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - 10); }); x.setLineDash([]); }
    x.font = font('bold', 9); x.fillStyle = '#c0392b'; x.textAlign = 'center';
    poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], A = T(p), B = T(q), L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 1) return; const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = mx - ctr[0], dy = my - ctr[1], dl = Math.hypot(dx, dy) || 1; x.save(); x.translate(mx + dx / dl * mm(5), my + dy / dl * mm(5)); let ang = Math.atan2(B[1] - A[1], B[0] - A[0]); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI; x.rotate(ang); x.fillText(String(Math.round(L)), 0, 0); x.restore(); });
    x.fillStyle = '#333'; x.font = font('normal', 7.5); poly.forEach((p, i) => { const q = T(p), dx = q[0] - ctr[0], dy = q[1] - ctr[1], dl = Math.hypot(dx, dy) || 1; x.fillText(String.fromCharCode(65 + (i % 26)), q[0] + dx / dl * mm(3), q[1] + dy / dl * mm(3)); });
    x.font = font('bold', 20); x.fillStyle = 'rgba(30,60,90,.35)'; x.fillText(r.name, ctr[0], ctr[1]); x.textAlign = 'left';
    x.font = font('normal', 7.5); x.fillStyle = '#666'; x.fillText('Ölçüler mm · kenar uzunlukları açınım (gerçek boy) üzerinden · köşegenler kesikli', mm(12), mm(14));
    pages.push({ data: c.toDataURL('image/jpeg', 0.9), w: W, h: H });
  });
  download(`imalat-paftasi-${stamp()}.pdf`, pdfFromJpegs(pages, PW, PH, 'Imalat paftasi')); toast(`Pafta PDF · ${pages.length} sayfa`);
}
const EXP = { '3dm': export3dm, ifc: exportIFC, dxf2: exportDXF2, glb: exportGLB, usdz: exportUSDZ, '3mf': export3MF, ply: exportPLY, png: () => exportPNG(3), svg: exportSVG, webm: exportVideo, xlsx: exportXLSX, pafta: exportPafta };

/* ---- v5: action panels for anchors / units / gcode ---- */
Object.assign(ACT, {
  anchors: { title: 'ankraj listesi', btns: [['CSV', n => simpleCSV(n, 'ankraj', ['No', 'Kat', 'X', 'Y', 'Z'], (info[n.id].arows || []).map(r => [r.name, r.floor, ...r.p.map(v => v.toFixed(4).replace('.', ','))]))]] },
  units: { title: 'üniteler', btns: [['CSV', n => simpleCSV(n, 'uniteler', ['Ünite', 'Panel', 'Alan'], (info[n.id].urows || []).map(r => [r.name, r.n, r.a.toFixed(3).replace('.', ',')]))]] },
  gcode: { title: 'CNC', btns: [['G-code indir', n => { const g = info[n.id] && info[n.id].gcode; if (!g) { toast('Eğri yok'); return; } download(`kesim-${stamp()}.nc`, new Blob([g.join('\r\n')], { type: 'text/plain' })); }]] }
});
function simpleCSV(n, name, head, rows) { if (!rows.length) { toast('Liste boş'); return; } download(`${name}-${stamp()}.csv`, new Blob(['﻿' + [head, ...rows].map(r => r.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' })); }
function actTable2(n) {
  const t3 = actTable3(n); if (t3 !== null) return t3;
  const inf = info[n.id] || {};
  if (n.type === 'anchors') { const r = inf.arows || []; if (!r.length) return '<tr><td>(ankraj yok)</td></tr>'; const fl = {}; r.forEach(x => fl[x.floor] = (fl[x.floor] || 0) + 1); return `<tr><th>Kat</th><th>Ankraj</th></tr>${Object.entries(fl).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}<tr><th>Toplam</th><th>${r.length}</th></tr>`; }
  if (n.type === 'units') { const r = inf.urows || []; if (!r.length) return '<tr><td>(ünite yok)</td></tr>'; return `<tr><th>Ünite</th><th>Panel</th><th>Alan</th></tr>${r.slice(0, 12).map(x => `<tr><td>${esc(x.name)}</td><td>${x.n}</td><td>${x.a.toFixed(2)}</td></tr>`).join('')}${r.length > 12 ? `<tr><td colspan="3">… +${r.length - 12}</td></tr>` : ''}<tr><th>Toplam</th><th colspan="2">${r.length} ünite</th></tr>`; }
  if (n.type === 'gcode') { const g = inf.gcode; return g ? `<tr><td>Satır</td><td>${g.length}</td></tr><tr><td>Kontur</td><td>${g.filter(l => l.startsWith('(') && /kontur|egri/.test(l)).length}</td></tr>` : '<tr><td>(eğri yok)</td></tr>'; }
  return null;
}

/* ---- import / image / pick / note / script node UIs ---- */
async function importFile(n, f) {
  const ext = f.name.split('.').pop().toLowerCase(); toast(`${f.name} okunuyor…`);
  try {
    let r; if (ext === 'dxf') r = parseDXF(await f.text()); else if (ext === 'obj') r = parseOBJ(await f.text()); else if (ext === '3dm') r = await parse3DM(await f.arrayBuffer()); else throw new Error('DXF, OBJ ya da 3DM seç');
    const nv = r.geo.reduce((s, x) => s + pts(x.g).length, 0); if (nv > 300000) throw new Error(`Çok büyük dosya (${nv} köşe, en fazla 300.000)`);
    record(); n.st.geo = r.geo; n.st.file = f.name; n.st.msg = `${r.geo.length} nesne${r.skipped ? ` · ${r.skipped} desteklenmeyen atlandı` : ''}`; schedule(); recordSoon();
    if (JSON.stringify(n.st.geo).length > 3e6) toast('Büyük dosya: tarayıcı belleğine sığmayabilir, tanımı "Kaydet" ile dosyaya kaydet'); else toast(`${f.name} · ${n.st.msg}`);
  } catch (e) { toast(e.message || 'Dosya okunamadı'); }
}
function loadImage(n, f) {
  const url = URL.createObjectURL(f), im = new Image();
  im.onload = () => { const s = Math.min(1, 160 / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * s)), h = Math.max(1, Math.round(im.height * s)), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data, px = [];
    for (let i = 0; i < w * h; i++) px.push(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]); record(); Object.assign(n.st, { name: f.name, w, h, px }); URL.revokeObjectURL(url); schedule(); recordSoon(); };
  im.onerror = () => toast('Resim açılamadı'); im.src = url;
}
function drawThumb(n) { const el = els[n.id]; if (!el) return; const cv = el.querySelector('.ith'); if (!cv) return; const st = n.st; if (!st.w) { cv.width = 120; cv.height = 40; const x = cv.getContext('2d'); x.fillStyle = '#eee'; x.fillRect(0, 0, 120, 40); x.fillStyle = '#888'; x.font = '11px sans-serif'; x.fillText('resim yok', 32, 24); return; }
  cv.width = st.w; cv.height = st.h; const x = cv.getContext('2d'), id = x.createImageData(st.w, st.h); for (let i = 0; i < st.w * st.h; i++) { id.data[i * 4] = st.px[i * 3]; id.data[i * 4 + 1] = st.px[i * 3 + 1]; id.data[i * 4 + 2] = st.px[i * 3 + 2]; id.data[i * 4 + 3] = 255; } x.putImageData(id, 0, 0); }
let PICK = null;
function setPick(n) { const old = PICK; PICK = n && PICK !== n ? n : null; viewEl.classList.toggle('picking', !!PICK); if (old) refreshNode(old); if (PICK) { refreshNode(PICK); toast('3B görünüme tıklayarak nokta ekle · Esc: bitir'); } }
(() => { const ray = new THREE.Raycaster(); let pd = null; const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { pd = [e.clientX, e.clientY]; });
  cvs.addEventListener('pointerup', e => { if (!PICK || !pd || Math.hypot(e.clientX - pd[0], e.clientY - pd[1]) > 4) return; const r = cvs.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), cam);
    const ms = []; prev.traverse(o => { if (o.isMesh) ms.push(o); }); const hit = ray.intersectObjects(ms, false)[0]; let p = hit ? hit.point : null; if (!p) { p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), p)) return; }
    record(); PICK.st.pts.push([+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)]); schedule(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && PICK) setPick(null); });
})();
function buildNodeV5(n, c, el, ins, outs, ch) {
  if (c.ui === 'import') {
    el.innerHTML = `<div class="sb"><div class="st" data-drag><span>Import</span><button type="button" class="ifb">dosya seç…</button></div><small class="rinfo imsg"></small><input type="file" accept=".dxf,.obj,.3dm" hidden></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    const fi = el.querySelector('input'); el.querySelector('.ifb').addEventListener('click', () => fi.click()); fi.addEventListener('change', () => { const f = fi.files[0]; fi.value = ''; if (f) importFile(n, f); }); return true;
  }
  if (c.ui === 'img') {
    el.innerHTML = `${ins()}<div class="sb"><div class="st" data-drag><span>Image Sampler</span><button type="button" class="ifb">resim…</button></div><canvas class="ith"></canvas><div class="orow"><select class="ich"><option value="bright">parlaklık</option><option value="r">kırmızı</option><option value="g">yeşil</option><option value="b">mavi</option></select><label><input type="checkbox" class="iinv"> ters</label></div><input type="file" accept="image/*" hidden></div>${outs}<span class="msg"></span>`;
    const fi = el.querySelector('input[type=file]'); el.querySelector('.ifb').addEventListener('click', () => fi.click()); fi.addEventListener('change', () => { const f = fi.files[0]; fi.value = ''; if (f) loadImage(n, f); });
    const chs = el.querySelector('.ich'); chs.value = n.st.ch; chs.addEventListener('change', () => { n.st.ch = chs.value; ch(); }); const iv = el.querySelector('.iinv'); iv.checked = !!n.st.inv; iv.addEventListener('change', () => { n.st.inv = iv.checked; ch(); }); return true;
  }
  if (c.ui === 'pick') {
    el.innerHTML = `<div class="sb"><div class="st" data-drag><span>Nokta · <b class="pc">0</b></span><span><button type="button" class="pk">seç</button> <button type="button" class="pu">↶</button> <button type="button" class="px">temizle</button></span></div><small class="rinfo">"seç"e bas, 3B görünüme tıkla (yüzeye ya da zemine)</small></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    el.querySelector('.pk').addEventListener('click', () => setPick(n)); el.querySelector('.pu').addEventListener('click', () => { record(); n.st.pts.pop(); ch(); }); el.querySelector('.px').addEventListener('click', () => { record(); n.st.pts = []; ch(); }); return true;
  }
  if (c.ui === 'note') {
    el.className += ' note'; el.innerHTML = `<div class="nt" data-drag>not</div><textarea spellcheck="false" aria-label="not">${esc(n.st.text)}</textarea>`;
    const ta = el.querySelector('textarea'); ta.addEventListener('input', () => { n.st.text = ta.value; recordSoon(); }); ta.addEventListener('keydown', e => e.stopPropagation()); return true;
  }
  if (c.ui === 'script') {
    el.innerHTML = `${ins()}<div class="sb scr"><div class="st" data-drag><span>JS script</span><small>return { a, b }</small></div><textarea spellcheck="false" aria-label="kod">${esc(n.st.code)}</textarea></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    const ta = el.querySelector('textarea'); let t = 0; ta.addEventListener('input', () => { n.st.code = ta.value; clearTimeout(t); t = setTimeout(ch, 350); }); ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } }); return true;
  }
  return false;
}
function refreshNodeV5(n, c, el) {
  if (c.ui === 'import') el.querySelector('.imsg').textContent = n.st.file ? `${n.st.file} · ${n.st.msg || ''}` : 'DXF, OBJ ya da Rhino 3DM';
  if (c.ui === 'img') drawThumb(n);
  if (c.ui === 'pick') { el.querySelector('.pc').textContent = (n.st.pts || []).length; const b = el.querySelector('.pk'); b.textContent = PICK === n ? 'bitir' : 'seç'; b.classList.toggle('on', PICK === n); }
}

/* ---- clusters ---- */
C.__in = { cat: 'X', name: 'in', nick: 'in', ins: [], outs: ['V'], tree: (I, st) => [st.tree || []] };
function clusterType(id, d) {
  return { cat: 'Cluster', name: d.name, nick: d.name, ins: d.ins.map(x => ({ n: x.n, tree: true, opt: true })), outs: d.outs.map(x => x.n),
    tree: (I, st, n) => { const sd = doc, sc = cache, si = info; let out, errs = [];
      try { const inN = d.ins.map((x, k) => ({ id: -1 - k, type: '__in', st: { tree: I[k] || [] }, x: 0, y: 0 })); doc = { nodes: [...d.sub.nodes, ...inN], wires: [...d.sub.wires, ...d.ins.map((x, k) => ({ a: -1 - k, ao: 0, b: x.node, bi: x.port }))], groups: [] }; NOINC++; try { solve(); } finally { NOINC--; }
        out = d.outs.map(o => (cache[o.node] || [])[o.port] || []); errs = d.sub.nodes.filter(m => info[m.id] && info[m.id].err).map(m => `${nickOf(m)}: ${info[m.id].err}`); }
      finally { doc = sd; cache = sc; info = si; }
      if (errs.length) info[n.id] = { ...(info[n.id] || {}), warn: errs[0] }; return out; } };
}
function registerDefs() { for (const k of Object.keys(C)) if (k.startsWith('cl_')) delete C[k]; for (const [id, d] of Object.entries(doc.defs || {})) C['cl_' + id] = clusterType(id, d); }
function makeCluster() {
  const S = new Set(sel); if (S.size < 2) { toast('En az 2 bileşen seç'); return; }
  const inc = doc.wires.filter(w => !S.has(w.a) && S.has(w.b)), outg = doc.wires.filter(w => S.has(w.a) && !S.has(w.b));
  if (!outg.length) { toast('Seçimden dışarı çıkan bağlantı yok (cluster çıkışı olmaz)'); return; }
  const name = prompt('Cluster adı:', 'Cluster'); if (name == null) return; record();
  const nodes = doc.nodes.filter(n => S.has(n.id)), inner = doc.wires.filter(w => S.has(w.a) && S.has(w.b)), ins = [], ik = new Map(), outs = [], ok = new Map();
  inc.forEach(w => { const k = w.b + ':' + w.bi; if (!ik.has(k)) { ik.set(k, ins.length); ins.push({ n: C[byId(w.b).type].ins[w.bi].n, node: w.b, port: w.bi }); } });
  outg.forEach(w => { const k = w.a + ':' + w.ao; if (!ok.has(k)) { ok.set(k, outs.length); outs.push({ n: C[byId(w.a).type].outs[w.ao], node: w.a, port: w.ao }); } });
  const id = 'd' + (uid++); doc.defs = doc.defs || {}; doc.defs[id] = { name: name.trim() || 'Cluster', sub: { nodes: JSON.parse(JSON.stringify(nodes)), wires: inner.map(w => ({ ...w })) }, ins, outs }; registerDefs();
  const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length, cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
  doc.nodes = doc.nodes.filter(n => !S.has(n.id)); doc.wires = doc.wires.filter(w => !S.has(w.a) && !S.has(w.b)); doc.groups.forEach(g => g.ids = g.ids.filter(i => !S.has(i))); doc.groups = doc.groups.filter(g => g.ids.length);
  const cn = addNode('cl_' + id, cx, cy); inc.forEach(w => doc.wires.push({ a: w.a, ao: w.ao, b: cn.id, bi: ik.get(w.b + ':' + w.bi) })); outg.forEach(w => doc.wires.push({ a: cn.id, ao: ok.get(w.a + ':' + w.ao), b: w.b, bi: w.bi }));
  sel.clear(); sel.add(cn.id); rebuildAll(); schedule(); record(); toast(`Cluster "${doc.defs[id].name}" · ${ins.length} giriş, ${outs.length} çıkış`);
}
function explodeCluster(n) {
  const d = doc.defs && doc.defs[n.type.slice(3)]; if (!d) return; record(); const map = {}, ax = d.sub.nodes.reduce((s, m) => s + m.x, 0) / d.sub.nodes.length, ay = d.sub.nodes.reduce((s, m) => s + m.y, 0) / d.sub.nodes.length;
  sel.clear(); for (const m of d.sub.nodes) { const k = { ...JSON.parse(JSON.stringify(m)), id: uid++, x: m.x - ax + n.x, y: m.y - ay + n.y }; map[m.id] = k.id; doc.nodes.push(k); sel.add(k.id); }
  d.sub.wires.forEach(w => doc.wires.push({ a: map[w.a], ao: w.ao, b: map[w.b], bi: w.bi }));
  doc.wires.filter(w => w.b === n.id).forEach(w => { const x = d.ins[w.bi]; if (x) doc.wires.push({ a: w.a, ao: w.ao, b: map[x.node], bi: x.port }); });
  doc.wires.filter(w => w.a === n.id).forEach(w => { const x = d.outs[w.ao]; if (x) doc.wires.push({ a: map[x.node], ao: x.port, b: w.b, bi: w.bi }); });
  doc.wires = doc.wires.filter(w => w.a !== n.id && w.b !== n.id); doc.nodes = doc.nodes.filter(m => m !== n); rebuildAll(); schedule(); record();
}

/* ---- remote control panel ---- */
function paintRemote() {
  const box = $('remote'); if (!box || box.hidden) return;
  const ctrls = doc.nodes.filter(n => ['slider', 'toggle', 'vlist', 'numin'].includes(C[n.type].ui));
  $('remList').innerHTML = ctrls.length ? ctrls.map(n => { const s = n.st, u = C[n.type].ui;
    if (u === 'slider') return `<label data-id="${n.id}"><span>${esc(s.label)}</span><input type="range" min="${s.min}" max="${s.max}" step="${s.int ? 1 : (s.max - s.min) / 200}" value="${s.val}"><b>${fmt(s.val)}</b></label>`;
    if (u === 'toggle') return `<label data-id="${n.id}"><span>${esc(s.label)}</span><input type="checkbox" ${s.val ? 'checked' : ''}></label>`;
    if (u === 'numin') return `<label data-id="${n.id}"><span>${esc(s.label)}</span><input type="number" step="any" value="${s.val}"></label>`;
    return `<label data-id="${n.id}"><span>${esc(s.label)}</span><select>${vlistItems(s).map((it, i) => `<option value="${i}" ${i === s.sel ? 'selected' : ''}>${esc(it.name)}</option>`).join('')}</select></label>`; }).join('') : '<small>Tanımda slider, toggle ya da liste yok</small>';
}
function remoteInput(e) {
  const lb = e.target.closest('[data-id]'); if (!lb) return; const n = byId(+lb.dataset.id); if (!n) return; const u = C[n.type].ui, t = e.target;
  if (u === 'slider') { n.st.val = n.st.int ? Math.round(+t.value) : +(+t.value).toFixed(4); lb.querySelector('b').textContent = fmt(n.st.val); }
  else if (u === 'toggle') n.st.val = t.checked; else if (u === 'numin') { const x = parseFloat(t.value); if (!isFinite(x)) return; n.st.val = x; } else n.st.sel = +t.value;
  const el = els[n.id]; if (el) { el.remove(); delete els[n.id]; buildNode(n); } schedule(); recordSoon();
}

$('remBtn').addEventListener('click', () => { $('remote').hidden = !$('remote').hidden; paintRemote(); });
$('remX').addEventListener('click', () => { $('remote').hidden = true; document.body.classList.remove('viewonly'); $('viewOnly').checked = false; sizeView(); });
$('viewOnly').addEventListener('change', e => { document.body.classList.toggle('viewonly', e.target.checked); sizeView(); });
$('remList').addEventListener('input', remoteInput); $('remList').addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') remoteInput(e); });
