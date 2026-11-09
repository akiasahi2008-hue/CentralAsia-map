/**
 * Builder for Central Asia Historical Atlas (1162 - 1949)
 * Generates:
 *   - js/atlas_snapshots.js
 *   - js/atlas_boot.js
 *   - js/map_data.js
 */
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'C:/Users/info/.gemini/antigravity/brain/90eb16b7-7d36-4d28-97dc-89737ed069af/scratch/orig_backup';
const OUT_DIR = path.resolve(__dirname, '..');

global.window = {};
require(path.join(BACKUP_DIR, 'atlas_snapshots.js'));
require(path.join(BACKUP_DIR, 'china_geo_data.js'));

const ORIG_SNAPS = window.ATLAS_SNAPSHOTS;
const ORIG_PROVS = window.PROVINCE_OUTLINES;

// ---------------- Geometry Helpers ----------------
function cloneCoords(coords) {
  return JSON.parse(JSON.stringify(coords));
}

function getPolygons(shape) {
  if (!shape) return [];
  if (shape.type === 'Polygon') return [cloneCoords(shape.coordinates)];
  if (shape.type === 'MultiPolygon') return cloneCoords(shape.coordinates);
  return [];
}

function ringArea(ring) {
  if (!ring || ring.length < 3) return 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a) * 0.5;
}

function ringCentroid(ring) {
  if (!ring || !ring.length) return [75, 42];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let sx = 0, sy = 0;
  for (const p of ring) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
    sx += p[0];
    sy += p[1];
  }
  return [
    Number(((sx / ring.length + (minX + maxX) * 0.5) * 0.5).toFixed(2)),
    Number(((sy / ring.length + (minY + maxY) * 0.5) * 0.5).toFixed(2)),
  ];
}

function shapeAnchor(shape) {
  const polys = getPolygons(shape);
  let bestRing = null;
  let bestArea = -1;
  for (const poly of polys) {
    if (poly && poly[0]) {
      const a = ringArea(poly[0]);
      if (a > bestArea) {
        bestArea = a;
        bestRing = poly[0];
      }
    }
  }
  return bestRing ? ringCentroid(bestRing) : [75, 42];
}

// Clip a single closed ring against half-plane nx * x + ny * y <= c
function clipRingHalfPlane(ring, nx, ny, c) {
  if (!ring || ring.length < 3) return [];
  const pts = ring.slice();
  if (
    pts.length > 1 &&
    Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 1e-6 &&
    Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-6
  ) {
    pts.pop();
  }
  if (pts.length < 3) return [];
  const out = [];
  const evalPt = (p) => nx * p[0] + ny * p[1] - c;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    const dCur = evalPt(cur);
    const dPrev = evalPt(prev);
    const curIn = dCur <= 1e-9;
    const prevIn = dPrev <= 1e-9;
    if (curIn !== prevIn) {
      const t = dPrev / (dPrev - dCur);
      out.push([
        Number((prev[0] + (cur[0] - prev[0]) * t).toFixed(2)),
        Number((prev[1] + (cur[1] - prev[1]) * t).toFixed(2)),
      ]);
    }
    if (curIn) {
      out.push([Number(cur[0].toFixed(2)), Number(cur[1].toFixed(2))]);
    }
  }
  if (out.length < 3) return [];
  out.push([out[0][0], out[0][1]]);
  return ringArea(out) >= 0.08 ? out : [];
}

function clipShapeHalfPlane(shape, nx, ny, c) {
  const polys = getPolygons(shape);
  const outPolys = [];
  for (const poly of polys) {
    if (!poly || !poly[0]) continue;
    const outer = clipRingHalfPlane(poly[0], nx, ny, c);
    if (outer.length >= 4) {
      outPolys.push([outer]);
    }
  }
  if (!outPolys.length) return null;
  return outPolys.length === 1
    ? { type: 'Polygon', coordinates: outPolys[0] }
    : { type: 'MultiPolygon', coordinates: outPolys };
}

function clipShapeBox(shape, west, south, east, north) {
  let s = shape;
  if (west !== null && west !== undefined) s = s && clipShapeHalfPlane(s, -1, 0, -west);
  if (east !== null && east !== undefined) s = s && clipShapeHalfPlane(s, 1, 0, east);
  if (south !== null && south !== undefined) s = s && clipShapeHalfPlane(s, 0, -1, -south);
  if (north !== null && north !== undefined) s = s && clipShapeHalfPlane(s, 0, 1, north);
  return s;
}

function mergeShapes(...shapes) {
  const allPolys = [];
  for (const sh of shapes) {
    if (!sh) continue;
    for (const p of getPolygons(sh)) {
      if (p && p[0] && p[0].length >= 4) allPolys.push(p);
    }
  }
  if (!allPolys.length) return null;
  return allPolys.length === 1
    ? { type: 'Polygon', coordinates: allPolys[0] }
    : { type: 'MultiPolygon', coordinates: allPolys };
}

function getPol(snapKey, title) {
  const s = ORIG_SNAPS[snapKey];
  if (!s) throw new Error(`Missing snap ${snapKey}`);
  const searchIn = (sk) => {
    const list = [...(sk.polities || []), ...(sk.regions || []), ...(sk.prefectures || [])];
    return list.find((x) => x.title === title || x.title.startsWith(title) || x.title.includes(title));
  };
  let p = searchIn(s);
  if (!p) {
    for (const k of Object.keys(ORIG_SNAPS)) {
      const sk = ORIG_SNAPS[k];
      if (sk && typeof sk === 'object' && !Array.isArray(sk)) {
        p = searchIn(sk);
        if (p) break;
      }
    }
  }
  if (!p) throw new Error(`Missing polity ${title} in ${snapKey}`);
  return { type: p.shape.type, coordinates: cloneCoords(p.shape.coordinates) };
}

function getReg(snapKey, title) {
  const s = ORIG_SNAPS[snapKey];
  if (!s) throw new Error(`Missing snap ${snapKey}`);
  const list = [...(s.regions || []), ...(s.prefectures || [])];
  let r = list.find((x) => x.title === title || x.title.startsWith(title));
  if (!r) {
    for (const k of Object.keys(ORIG_SNAPS)) {
      const sk = ORIG_SNAPS[k];
      if (sk && typeof sk === 'object') {
        const l2 = [...(sk.regions || []), ...(sk.prefectures || [])];
        r = l2.find((x) => x.title === title || x.title.startsWith(title));
        if (r) break;
      }
    }
  }
  if (!r) throw new Error(`Missing region/pref ${title} in ${snapKey}`);
  return { type: r.shape.type, coordinates: cloneCoords(r.shape.coordinates) };
}

function getNeighbor(title) {
  const n = ORIG_SNAPS.neighbors.find((x) => x.title === title);
  if (!n) throw new Error(`Missing neighbor ${title}`);
  return { type: n.shape.type, coordinates: cloneCoords(n.shape.coordinates) };
}

function getProv(titlePrefix) {
  const p = ORIG_PROVS.find((x) => x.title.startsWith(titlePrefix));
  if (!p) throw new Error(`Missing province ${titlePrefix}`);
  return { type: 'MultiPolygon', coordinates: cloneCoords(p.rings) };
}

// ---------------- Base Geographic & Historical Shapes ----------------
const S = {};

// Modern neighbor countries
S.kazakh_mod = getNeighbor('哈萨克斯坦');
S.uzbek_mod = getNeighbor('乌兹别克斯坦');
S.turkmen_mod = getNeighbor('土库曼斯坦');
S.kyrgyz_mod = getNeighbor('吉尔吉斯斯坦');
S.tajik_mod = getNeighbor('塔吉克斯坦');
S.afghan_mod = getNeighbor('阿富汗');
S.iran_mod = getNeighbor('伊朗');
S.pakistan_mod = getNeighbor('巴基斯坦');
S.india_mod = getNeighbor('印度');
S.russia_mod = getNeighbor('俄罗斯');
S.mongolia_mod = getPol('s_roc_d', '蒙古人民共和国');

// Sub-regions of Kazakhstan / Steppe
S.kazakh_little_juz = clipShapeHalfPlane(S.kazakh_mod, 1, 0.15, 72.5); // West of ~65.5E
S.kazakh_east_of_little = clipShapeHalfPlane(S.kazakh_mod, -1, -0.15, -72.5);
S.kazakh_middle_juz = clipShapeHalfPlane(S.kazakh_east_of_little, 0, -1, -45.2); // North of 45.2N
S.kazakh_south_belt = clipShapeHalfPlane(S.kazakh_east_of_little, 0, 1, 45.2); // South of 45.2N
S.syr_steppe = clipShapeHalfPlane(S.kazakh_south_belt, 1, 0, 70.2); // Syr Darya / Otrar / Sighnaq / Turkistan
S.semirechye_north = clipShapeHalfPlane(S.kazakh_south_belt, -1, 0, -70.2); // Jetysu / Balkhash / Ili-Chu-Talas
S.semirechye = mergeShapes(S.semirechye_north, clipShapeHalfPlane(S.kyrgyz_mod, 0, -1, -40.8));

// Sub-regions of Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan
S.fergana = mergeShapes(
  getPol('s_qing_f', '哈萨克 · 浩罕'),
  clipShapeHalfPlane(S.uzbek_mod, -1, 0, -70.0),
  clipShapeHalfPlane(S.kyrgyz_mod, 0, 1, 40.8)
);
S.khwarezm_core = getPol('s_qing_b', '希瓦汗国');
S.khwarezm_oasis = clipShapeHalfPlane(S.uzbek_mod, 1, 0, 62.2);
S.mawarannahr_core = mergeShapes(
  clipShapeBox(S.uzbek_mod, 62.2, 37.0, 70.0, 42.5),
  getPol('s_qing_f', '布哈拉汗国')
);
S.bukhara_oasis = clipShapeHalfPlane(S.mawarannahr_core, 1, 0, 65.8);
S.samarkand_kesh = clipShapeHalfPlane(S.mawarannahr_core, -1, 0, -65.8);
S.badakhshan_pamir = S.tajik_mod;
S.hisar_badakhshan = mergeShapes(
  clipShapeHalfPlane(S.tajik_mod, 1, 0, 71.5),
  clipShapeBox(S.afghan_mod, 67.5, 35.8, 74.8, 38.6)
);
S.pamir_east = clipShapeHalfPlane(S.tajik_mod, -1, 0, -71.5);
S.merv_turkmen = S.turkmen_mod;

// Khorasan, Afghanistan, Iran
S.khorasan_herat = mergeShapes(
  clipShapeHalfPlane(S.afghan_mod, 0, -1, -33.6),
  clipShapeBox(S.iran_mod, 57.5, 33.5, 61.5, 38.5),
  clipShapeHalfPlane(S.turkmen_mod, 0, 1, 38.2)
);
S.kabul_kandahar = clipShapeHalfPlane(S.afghan_mod, 0, 1, 33.6);
S.ghazni_ghur = getPol('s_nansong_a', '伽色尼王朝');
S.safavid_persia = getPol('s_qing_a', '萨法维波斯');
S.ilkhanate_full = getPol('s_yuan', '伊利汗国');

// East Turkestan (Tarim Basin, Turfan-Hami, Dzungaria)
S.xinjiang_greater = getReg('s_qing_d', '伊犁（新疆）');
S.xinjiang_modern = getReg('s_roc', '新疆');
S.tarim_full = getPol('s_tang_b1', '安西都护府（孤悬坚守）');
S.dzungaria_full = getPol('s_tang_b1', '北庭都护府（孤悬坚守）');
S.qocho_uyghur = getPol('s_beisong_a', '高昌回鹘');
S.hami_wei = getPol('s_ming_a', '哈密卫（关西七卫）');
S.ili_occupied = getPol('s_qing_f0', '伊犁（沙俄侵占）');

// Sub-regions of Tarim Basin & Dzungaria
S.kashgaria_west = clipShapeHalfPlane(S.tarim_full, 1, 0, 80.5); // Kashgar, Yarkand, Khotan, Aksu
S.kashgar_yarkand = clipShapeHalfPlane(S.kashgaria_west, -0.35, -1, -64.2); // Kashgar & Yarkand & Aksu
S.khotan_oasis = clipShapeHalfPlane(S.kashgaria_west, 0.35, 1, 64.2); // Khotan (于闐)
S.kucha_karashahr = clipShapeBox(S.tarim_full, 80.5, 36.0, 89.2, 43.2); // Kucha, Karashahr, Korla, Charklik
S.turfan_beshbaliq = mergeShapes(S.qocho_uyghur, getReg('s_yuan', '北庭都护府'));
S.ili_tarbagatai = clipShapeHalfPlane(S.dzungaria_full, 1, 0, 86.2);
S.urumqi_barkol = clipShapeHalfPlane(S.dzungaria_full, -1, 0, -86.2);

// Historical Empires in Central Asia
S.karakhitai_full = getPol('s_nansong_a', '西辽');
S.karakhanid_full = getPol('s_beisong_a', '喀喇汗王朝');
S.west_karakhanid = mergeShapes(S.mawarannahr_core, S.fergana);
S.east_karakhanid = mergeShapes(S.semirechye, S.kashgaria_west);
S.kipchak_steppe = getPol('s_beisong_b', '钦察');
S.kipchak_west = getPol('s_nansong_a', '钦察');
S.golden_horde = getPol('s_yuan', '金帐汗国');
S.white_horde = getPol('s_ming_b0', '白帐汗国');
S.sibir_khanate = getPol('s_ming_b0', '西伯利亚汗国');
S.nogai_horde = getPol('s_qing_a', '诺盖汗国');
S.kazakh_khanate = getPol('s_qing_a', '哈萨克汗国');
S.chagatai_yuan = getPol('s_yuan', '察合台汗国');
S.timurid_peak = getPol('s_ming_a0', '帖木儿诸王国');
S.timurid_west = getPol('s_ming_b0', '帖木儿诸王国');
S.dzungar_peak = getPol('s_qing_c', '准噶尔汗国');

// Mongolia & Steppe Tribes (1162-1206)
S.mongol_tribes_all = getPol('s_nansong_a', '蒙古诸部');
S.naiman_tribe = clipShapeHalfPlane(S.mongol_tribes_all, 1, 0, 99.0);
S.mongol_mid_east = clipShapeHalfPlane(S.mongol_tribes_all, -1, 0, -99.0);
S.kereit_tribe = clipShapeBox(S.mongol_mid_east, 99.0, 41.5, 108.8, 49.2);
S.merkit_tribe = clipShapeBox(S.mongol_mid_east, 98.5, 49.2, 110.5, 60.0);
S.mongol_ulus_1162 = clipShapeBox(S.mongol_mid_east, 108.8, 46.2, 116.8, 56.0);
S.tatar_tribe = mergeShapes(
  clipShapeBox(S.mongol_mid_east, 113.5, 41.5, 122.0, 49.5),
  clipShapeBox(S.mongol_mid_east, 108.8, 41.5, 113.5, 46.2)
);
S.lingbei_yuan = getReg('s_yuan', '岭北行省');
S.uliasutai_qing = getReg('s_qing_f', '乌里雅苏台');
S.kobdo_urianghai = clipShapeHalfPlane(S.uliasutai_qing, 1, 0, 97.5);
S.khalkha_proper = clipShapeHalfPlane(S.uliasutai_qing, -1, 0, -97.5);

// Hexi, Qinghai, Tibet, China
S.xixia = getPol('s_nansong_a', '西夏');
S.gansu_yuan = getReg('s_yuan', '甘肃行省');
S.shazhou_dunhuang = getReg('s_yuan', '沙州路');
S.suzhou_jiuquan = getReg('s_yuan', '肃州路');
S.ganzhou_zhangye = getReg('s_yuan', '甘州路');
S.ejina_ruoshui = getReg('s_yuan', '亦集乃路');
S.karakorum_lu = getReg('s_yuan', '和林路');
S.qinghai_region = getReg('s_qing_d', '青海');
S.tibet_region = getReg('s_qing_d', '西藏');
S.kashmir_ladakh = getPol('s_yuan', '克什米尔·拉达克');

// Chinese & Eastern Dynasties
S.jin_1162 = getPol('s_nansong_a', '金');
S.nansong_1162 = getPol('s_nansong_a', '南宋');
S.dali_1162 = getPol('s_nansong_a', '大理');
S.yuan_main = getPol('s_yuan', '元');
S.ming_1405 = getPol('s_ming_a', '明');
S.ming_1500 = getPol('s_ming_b0', '明');
S.beiyuan_1370 = getPol('s_ming_a', '北元');
S.dada_1450 = getPol('s_ming_b0', '鞑靼');
S.wala_1450 = getPol('s_ming_b0', '瓦剌');
S.qing_1680 = getPol('s_qing_b', '清');
S.qing_1727 = getPol('s_qing_c', '清');
S.qing_1759 = getPol('s_qing_d', '清');
S.qing_1864 = getPol('s_qing_f0', '清');
S.qing_1881 = getPol('s_qing_f', '清');
S.roc_main = getPol('s_roc', '中华民国');

// Derived composite shapes for specific Central Asian regimes
S.khwarezm_1187 = mergeShapes(S.khwarezm_core, S.merv_turkmen);
S.khwarezm_1200 = mergeShapes(S.khwarezm_core, S.merv_turkmen, S.khorasan_herat, clipShapeHalfPlane(S.iran_mod, 0, -1, -32.0));
S.khwarezm_1211 = mergeShapes(
  S.khwarezm_1200,
  S.mawarannahr_core,
  S.fergana,
  S.syr_steppe,
  S.badakhshan_pamir,
  S.kabul_kandahar
);

S.ghurid_1162 = mergeShapes(S.khorasan_herat, S.kabul_kandahar, S.badakhshan_pamir);
S.ghurid_1187 = mergeShapes(S.khorasan_herat, S.kabul_kandahar, S.badakhshan_pamir, clipShapeHalfPlane(S.pakistan_mod, 0, -1, -29.0));
S.ghurid_1200 = mergeShapes(S.kabul_kandahar, S.badakhshan_pamir, clipShapeHalfPlane(S.pakistan_mod, 0, -1, -28.0));

S.mongol_1206 = S.mongol_tribes_all;
S.mongol_1211 = mergeShapes(S.mongol_tribes_all, S.dzungaria_full, S.qocho_uyghur, S.semirechye_north);
S.mongol_1218 = mergeShapes(S.mongol_1211, S.tarim_full, S.semirechye, S.fergana, S.pamir_east);
S.mongol_1221 = mergeShapes(
  S.mongol_1218,
  S.khwarezm_1211,
  S.xixia,
  clipShapeHalfPlane(S.jin_1162, 0, -1, -36.5)
);

// Appanages (1227 - 1269)
S.jochi_ulus_1227 = mergeShapes(S.kipchak_steppe, S.khwarezm_core, S.syr_steppe);
S.jochi_ulus_1241 = S.golden_horde;
S.ogedei_ulus = mergeShapes(S.ili_tarbagatai, clipShapeHalfPlane(S.naiman_tribe, 1, 0, 93.5));
S.chagatai_1227 = mergeShapes(S.mawarannahr_core, S.fergana, S.semirechye, S.kashgaria_west, S.badakhshan_pamir);
S.chagatai_1241 = mergeShapes(S.chagatai_1227, S.kucha_karashahr);
S.tolui_mongol_1227 = mergeShapes(
  clipShapeHalfPlane(S.mongol_tribes_all, -1, 0, -93.5),
  S.urumqi_barkol,
  S.qocho_uyghur,
  S.xixia,
  clipShapeHalfPlane(S.jin_1162, 0, -1, -34.2)
);
S.khorasan_mongol_gov = mergeShapes(S.merv_turkmen, S.khorasan_herat, S.kabul_kandahar, clipShapeHalfPlane(S.iran_mod, 0, -1, -31.0));

// Kaidu & Chagatai Split (1269 - 1370)
S.kaidu_ulus_1269 = mergeShapes(S.ogedei_ulus, S.semirechye, S.kashgaria_west, S.fergana);
S.chagatai_1269 = mergeShapes(S.mawarannahr_core, S.badakhshan_pamir, S.kabul_kandahar);
S.kaidu_chagatai_1301 = mergeShapes(S.chagatai_yuan, S.ogedei_ulus);
S.west_chagatai_1347 = mergeShapes(S.mawarannahr_core, S.badakhshan_pamir, S.kabul_kandahar);
S.moghulistan_1347 = mergeShapes(S.semirechye, S.ili_tarbagatai, S.tarim_full, S.qocho_uyghur, S.fergana);
S.moghulistan_1405 = mergeShapes(S.semirechye, S.dzungaria_full, S.tarim_full, S.qocho_uyghur);
S.moghulistan_1469 = mergeShapes(S.semirechye, S.tarim_full, S.qocho_uyghur, S.fergana);
S.kartids_herat = mergeShapes(S.khorasan_herat, S.merv_turkmen);

// Timurid & Uzbek / Kazakh / Yarkand (1370 - 1640)
S.timurid_1370 = mergeShapes(S.mawarannahr_core, S.badakhshan_pamir, clipShapeHalfPlane(S.afghan_mod, 0, -1, -34.5));
S.timurid_1447 = mergeShapes(S.timurid_west, S.fergana, S.khwarezm_core);
S.timurid_samarkand_1469 = mergeShapes(S.mawarannahr_core, S.badakhshan_pamir, S.fergana);
S.timurid_herat_1469 = mergeShapes(S.khorasan_herat, S.merv_turkmen, S.kabul_kandahar, S.khwarezm_core);
S.abul_khayr_uzbek = mergeShapes(S.syr_steppe, S.kazakh_middle_juz, S.kazakh_little_juz);
S.kazakh_1469 = mergeShapes(S.semirechye_north, clipShapeHalfPlane(S.kazakh_middle_juz, -1, 0, -71.0));
S.shaybanid_1507 = mergeShapes(S.mawarannahr_core, S.fergana, S.khwarezm_core, S.syr_steppe, S.khorasan_herat, S.merv_turkmen, S.badakhshan_pamir);
S.shaybanid_1514 = mergeShapes(S.mawarannahr_core, S.fergana, S.syr_steppe, S.badakhshan_pamir, clipShapeHalfPlane(S.afghan_mod, 0, -1, -35.2));
S.bukhara_1580 = mergeShapes(S.shaybanid_1514, S.khorasan_herat);
S.bukhara_1640 = mergeShapes(S.mawarannahr_core, S.fergana, S.badakhshan_pamir, clipShapeHalfPlane(S.afghan_mod, 0, -1, -35.5));
S.bukhara_1709 = mergeShapes(S.mawarannahr_core, S.hisar_badakhshan);
S.kokand_1709 = mergeShapes(S.fergana, S.pamir_east);
S.kokand_1820 = mergeShapes(S.fergana, S.pamir_east, S.syr_steppe, clipShapeHalfPlane(S.semirechye, 1, 0, 75.5));
S.yarkand_khanate = mergeShapes(S.tarim_full, S.qocho_uyghur);
S.khoshut_khanate = mergeShapes(S.qinghai_region, S.tibet_region);
S.dzungar_1640 = mergeShapes(S.dzungaria_full, S.kobdo_urianghai, clipShapeHalfPlane(S.semirechye, -1, 0, -75.0));
S.dzungar_1680 = mergeShapes(S.dzungar_1640, S.yarkand_khanate, S.semirechye);

// Great Game & Modern (1759 - 1949)
S.yakub_beg_1864 = mergeShapes(S.tarim_full, S.qocho_uyghur, S.urumqi_barkol);
S.russian_steppe_1820 = mergeShapes(S.russia_mod, S.kazakh_little_juz, S.kazakh_middle_juz);
S.russian_turkestan_1864 = mergeShapes(S.russia_mod, S.kazakh_mod, S.kyrgyz_mod, clipShapeHalfPlane(S.uzbek_mod, 0, -1, -40.5));
S.russian_empire_1881 = mergeShapes(S.russia_mod, S.kazakh_mod, S.kyrgyz_mod, S.turkmen_mod, S.tajik_mod, S.fergana, S.syr_steppe, S.samarkand_kesh);
S.turkestan_assr_1917 = mergeShapes(S.semirechye, S.syr_steppe, S.fergana, S.samarkand_kesh, S.merv_turkmen, S.pamir_east);
S.alash_autonomy_1917 = mergeShapes(S.kazakh_little_juz, S.kazakh_middle_juz);

// Helper to build a polity entry
function pol(title, role, tint, shape, anchorOverride = null) {
  if (!shape) throw new Error(`Null shape for polity ${title}`);
  return {
    title,
    role,
    tint,
    anchor: anchorOverride || shapeAnchor(shape),
    shape,
  };
}

// Helper to build a region entry
function reg(title, category, shape, anchorOverride = null) {
  if (!shape) throw new Error(`Null shape for region ${title}`);
  return {
    title,
    category,
    anchor: anchorOverride || shapeAnchor(shape),
    shape,
  };
}

// Helper to build a prefecture entry
function pref(title, category, shape) {
  if (!shape) throw new Error(`Null shape for pref ${title}`);
  return {
    title,
    category,
    shape,
  };
}

// Standard detailed sub-regions (regions) and prefectures for Central Asia
function buildCentralAsiaRegions(eraType) {
  if (eraType === 'pre_mongol') {
    return [
      reg('セミレチエ（ベラサグン直轄）', '直轄領', S.semirechye, [75.8, 43.4]),
      reg('マー・ワラー・アンナフル', '属領', S.mawarannahr_core, [65.5, 39.8]),
      reg('フェルガナ盆地', '属領', S.fergana, [71.8, 40.8]),
      reg('カシュガル・ヤルカンド（西域西道）', '属領', S.kashgar_yarkand, [77.2, 39.2]),
      reg('ホータン（于闐）', '属領', S.khotan_oasis, [80.2, 37.1]),
      reg('クチャ・カラシャール（西域北道）', '属領', S.kucha_karashahr, [84.8, 41.2]),
      reg('ビシュバリク・高昌（ウイグル領）', '王国領', S.turfan_beshbaliq, [89.2, 43.1]),
      reg('ホラズム', '州域', S.khwarezm_core, [59.8, 42.1]),
      reg('ホラーサーン', '州域', S.khorasan_herat, [61.8, 35.2]),
      reg('トハリスターン・バダフシャーン', '州域', S.badakhshan_pamir, [70.2, 38.2]),
      reg('シル河下流・オトラル地方', '辺境州', S.syr_steppe, [67.2, 43.6]),
      reg('河西（沙州・甘州・涼州）', '西夏領', S.gansu_yuan, [99.5, 39.2]),
    ];
  }
  if (eraType === 'mongol_yuan') {
    return [
      reg('マー・ワラー・アンナフル（マスウード・ベク管区）', '行省・総督区', S.mawarannahr_core, [65.5, 39.8]),
      reg('アルマリク・イリ渓谷（チャガタイ本営）', '中枢オルド', S.ili_tarbagatai, [81.2, 44.2]),
      reg('セミレチエ（チュー・タラス河谷）', '遊牧本営', S.semirechye, [74.8, 43.4]),
      reg('フェルガナ', '州域', S.fergana, [71.8, 40.8]),
      reg('カシュガル・ヤルカンド', 'オアシス管区', S.kashgar_yarkand, [77.2, 39.2]),
      reg('ホータン（于闐）', 'オアシス管区', S.khotan_oasis, [80.2, 37.1]),
      reg('クチャ・カラシャール', 'オアシス管区', S.kucha_karashahr, [84.8, 41.2]),
      reg('ビシュバリク・高昌（イディクート領）', '都護府・王国', S.turfan_beshbaliq, [89.2, 43.1]),
      reg('ホラズム（ジョチ・ウルス南境）', 'ウルス分地', S.khwarezm_core, [59.8, 42.1]),
      reg('キプチャク草原・シル河流域', 'ウルス分地', S.syr_steppe, [67.2, 44.2]),
      reg('ホラーサーン（アム河等処行省）', '行省', S.khorasan_herat, [61.8, 35.2]),
      reg('嶺北行省（カラコルム）', '行省', S.lingbei_yuan, [102.8, 47.2]),
      reg('甘粛行省（敦煌・酒泉・張掖）', '行省', S.gansu_yuan, [99.5, 39.2]),
    ];
  }
  if (eraType === 'timurid_uzbek') {
    return [
      reg('サマルカンド直轄州（マー・ワラー・アンナフル）', '中枢州', S.samarkand_kesh, [66.9, 39.6]),
      reg('ブハラ州', '中枢州', S.bukhara_oasis, [64.2, 39.8]),
      reg('フェルガナ州（アンディジャン）', '分封州', S.fergana, [71.8, 40.8]),
      reg('ヒッサール・バダフシャーン州', '分封州', S.hisar_badakhshan, [69.5, 37.6]),
      reg('ホラーサーン州（ヘラート）', '中枢州', S.khorasan_herat, [62.2, 34.6]),
      reg('カーブル・ガズナ州', '分封州', S.kabul_kandahar, [68.5, 33.2]),
      reg('ホラズム州（ウルゲンチ・ヒヴァ）', '州域', S.khwarezm_core, [59.8, 42.1]),
      reg('トルキスタン（ヤシ・オトラル・スィグナク）', '北辺要衝', S.syr_steppe, [67.5, 43.4]),
      reg('ジェティス（モグーリスタン西部）', '遊牧領', S.semirechye, [75.5, 43.5]),
      reg('イリ・エミル（モグーリスタン北境）', '遊牧領', S.ili_tarbagatai, [82.0, 44.8]),
      reg('カシュガル・ヤルカンド（マンглаイ・スベ）', 'オアシス領', S.kashgar_yarkand, [77.2, 38.8]),
      reg('ホータン（于闐）', 'オアシス領', S.khotan_oasis, [80.2, 37.1]),
      reg('アクス・クチャ・カラシャール', 'オアシス領', S.kucha_karashahr, [84.5, 41.2]),
      reg('トルファン（高昌）・ビシュバリク', '東境領', S.turfan_beshbaliq, [89.2, 43.0]),
      reg('ハミ衛（哈密・関西七衛）', '羈縻衛所', S.hami_wei, [93.8, 42.5]),
    ];
  }
  if (eraType === 'qing_great_game') {
    return [
      reg('イリ将軍直轄（天山北路・ジュンガリア）', '将軍轄区', S.dzungaria_full, [84.5, 44.8]),
      reg('カシュガル参賛大臣轄区（天山南路西四城）', '回部八城', S.kashgar_yarkand, [77.0, 39.0]),
      reg('ホータン（于闐）直隷州', '回部八城', S.khotan_oasis, [80.2, 37.1]),
      reg('アクス・クチャ・カラシャール（東四城）', '回部八城', S.kucha_karashahr, [84.5, 41.2]),
      reg('鎮西府・吐魯番庁・哈密庁（東路）', '州府', S.hami_wei, [92.8, 42.8]),
      reg('セミレチエ州（ロシア領七河州）', '州（オブラスチ）', S.semirechye, [76.5, 44.0]),
      reg('シルダリヤ州（タシュケント）', '州（オブラスチ）', S.syr_steppe, [67.8, 43.2]),
      reg('フェルガナ州（コーカンド）', 'ハン国・州', S.fergana, [71.8, 40.8]),
      reg('サマルカンド・ブハラ地方', 'アミール国・州', S.mawarannahr_core, [65.5, 39.8]),
      reg('ヒヴァ・ホラズム地方', 'ハン国', S.khwarezm_core, [59.8, 42.1]),
      reg('ザカスピ州（トルクメニスタン・メルヴ）', '州（オブラスチ）', S.merv_turkmen, [59.5, 38.8]),
      reg('ウリヤスタイ・コブド（外モンゴル）', '将軍轄区', S.uliasutai_qing, [98.5, 47.8]),
      reg('青海辦事大臣轄区', '大臣轄区', S.qinghai_region, [96.2, 35.6]),
    ];
  }
  // modern_ca (1917 - 1949)
  return [
    reg('カザフSSR', '連邦構成共和国', S.kazakh_mod, [67.5, 48.0]),
    reg('ウズベクSSR', '連邦構成共和国', S.uzbek_mod, [64.5, 41.2]),
    reg('トルクメンSSR', '連邦構成共和国', S.turkmen_mod, [59.2, 39.0]),
    reg('キルギスSSR', '連邦構成共和国', S.kyrgyz_mod, [74.8, 41.5]),
    reg('タジクSSR', '連邦構成共和国', S.tajik_mod, [71.0, 38.6]),
    reg('天山北路（迪化道・イリ道・タルバガタイ道）', '新疆省道区', S.dzungaria_full, [85.0, 44.8]),
    reg('天山南路・カシュガル道（喀什道）', '新疆省道区', S.kashgar_yarkand, [77.0, 39.2]),
    reg('ホータン道（和闐道）', '新疆省道区', S.khotan_oasis, [80.2, 37.1]),
    reg('アクス・焉耆道（阿克蘇道）', '新疆省道区', S.kucha_karashahr, [84.8, 41.2]),
    reg('モンゴル人民共和国', '人民共和国', S.mongolia_mod, [103.5, 46.8]),
    reg('甘粛省（河西回廊）', '省', S.gansu_yuan, [100.2, 38.8]),
    reg('青海省', '省', S.qinghai_region, [96.2, 35.6]),
  ];
}

function buildCentralAsiaPrefectures() {
  return [
    pref('サマルカンド州', '中枢州', S.samarkand_kesh),
    pref('ブハラ州', '中枢州', S.bukhara_oasis),
    pref('フェルガナ州（アンディジャン・コーカンド）', '州域', S.fergana),
    pref('ホラズム州（ウルゲンチ・ヒヴァ）', '州域', S.khwarezm_core),
    pref('セミレチエ（ベラサグン・アルマリク）', '州域', S.semirechye),
    pref('オトラル・ヤシ（シル河中流域）', '州域', S.syr_steppe),
    pref('ヒッサール・バダフシャーン', '州域', S.badakhshan_pamir),
    pref('メルヴ・トルクメン', '州域', S.merv_turkmen),
    pref('ホラーサーン（ヘラート・バルフ）', '州域', S.khorasan_herat),
    pref('カーブル・ガズナ', '州域', S.kabul_kandahar),
    pref('カシュガル・ヤルカンド（疏勒・葉爾羌）', '西域オアシス', S.kashgar_yarkand),
    pref('ホータン（于闐）', '西域オアシス', S.khotan_oasis),
    pref('クチャ・カラシャール（亀茲・焉耆）', '西域オアシス', S.kucha_karashahr),
    pref('トルファン・ビシュバリク（高昌・北庭）', '西域オアシス', S.turfan_beshbaliq),
    pref('イリ・タルバガタイ（クルジャ・チョグチャク）', '天山北路', S.ili_tarbagatai),
    pref('ハミ（哈密）', '西域東門', S.hami_wei),
    pref('沙州（敦煌）', '河西四郡', S.shazhou_dunhuang),
    pref('粛州（酒泉）', '河西四郡', S.suzhou_jiuquan),
    pref('甘州（張掖）', '河西四郡', S.ganzhou_zhangye),
    pref('エジナ（亦集乃）', '漠南要衝', S.ejina_ruoshui),
    pref('カラコルム（和林）', '漠北都城', S.karakorum_lu),
  ];
}

const COMMON_PREFS = buildCentralAsiaPrefectures();
const REG_PRE_MONGOL = buildCentralAsiaRegions('pre_mongol');
const REG_MONGOL_YUAN = buildCentralAsiaRegions('mongol_yuan');
const REG_TIMURID_UZBEK = buildCentralAsiaRegions('timurid_uzbek');
const REG_QING_GREAT_GAME = buildCentralAsiaRegions('qing_great_game');
const REG_MODERN_CA = buildCentralAsiaRegions('modern_ca');

// ---------------- 33 Snapshots across 9 Eras (1162 - 1949) ----------------
const SNAPSHOTS = {
  neighbors: [
    { title: 'カザフスタン', shape: S.kazakh_mod },
    { title: 'ウズベキスタン', shape: S.uzbek_mod },
    { title: 'トルクメニスタン', shape: S.turkmen_mod },
    { title: 'キルギス', shape: S.kyrgyz_mod },
    { title: 'タジキスタン', shape: S.tajik_mod },
    { title: 'アフガニスタン', shape: S.afghan_mod },
    { title: 'イラン', shape: S.iran_mod },
    { title: 'パキスタン', shape: S.pakistan_mod },
    { title: 'インド', shape: S.india_mod },
    { title: 'ロシア', shape: S.russia_mod },
    { title: 'モンゴル', shape: S.mongolia_mod },
  ],

  // Era 1: 1162 - 1206 (Kara-Khitai, Khwarezm, Steppe Tribes)
  s_ca_1162: {
    polities: [
      pol('カラ・キタイ（西遼）', 'main', '#7b4397', S.karakhitai_full, [76.2, 43.2]),
      pol('西カラ・ハン朝', 'protectorate', '#a66fb5', S.west_karakhanid, [66.2, 40.0]),
      pol('東カラ・ハン朝', 'protectorate', '#965ea8', S.east_karakhanid, [76.5, 39.2]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_core, [59.6, 42.1]),
      pol('ゴール朝・セルジューク東方諸侯', 'rival', '#d48b3b', S.ghurid_1162, [64.2, 34.5]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 48.5]),
      pol('ナイマン部', 'rival', '#5b7a9c', S.naiman_tribe, [91.5, 47.8]),
      pol('ケレイト部', 'rival', '#4a89aa', S.kereit_tribe, [103.5, 46.5]),
      pol('メルキト部', 'rival', '#647687', S.merkit_tribe, [104.5, 51.2]),
      pol('モンゴル部', 'rival', '#b83b2b', S.mongol_ulus_1162, [111.5, 48.6]),
      pol('タタル部', 'rival', '#7c6f64', S.tatar_tribe, [116.5, 46.2]),
      pol('西夏', 'rival', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', S.jin_1162, [114.5, 38.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_PRE_MONGOL,
    prefectures: COMMON_PREFS,
  },

  s_ca_1187: {
    polities: [
      pol('カラ・キタイ（西遼）', 'main', '#7b4397', S.karakhitai_full, [76.2, 43.2]),
      pol('西カラ・ハン朝', 'protectorate', '#a66fb5', S.west_karakhanid, [66.2, 40.0]),
      pol('東カラ・ハン朝', 'protectorate', '#965ea8', S.east_karakhanid, [76.5, 39.2]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_1187, [59.8, 40.8]),
      pol('ゴール朝', 'rival', '#d48b3b', S.ghurid_1187, [65.5, 34.0]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 48.5]),
      pol('ナイマン部', 'rival', '#5b7a9c', S.naiman_tribe, [91.5, 47.8]),
      pol('ケレイト部', 'rival', '#4a89aa', S.kereit_tribe, [103.5, 46.5]),
      pol('メルキト部', 'rival', '#647687', S.merkit_tribe, [104.5, 51.2]),
      pol('モンゴル部（テムジン）', 'rival', '#b83b2b', S.mongol_ulus_1162, [111.5, 48.6]),
      pol('タタル部', 'rival', '#7c6f64', S.tatar_tribe, [116.5, 46.2]),
      pol('西夏', 'rival', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', S.jin_1162, [114.5, 38.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_PRE_MONGOL,
    prefectures: COMMON_PREFS,
  },

  s_ca_1200: {
    polities: [
      pol('カラ・キタイ（西遼）', 'main', '#7b4397', S.karakhitai_full, [76.2, 43.2]),
      pol('西カラ・ハン朝', 'protectorate', '#a66fb5', S.west_karakhanid, [66.2, 40.0]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_1200, [60.2, 38.5]),
      pol('ゴール朝', 'rival', '#d48b3b', S.ghurid_1200, [68.8, 33.5]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 48.5]),
      pol('ナイマン部', 'rival', '#5b7a9c', S.naiman_tribe, [91.5, 47.8]),
      pol('ケレイト部', 'rival', '#4a89aa', S.kereit_tribe, [103.5, 46.5]),
      pol('モンゴル部（テムジン）', 'rival', '#b83b2b', mergeShapes(S.mongol_ulus_1162, S.tatar_tribe, S.merkit_tribe), [111.5, 48.2]),
      pol('西夏', 'rival', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', S.jin_1162, [114.5, 38.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_PRE_MONGOL,
    prefectures: COMMON_PREFS,
  },

  // Era 2: 1206 - 1227 (Rise of Genghis Khan & Conquest of Central Asia)
  s_ca_1206: {
    polities: [
      pol('モンゴル帝国', 'main', '#b83b2b', S.mongol_1206, [104.5, 47.8]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_1200, [60.5, 38.5]),
      pol('カラ・キタイ（西遼）', 'rival', '#7b4397', S.karakhitai_full, [76.2, 43.2]),
      pol('西カラ・ハン朝', 'protectorate', '#a66fb5', S.west_karakhanid, [66.2, 40.0]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 48.5]),
      pol('西夏', 'rival', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', S.jin_1162, [114.5, 38.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_PRE_MONGOL,
    prefectures: COMMON_PREFS,
  },

  s_ca_1211: {
    polities: [
      pol('モンゴル帝国', 'main', '#b83b2b', S.mongol_1211, [102.5, 47.5]),
      pol('天山ウイグル王国（モンゴル帰順）', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_1211, [63.5, 39.2]),
      pol('カラ・キタイ（クチュルク政権）', 'rival', '#7b4397', mergeShapes(S.semirechye, S.tarim_full), [77.8, 40.5]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 49.0]),
      pol('西夏（モンゴル服属）', 'protectorate', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', S.jin_1162, [114.5, 38.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_PRE_MONGOL,
    prefectures: COMMON_PREFS,
  },

  s_ca_1218: {
    polities: [
      pol('モンゴル帝国', 'main', '#b83b2b', S.mongol_1218, [94.0, 45.5]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('ホラズム・シャー朝', 'rival', '#2a8c82', S.khwarezm_1211, [63.5, 39.2]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_steppe, [67.0, 49.0]),
      pol('西夏', 'protectorate', '#b37428', S.xixia, [103.2, 38.8]),
      pol('金', 'rival', '#8d6e63', clipShapeHalfPlane(S.jin_1162, 0, 1, 36.5), [114.5, 34.8]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1221: {
    polities: [
      pol('モンゴル帝国', 'main', '#b83b2b', S.mongol_1221, [85.0, 43.8]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('キプチャク諸部', 'rival', '#8c7a5b', S.kipchak_west, [61.5, 49.5]),
      pol('デリー・スルターン朝（奴隷王朝）', 'rival', '#688f4e', clipShapeHalfPlane(S.pakistan_mod, 0, 1, 32.5), [72.5, 29.5]),
      pol('金（河南残領）', 'rival', '#8d6e63', clipShapeHalfPlane(S.jin_1162, 0, 1, 35.8), [114.5, 34.5]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃諸部', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  // Era 3: 1227 - 1269 (Expansion of Mongol Empire & Formation of Four Uluses)
  s_ca_1227: {
    polities: [
      pol('チャガタイ・ウルス', 'main', '#c86428', S.chagatai_1227, [72.5, 41.2]),
      pol('オゴデイ・ウルス', 'rival', '#8e44ad', S.ogedei_ulus, [84.5, 46.2]),
      pol('ジョチ・ウルス', 'rival', '#3b7a57', S.jochi_ulus_1227, [64.5, 46.8]),
      pol('モンゴル帝国（大ハーン直轄・トルイ領）', 'rival', '#b83b2b', S.tolui_mongol_1227, [103.5, 44.5]),
      pol('ホラーサーン総督区（モンゴル帝国）', 'protectorate', '#d48b3b', S.khorasan_mongol_gov, [61.8, 35.2]),
      pol('天山ウイグル王国（イディクート領）', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('金', 'rival', '#8d6e63', clipShapeHalfPlane(S.jin_1162, 0, 1, 35.5), [114.5, 34.2]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃', 'protectorate', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1241: {
    polities: [
      pol('チャガタイ・ウルス', 'main', '#c86428', S.chagatai_1241, [73.5, 40.8]),
      pol('オゴデイ・ウルス', 'rival', '#8e44ad', S.ogedei_ulus, [84.5, 46.2]),
      pol('ジョチ・ウルス（キプチャク・ハン国）', 'rival', '#3b7a57', S.jochi_ulus_1241, [67.0, 49.0]),
      pol('モンゴル帝国（大ハーン直轄領）', 'rival', '#b83b2b', mergeShapes(S.tolui_mongol_1227, S.jin_1162), [106.0, 42.5]),
      pol('アム河等処行尚書省（ホラーサーン）', 'protectorate', '#d48b3b', S.khorasan_mongol_gov, [61.8, 35.2]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃（モンゴル帰順）', 'protectorate', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1259: {
    polities: [
      pol('チャガタイ・ウルス', 'main', '#c86428', S.chagatai_1241, [73.5, 40.8]),
      pol('ジョチ・ウルス（キプチャク・ハン国）', 'rival', '#3b7a57', S.jochi_ulus_1241, [67.0, 49.0]),
      pol('フレグ・ウルス（イル・ハン国）', 'rival', '#9b59b6', S.ilkhanate_full, [61.5, 34.5]),
      pol('オゴデイ・ウルス（ハイドゥ領）', 'rival', '#8e44ad', S.ogedei_ulus, [83.5, 46.2]),
      pol('モンゴル帝国（大ハーン直轄領）', 'rival', '#b83b2b', mergeShapes(S.tolui_mongol_1227, S.jin_1162, S.dali_1162), [105.5, 41.5]),
      pol('天山ウイグル王国', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('南宋', 'rival', '#b55d4c', S.nansong_1162, [114.0, 28.5]),
      pol('吐蕃（宣政院轄地）', 'protectorate', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  // Era 4: 1269 - 1370 (Kaidu-Kublai War & East-West Split of Chagatai Khanate)
  s_ca_1269: {
    polities: [
      pol('ハイドゥ・ウルス（ハイドゥの国）', 'main', '#8e44ad', S.kaidu_ulus_1269, [78.5, 43.8]),
      pol('チャガタイ・ハン国（バラク／ドゥア）', 'main', '#c86428', S.chagatai_1269, [66.5, 39.2]),
      pol('キプチャク・ハン国（ジョチ・ウルス）', 'rival', '#3b7a57', S.golden_horde, [67.0, 49.0]),
      pol('イル・ハン国（フレグ・ウルス）', 'rival', '#9b59b6', S.ilkhanate_full, [61.5, 34.5]),
      pol('大元ウルス（元）', 'rival', '#2e6b9e', S.yuan_main, [106.5, 40.5]),
      pol('天山ウイグル王国（ビシュバリク・高昌）', 'protectorate', '#c27ba0', S.qocho_uyghur, [88.5, 42.6]),
      pol('カシミール・ラダック', 'rival', '#7c8c64', S.kashmir_ladakh, [76.2, 33.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1301: {
    polities: [
      pol('チャガタイ・ハン国（ドゥア・ハン）', 'main', '#c86428', S.kaidu_chagatai_1301, [73.5, 41.8]),
      pol('キプチャク・ハン国（ジョチ・ウルス）', 'rival', '#3b7a57', S.golden_horde, [67.0, 49.0]),
      pol('イル・ハン国（ガザン・ハン）', 'rival', '#9b59b6', S.ilkhanate_full, [61.5, 34.5]),
      pol('大元ウルス（元）', 'rival', '#2e6b9e', S.yuan_main, [106.5, 40.5]),
      pol('カシミール・ラダック', 'rival', '#7c8c64', S.kashmir_ladakh, [76.2, 33.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1310: {
    polities: [
      pol('チャガタイ・ハン国（ケベク／タルマシリン）', 'main', '#c86428', S.chagatai_yuan, [73.5, 41.5]),
      pol('キプチャク・ハン国（ウズベク・ハン）', 'rival', '#3b7a57', S.golden_horde, [67.0, 49.0]),
      pol('イル・ハン国（オルジェイトゥ）', 'rival', '#9b59b6', S.ilkhanate_full, [61.5, 34.5]),
      pol('大元ウルス（元）', 'rival', '#2e6b9e', S.yuan_main, [106.5, 40.5]),
      pol('デリー・スルターン朝（ハルジー朝／トゥグルク朝）', 'rival', '#688f4e', S.india_mod, [76.5, 28.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  s_ca_1347: {
    polities: [
      pol('西チャガタイ・ハン国（アミール諸部）', 'main', '#c86428', S.west_chagatai_1347, [66.5, 38.8]),
      pol('モグーリスタン・ハン国（東チャガタイ）', 'main', '#5b8c3e', S.moghulistan_1347, [79.5, 42.2]),
      pol('白帳ハン国（ジョチ・ウルス左翼）', 'rival', '#3b7a57', S.white_horde, [66.5, 48.2]),
      pol('クルト朝（ヘラート）・イルハン朝後継諸政権', 'rival', '#9b59b6', S.ilkhanate_full, [61.5, 34.5]),
      pol('大元ウルス（元）', 'rival', '#2e6b9e', S.yuan_main, [106.5, 40.5]),
      pol('デリー・スルターン朝（トゥグルク朝）', 'rival', '#688f4e', S.india_mod, [76.5, 28.5]),
    ],
    regions: REG_MONGOL_YUAN,
    prefectures: COMMON_PREFS,
  },

  // Era 5: 1370 - 1507 (Timurid Empire, Moghulistan & Rise of Uzbeks/Kazakhs)
  s_ca_1370: {
    polities: [
      pol('ティムール朝（ティムール帝国）', 'main', '#1b6ca8', S.timurid_1370, [66.5, 38.8]),
      pol('モグーリスタン・ハン国', 'rival', '#5b8c3e', S.moghulistan_1405, [80.5, 42.5]),
      pol('クルト朝（ヘラート）', 'rival', '#9b59b6', S.kartids_herat, [61.8, 35.2]),
      pol('白帳ハン国（ウルス・ハン）', 'rival', '#3b7a57', S.white_horde, [66.5, 48.2]),
      pol('ホラズム（スーフィー朝）', 'rival', '#2a8c82', S.khwarezm_core, [59.8, 42.1]),
      pol('北元（モンゴル）', 'rival', '#8c6d46', S.beiyuan_1370, [104.5, 46.8]),
      pol('明', 'rival', '#b83b2b', S.ming_1405, [111.5, 35.5]),
      pol('吐蕃（パクモドゥパ政権）', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1405: {
    polities: [
      pol('ティムール朝（ティムール帝国）', 'main', '#1b6ca8', S.timurid_peak, [64.5, 37.5]),
      pol('モグーリスタン・ハン国', 'rival', '#5b8c3e', S.moghulistan_1405, [81.5, 42.2]),
      pol('キプチャク・ハン国（エディゲ／シャディ・ベク）', 'rival', '#3b7a57', S.white_horde, [66.5, 48.5]),
      pol('オイラト（ドルベン・オイラト）', 'rival', '#7b52ab', S.kobdo_urianghai, [92.5, 48.5]),
      pol('韃靼（東モンゴル）', 'rival', '#8c6d46', S.khalkha_proper, [105.5, 47.2]),
      pol('ハミ衛（明朝羈縻）', 'protectorate', '#d48b3b', S.hami_wei, [93.8, 42.5]),
      pol('明', 'rival', '#b83b2b', S.ming_1405, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1447: {
    polities: [
      pol('ティムール朝（シャー・ルフ／ウルグ・ベク）', 'main', '#1b6ca8', S.timurid_1447, [64.2, 37.8]),
      pol('モグーリスタン・ハン国（ワイス・ハン／エセン・ブカ）', 'rival', '#5b8c3e', S.moghulistan_1405, [80.5, 41.8]),
      pol('アブール＝ハイル・ハン国（ウズベク・ウルス）', 'rival', '#2a8c82', S.abul_khayr_uzbek, [66.5, 47.5]),
      pol('オイラト（エセン・タイシ）', 'rival', '#7b52ab', S.wala_1450, [94.5, 47.8]),
      pol('韃靼（東モンゴル）', 'rival', '#8c6d46', S.dada_1450, [108.5, 45.8]),
      pol('ハミ衛（関西七衛）', 'protectorate', '#d48b3b', S.hami_wei, [93.8, 42.5]),
      pol('明', 'rival', '#b83b2b', S.ming_1500, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1469: {
    polities: [
      pol('ティムール朝（サマルカンド政権）', 'main', '#1b6ca8', S.timurid_samarkand_1469, [67.2, 39.5]),
      pol('ティムール朝（ヘラート政権・フサイン・バイカラ）', 'main', '#3a86b8', S.timurid_herat_1469, [62.2, 35.2]),
      pol('モグーリスタン・ハン国（ユーヌス・ハン）', 'rival', '#5b8c3e', S.moghulistan_1469, [80.5, 41.5]),
      pol('カザフ・ハン国（ケレイ／ジャニベク・ハン）', 'rival', '#c98a2c', S.kazakh_1469, [73.5, 45.8]),
      pol('ウズベク諸部（シャイバーニー家）', 'rival', '#2a8c82', mergeShapes(S.kazakh_little_juz, S.syr_steppe), [64.5, 46.8]),
      pol('シビル・ハン国', 'rival', '#5f7d8b', S.sibir_khanate, [71.5, 57.5]),
      pol('オイラト諸部', 'rival', '#7b52ab', S.wala_1450, [91.5, 47.5]),
      pol('東モンゴル（ダヤン・ハーン）', 'rival', '#8c6d46', S.dada_1450, [106.5, 45.8]),
      pol('明', 'rival', '#b83b2b', S.ming_1500, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  // Era 6: 1507 - 1640 (Uzbek Khanates, Kazakh Khanate & Yarkand Khanate)
  s_ca_1507: {
    polities: [
      pol('シャイバーニー朝（ウズベク・ブハラ・ハン国）', 'main', '#2a8c82', S.shaybanid_1507, [64.5, 39.2]),
      pol('カザフ・ハン国（ブルンドゥク／カシム・ハン）', 'rival', '#c98a2c', S.kazakh_khanate, [69.5, 48.2]),
      pol('モグーリスタン・ハン国（マンスール・ハン）', 'rival', '#5b8c3e', S.moghulistan_1469, [81.5, 41.8]),
      pol('バーブル領（カーブル・ガズナ）', 'rival', '#1b6ca8', S.kabul_kandahar, [68.8, 33.8]),
      pol('サファヴィー朝（イスマーイール1世）', 'rival', '#8e44ad', S.iran_mod, [58.8, 33.5]),
      pol('シビル・ハン国', 'rival', '#5f7d8b', S.sibir_khanate, [71.5, 57.5]),
      pol('ノガイ・オルダ', 'rival', '#7c6f64', S.nogai_horde, [59.2, 47.5]),
      pol('オイラト四部', 'rival', '#7b52ab', S.wala_1450, [89.5, 46.8]),
      pol('東モンゴル（ダヤン・ハーン）', 'rival', '#8c6d46', S.dada_1450, [106.5, 45.8]),
      pol('明', 'rival', '#b83b2b', S.ming_1500, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1514: {
    polities: [
      pol('ブハラ・ハン国（シャイバーニー朝）', 'main', '#2a8c82', S.shaybanid_1514, [66.2, 39.8]),
      pol('ヒヴァ・ハン国（ホラズム・アラブシャー朝）', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('ヤルカンド・ハン国（サイード・ハン）', 'main', '#5b8c3e', S.yarkand_khanate, [79.8, 39.5]),
      pol('カザフ・ハン国（カシム・ハン）', 'rival', '#c98a2c', S.kazakh_khanate, [69.5, 48.2]),
      pol('サファヴィー朝', 'rival', '#8e44ad', S.safavid_persia, [60.2, 34.5]),
      pol('バーブル領（のちムガル帝国）', 'rival', '#1b6ca8', mergeShapes(S.kabul_kandahar, clipShapeHalfPlane(S.pakistan_mod, 0, -1, -30.5)), [69.8, 33.2]),
      pol('シビル・ハン国', 'rival', '#5f7d8b', S.sibir_khanate, [71.5, 57.5]),
      pol('ノガイ・オルダ', 'rival', '#7c6f64', S.nogai_horde, [59.2, 47.5]),
      pol('オイラト四部', 'rival', '#7b52ab', S.wala_1450, [88.5, 46.8]),
      pol('東モンゴル（ハルハ・トゥメト）', 'rival', '#8c6d46', S.dada_1450, [106.5, 45.8]),
      pol('明', 'rival', '#b83b2b', S.ming_1500, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1580: {
    polities: [
      pol('ブハラ・ハン国（アブドゥッラーフ2世／ジャーン朝）', 'main', '#2a8c82', S.bukhara_1580, [65.8, 39.2]),
      pol('ヒヴァ・ハン国', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('ヤルカンド・ハン国（アブドゥル・カリーム）', 'main', '#5b8c3e', S.yarkand_khanate, [79.8, 39.5]),
      pol('カザフ・ハン国（ハック・ナザル／タワックル・ハン）', 'rival', '#c98a2c', S.kazakh_khanate, [69.5, 48.2]),
      pol('サファヴィー朝（アッバース1世）', 'rival', '#8e44ad', S.safavid_persia, [59.8, 34.2]),
      pol('ムガル帝国（アクバル大帝）', 'rival', '#688f4e', mergeShapes(S.india_mod, S.pakistan_mod, S.kabul_kandahar, S.kashmir_ladakh), [74.5, 29.8]),
      pol('ロシア・ツァーリ国（シビル・ハン国征服）', 'rival', '#4a6b82', mergeShapes(S.russia_mod, S.sibir_khanate), [72.5, 57.5]),
      pol('オイラト四部（ドルベン・オイラト）', 'rival', '#7b52ab', S.dzungar_1640, [86.5, 46.2]),
      pol('ハルハ・モンゴル／トゥメト（アルタン・ハーン）', 'rival', '#8c6d46', S.dada_1450, [105.5, 46.2]),
      pol('明', 'rival', '#b83b2b', S.ming_1500, [111.5, 35.5]),
      pol('吐蕃', 'rival', '#9e8b76', S.tibet_region, [88.5, 31.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  // Era 7: 1640 - 1759 (Dzungar Empire, Three Uzbek Khanates & Kazakh Three Jüz)
  s_ca_1640: {
    polities: [
      pol('ジュンガル・ホンタイジ国（バートル・ホンタイジ）', 'main', '#7b52ab', S.dzungar_1640, [85.5, 45.8]),
      pol('ヤルカンド・ハン国（アブドゥッラー・ハン）', 'rival', '#5b8c3e', S.yarkand_khanate, [79.8, 39.5]),
      pol('ブハラ・ハン国（ジャーン朝・アシュタルハーン朝）', 'rival', '#2a8c82', S.bukhara_1640, [66.2, 39.5]),
      pol('ヒヴァ・ハン国（アブル・ガーズィー・ハン）', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('カザフ・ハン国（ジャンギル・ハン）', 'rival', '#c98a2c', S.kazakh_khanate, [68.5, 48.2]),
      pol('ホシュート・ハン国（グーシ・ハン）', 'rival', '#b37428', S.khoshut_khanate, [92.5, 33.8]),
      pol('ハルハ三部（トゥシェート・チェチェン・ジャサクト）', 'rival', '#8c6d46', S.khalkha_proper, [104.5, 47.2]),
      pol('サファヴィー朝', 'rival', '#8e44ad', S.safavid_persia, [60.0, 34.5]),
      pol('ムガル帝国（シャー・ジャハーン）', 'rival', '#688f4e', mergeShapes(S.india_mod, S.pakistan_mod, S.kabul_kandahar), [74.5, 29.8]),
      pol('ロシア・ツァーリ国', 'rival', '#4a6b82', S.russia_mod, [76.0, 56.5]),
      pol('清', 'rival', '#c0392b', S.qing_1680, [112.5, 36.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1680: {
    polities: [
      pol('ジュンガル・ハン国（ガルダン・ボショクト・ハーン）', 'main', '#7b52ab', S.dzungar_1680, [83.5, 43.8]),
      pol('白山派ホージャ政権（アパク・ホージャ・ジュンガル宗主下）', 'protectorate', '#9b72cb', S.yarkand_khanate, [78.8, 38.8]),
      pol('ブハラ・ハン国（ジャーン朝）', 'rival', '#2a8c82', S.bukhara_1640, [66.2, 39.5]),
      pol('ヒヴァ・ハン国', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('カザフ・ハン国（タウケ・ハン）', 'rival', '#c98a2c', S.kazakh_khanate, [68.5, 48.2]),
      pol('ホシュート・ハン国', 'rival', '#b37428', S.khoshut_khanate, [92.5, 33.8]),
      pol('ハルハ・モンゴル', 'rival', '#8c6d46', S.khalkha_proper, [104.5, 47.2]),
      pol('サファヴィー朝', 'rival', '#8e44ad', S.safavid_persia, [60.0, 34.5]),
      pol('ムガル帝国（アウラングゼーブ）', 'rival', '#688f4e', mergeShapes(S.india_mod, S.pakistan_mod, S.kabul_kandahar), [74.5, 29.8]),
      pol('ロシア・ツァーリ国', 'rival', '#4a6b82', S.russia_mod, [76.0, 56.5]),
      pol('清（康熙帝）', 'rival', '#c0392b', S.qing_1680, [112.5, 36.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1697: {
    polities: [
      pol('ジュンガル・ハン国（ツェワン・ラブタン）', 'main', '#7b52ab', S.dzungar_peak, [82.5, 43.8]),
      pol('ブハラ・ハン国（ジャーン朝）', 'rival', '#2a8c82', S.bukhara_1709, [65.8, 39.2]),
      pol('コーカンド・ハン国（シャールフ・ビー・1709成立）', 'rival', '#d48b3b', S.kokand_1709, [71.8, 40.6]),
      pol('ヒヴァ・ハン国', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('カザフ・ハン国（タウケ・ハン・三ジュズ連合）', 'rival', '#c98a2c', S.kazakh_khanate, [67.5, 48.2]),
      pol('ホシュート・ハン国（ラサン・ハン）', 'rival', '#b37428', S.khoshut_khanate, [92.5, 33.8]),
      pol('サファヴィー朝', 'rival', '#8e44ad', S.safavid_persia, [60.0, 34.5]),
      pol('ムガル帝国', 'rival', '#688f4e', mergeShapes(S.india_mod, S.pakistan_mod, S.kabul_kandahar), [74.5, 29.8]),
      pol('ロシア帝国（ピョートル1世）', 'rival', '#4a6b82', S.russia_mod, [76.0, 56.5]),
      pol('清（ハルハ服属・康熙親征）', 'rival', '#c0392b', mergeShapes(S.qing_1680, S.khalkha_proper), [108.5, 41.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  s_ca_1727: {
    polities: [
      pol('ジュンガル・ハン国（ガルダン・ツェレン）', 'main', '#7b52ab', S.dzungar_peak, [81.8, 43.8]),
      pol('カザフ小ジュズ（アブル・ハイル・ハン）', 'rival', '#c98a2c', S.kazakh_little_juz, [58.5, 48.5]),
      pol('カザフ中ジュズ（アブライ・スルタン）', 'rival', '#d99b3c', S.kazakh_middle_juz, [71.5, 49.2]),
      pol('カザフ大ジュズ（ジュンガル服属下）', 'protectorate', '#b97a20', S.syr_steppe, [67.5, 43.8]),
      pol('ブハラ・ハン国', 'rival', '#2a8c82', S.bukhara_1709, [65.5, 39.2]),
      pol('コーカンド・ハン国', 'rival', '#d48b3b', S.kokand_1709, [71.8, 40.6]),
      pol('ヒヴァ・ハン国', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('アフシャール朝（ナーディル・シャー）', 'rival', '#8e44ad', mergeShapes(S.iran_mod, S.khorasan_herat, S.kabul_kandahar), [61.2, 34.2]),
      pol('ロシア帝国', 'rival', '#4a6b82', S.russia_mod, [76.0, 56.5]),
      pol('清（青海・チベット平定）', 'rival', '#c0392b', S.qing_1727, [104.5, 37.5]),
    ],
    regions: REG_TIMURID_UZBEK,
    prefectures: COMMON_PREFS,
  },

  // Era 8: 1759 - 1917 (Qing Ili Generalship, Russian Advance & The Great Game)
  s_ca_1759: {
    polities: [
      pol('清（イリ将軍統治・天山南北路平定）', 'main', '#c0392b', S.qing_1759, [88.5, 41.5]),
      pol('ブハラ・アミール国（マンギト朝）', 'main', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('コーカンド・ハン国（エルデネ・ビー／ナルブタ・ビー）', 'main', '#d48b3b', S.kokand_1709, [71.8, 40.6]),
      pol('ヒヴァ・ハン国（コンギラト朝）', 'main', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('カザフ中ジュズ（アブライ・ハン・清露両属）', 'rival', '#d99b3c', S.kazakh_middle_juz, [71.5, 49.2]),
      pol('カザフ大ジュズ', 'rival', '#b97a20', mergeShapes(S.syr_steppe, clipShapeHalfPlane(S.semirechye, 1, 0, 75.5)), [69.5, 43.8]),
      pol('カザフ小ジュズ（ロシア保護領）', 'protectorate', '#7a92a8', S.kazakh_little_juz, [58.5, 48.5]),
      pol('ドゥッラーニー朝（アフマド・シャー）', 'rival', '#688f4e', mergeShapes(S.afghan_mod, S.pakistan_mod, S.kashmir_ladakh), [67.5, 33.2]),
      pol('トルクメン諸部', 'rival', '#8c7a5b', S.merv_turkmen, [59.2, 38.8]),
      pol('ロシア帝国', 'rival', '#4a6b82', S.russia_mod, [76.0, 56.5]),
    ],
    regions: REG_QING_GREAT_GAME,
    prefectures: COMMON_PREFS,
  },

  s_ca_1820: {
    polities: [
      pol('コーカンド・ハン国（ウマル・ハン／マダリ・ハン）', 'main', '#d48b3b', S.kokand_1820, [71.2, 41.8]),
      pol('ブハラ・アミール国（マンギト朝）', 'main', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('ヒヴァ・ハン国（ムハンマド・ラヒーム1世）', 'main', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('清（イリ将軍轄区・新疆）', 'rival', '#c0392b', S.qing_1759, [88.5, 41.5]),
      pol('ロシア帝国（カザフ草原直轄化・シベリア管区）', 'rival', '#4a6b82', S.russian_steppe_1820, [70.5, 51.5]),
      pol('トルクメン諸部（テケ・ヨムート）', 'rival', '#8c7a5b', S.merv_turkmen, [59.2, 38.8]),
      pol('アフガニスタン・バーラクザイ朝', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('ガージャール朝ペルシア', 'rival', '#8e44ad', S.iran_mod, [58.5, 33.5]),
      pol('シク王国・英領インド', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod), [75.5, 29.5]),
    ],
    regions: REG_QING_GREAT_GAME,
    prefectures: COMMON_PREFS,
  },

  s_ca_1864: {
    polities: [
      pol('ロシア帝国（トルキスタン総督府設置・1867）', 'main', '#4a6b82', S.russian_turkestan_1864, [69.5, 46.8]),
      pol('ヤクブ・ベク政権（イェティシャフル・カシュガリア）', 'main', '#5b8c3e', S.yakub_beg_1864, [79.8, 39.8]),
      pol('イリ地方（ロシア占領・1871〜1881）', 'protectorate', '#6b8ba4', S.ili_occupied, [81.8, 43.8]),
      pol('コーカンド・ハン国（フェルガナ残領）', 'protectorate', '#d48b3b', S.kokand_1709, [71.8, 40.6]),
      pol('ブハラ・アミール国（1868ロシア保護国化）', 'protectorate', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('ヒヴァ・ハン国（1873ロシア保護国化）', 'protectorate', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('トルクメン諸部', 'rival', '#8c7a5b', S.merv_turkmen, [59.2, 38.8]),
      pol('清', 'rival', '#c0392b', S.qing_1864, [102.5, 38.5]),
      pol('アフガニスタン・アミール国', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('英領インド帝国', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_QING_GREAT_GAME,
    prefectures: COMMON_PREFS,
  },

  s_ca_1881: {
    polities: [
      pol('ロシア帝国（トルキスタン総督府・ステップ総督府）', 'main', '#4a6b82', S.russian_empire_1881, [68.5, 45.8]),
      pol('ブハラ・アミール国（ロシア保護国）', 'protectorate', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('ヒヴァ・ハン国（ロシア保護国）', 'protectorate', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('清（甘粛新疆省・左宗棠収復／イリ返還）', 'main', '#c0392b', S.qing_1881, [86.5, 41.8]),
      pol('アフガニスタン・アミール国（アブドゥッラフマーン・ハーン）', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('ガージャール朝ペルシア', 'rival', '#8e44ad', S.iran_mod, [58.5, 33.5]),
      pol('英領インド帝国', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_QING_GREAT_GAME,
    prefectures: COMMON_PREFS,
  },

  // Era 9: 1917 - 1949 (Russian Revolution, Soviet Central Asian Republics & Republican Xinjiang)
  s_ca_1917: {
    polities: [
      pol('トルキスタン自治ソビエト社会主義共和国（タシュケント）', 'main', '#b83b2b', S.turkestan_assr_1917, [68.5, 41.8]),
      pol('アラシュ自治国（カザフ自治政府）', 'rival', '#c98a2c', S.alash_autonomy_1917, [67.5, 48.5]),
      pol('ブハラ・アミール国', 'rival', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('ヒヴァ・ハン国', 'rival', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('中華民国（新疆省・楊増新統治）', 'main', '#2e6b9e', S.roc_main, [86.5, 41.5]),
      pol('ボグド・ハーン政権（外モンゴル自治）', 'rival', '#8c6d46', S.mongolia_mod, [103.5, 46.8]),
      pol('ロシア・ソビエト連邦社会主義共和国', 'rival', '#a93226', S.russia_mod, [76.0, 56.5]),
      pol('アフガニスタン王国（1919独立）', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('英領インド帝国', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_MODERN_CA,
    prefectures: COMMON_PREFS,
  },

  s_ca_1920: {
    polities: [
      pol('トルキスタン自治ソビエト社会主義共和国', 'main', '#b83b2b', S.turkestan_assr_1917, [68.5, 41.8]),
      pol('キルギス（カザフ）自治ソビエト社会主義共和国', 'main', '#d35400', S.alash_autonomy_1917, [67.5, 48.5]),
      pol('ブハラ人民ソビエト共和国', 'protectorate', '#2a8c82', S.bukhara_1709, [65.2, 39.2]),
      pol('ホラズム人民ソビエト共和国', 'protectorate', '#3b9c92', S.khwarezm_core, [59.8, 42.1]),
      pol('中華民国（新疆省・楊増新統治）', 'main', '#2e6b9e', S.roc_main, [86.5, 41.5]),
      pol('モンゴル人民革命政府（1921成立）', 'rival', '#8c6d46', S.mongolia_mod, [103.5, 46.8]),
      pol('ロシア・ソビエト連邦社会主義共和国', 'rival', '#a93226', S.russia_mod, [76.0, 56.5]),
      pol('アフガニスタン王国', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('英領インド帝国', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_MODERN_CA,
    prefectures: COMMON_PREFS,
  },

  s_ca_1924: {
    polities: [
      pol('ウズベクSSR（タジクASSR含む）', 'main', '#2a8c82', mergeShapes(S.uzbek_mod, S.tajik_mod), [65.5, 40.5]),
      pol('トルクメンSSR', 'main', '#d48b3b', S.turkmen_mod, [59.2, 39.0]),
      pol('カザフASSR（ロシアSFSR内）', 'main', '#c98a2c', S.kazakh_mod, [67.5, 48.0]),
      pol('キルギスASSR（カラ・キルギス自治州）', 'main', '#3b9c92', S.kyrgyz_mod, [74.8, 41.5]),
      pol('モンゴル人民共和国（1924成立）', 'rival', '#8c6d46', S.mongolia_mod, [103.5, 46.8]),
      pol('中華民国（新疆省・楊増新／金樹仁統治）', 'main', '#2e6b9e', S.roc_main, [86.5, 41.5]),
      pol('ソビエト社会主義共和国連邦（ロシアSFSR）', 'rival', '#b83b2b', S.russia_mod, [76.0, 56.5]),
      pol('アフガニスタン王国', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('パフラヴィー朝イラン', 'rival', '#8e44ad', S.iran_mod, [58.5, 33.5]),
      pol('英領インド帝国', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_MODERN_CA,
    prefectures: COMMON_PREFS,
  },

  s_ca_1936: {
    polities: [
      pol('カザフSSR（ソ連構成共和国）', 'main', '#c98a2c', S.kazakh_mod, [67.5, 48.0]),
      pol('ウズベクSSR（ソ連構成共和国）', 'main', '#2a8c82', S.uzbek_mod, [64.5, 41.2]),
      pol('トルクメンSSR（ソ連構成共和国）', 'main', '#d48b3b', S.turkmen_mod, [59.2, 39.0]),
      pol('キルギスSSR（ソ連構成共和国）', 'main', '#3b9c92', S.kyrgyz_mod, [74.8, 41.5]),
      pol('タジクSSR（ソ連構成共和国）', 'main', '#7b52ab', S.tajik_mod, [71.0, 38.6]),
      pol('東トルキスタン共和国（三区革命・イリ政府 1944〜1949）', 'protectorate', '#5b8c3e', S.ili_tarbagatai, [82.5, 44.8]),
      pol('中華民国（新疆省・盛世才政権 → 1949中華人民共和国成立）', 'main', '#2e6b9e', S.roc_main, [87.5, 40.5]),
      pol('モンゴル人民共和国', 'rival', '#8c6d46', S.mongolia_mod, [103.5, 46.8]),
      pol('ソビエト社会主義共和国連邦（ロシアSFSR）', 'rival', '#b83b2b', S.russia_mod, [76.0, 56.5]),
      pol('アフガニスタン王国', 'rival', '#688f4e', S.afghan_mod, [66.5, 33.8]),
      pol('パフラヴィー朝イラン', 'rival', '#8e44ad', S.iran_mod, [58.5, 33.5]),
      pol('インド・パキスタン（1947分離独立）', 'rival', '#a65d4c', mergeShapes(S.india_mod, S.pakistan_mod, S.kashmir_ladakh), [75.5, 29.8]),
    ],
    regions: REG_MODERN_CA,
    prefectures: COMMON_PREFS,
  },
};

// Also alias s_prc to s_ca_1936 so any legacy check in app.js for s_prc succeeds seamlessly
SNAPSHOTS.s_prc = SNAPSHOTS.s_ca_1936;

// ---------------- Lossless VLQ Encoder for atlas_snapshots.js & atlas_boot.js ----------------
const VLQ_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-';
function encodeVlqInt(num) {
  let v = num < 0 ? ((-num) << 1) | 1 : num << 1;
  let s = '';
  do {
    let b = v & 31;
    v >>>= 5;
    if (v > 0) b |= 32;
    s += VLQ_CHARS[b];
  } while (v > 0);
  return s;
}

function encodeRingVlq(ring) {
  let x = 0, y = 0, out = '';
  for (const pt of ring) {
    const nx = Math.round(pt[0] * 100);
    const ny = Math.round(pt[1] * 100);
    out += encodeVlqInt(nx - x) + encodeVlqInt(ny - y);
    x = nx;
    y = ny;
  }
  return out;
}

function packSnapshots(snapDict, onlyKeys = null) {
  const rList = [];
  const rMap = new Map();
  const fList = [];
  const fMap = new Map();
  const dOut = {};

  function addRing(ring) {
    const enc = encodeRingVlq(ring);
    let idx = rMap.get(enc);
    if (idx === undefined) {
      idx = rList.length;
      rList.push(enc);
      rMap.set(enc, idx);
    }
    return idx;
  }

  function addFeat(item) {
    const copy = { ...item };
    if (copy.shape) {
      if (copy.shape.type === 'Polygon') {
        copy.shape = { _p: (copy.shape.coordinates || []).map(addRing) };
      } else if (copy.shape.type === 'MultiPolygon') {
        copy.shape = { _m: (copy.shape.coordinates || []).map((poly) => poly.map(addRing)) };
      }
    }
    const sig = JSON.stringify(copy);
    let idx = fMap.get(sig);
    if (idx === undefined) {
      idx = fList.length;
      fList.push(copy);
      fMap.set(sig, idx);
    }
    return idx;
  }

  for (const [k, val] of Object.entries(snapDict)) {
    if (onlyKeys && !onlyKeys.includes(k)) continue;
    if (Array.isArray(val)) {
      dOut[k] = val.map(addFeat);
    } else if (val && typeof val === 'object') {
      const sc = {};
      for (const [sk, sv] of Object.entries(val)) {
        if ((sk === 'polities' || sk === 'regions' || sk === 'prefectures') && Array.isArray(sv)) {
          sc[sk] = sv.map(addFeat);
        } else {
          sc[sk] = sv;
        }
      }
      dOut[k] = sc;
    }
  }
  return { r: rList, f: fList, d: dOut };
}

function emitSnapshotsFile(packed, isBoot = false) {
  return `/**
 * ${isBoot ? 'Historical Atlas Boot Seed' : 'Historical Atlas Snapshots'} (Central Asia Edition 1162-1949)
 */
(function () {
  'use strict';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-';
  const R = new Uint8Array(128);
  for (let i = 0; i < 64; i++) R[A.charCodeAt(i)] = i;
  const D = ${JSON.stringify(packed)};
  const rc = new Array(D.r.length);
  function ring(idx) {
    let r = rc[idx];
    if (r) return r;
    const s = D.r[idx];
    r = [];
    let i = 0, n = s.length, x = 0, y = 0;
    while (i < n) {
      let b, sh = 0, v = 0;
      do { b = R[s.charCodeAt(i++)]; v |= (b & 31) << sh; sh += 5; } while (b >= 32);
      x += (v & 1) ? ~(v >>> 1) : (v >>> 1);
      sh = 0; v = 0;
      do { b = R[s.charCodeAt(i++)]; v |= (b & 31) << sh; sh += 5; } while (b >= 32);
      y += (v & 1) ? ~(v >>> 1) : (v >>> 1);
      r.push([x / 100, y / 100]);
    }
    return (rc[idx] = r);
  }
  const fc = new Array(D.f.length);
  function feat(idx) {
    let f = fc[idx];
    if (f) return f;
    const raw = D.f[idx];
    const sh = raw.shape;
    if (sh) {
      if (sh._p) {
        const ids = sh._p;
        raw.shape = { type: 'Polygon' };
        Object.defineProperty(raw.shape, 'coordinates', {
          enumerable: true,
          configurable: true,
          get() {
            const v = ids.map(ring);
            Object.defineProperty(this, 'coordinates', { value: v, writable: true, enumerable: true, configurable: true });
            return v;
          }
        });
      } else if (sh._m) {
        const ids = sh._m;
        raw.shape = { type: 'MultiPolygon' };
        Object.defineProperty(raw.shape, 'coordinates', {
          enumerable: true,
          configurable: true,
          get() {
            const v = ids.map((p) => p.map(ring));
            Object.defineProperty(this, 'coordinates', { value: v, writable: true, enumerable: true, configurable: true });
            return v;
          }
        });
      }
    }
    return (fc[idx] = raw);
  }
  const out = ${isBoot ? 'window.ATLAS_SNAPSHOTS || {}' : '{}'};
  for (const [k, s] of Object.entries(D.d)) {
    ${isBoot ? 'if (out[k]) continue;' : ''}
    if (Array.isArray(s)) {
      out[k] = s.map(feat);
    } else if (s && typeof s === 'object') {
      const sc = {};
      for (const [sk, sv] of Object.entries(s)) {
        sc[sk] = (sk === 'polities' || sk === 'prefectures' || sk === 'regions') && Array.isArray(sv) ? sv.map(feat) : sv;
      }
      out[k] = sc;
    }
  }
  window.ATLAS_SNAPSHOTS = out;
  ${isBoot ? '' : 'window.ATLAS_FULL_SNAPSHOTS_LOADED = true;'}
})();
`;
}

// Write atlas_snapshots.js and atlas_boot.js
const fullPacked = packSnapshots(SNAPSHOTS);
const bootPacked = packSnapshots(SNAPSHOTS, ['neighbors', 's_ca_1162']);

fs.writeFileSync(path.join(OUT_DIR, 'js', 'atlas_snapshots.js'), emitSnapshotsFile(fullPacked, false), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'js', 'atlas_boot.js'), emitSnapshotsFile(bootPacked, true), 'utf8');
console.log('Generated js/atlas_snapshots.js and js/atlas_boot.js successfully.');
