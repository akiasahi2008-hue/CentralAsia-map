/**
 * Build Central Asia Geographic Data (china_geo_data.js), Historical Lore Data (lore_data.js),
 * and update index.html initial DOM.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_MAP_JS = 'E:\\マイドライブ\\史書\\map\\js';

global.window = global;
require(path.join(SOURCE_MAP_JS, 'china_geo_data.js'));
require(path.join(SOURCE_MAP_JS, 'lore_data.js'));
const ORIG_LORE = window.ATLAS_LORE_DATA;

function r2(n) { return Math.round(n * 100) / 100; }
function polyRing(pts) {
  const ring = pts.map(p => [r2(p[0]), r2(p[1])]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

// ============================================================================
// 1. UPDATE window.PROVINCE_OUTLINES & window.HYDRO_DATA -> js/china_geo_data.js
// ============================================================================

const PROV_JA_MAP = {
  '新疆维吾尔自治区': '新疆ウイグル自治区',
  '甘肃省': '甘粛省',
  '青海省': '青海省',
  '西藏自治区': 'チベット自治区',
  '内蒙古自治区': '内モンゴル自治区',
  '宁夏回族自治区': '寧夏回族自治区',
  '陕西省': '陝西省',
  '四川省': '四川省',
  '云南省': '雲南省',
  '山西省': '山西省',
  '河北省': '河北省',
  '北京市': '北京市',
  '天津市': '天津市',
  '河南省': '河南省',
  '山东省': '山東省',
  '湖北省': '湖北省',
  '湖南省': '湖南省',
  '重庆市': '重慶市',
  '贵州省': '貴州省',
  '广西壮族自治区': '広西チワン族自治区',
  '广东省': '広東省',
  '江西省': '江西省',
  '安徽省': '安徽省',
  '江苏省': '江蘇省',
  '上海市': '上海市',
  '浙江省': '浙江省',
  '福建省': '福建省',
  '台湾省': '台湾',
  '海南省': '海南省',
  '辽宁省': '遼寧省',
  '吉林省': '吉林省',
  '黑龙江省': '黒竜江省',
  '香港特别行政区': '香港',
  '澳门特别行政区': 'マカオ'
};

const updatedProvinces = (window.PROVINCE_OUTLINES || []).map(p => ({
  ...p,
  title: PROV_JA_MAP[p.title] || p.title
}));

// Modern Central Asian & Neighboring Countries in exact PROVINCE_OUTLINES schema:
// { title, code, hub: [lon, lat], rings: [ [ ring ] ] }
const MODERN_CA_COUNTRIES = [
  {
    title: 'カザフスタン',
    code: 'CA_KZ',
    hub: [67.5, 48.0],
    rings: [[polyRing([[50.0,44.5],[53.5,42.5],[56.0,45.0],[58.5,45.5],[62.0,45.5],[66.0,43.0],[68.0,41.0],[70.0,42.0],[73.5,43.0],[77.0,43.0],[80.2,42.3],[80.5,45.2],[83.0,47.2],[87.3,49.1],[85.0,50.5],[80.0,51.5],[76.0,54.0],[70.0,55.0],[63.0,54.0],[56.0,51.5],[50.0,50.5]])]]
  },
  {
    title: 'ウズベキスタン',
    code: 'CA_UZ',
    hub: [63.8, 41.2],
    rings: [[polyRing([[56.0,41.3],[56.0,45.0],[58.5,45.5],[62.0,45.5],[66.0,43.0],[68.0,41.0],[70.0,42.0],[73.1,40.8],[71.8,40.0],[70.5,40.2],[68.4,39.5],[67.8,37.2],[66.5,37.3],[64.0,39.0],[62.0,40.2],[60.2,41.8]])]]
  },
  {
    title: 'トルクメニスタン',
    code: 'CA_TM',
    hub: [59.0, 38.8],
    rings: [[polyRing([[52.5,37.3],[53.5,42.5],[56.0,41.3],[60.2,41.8],[62.0,40.2],[64.0,39.0],[66.5,37.3],[63.0,35.3],[61.2,35.6],[58.0,37.5],[54.8,37.3]])]]
  },
  {
    title: 'キルギス',
    code: 'CA_KG',
    hub: [74.8, 41.5],
    rings: [[polyRing([[70.0,42.0],[73.5,43.0],[77.0,43.0],[80.2,42.3],[78.5,41.0],[75.0,40.3],[73.8,39.5],[69.5,39.5],[70.5,40.2],[71.8,40.0],[73.1,40.8]])]]
  },
  {
    title: 'タジキスタン',
    code: 'CA_TJ',
    hub: [71.0, 38.6],
    rings: [[polyRing([[67.8,37.2],[68.4,39.5],[70.5,40.2],[69.5,39.5],[73.8,39.5],[75.0,38.5],[74.9,37.2],[71.5,36.8],[68.0,37.0]])]]
  },
  {
    title: 'アフガニスタン',
    code: 'CA_AF',
    hub: [66.0, 34.2],
    rings: [[polyRing([[60.8,31.0],[61.2,35.6],[63.0,35.3],[66.5,37.3],[68.0,37.0],[71.5,36.8],[74.9,37.2],[71.5,34.5],[70.0,33.0],[66.3,29.8],[61.5,29.8]])]]
  },
  {
    title: 'モンゴル',
    code: 'CA_MN',
    hub: [103.5, 46.8],
    rings: [[polyRing([[87.8,49.1],[92.2,50.8],[98.0,51.5],[102.2,51.5],[107.0,50.2],[112.0,49.5],[116.8,49.8],[119.8,46.8],[116.0,44.5],[111.5,43.5],[105.0,41.8],[99.0,42.5],[95.0,43.5],[90.8,45.2],[88.0,48.0]])]]
  }
];

const finalProvinceOutlines = [...MODERN_CA_COUNTRIES, ...updatedProvinces];

const hydro = window.HYDRO_DATA || { rivers: [], lakes: [], labels: [] };

const CA_RIVER_RANK_UPGRADES = {
  'Amu Darya': 1,
  'Syr Darya': 1,
  'Ile': 1,
  'Tarim': 1,
  'Yarkant': 2,
  'Hotan': 2,
  'Aksu': 2,
  'Kaidu': 2,
  'Ertis': 1,
  'Irtysh': 1,
  'Selenga': 2,
  'Orkhon': 2,
  'Kerulen': 2,
  'Indus': 1,
  'Helmand': 2
};

for (const r of hydro.rivers) {
  if (CA_RIVER_RANK_UPGRADES[r.name]) {
    r.rank = CA_RIVER_RANK_UPGRADES[r.name];
  }
}

const EXTRA_CA_RIVERS = [
  {
    name: 'Zeravshan',
    zh: 'ゼラフシャン川',
    rank: 2,
    lines: [[[70.6, 39.45], [69.0, 39.5], [67.5, 39.65], [66.96, 39.72], [65.8, 40.0], [64.42, 39.77], [63.8, 39.4]]]
  },
  {
    name: 'Chu',
    zh: 'チュー川',
    rank: 2,
    lines: [[[75.8, 42.3], [74.6, 42.9], [73.5, 43.4], [71.5, 44.3], [69.2, 45.0], [67.8, 45.2]]]
  },
  {
    name: 'Talas',
    zh: 'タラス川',
    rank: 2,
    lines: [[[73.2, 42.3], [72.2, 42.5], [71.39, 42.9], [70.5, 43.7], [69.8, 44.4]]]
  },
  {
    name: 'Murgab',
    zh: 'ムルガブ川',
    rank: 2,
    lines: [[[65.2, 35.0], [63.8, 35.5], [62.8, 36.2], [62.18, 37.66], [61.8, 38.4]]]
  },
  {
    name: 'Hari Rud',
    zh: 'ハリー・ルード川',
    rank: 2,
    lines: [[[66.2, 34.4], [64.2, 34.35], [62.2, 34.34], [61.15, 35.6], [60.5, 36.5], [60.4, 37.6]]]
  }
];
hydro.rivers.push(...EXTRA_CA_RIVERS);

const EXTRA_CA_LAKES = [
  {
    name: 'Aral Sea',
    zh: 'アラル海',
    rank: 1,
    rings: [polyRing([[58.4,44.2],[58.6,45.8],[59.6,46.6],[61.2,46.7],[61.6,45.8],[61.2,44.5],[60.2,43.5],[58.8,43.6]])]
  },
  {
    name: 'Caspian Sea',
    zh: 'カスピ海',
    rank: 1,
    rings: [polyRing([[49.8,37.2],[50.2,40.3],[50.0,44.5],[51.5,46.8],[53.5,46.2],[53.2,44.5],[51.2,43.2],[52.6,41.5],[53.8,41.2],[52.8,40.0],[53.6,38.8],[53.9,37.0],[51.5,36.7]])]
  },
  {
    name: 'Zaysan Lake',
    zh: 'ザイサン湖',
    rank: 2,
    rings: [polyRing([[83.3,47.8],[83.6,48.2],[84.6,48.1],[84.9,47.7],[84.1,47.6]])]
  },
  {
    name: 'Alakol Lake',
    zh: 'アラコル湖',
    rank: 2,
    rings: [polyRing([[81.3,45.9],[81.6,46.4],[82.1,46.2],[81.9,45.7]])]
  },
  {
    name: 'Bosten Lake',
    zh: 'ボステン湖',
    rank: 2,
    rings: [polyRing([[86.6,41.85],[86.8,42.1],[87.3,42.05],[87.2,41.8]])]
  }
];
hydro.lakes.push(...EXTRA_CA_LAKES);

// Replace HYDRO_DATA.labels with Japanese labels in exact schema: { zh, en, coord: [lon, lat], kind: 'trunk'|'river'|'lake'|'range', rot }
const CA_HYDRO_LABELS = [
  { zh: 'アム川（オクサス川）', en: 'Amu Darya (Oxus)', coord: [62.6, 40.1], kind: 'trunk', rot: -34 },
  { zh: 'シル川（ヤクサルテス川）', en: 'Syr Darya (Jaxartes)', coord: [65.8, 44.3], kind: 'trunk', rot: -28 },
  { zh: 'ゼラフシャン川', en: 'Zeravshan R.', coord: [66.2, 39.85], kind: 'river', rot: -10 },
  { zh: 'チュー川', en: 'Chu R.', coord: [72.2, 43.9], kind: 'river', rot: -25 },
  { zh: 'タラス川', en: 'Talas R.', coord: [71.2, 43.2], kind: 'river', rot: -32 },
  { zh: 'イリ川', en: 'Ili R.', coord: [77.8, 44.1], kind: 'trunk', rot: -18 },
  { zh: 'タリム川', en: 'Tarim R.', coord: [84.2, 41.0], kind: 'trunk', rot: 6 },
  { zh: 'ヤルカンド川', en: 'Yarkand R.', coord: [78.6, 39.5], kind: 'river', rot: -35 },
  { zh: 'ホータン川', en: 'Hotan R.', coord: [80.5, 38.8], kind: 'river', rot: -65 },
  { zh: 'エルティシ川', en: 'Irtysh R.', coord: [81.2, 49.4], kind: 'trunk', rot: -35 },
  { zh: 'オルホン川', en: 'Orkhon R.', coord: [103.5, 48.5], kind: 'river', rot: -40 },
  { zh: 'ケルレン川', en: 'Kerulen R.', coord: [112.0, 47.8], kind: 'river', rot: 15 },
  { zh: 'セレンガ川', en: 'Selenga R.', coord: [105.5, 49.6], kind: 'river', rot: -25 },
  { zh: 'ムルガブ川', en: 'Murgab R.', coord: [62.5, 36.8], kind: 'river', rot: -65 },
  { zh: 'ハリー・ルード川', en: 'Hari Rud', coord: [62.8, 34.45], kind: 'river', rot: 4 },
  { zh: 'インダス川', en: 'Indus R.', coord: [72.2, 32.8], kind: 'trunk', rot: -55 },
  { zh: '黄 河', en: 'Yellow R.', coord: [104.2, 36.3], kind: 'trunk', rot: -20 },
  { zh: 'アラル海', en: 'Aral Sea', coord: [59.9, 45.1], kind: 'lake', rot: 0 },
  { zh: 'カスピ海', en: 'Caspian Sea', coord: [51.8, 40.5], kind: 'lake', rot: 0 },
  { zh: 'バルハシ湖', en: 'Lake Balkhash', coord: [75.5, 46.2], kind: 'lake', rot: -12 },
  { zh: 'イシク湖', en: 'Issyk-Kul', coord: [77.3, 42.45], kind: 'lake', rot: 0 },
  { zh: 'ザイサン湖', en: 'Lake Zaysan', coord: [84.1, 47.9], kind: 'lake', rot: 0 },
  { zh: 'アラコル湖', en: 'Lake Alakol', coord: [81.7, 46.1], kind: 'lake', rot: 0 },
  { zh: 'ボステン湖', en: 'Bosten Lake', coord: [87.0, 41.95], kind: 'lake', rot: 0 },
  { zh: 'ロプノール（羅布泊）', en: 'Lop Nur', coord: [90.3, 40.2], kind: 'lake', rot: 0 },
  { zh: 'フブスグル湖', en: 'Lake Khövsgöl', coord: [100.4, 51.0], kind: 'lake', rot: 0 },
  { zh: 'バイカル湖', en: 'Lake Baikal', coord: [107.8, 53.3], kind: 'lake', rot: -35 },
  { zh: '青海湖', en: 'Qinghai Lake', coord: [100.2, 36.9], kind: 'lake', rot: 0 },
  { zh: '天山山脈', en: 'Tian Shan', coord: [81.5, 42.4], kind: 'range', rot: -8 },
  { zh: 'パミール高原', en: 'Pamir Mountains', coord: [73.2, 38.3], kind: 'range', rot: -15 },
  { zh: '崑崙山脈', en: 'Kunlun Mountains', coord: [82.5, 36.0], kind: 'range', rot: 6 },
  { zh: 'アルタイ山脈', en: 'Altai Mountains', coord: [89.0, 48.0], kind: 'range', rot: -32 },
  { zh: 'ヒンドゥークシュ山脈', en: 'Hindu Kush', coord: [69.0, 35.5], kind: 'range', rot: -25 },
  { zh: 'カラコルム山脈', en: 'Karakoram', coord: [76.5, 35.8], kind: 'range', rot: -30 },
  { zh: '祁連山脈', en: 'Qilian Mountains', coord: [98.5, 38.4], kind: 'range', rot: -28 },
  { zh: 'タクラマカン砂漠', en: 'Taklamakan Desert', coord: [82.8, 39.2], kind: 'range', rot: 0 },
  { zh: 'キジルクム砂漠', en: 'Kyzylkum Desert', coord: [63.8, 42.6], kind: 'range', rot: -15 },
  { zh: 'カラクム砂漠', en: 'Karakum Desert', coord: [59.2, 39.2], kind: 'range', rot: -12 }
];
hydro.labels = CA_HYDRO_LABELS;

const geoOut = `// Generated Central Asia + China Geo Data
window.CHINA_OUTLINE = ${JSON.stringify(window.CHINA_OUTLINE)};
window.PROVINCE_OUTLINES = ${JSON.stringify(finalProvinceOutlines)};
window.RIVER_PATHS = ${JSON.stringify(window.RIVER_PATHS || [])};
window.HYDRO_DATA = ${JSON.stringify(hydro)};
`;
fs.writeFileSync(path.join(ROOT, 'js', 'china_geo_data.js'), geoOut, 'utf8');
console.log('Generated js/china_geo_data.js successfully.');

// ============================================================================
// 2. BUILD window.ATLAS_LORE_DATA -> js/lore_data.js
// ============================================================================

const CHINESE_ERA_SPANS = [
  [1151, '西遼・紹興', 1, 'カラ・キタイ仁宗イェリュ・イリ', 'Yelü Yili of Qara Khitai'],
  [1164, '西遼・崇福', 1, 'カラ・キタイ承天太后プスワン', 'Regent Pusuwan of Qara Khitai'],
  [1178, '西遼・天禧', 1, 'カラ・キタイ末主チルグ／ホラズム・テキシュ', 'Yelü Zhilugu / Tekish'],
  [1200, 'ホラズム拡張期', 1, 'アラーウッディーン・ムハンマド／テムジン', 'Muhammad II of Khwarezm'],
  [1206, 'モンゴル帝国建国', 1, 'チンギス・ハーン', 'Genghis Khan'],
  [1219, 'チンギス・ハーン西征', 1, 'チンギス・ハーン', 'Genghis Khan (Western Campaign)'],
  [1229, 'オゴデイ・ハーン治世', 1, 'オゴデイ・ハーン', 'Ögedei Khan'],
  [1242, 'ドレゲネ摂政期', 1, 'ドレゲネ・ハトゥン', 'Töregene Khatun'],
  [1246, 'グユク・ハーン治世', 1, 'グユク・ハーン', 'Güyük Khan'],
  [1251, 'モンケ・ハーン治世', 1, 'モンケ・ハーン', 'Möngke Khan'],
  [1260, '至元（4ウルス分立）', 1, 'クビライ・ハーン／アルグ', 'Kublai Khan / Alghu'],
  [1269, 'ハイドゥ・ウルス盟約', 1, 'ハイドゥ／クビライ', 'Kaidu / Kublai Khan'],
  [1282, 'ハイドゥ・ドゥア連立', 1, 'ハイドゥ／ドゥア', 'Kaidu & Duwa'],
  [1302, 'チャガタイ再統合', 1, 'チャガタイ・ハン国ドゥア', 'Duwa Khan'],
  [1318, 'ケベク通貨改革期', 1, 'チャガタイ・ハン国ケベク', 'Kebek Khan'],
  [1331, 'タルマシリン改宗期', 1, 'タルマシリン・ハーン', 'Tarmashirin Khan'],
  [1347, 'モグーリスタン建国', 1, 'トゥグルク・ティムール', 'Tughlugh Timur'],
  [1370, 'ティムール建国', 1, 'アミール・ティムール', 'Amir Timur (Tamerlane)'],
  [1405, 'シャー・ルフ治世', 1, 'ティムール朝シャー・ルフ', 'Shah Rukh'],
  [1447, 'ウルグ・ベク治世', 1, 'ティムール朝ウルグ・ベク', 'Ulugh Beg'],
  [1451, 'アブー・サイード治世', 1, 'ティムール朝アブー・サイード', 'Abu Sa\'id Mirza'],
  [1469, 'ヘラート文化最盛期', 1, 'フサイン・バイカラ', 'Husayn Bayqara'],
  [1500, 'シャイバーニー朝成立', 1, 'ムハンマド・シャイバーニー・ハーン', 'Muhammad Shaybani Khan'],
  [1514, 'ヤルカンド建国', 1, 'スルタン・サイード・ハーン', 'Sultan Said Khan'],
  [1533, 'ブハラ遷都・ウズベク隆盛', 1, 'ウバイドゥッラー・ハーン', 'Ubaydallah Khan'],
  [1583, 'シャイバーニー朝最盛', 1, 'アブドゥッラーフ・ハーン2世', 'Abdullah Khan II'],
  [1599, 'ジャーン朝ブハラ', 1, 'イマーム・クリー・ハーン', 'Imam Quli Khan'],
  [1640, 'ジュンガル台頭', 1, 'バートル・ホンタイジ', 'Erdeni Batur'],
  [1671, 'ガルダン覇権', 1, 'ガルダン・ボショクト・ハーン', 'Galdan Boshugtu Khan'],
  [1697, 'ツェワン・ラブタン治世', 1, 'ツェワン・ラブタン', 'Tsewang Rabtan'],
  [1727, 'ガルダン・ツェリン治世', 1, 'ガルダン・ツェリン', 'Galdan Tseren'],
  [1736, '乾隆', 1, '清・乾隆帝', 'Qianlong Emperor'],
  [1796, '嘉慶', 1, '清・嘉慶帝／コーカンド・アーリム', 'Jiaqing Emperor'],
  [1821, '道光', 1, '清・道光帝／コーカンド・マダリ', 'Daoguang Emperor'],
  [1851, '咸豊', 1, '清・咸豊帝', 'Xianfeng Emperor'],
  [1862, '同治', 1, '清・同治帝／ヤクブ・ベク', 'Tongzhi Emperor'],
  [1875, '光緒', 1, '清・光緒帝／ロシア・アレクサンドル2世', 'Guangxu Emperor'],
  [1909, '宣統', 1, '清・宣統帝', 'Xuantong Emperor'],
  [1912, '民国', 1, '中華民国・ソビエト連邦形成期', 'Republic of China / Early USSR']
];

const REGIONAL_ERA_TRACKS = [
  {
    regime: 'カラ・キタイ（西遼）',
    polities: ['カラ・キタイ（西遼）', 'ナイマン（クチュルク政権）'],
    until: 1218,
    spans: [
      [1151, '紹興', 1, '西遼・仁宗イェリュ・イリ', 'Yelü Yili of Qara Khitai'],
      [1164, '崇福', 1, '西遼・承天太后プスワン', 'Regent Pusuwan'],
      [1178, '天禧', 1, '西遼・末主チルグ', 'Yelü Zhilugu'],
      [1211, 'クチュルク統治', 1, 'ナイマン王子クチュルク', 'Kuchlug']
    ]
  },
  {
    regime: 'ホラズム・シャー朝',
    polities: ['ホラズム・シャー朝'],
    until: 1231,
    spans: [
      [1156, 'イル・アルスラン治世', 1, 'ホラズム・シャー朝', 'Il-Arslan'],
      [1172, 'テキシュ治世', 1, 'ホラズム・シャー朝', 'Tekish'],
      [1200, 'ムハンマド2世治世', 1, 'ホラズム・シャー朝', 'Muhammad II'],
      [1220, 'ジャラールッディーン抗戦', 1, 'ホラズム・シャー朝', 'Jalal al-Din']
    ]
  },
  {
    regime: 'ティムール朝',
    polities: ['ティムール朝（ティムール帝国）', 'ティムール朝'],
    until: 1507,
    spans: [
      [1370, 'アミール・ティムール治世', 1, 'ティムール朝', 'Amir Timur'],
      [1405, 'シャー・ルフ治世', 1, 'ティムール朝', 'Shah Rukh'],
      [1447, 'ウルグ・ベク治世', 1, 'ティムール朝', 'Ulugh Beg'],
      [1451, 'アブー・サイード治世', 1, 'ティムール朝', 'Abu Sa\'id'],
      [1469, 'フサイン・バイカラ治世', 1, 'ティムール朝', 'Husayn Bayqara']
    ]
  },
  {
    regime: 'ジュンガル・ハン国',
    polities: ['ジュンガル・ハン国', 'オイラト（ドルベン・オイラト）'],
    until: 1758,
    spans: [
      [1634, 'バートル・ホンタイジ治世', 1, 'ジュンガル・ハン国', 'Erdeni Batur'],
      [1671, 'ガルダン・ハーン治世', 1, 'ジュンガル・ハン国', 'Galdan Boshugtu Khan'],
      [1697, 'ツェワン・ラブタン治世', 1, 'ジュンガル・ハン国', 'Tsewang Rabtan'],
      [1727, 'ガルダン・ツェリン治世', 1, 'ジュンガル・ハン国', 'Galdan Tseren'],
      [1745, 'ジュンガル後期', 1, 'ダワチ／アムルサナー', 'Dawachi / Amursana']
    ]
  }
];

const STRATEGIC_PASSES = [
  {
    key: 'iron_gate_ca',
    ancientZh: '鉄門関（ブズガル峠）',
    ancientEn: 'Iron Gate (Buzgala Pass)',
    modernZh: 'ウズベキスタン・スルハンダリヤ州ボイスン近郊',
    modernEn: 'Boysun, Surxondaryo, Uzbekistan',
    coord: [67.15, 38.22],
    appear: 1162,
    vanish: 1949,
    focusYear: 1222,
    align: 'b',
    rangeZh: 'ヒッサール山脈南麓・ソグドとバクトリアの境',
    rangeEn: 'Gissar Range',
    chokepointZh: 'サマルカンド（ソグディアナ）とバルフ（トハリスタン）を隔てる断崖の峡谷。玄奘・チンギス・ハーン・長春真人・ティムールが通過した中央アジア南下路の最重要関門。',
    chokepointEn: 'Strategic defile between Samarkand and Balkh traversed by Xuanzang, Genghis Khan, Qiu Chuji, and Timur.',
    chokepointJa: 'サマルカンド（ソグディアナ）とバルフ（トハリスタン）を隔てる断崖の峡谷。玄奘・チンギス・ハーン・長春真人・ティムールが通過した中央アジア南下路の最重要関門。',
    rangeJa: 'ヒッサール山脈南麓・ソグドとバクトリアの境'
  },
  {
    key: 'terek_pass',
    ancientZh: 'テレク峠',
    ancientEn: 'Terek Pass',
    modernZh: 'キルギス・オシュ州／新疆カシュガル境界',
    modernEn: 'Osh / Kashgar Frontier',
    coord: [74.72, 40.28],
    appear: 1162,
    vanish: 1949,
    focusYear: 1514,
    align: 't',
    rangeZh: 'アライ山脈・フェルガナとカシュガルを結ぶ峠',
    rangeEn: 'Alay Mountains',
    chokepointZh: 'フェルガナ盆地（アンディジャン・オシュ・コーカンド）から天山・パミール北縁を越えてカシュガル（喀什噶爾）へ至るシルクロード主要キャラバン路。',
    chokepointEn: 'Primary Silk Road caravan pass linking the Fergana Valley with Kashgar across the Alay range.',
    chokepointJa: 'フェルガナ盆地（アンディジャン・オシュ・コーカンド）から天山・パミール北縁を越えてカシュガル（喀什噶爾）へ至るシルクロード主要キャラバン路。',
    rangeJa: 'アライ山脈・フェルガナとカシュガルを結ぶ峠'
  },
  {
    key: 'bedel_pass',
    ancientZh: 'ベデル峠（凌山）',
    ancientEn: 'Bedel Pass',
    modernZh: 'キルギス・イシク・クル州／新疆ウシュ（烏什）境界',
    modernEn: 'Issyk-Kul / Uchturpan Frontier',
    coord: [78.42, 41.42],
    appear: 1162,
    vanish: 1949,
    focusYear: 1347,
    align: 't',
    rangeZh: '天山山脈中部（コクシャール山脈）',
    rangeEn: 'Central Tian Shan',
    chokepointZh: 'イシク湖畔のセミレチエ草原とタリム盆地のウシュ（烏什）・アクス（阿克蘇）を最短で結ぶ天山越えの要衝。',
    chokepointEn: 'High mountain pass across the Tian Shan connecting Issyk-Kul with Uchturpan and Aksu.',
    chokepointJa: 'イシク湖畔のセミレチエ草原とタリム盆地のウシュ（烏什）・アクス（阿克蘇）を最短で結ぶ天山越えの要衝。',
    rangeJa: '天山山脈中部（コクシャール山脈）'
  },
  {
    key: 'muzart_pass',
    ancientZh: 'ムザルト峠',
    ancientEn: 'Muzart Pass',
    modernZh: '新疆イリ・モンゴルキュレ県／アクス・バイ県境',
    modernEn: 'Ili / Aksu Glacier Pass',
    coord: [80.65, 42.22],
    appear: 1162,
    vanish: 1949,
    focusYear: 1758,
    align: 'b',
    rangeZh: '天山山脈ハン・テングリ東麓氷河道',
    rangeEn: 'Tian Shan Muzart Glacier',
    chokepointZh: '天山北麓のイリ渓谷（クルジャ）と天山南麓のアクス・クチャを結ぶ氷河越えの軍道。モグーリスタン、ジュンガル、清朝のイリ将軍が南北連絡の生命線とした。',
    chokepointEn: 'Glaciated military and trade pass linking the Ili Valley with Aksu and Kucha in the Tarim Basin.',
    chokepointJa: '天山北麓のイリ渓谷（クルジャ）と天山南麓のアクス・クチャを結ぶ氷河越えの軍道。モグーリスタン、ジュンガル、清朝のイリ将軍が南北連絡の生命線とした。',
    rangeJa: '天山山脈ハン・テングリ東麓氷河道'
  },
  {
    key: 'talki_pass',
    ancientZh: 'タルキ峠（果子溝）',
    ancientEn: 'Talki Pass (Guozigou)',
    modernZh: '新疆イリ・カザフ自治州コルガス北東',
    modernEn: 'Khorgas, Ili, Xinjiang',
    coord: [81.12, 44.45],
    appear: 1162,
    vanish: 1949,
    focusYear: 1221,
    align: 't',
    rangeZh: 'ボロホロ山脈・サイラム湖（天池）南岸峡谷',
    rangeEn: 'Borohoro Mountains / Sayram Lake',
    chokepointZh: 'ジュンガル盆地からサイラム湖を経てイリ渓谷（アルマリク・クルジャ）へ降りる天山北路随一の険隘。1219年の西征時にチャガタイが48橋を架設し、長春真人も通過した。',
    chokepointEn: 'Gateway into the Ili Valley from Dzungaria past Sayram Lake, engineered with 48 bridges by Chagatai in 1219.',
    chokepointJa: 'ジュンガル盆地からサイラム湖を経てイリ渓谷（アルマリク・クルジャ）へ降りる天山北路随一の険隘。1219年の西征時にチャガタイが48橋を架設し、長春真人も通過した。',
    rangeJa: 'ボロホロ山脈・サイラム湖（天池）南岸峡谷'
  },
  {
    key: 'dzungarian_gate',
    ancientZh: 'ジュンガル門（アラタウ山口）',
    ancientEn: 'Dzungarian Gate (Alataw Pass)',
    modernZh: '新疆ボルタラ州アラシャンコウ／カザフスタン境界',
    modernEn: 'Alashankou / Dostyk',
    coord: [82.48, 45.22],
    appear: 1162,
    vanish: 1949,
    focusYear: 1219,
    align: 't',
    rangeZh: 'ジュンガル・アラタウ山脈とバルルク山脈の間',
    rangeEn: 'Dzungarian Alatau',
    chokepointZh: 'ジュンガル盆地とセミレチエ（アラコル湖・バルハシ湖）を直結する天然の回廊。古来より遊牧騎馬軍団が東方ステップから中央アジアへ進出する大門となった。',
    chokepointEn: 'Natural wind-swept corridor between Dzungaria and Semirechye used by nomadic armies across millennia.',
    chokepointJa: 'ジュンガル盆地とセミレチエ（アラコル湖・バルハシ湖）を直結する天然の回廊。古来より遊牧騎馬軍団が東方ステップから中央アジアへ進出する大門となった。',
    rangeJa: 'ジュンガル・アラタウ山脈とバルルク山脈の間'
  },
  {
    key: 'khyber_pass',
    ancientZh: 'カイバル峠',
    ancientEn: 'Khyber Pass',
    modernZh: 'アフガニスタン・パキスタン国境（スピン・ガル山脈）',
    modernEn: 'Afghanistan–Pakistan Border',
    coord: [71.15, 34.09],
    appear: 1162,
    vanish: 1949,
    focusYear: 1526,
    align: 'b',
    rangeZh: 'ヒンドゥークシュ南脈・スピン・ガル山脈',
    rangeEn: 'Spin Ghar / Hindu Kush',
    chokepointZh: '中央アジアのカーブル盆地とインド亜大陸北西部（ペシャーワル・インダス河谷）を繋ぐ戦略的峠道。チンギス・ハーン軍、ティムール、バーブルがここを通過した。',
    chokepointEn: 'Strategic mountain pass connecting Kabul and Central Asia with the Indus Valley.',
    chokepointJa: '中央アジアのカーブル盆地とインド亜大陸北西部（ペシャーワル・インダス河谷）を繋ぐ戦略的峠道。チンギス・ハーン軍、ティムール、バーブルがここを通過した。',
    rangeJa: 'ヒンドゥークシュ南脈・スピン・ガル山脈'
  },
  {
    key: 'yumenguan',
    ancientZh: '玉門関',
    ancientEn: 'Yumen Pass',
    modernZh: '中国甘粛省敦煌市北西',
    modernEn: 'Dunhuang, Gansu',
    coord: [93.86, 40.35],
    appear: 1162,
    vanish: 1949,
    focusYear: 1274,
    align: 't',
    rangeZh: '疎勒河谷・西域北道門戸',
    rangeEn: 'Shule River Valley',
    chokepointZh: '敦煌の北西に位置し、河西回廊からハミ（哈密）・トルファン（高昌）・タリム盆地北道へ向かうシルクロードの玄関口。ホータン（于闐）の美玉がここから中国へ入ったことに由来する。',
    chokepointEn: 'Historic Jade Gate northwest of Dunhuang guarding the northern Silk Road into the Tarim Basin.',
    chokepointJa: '敦煌の北西に位置し、河西回廊からハミ（哈密）・トルファン（高昌）・タリム盆地北道へ向かうシルクロードの玄関口。ホータン（于闐）の美玉がここから中国へ入ったことに由来する。',
    rangeJa: '疎勒河谷・西域北道門戸'
  },
  {
    key: 'yangguan',
    ancientZh: '陽関',
    ancientEn: 'Yangguan Pass',
    modernZh: '中国甘粛省敦煌市南西',
    modernEn: 'Southwest of Dunhuang, Gansu',
    coord: [94.06, 39.93],
    appear: 1162,
    vanish: 1949,
    focusYear: 1274,
    align: 'b',
    rangeZh: 'アルティン山脈北麓・西域南道門戸',
    rangeEn: 'Southern Silk Road Gateway',
    chokepointZh: '玉門関の南に位置し、敦煌からチャルクリク（若羌）・チェルチェン（且末）・ホータン（于闐）へ至る西域南道の門戸。',
    chokepointEn: 'Southern Silk Road gateway southwest of Dunhuang leading toward Lop Nur and Khotan.',
    chokepointJa: '玉門関の南に位置し、敦煌からチャルクリク（若羌）・チェルチェン（且末）・ホータン（于闐）へ至る西域南道の門戸。',
    rangeJa: 'アルティン山脈北麓・西域南道門戸'
  },
  {
    key: 'jiayuguan',
    ancientZh: '嘉峪関',
    ancientEn: 'Jiayuguan Pass',
    modernZh: '中国甘粛省嘉峪関市',
    modernEn: 'Jiayuguan, Gansu',
    coord: [98.22, 39.80],
    appear: 1372,
    vanish: 1949,
    focusYear: 1372,
    align: 'b',
    rangeZh: '祁連山雪峰・黒山峡谷',
    rangeEn: 'Qilian Mountains & Heishan Gorge',
    chokepointZh: '1372年（明・洪武5年）に馮勝が河西回廊最狭部に築いた明代万里の長城の西端関城。トルファン・ハン国やジュンガルとの国境防衛拠点となった。',
    chokepointEn: 'Westernmost fortress of the Ming Great Wall built in 1372 at the narrowest point of the Hexi Corridor.',
    chokepointJa: '1372年（明・洪武5年）に馮勝が河西回廊最狭部に築いた明代万里の長城の西端関城。トルファン・ハン国やジュンガルとの国境防衛拠点となった。',
    rangeJa: '祁連山雪峰・黒山峡谷'
  }
];

const HISTORICAL_JOURNEYS = [
  {
    key: 'genghis_khan',
    dynastyKey: 'mongol_rise',
    color: '#c84b31',
    shortZh: 'チンギス・ハーン西征',
    shortEn: 'Genghis Khan',
    titleZh: 'チンギス・ハーンの中央アジア西征行跡',
    titleEn: "Genghis Khan's Western Campaign",
    spanZh: '1219年 — 1225年（モンゴル帝国初期）',
    spanEn: '1219 – 1225 CE',
    stops: [
      {
        year: 1219,
        eraZh: 'チンギス・ハーン14年',
        ancientZh: 'カラコルム',
        modernZh: 'モンゴル・ハラホリン',
        ancientEn: 'Karakorum',
        modernEn: 'Kharkhorin, Mongolia',
        coord: [102.84, 47.20],
        labelPos: 'top',
        titleZh: 'オルホン河畔より西征進発',
        titleEn: 'Departure from the Orkhon Valley',
        descZh: '1218年のオトラル事件（ホラズム知事によるモンゴル使節・商隊殺害）を受け、チンギス・ハーンは漠北の本営から全軍を動員して中央アジア遠征へ出発した。',
        descEn: 'Following the Otrar massacre of Mongol envoys and merchants, Genghis Khan mobilized the Mongol army for the invasion of Khwarezm.',
        quoteZh: '『元朝秘史』：「チンギス・ハーンはサルタウル（ホラズム）の民に黄金の綱を絶たれたとて出陣せり。」',
        quoteEn: 'The Secret History of the Mongols',
        persons: ['genghis_khan'],
        titleJa: 'オルホン河畔より西征進発',
        descJa: '1218年のオトラル事件（ホラズム知事によるモンゴル使節・商隊殺害）を受け、チンギス・ハーンは漠北の本営から全軍を動員して中央アジア遠征へ出発した。'
      },
      {
        year: 1219,
        eraZh: 'チンギス・ハーン14年秋',
        ancientZh: 'アルマリク',
        modernZh: '新疆イリ・コルガス近郊',
        ancientEn: 'Almaliq',
        modernEn: 'Khorgas, Ili, Xinjiang',
        coord: [80.55, 44.22],
        fromCoord: [102.84, 47.20],
        via: [[91.6, 46.8], [84.5, 47.2]],
        labelPos: 'top',
        titleZh: 'イリ渓谷への進軍とウイグル・カルルク軍合流',
        titleEn: 'Advance through the Ili Valley',
        descZh: 'アルタイ山脈を越えてエルティシ川で夏営した後、ビシュバリクのバルチュク率いるウイグル軍やアルマリクのカルルク軍を合流させ、チャガタイが築いた果子溝の道を通ってセミレチエへ進出した。',
        descEn: 'Joined by Uyghur and Karluk allies, the Mongol army crossed the Talki Pass into the Ili Valley.',
        quoteZh: '『世界征服者史』（ジュヴァイニー）',
        quoteEn: 'History of the World Conqueror',
        persons: ['genghis_khan'],
        titleJa: 'イリ渓谷への進軍とウイグル・カルルク軍合流',
        descJa: 'アルタイ山脈を越えてエルティシ川で夏営した後、ビシュバリクのバルチュク率いるウイグル軍やアルマリクのカルルク軍を合流させ、チャガタイが築いた果子溝の道を通ってセミレチエへ進出した。'
      },
      {
        year: 1219,
        eraZh: 'チンギス・ハーン14年9月',
        ancientZh: 'オトラル',
        modernZh: 'カザフスタン・オトラル遺跡',
        ancientEn: 'Otrar',
        modernEn: 'Otrar, Kazakhstan',
        coord: [68.30, 42.85],
        fromCoord: [80.55, 44.22],
        via: [[75.3, 42.8], [71.4, 42.9]],
        labelPos: 'top',
        titleZh: 'オトラル包囲と四路分進',
        titleEn: 'Siege of Otrar',
        descZh: 'シル川中流のオトラルに到着したチンギス・ハーンは、チャガタイとオゴデイにオトラル包囲を、ジョチにシル川下流（スィグナク・ジャンド）攻略を命じ、自らはトルイと共にキジルクム砂漠を奇襲縦断した。',
        descEn: 'Genghis Khan divided his forces to besiege Otrar while leading the main wing across the Kyzylkum Desert.',
        quoteZh: '『集史』（ラシードゥッディーン）',
        quoteEn: 'Jami al-Tawarikh',
        persons: ['genghis_khan'],
        titleJa: 'オトラル包囲と四路分進',
        descJa: 'シル川中流のオトラルに到着したチンギス・ハーンは、チャガタイとオゴデイにオトラル包囲を、ジョチにシル川下流（スィグナク・ジャンド）攻略を命じ、自らはトルイと共にキジルクム砂漠を奇襲縦断した。'
      },
      {
        year: 1220,
        eraZh: 'チンギス・ハーン15年2月',
        ancientZh: 'ブハラ',
        modernZh: 'ウズベキスタン・ブハラ',
        ancientEn: 'Bukhara',
        modernEn: 'Bukhara, Uzbekistan',
        coord: [64.42, 39.77],
        fromCoord: [68.30, 42.85],
        via: [[66.0, 41.5]],
        labelPos: 'bottom',
        titleZh: 'キジルクム砂漠奇襲とブハラ陥落',
        titleEn: 'Fall of Bukhara',
        descZh: '通行不能とみられていたキジルクム砂漠を突破してホラズム軍の背後に現れ、1220年2月にブハラを攻略した。',
        descEn: 'Emerging unexpectedly from the Kyzylkum Desert, Genghis Khan captured Bukhara in February 1220.',
        quoteZh: '『世界征服者史』',
        quoteEn: 'Tarikh-i Jahangushay',
        persons: ['genghis_khan'],
        titleJa: 'キジルクム砂漠奇襲とブハラ陥落',
        descJa: '通行不能とみられていたキジルクム砂漠を突破してホラズム軍の背後に現れ、1220年2月にブハラを攻略した。'
      },
      {
        year: 1220,
        eraZh: 'チンギス・ハーン15年3月',
        ancientZh: 'サマルカンド',
        modernZh: 'ウズベキスタン・サマルカンド',
        ancientEn: 'Samarkand',
        modernEn: 'Samarkand, Uzbekistan',
        coord: [66.96, 39.65],
        fromCoord: [64.42, 39.77],
        labelPos: 'top',
        titleZh: '新都サマルカンドの攻略',
        titleEn: 'Capture of Samarkand',
        descZh: 'ゼラフシャン川に沿って東進し、ホラズム・シャー朝の新都サマルカンドを包囲・攻略。逃亡したスルタン・ムハンマドを追ってジェベとスブタイをカスピ海方面へ派遣した。',
        descEn: 'Genghis Khan marched up the Zeravshan Valley to take Samarkand, sending Jebe and Subutai in pursuit of Sultan Muhammad.',
        quoteZh: '『元史・太祖本紀』：「十五年春三月、帝克尋思干（サマルカンド）城。」',
        quoteEn: 'History of Yuan',
        persons: ['genghis_khan'],
        titleJa: '新都サマルカンドの攻略',
        descJa: 'ゼラフシャン川に沿って東進し、ホラズム・シャー朝の新都サマルカンドを包囲・攻略。逃亡したスルタン・ムハンマドを追ってジェベとスブタイをカスピ海方面へ派遣した。'
      },
      {
        year: 1221,
        eraZh: 'チンギス・ハーン16年',
        ancientZh: 'バルフ',
        modernZh: 'アフガニスタン・バルフ',
        ancientEn: 'Balkh',
        modernEn: 'Balkh, Afghanistan',
        coord: [66.90, 36.76],
        fromCoord: [66.96, 39.65],
        via: [[67.15, 38.22]],
        labelPos: 'bottom',
        titleZh: '鉄門関・アム川渡河とホラーサーン制圧',
        titleEn: 'Crossing the Oxus to Balkh',
        descZh: '鉄門関を越えてアム川を渡り、バルフを制圧。トルイをメルヴ・ニーシャープール・ヘラートへ派遣してホラーサーン全域を平定させた。1222年にはこの地で長春真人（丘処機）と会見した。',
        descEn: 'Crossing the Iron Gate and the Amu Darya, Genghis Khan took Balkh and received the Taoist master Qiu Chuji near the Hindu Kush.',
        quoteZh: '『長春真人西遊記』',
        quoteEn: 'Travels of an Alchemist',
        persons: ['genghis_khan', 'qiu_chuji'],
        titleJa: '鉄門関・アム川渡河とホラーサーン制圧',
        descJa: '鉄門関を越えてアム川を渡り、バルフを制圧。トルイをメルヴ・ニーシャープール・ヘラートへ派遣してホラーサーン全域を平定させた。1222年にはこの地で長春真人（丘処機）と会見した。'
      }
    ]
  },
  {
    key: 'qiu_chuji',
    dynastyKey: 'mongol_rise',
    color: '#3b7ea1',
    shortZh: '長春真人西遊',
    shortEn: 'Qiu Chuji',
    titleZh: '丘処機（長春真人）『西遊記』の旅',
    titleEn: "Qiu Chuji's Journey to the West",
    spanZh: '1220年 — 1224年',
    spanEn: '1220 – 1224 CE',
    stops: [
      {
        year: 1221,
        eraZh: '1221年秋',
        ancientZh: 'ビシュバリク',
        modernZh: '新疆ジムサル県（北庭故城）',
        ancientEn: 'Beshbaliq',
        modernEn: 'Jimsar, Xinjiang',
        coord: [89.18, 44.00],
        labelPos: 'top',
        titleZh: '天山北麓の王都ビシュバリク訪問',
        titleEn: 'Arrival at Beshbaliq',
        descZh: 'モンゴル高原とアルタイ山脈を越えた長春真人一行は、天山北麓のウイグル王都ビシュバリク（別失八里）に到着し、ウイグル王族や仏教徒・道士の出迎えを受け、現地の葡萄酒や綿花栽培を記録した。',
        descEn: 'Crossing Mongolia and the Altai Mountains, Qiu Chuji reached the Uyghur summer capital Beshbaliq at the northern foot of the Tian Shan.',
        quoteZh: '『長春真人西遊記』：「至鼈思馬大城（ビシュバリク）、王官・士庶・僧道数百、具威儀遠迎。」',
        quoteEn: 'Travels of Qiu Chuji',
        persons: ['qiu_chuji'],
        titleJa: '天山北麓の王都ビシュバリク訪問',
        descJa: 'モンゴル高原とアルタイ山脈を越えた長春真人一行は、天山北麓のウイグル王都ビシュバリク（別失八里）に到着し、ウイグル王族や仏教徒・道士の出迎えを受け、現地の葡萄酒や綿花栽培を記録した。'
      },
      {
        year: 1221,
        eraZh: '1221年10月',
        ancientZh: 'アルマリク',
        modernZh: '新疆イリ・コルガス近郊',
        ancientEn: 'Almaliq',
        modernEn: 'Khorgas, Ili, Xinjiang',
        coord: [80.55, 44.22],
        fromCoord: [89.18, 44.00],
        via: [[84.8, 44.3], [81.12, 44.45]],
        labelPos: 'top',
        titleZh: '天池（サイラム湖）・果子溝とアルマリク',
        titleEn: 'Sayram Lake & Almaliq',
        descZh: 'サイラム湖を「天池」と名付け、チャガタイが開いた果子溝の48橋を下ってイリ渓谷のアルマリク（阿里馬城）に至り、リンゴ（アルマ）が実る豊かな果樹園と地下水道を描写した。',
        descEn: 'Passing Sayram Lake and the 48 bridges of Talki Pass, Qiu Chuji arrived at Almaliq in the Ili Valley.',
        quoteZh: '『長春真人西遊記』：「至阿里馬城（アルマリク）…土人呼果為阿里馬、蓋多果実、以是名其城。」',
        quoteEn: 'Travels of Qiu Chuji',
        persons: ['qiu_chuji'],
        titleJa: '天池（サイラム湖）・果子溝とアルマリク',
        descJa: 'サイラム湖を「天池」と名付け、チャガタイが開いた果子溝の48橋を下ってイリ渓谷のアルマリク（阿里馬城）に至り、リンゴ（アルマ）が実る豊かな果樹園と地下水道を描写した。'
      },
      {
        year: 1221,
        eraZh: '1221年11月',
        ancientZh: 'サマルカンド',
        modernZh: 'ウズベキスタン・サマルカンド',
        ancientEn: 'Samarkand',
        modernEn: 'Samarkand, Uzbekistan',
        coord: [66.96, 39.65],
        fromCoord: [80.55, 44.22],
        via: [[75.3, 42.8], [71.39, 42.9], [69.24, 41.3]],
        labelPos: 'top',
        titleZh: 'サマルカンドでの越冬と耶律楚材らとの交流',
        titleEn: 'Wintering in Samarkand',
        descZh: 'ベラサグン・タラズ・シル川を渡ってサマルカンド（邪米思干大城）に到着し、太師・耶律阿海や湛然居士（耶律楚材）らと交流しながら翌春まで滞在した。',
        descEn: 'Traveling via Balasagun and Talas, Qiu Chuji wintered in Samarkand.',
        quoteZh: '『長春真人西遊記』：「至邪米思干大城（サマルカンド）、太師移剌国公郊迎。」',
        quoteEn: 'Travels of Qiu Chuji',
        persons: ['qiu_chuji'],
        titleJa: 'サマルカンドでの越冬と耶律楚材らとの交流',
        descJa: 'ベラサグン・タラズ・シル川を渡ってサマルカンド（邪米思干大城）に到着し、太師・耶律阿海や湛然居士（耶律楚材）らと交流しながら翌春まで滞在した。'
      },
      {
        year: 1222,
        eraZh: '1222年4月',
        ancientZh: 'バルフ',
        modernZh: 'アフガニスタン・バルフ南郊',
        ancientEn: 'Balkh / Hindu Kush',
        modernEn: 'Northern Afghanistan',
        coord: [66.90, 36.76],
        fromCoord: [66.96, 39.65],
        via: [[67.15, 38.22]],
        labelPos: 'bottom',
        titleZh: '鉄門関を越えチンギス・ハーンと会見',
        titleEn: 'Audience with Genghis Khan',
        descZh: '鉄門関とアム川を越えてヒンドゥークシュ北麓の行営に達し、チンギス・ハーンに不老長生ではなく「敬天愛民・寡欲養生」の道を説いた。',
        descEn: 'Crossing the Iron Gate and Oxus, Qiu Chuji counselled Genghis Khan on governance and moderation.',
        quoteZh: '『元史・丘処機伝』：「欲一天下者、必在乎不嗜殺人。」',
        quoteEn: 'History of Yuan',
        persons: ['qiu_chuji', 'genghis_khan'],
        titleJa: '鉄門関を越えチンギス・ハーンと会見',
        descJa: '鉄門関とアム川を越えてヒンドゥークシュ北麓の行営に達し、チンギス・ハーンに不老長生ではなく「敬天愛民・寡欲養生」の道を説いた。'
      }
    ]
  },
  {
    key: 'timur',
    dynastyKey: 'timurid',
    color: '#2c8c69',
    shortZh: 'ティムール大遠征',
    shortEn: 'Amir Timur',
    titleZh: 'アミール・ティムールの中央アジア統一と遠征',
    titleEn: "Amir Timur's Campaigns",
    spanZh: '1370年 — 1405年',
    spanEn: '1370 – 1405 CE',
    stops: [
      {
        year: 1370,
        eraZh: '1370年4月',
        ancientZh: 'バルフ',
        modernZh: 'アフガニスタン・バルフ',
        ancientEn: 'Balkh',
        modernEn: 'Balkh, Afghanistan',
        coord: [66.90, 36.76],
        labelPos: 'bottom',
        titleZh: 'バルフ制圧とティムール朝創始',
        titleEn: 'Victory at Balkh & Founding of the Timurid Empire',
        descZh: 'バルラス部出身のアミール・ティムールがバルフでアミール・フサインを破り、チンギス裔のソユルガトミシュをハンに擁立して大アミール（キュレゲン）に就いた。',
        descEn: 'Timur defeated Amir Husayn at Balkh and established the Timurid realm.',
        quoteZh: '『ザファル・ナーマ（勝利の書）』',
        quoteEn: 'Zafarnama',
        persons: ['timur'],
        titleJa: 'バルフ制圧とティムール朝創始',
        descJa: 'バルラス部出身のアミール・ティムールがバルフでアミール・フサインを破り、チンギス裔のソユルガトミシュをハンに擁立して大アミール（キュレゲン）に就いた。'
      },
      {
        year: 1370,
        eraZh: '1370年7月',
        ancientZh: 'サマルカンド',
        modernZh: 'ウズベキスタン・サマルカンド',
        ancientEn: 'Samarkand',
        modernEn: 'Samarkand, Uzbekistan',
        coord: [66.96, 39.65],
        fromCoord: [66.90, 36.76],
        via: [[67.15, 38.22]],
        labelPos: 'top',
        titleZh: 'サマルカンド建都と大造営',
        titleEn: 'Capital at Samarkand',
        descZh: 'サマルカンドを帝国の首都と定め、遠征で集めた各地の工匠・学者によって青いドームが輝くイスラーム建築群と庭園を造営した。',
        descEn: 'Timur made Samarkand his imperial capital, transforming it into the jewel of the Islamic world.',
        quoteZh: 'クラビホ『チムール帝国紀行』',
        quoteEn: 'Embassy to Tamerlane',
        persons: ['timur'],
        titleJa: 'サマルカンド建都と大造営',
        descJa: 'サマルカンドを帝国の首都と定め、遠征で集めた各地の工匠・学者によって青いドームが輝くイスラーム建築群と庭園を造営した。'
      },
      {
        year: 1388,
        eraZh: '1388年',
        ancientZh: 'ウルゲンチ',
        modernZh: 'トルクメニスタン・クフナ・ウルゲンチ',
        ancientEn: 'Urgench',
        modernEn: 'Konye-Urgench, Turkmenistan',
        coord: [60.63, 41.55],
        fromCoord: [66.96, 39.65],
        via: [[64.42, 39.77]],
        labelPos: 'top',
        titleZh: 'ホラズム遠征とウルゲンチ制圧',
        titleEn: 'Conquest of Khwarezm',
        descZh: 'キプチャク・ハン国のトクタミシュと結んだホラズムのスーフィー朝を討ち、ウルゲンチを完全に服属させた。',
        descEn: 'Timur subdued Khwarezm and its capital Urgench during his campaigns against Tokhtamysh.',
        quoteZh: '『ザファル・ナーマ』',
        quoteEn: 'Zafarnama',
        persons: ['timur'],
        titleJa: 'ホラズム遠征とウルゲンチ制圧',
        descJa: 'キプチャク・ハン国のトクタミシュと結んだホラズムのスーフィー朝を討ち、ウルゲンチを完全に服属させた。'
      },
      {
        year: 1389,
        eraZh: '1389年',
        ancientZh: 'イリ（クルジャ）',
        modernZh: '新疆イリ・グルジャ（伊寧）',
        ancientEn: 'Ili (Kulja)',
        modernEn: 'Yining, Xinjiang',
        coord: [81.32, 43.92],
        fromCoord: [60.63, 41.55],
        via: [[69.24, 41.30], [75.3, 42.8]],
        labelPos: 'top',
        titleZh: 'モグーリスタン・イリ渓谷遠征',
        titleEn: 'Campaign into Moghulistan and the Ili Valley',
        descZh: '東方モグーリスタン・ハン国のヒズル・ホージャおよびカマルッディーンを討つため、イリ渓谷からユルドゥズ草原まで進撃した。',
        descEn: 'Timur led his armies deep into the Ili Valley and Yulduz steppe against Moghulistan.',
        quoteZh: '『ターリーヒ・ラシーディー』',
        quoteEn: 'Tarikh-i Rashidi',
        persons: ['timur'],
        titleJa: 'モグーリスタン・イリ渓谷遠征',
        descJa: '東方モグーリスタン・ハン国のヒズル・ホージャおよびカマルッディーンを討つため、イリ渓谷からユルドゥズ草原まで進撃した。'
      },
      {
        year: 1405,
        eraZh: '1405年2月',
        ancientZh: 'オトラル',
        modernZh: 'カザフスタン・オトラル遺跡',
        ancientEn: 'Otrar',
        modernEn: 'Otrar, Kazakhstan',
        coord: [68.30, 42.85],
        fromCoord: [81.32, 43.92],
        via: [[66.96, 39.65]],
        labelPos: 'top',
        titleZh: '明朝遠征の途上、オトラルにて陣没',
        titleEn: 'Death at Otrar',
        descZh: '1404年冬、20万の大軍を率いてサマルカンドから明朝遠征へ出発したが、シル河畔のオトラルで病に倒れ1405年2月に68歳で死去した。',
        descEn: 'Setting out on a winter campaign toward Ming China, Timur fell ill and died at Otrar in February 1405.',
        quoteZh: '『ザファル・ナーマ』',
        quoteEn: 'Zafarnama',
        persons: ['timur'],
        titleJa: '明朝遠征の途上、オトラルにて陣没',
        descJa: '1404年冬、20万の大軍を率いてサマルカンドから明朝遠征へ出発したが、シル河畔のオトラルで病に倒れ1405年2月に68歳で死去した。'
      }
    ]
  },
  {
    key: 'zuo_zongtang',
    dynastyKey: 'qing_russian',
    color: '#7a4b9e',
    shortZh: '左宗棠・新疆収復',
    shortEn: 'Zuo Zongtang',
    titleZh: '左宗棠・劉錦棠の西征と新疆省設置',
    titleEn: "Zuo Zongtang's Reconquest of Xinjiang",
    spanZh: '1875年 — 1884年（光緒元〜10年）',
    spanEn: '1875 – 1884 CE',
    stops: [
      {
        year: 1876,
        eraZh: '光緒2年春',
        ancientZh: '酒泉',
        modernZh: '中国甘粛省酒泉市',
        ancientEn: 'Jiuquan (Suzhou)',
        modernEn: 'Jiuquan, Gansu',
        coord: [98.51, 39.74],
        labelPos: 'bottom',
        titleZh: '粛州（酒泉）への本営前進',
        titleEn: 'Headquarters at Suzhou (Jiuquan)',
        descZh: '欽差大臣・左宗棠が蘭州から河西回廊の酒泉（粛州）へ本営を進め、「緩進急戦・先北後南」の方針のもと劉錦棠に先鋒として出撃を命じた。',
        descEn: 'Imperial Commissioner Zuo Zongtang advanced his headquarters to Suzhou and launched the campaign under Liu Jintang.',
        quoteZh: '左宗棠『遵旨統籌全局摺』：「重新疆者所以保蒙古、保蒙古者所以衛京師。」',
        quoteEn: 'Memorials of Zuo Zongtang',
        persons: ['zuo_zongtang'],
        titleJa: '粛州（酒泉）への本営前進',
        descJa: '欽差大臣・左宗棠が蘭州から河西回廊の酒泉（粛州）へ本営を進め、「緩進急戦・先北後南」の方針のもと劉錦棠に先鋒として出撃を命じた。'
      },
      {
        year: 1876,
        eraZh: '光緒2年8月',
        ancientZh: 'ウルムチ',
        modernZh: '新疆ウルムチ市',
        ancientEn: 'Urumqi (Dihua)',
        modernEn: 'Urumqi, Xinjiang',
        coord: [87.62, 43.82],
        fromCoord: [98.51, 39.74],
        via: [[93.51, 42.82]],
        labelPos: 'top',
        titleZh: 'ハミ経由・ウルムチ（迪化）奪還',
        titleEn: 'Recapture of Urumqi',
        descZh: 'ハミ（哈密）を兵站基地としてボグダ山北麓へ進出し、古牧地・ウルムチ・マナスを連破して天山北路を平定した。',
        descEn: 'Advancing via Hami, Qing forces recaptured Urumqi and secured northern Xinjiang.',
        quoteZh: '『清史稿・左宗棠伝』',
        quoteEn: 'Draft History of Qing',
        persons: ['zuo_zongtang'],
        titleJa: 'ハミ経由・ウルムチ（迪化）奪還',
        descJa: 'ハミ（哈密）を兵站基地としてボグダ山北麓へ進出し、古牧地・ウルムチ・マナスを連破して天山北路を平定した。'
      },
      {
        year: 1877,
        eraZh: '光緒3年4月',
        ancientZh: 'トルファン（高昌）',
        modernZh: '新疆トルファン市',
        ancientEn: 'Turfan',
        modernEn: 'Turpan, Xinjiang',
        coord: [89.19, 42.95],
        fromCoord: [87.62, 43.82],
        labelPos: 'bottom',
        titleZh: 'トルファン攻略とヤクブ・ベク急死',
        titleEn: 'Capture of Turfan',
        descZh: 'ダ坂城・トクスン・トルファンを連破して南疆への門戸を開き、直後の5月にヤクブ・ベクがコルラ（庫爾勒）で急死した。',
        descEn: 'Qing forces captured Dabancheng and Turfan; Yakub Beg died at Korla shortly thereafter.',
        quoteZh: '『清史稿』',
        quoteEn: 'Draft History of Qing',
        persons: ['zuo_zongtang'],
        titleJa: 'トルファン攻略とヤクブ・ベク急死',
        descJa: 'ダ坂城・トクスン・トルファンを連破して南疆への門戸を開き、直後の5月にヤクブ・ベクがコルラ（庫爾勒）で急死した。'
      },
      {
        year: 1877,
        eraZh: '光緒3年12月',
        ancientZh: 'カシュガル（喀什噶爾）',
        modernZh: '新疆カシュガル市',
        ancientEn: 'Kashgar',
        modernEn: 'Kashgar, Xinjiang',
        coord: [75.99, 39.47],
        fromCoord: [89.19, 42.95],
        via: [[86.15, 41.76], [82.96, 41.72], [80.26, 41.17]],
        labelPos: 'top',
        titleZh: '南疆西四城（カシュガル・ヤルカンド・ホータン）回復',
        titleEn: 'Recovery of Kashgar, Yarkand & Khotan',
        descZh: '劉錦棠がコルラ・クチャ・アクスを経てカシュガル・ヤルカンド・ホータンを回復。1881年のイリ返還条約と1884年の新疆省設置へと結実した。',
        descEn: 'Liu Jintang swept across the Tarim Basin to recover Kashgar, Yarkand, and Khotan, leading to the 1881 Treaty of Saint Petersburg and establishment of Xinjiang Province in 1884.',
        quoteZh: '『清史稿』',
        quoteEn: 'Draft History of Qing',
        persons: ['zuo_zongtang'],
        titleJa: '南疆西四城（カシュガル・ヤルカンド・ホータン）回復',
        descJa: '劉錦棠がコルラ・クチャ・アクスを経てカシュガル・ヤルカンド・ホータンを回復。1881年のイリ返還条約と1884年の新疆省設置へと結実した。'
      }
    ]
  }
];

const PERSON_PROFILES = [
  {
    key: 'genghis_khan',
    zh: 'チンギス・ハーン',
    en: 'Genghis Khan',
    courtesyZh: 'テムジン・モンゴル帝国初代ハーン',
    courtesyEn: 'Temüjin, Founder of the Mongol Empire',
    courtesyJa: 'テムジン・モンゴル帝国初代ハーン',
    dynastyKey: 'mongol_rise',
    span: [1162, 1227],
    aliases: ['テムジン', '成吉思汗', 'チンギス・カン', '太祖'],
    tokens: ['チンギス・ハーン', 'テムジン']
  },
  {
    key: 'qiu_chuji',
    zh: '丘処機（長春真人）',
    en: 'Qiu Chuji (Master Changchun)',
    courtesyZh: '通密・長春真人・『長春真人西遊記』',
    courtesyEn: 'Taoist Patriarch & Traveler to Central Asia',
    courtesyJa: '通密・長春真人・『長春真人西遊記』',
    dynastyKey: 'mongol_rise',
    span: [1148, 1227],
    aliases: ['長春真人', '丘処機'],
    tokens: ['丘処機', '長春真人']
  },
  {
    key: 'timur',
    zh: 'アミール・ティムール',
    en: 'Amir Timur (Tamerlane)',
    courtesyZh: 'サーヒブ・キラーン・ティムール朝創始者',
    courtesyEn: 'Sahib Qiran, Founder of the Timurid Empire',
    courtesyJa: 'サーヒブ・キラーン・ティムール朝創始者',
    dynastyKey: 'timurid',
    span: [1336, 1405],
    aliases: ['ティムール', '帖木児', 'タメルラン'],
    tokens: ['ティムール', 'アミール・ティムール']
  },
  {
    key: 'zuo_zongtang',
    zh: '左宗棠',
    en: 'Zuo Zongtang',
    courtesyZh: '季高・欽差大臣督辦新疆軍務',
    courtesyEn: 'Imperial Commissioner for Xinjiang',
    courtesyJa: '季高・欽差大臣督辦新疆軍務',
    dynastyKey: 'qing_russian',
    span: [1812, 1885],
    aliases: ['左文襄公', '左季高'],
    tokens: ['左宗棠']
  }
];

const POLITY_PROFILES = [
  {
    key: 'karakhitai_polity',
    zh: 'カラ・キタイ（西遼）',
    en: 'Qara Khitai (Western Liao)',
    titles: ['カラ・キタイ（西遼）', 'ナイマン（クチュルク政権）'],
    from: 1124,
    to: 1218,
    seatZh: 'ベラサグン（クズ・オルド）',
    seatEn: 'Balasagun (Quz Ordu)',
    rulersZh: 'イェリュ・ダシ（耶律大石）、感天太后、イェリュ・イリ、承天太后プスワン、末主チルグ',
    rulersEn: 'Yelü Dashi, Empress Xiao, Yelü Yili, Regent Pusuwan, Yelü Zhilugu',
    keywords: ['カラ・キタイ', '西遼', 'ベラサグン', 'カトワーン', 'クチュルク'],
    aliases: ['西遼', '黒契丹', 'カラ・キタイ'],
    summaryZh: '契丹（遼）の皇族イェリュ・ダシ（耶律大石）が中央アジアのベラサグンを都に建てた帝国。東・西カラハン朝や高昌ウイグル王国、ホラズムを属国とし、天山南北からマー・ワラー・アンナフルに至る覇権を握った。1211年にナイマン王子クチュルクに簒奪され、1218年にモンゴル軍に併合された。',
    summaryEn: 'Empire founded by the Khitan prince Yelü Dashi with its capital at Balasagun, exercising suzerainty over Transoxiana, Semirechye, and the Tarim Basin until the Mongol conquest of 1218.',
    summaryJa: '契丹（遼）の皇族イェリュ・ダシ（耶律大石）が中央アジアのベラサグンを都に建てた帝国。東・西カラハン朝や高昌ウイグル王国、ホラズムを属国とし、天山南北からマー・ワラー・アンナフルに至る覇権を握った。1211年にナイマン王子クチュルクに簒奪され、1218年にモンゴル軍に併合された。'
  },
  {
    key: 'khwarezm_polity',
    zh: 'ホラズム・シャー朝',
    en: 'Khwarezmian Empire',
    titles: ['ホラズム・シャー朝'],
    from: 1077,
    to: 1231,
    seatZh: 'ウルゲンチ ／ サマルカンド',
    seatEn: 'Urgench / Samarkand',
    rulersZh: 'アトスズ、イル・アルスラン、テキシュ、アラーウッディーン・ムハンマド、ジャラールッディーン',
    rulersEn: 'Atsiz, Il-Arslan, Tekish, Ala al-Din Muhammad II, Jalal al-Din',
    keywords: ['ホラズム', 'ウルゲンチ', 'オトラル事件'],
    aliases: ['ホラズム帝国', '花剌子模'],
    summaryZh: 'アム川下流のホラズム地方（ウルゲンチ）を本拠としたイスラーム王朝。13世紀初頭にイラン高原・ホラーサーン・マー・ワラー・アンナフルを統合して最大版図を築いたが、1218年のオトラル事件によりチンギス・ハーンの西征を招き滅亡した。',
    summaryEn: 'Islamic empire centered on Khwarezm (Urgench) and Samarkand that dominated Iran and Transoxiana before being conquered by Genghis Khan in 1219–1221.',
    summaryJa: 'アム川下流のホラズム地方（ウルゲンチ）を本拠としたイスラーム王朝。13世紀初頭にイラン高原・ホラーサーン・マー・ワラー・アンナフルを統合して最大版図を築いたが、1218年のオトラル事件によりチンギス・ハーンの西征を招き滅亡した。'
  },
  {
    key: 'chagatai_polity',
    zh: 'チャガタイ・ハン国',
    en: 'Chagatai Khanate',
    titles: ['チャガタイ・ハン国', '西チャガタイ・ハン国', 'モグーリスタン（東チャガタイ・ハン国）', 'モグーリスタン・ハン国'],
    from: 1227,
    to: 1570,
    seatZh: 'アルマリク ／ カルシ ／ ビシュバリク',
    seatEn: 'Almaliq / Qarshi / Beshbaliq',
    rulersZh: 'チャガタイ、アルグ、バラク、ドゥア、ケベク、タルマシリン、トゥグルク・ティムール、ワイス・ハーン',
    rulersEn: 'Chagatai, Alghu, Baraq, Duwa, Kebek, Tarmashirin, Tughlugh Timur, Uwais Khan',
    keywords: ['チャガタイ', 'モグーリスタン', 'アルマリク', 'カルシ'],
    aliases: ['チャガタイ・ウルス', '察合台汗国'],
    summaryZh: 'チンギス・ハーンの次男チャガタイに与えられたイリ渓谷・マー・ワラー・アンナフル・タリム盆地を領するウルス。14世紀初頭にドゥアとケベクが制度を整えた後、1340年代に西チャガタイと東のモグーリスタン・ハン国に分かれた。',
    summaryEn: 'Mongol khanate spanning the Ili Valley, Transoxiana, and the Tarim Basin ruled by the house of Chagatai.',
    summaryJa: 'チンギス・ハーンの次男チャガタイに与えられたイリ渓谷・マー・ワラー・アンナフル・タリム盆地を領するウルス。14世紀初頭にドゥアとケベクが制度を整えた後、1340年代に西チャガタイと東のモグーリスタン・ハン国に分かれた。'
  },
  {
    key: 'timurid_polity',
    zh: 'ティムール朝',
    en: 'Timurid Empire',
    titles: ['ティムール朝（ティムール帝国）', 'ティムール朝'],
    from: 1370,
    to: 1507,
    seatZh: 'サマルカンド → ヘラート',
    seatEn: 'Samarkand / Herat',
    rulersZh: 'アミール・ティムール、シャー・ルフ、ウルグ・ベク、アブー・サイード、フサイン・バイカラ',
    rulersEn: 'Timur, Shah Rukh, Ulugh Beg, Abu Sa\'id, Husayn Bayqara',
    keywords: ['ティムール', 'サマルカンド', 'ウルグ・ベク', 'ヘラート'],
    aliases: ['ティムール帝国', '帖木児帝国'],
    summaryZh: '1370年にアミール・ティムールがサマルカンドを都として創始した大帝国。サマルカンドとヘラートを中心に壮麗なイスラーム建築、ウルグ・ベク天文台、細密画、チャガタイ語文学が花開く「ティムール朝ルネサンス」を現出した。',
    summaryEn: 'Empire founded by Timur at Samarkand in 1370, renowned for the Timurid Renaissance in architecture, astronomy, and literature at Samarkand and Herat.',
    summaryJa: '1370年にアミール・ティムールがサマルカンドを都として創始した大帝国。サマルカンドとヘラートを中心に壮麗なイスラーム建築、ウルグ・ベク天文台、細密画、チャガタイ語文学が花開く「ティムール朝ルネサンス」を現出した。'
  },
  {
    key: 'bukhara_polity',
    zh: 'ブハラ・ハン国（ブハラ・アミール国）',
    en: 'Khanate / Emirate of Bukhara',
    titles: ['ブハラ・ハン国（シャイバーニー朝）', 'ブハラ・ハン国（ジャーン朝）', 'ブハラ・アミール国（マンギト朝）', 'ブハラ・アミール国（ロシア保護国）'],
    from: 1500,
    to: 1920,
    seatZh: 'サマルカンド → ブハラ',
    seatEn: 'Samarkand / Bukhara',
    rulersZh: 'ムハンマド・シャイバーニー、ウバイドゥッラー、アブドゥッラーフ2世、イマーム・クリー、シャー・ムラード',
    rulersEn: 'Muhammad Shaybani, Ubaydallah, Abdullah Khan II, Imam Quli, Shah Murad',
    keywords: ['ブハラ', 'シャイバーニー', 'マンギト朝'],
    aliases: ['ブハラ・ハン国', 'ブハラ・アミール国'],
    summaryZh: '1500年にムハンマド・シャイバーニー・ハーンがマー・ワラー・アンナフルを征服して成立したウズベク国家。シャイバーニー朝、ジャーン朝、マンギト朝（ブハラ・アミール国）と続き、中央アジアの宗教・学術・商業の中心となった。',
    summaryEn: 'Uzbek state ruling Transoxiana from Samarkand and Bukhara under the Shaybanid, Janid, and Manghit dynasties from 1500 to 1920.',
    summaryJa: '1500年にムハンマド・シャイバーニー・ハーンがマー・ワラー・アンナフルを征服して成立したウズベク国家。シャイバーニー朝、ジャーン朝、マンギト朝（ブハラ・アミール国）と続き、中央アジアの宗教・学術・商業の中心となった。'
  },
  {
    key: 'dzungar_polity',
    zh: 'ジュンガル・ハン国',
    en: 'Dzungar Khanate',
    titles: ['ジュンガル・ハン国', 'オイラト（ドルベン・オイラト）'],
    from: 1634,
    to: 1758,
    seatZh: 'イリ（クルジャ／グルジャ）',
    seatEn: 'Ili (Kulja / Ghulja)',
    rulersZh: 'バートル・ホンタイジ、センゲ、ガルダン・ボショクト・ハーン、ツェワン・ラブタン、ガルダン・ツェリン',
    rulersEn: 'Erdeni Batur, Sengge, Galdan Boshugtu Khan, Tsewang Rabtan, Galdan Tseren',
    keywords: ['ジュンガル', 'オイラト', 'ガルダン', 'イリ'],
    aliases: ['ジュンガル帝国', '準噶爾'],
    summaryZh: 'オイラトのチョロス部がイリ渓谷を本拠に樹立した遊牧帝国。タリム盆地（ヤルカンド・ハン国）を支配下に置き、ハルハ・チベット・カザフ草原へ進出して清朝の康熙・雍正・乾隆三代と中央ユーラシアの覇権を争った。',
    summaryEn: 'Oirat nomadic empire centered in the Ili Valley that contested Inner Asian hegemony with the Qing dynasty and Kazakh Khanate.',
    summaryJa: 'オイラトのチョロス部がイリ渓谷を本拠に樹立した遊牧帝国。タリム盆地（ヤルカンド・ハン国）を支配下に置き、ハルハ・チベット・カザフ草原へ進出して清朝の康熙・雍正・乾隆三代と中央ユーラシアの覇権を争った。'
  }
];

const CITY_LORE = [
  {
    modern: 'サマルカンド',
    coord: [66.96, 39.65],
    tagZh: 'マー・ワラー・アンナフルの珠玉・ティムール朝の帝都',
    tagEn: 'Pearl of Transoxiana · Timurid Capital',
    tagJa: 'マー・ワラー・アンナフルの珠玉・ティムール朝の帝都',
    descZh: 'ゼラフシャン川中流のソグディアナ・オアシスの中心都市。西カラハン朝・ホラズム・シャー朝の都となった後、1370年にアミール・ティムールが帝国の首都と定め、レギスタン広場、ビビ・ハニム・モスク、グーリ・アミール廟、ウルグ・ベク天文台が築かれた。',
    descEn: 'Historic heart of Sogdiana and imperial capital of Amir Timur and Ulugh Beg.',
    descJa: 'ゼラフシャン川中流のソグディアナ・オアシスの中心都市。西カラハン朝・ホラズム・シャー朝の都となった後、1370年にアミール・ティムールが帝国の首都と定め、レギスタン広場、ビビ・ハニム・モスク、グーリ・アミール廟、ウルグ・ベク天文台が築かれた。'
  },
  {
    modern: 'ブハラ',
    coord: [64.42, 39.77],
    tagZh: '貴きブハラ・シャイバーニー朝とブハラ・ハン国の都',
    tagEn: 'Noble Bukhara · Capital of the Bukhara Khanate',
    tagJa: '貴きブハラ・シャイバーニー朝とブハラ・ハン国の都',
    descZh: 'ゼラフシャン川下流のオアシス都市。カラハン朝期にカラーン・ミナレット（1127年）が建てられ、16世紀以降はシャイバーニー朝・ジャーン朝・マンギト朝（ブハラ・ハン国／アミール国）の首都として中央アジア最高のイスラーム学術都市となった。',
    descEn: 'Major oasis city of the lower Zeravshan and capital of the Khanate and Emirate of Bukhara.',
    descJa: 'ゼラフシャン川下流のオアシス都市。カラハン朝期にカラーン・ミナレット（1127年）が建てられ、16世紀以降はシャイバーニー朝・ジャーン朝・マンギト朝（ブハラ・ハン国／アミール国）の首都として中央アジア最高のイスラーム学術都市となった。'
  },
  {
    modern: 'ビシュバリク',
    coord: [89.18, 44.00],
    tagZh: '天山北路の古都・高昌ウイグル夏都とモグーリスタン本拠',
    tagEn: 'Beshbaliq · Five Cities of the Northern Tian Shan',
    tagJa: '天山北路の古都・高昌ウイグル夏都とモグーリスタン本拠',
    descZh: '天山山脈ボグダ峰の北麓（現・新疆ジムサル県北庭故城）に位置し、テュルク語で「五つの城」を意味する。天山ウイグル王国の夏の都であり、モンゴル帝国・元朝期にはビシュバリク行尚書省や北庭都元帥府が置かれ、モグーリスタン・ハン国の中心ともなった。',
    descEn: 'Summer capital of the Idiqut Uyghur Kingdom and key administrative center under the Mongol Empire and Moghulistan.',
    descJa: '天山山脈ボグダ峰の北麓（現・新疆ジムサル県北庭故城）に位置し、テュルク語で「五つの城」を意味する。天山ウイグル王国の夏の都であり、モンゴル帝国・元朝期にはビシュバリク行尚書省や北庭都元帥府が置かれ、モグーリスタン・ハン国の中心ともなった。'
  },
  {
    modern: 'ホータン（于闐）',
    coord: [79.92, 37.11],
    tagZh: '西域南道の中核オアシス・ホータン玉と絹の都',
    tagEn: 'Khotan (Yutian) · Jade Oasis of the Southern Tarim',
    tagJa: '西域南道の中核オアシス・ホータン玉と絹の都',
    descZh: '崑崙山脈北麓、ホータン川の扇状地に広がる西域南道最大のオアシス都市。古来より和田玉（ホータン玉）と養蚕・絹織物で名高く、カラハン朝、カラ・キタイ、チャガタイ・ハン国、ヤルカンド・ハン国、清朝の南疆統治における重要拠点となった。',
    descEn: 'Major southern Tarim Basin oasis famed for nephrite jade and silk production.',
    descJa: '崑崙山脈北麓、ホータン川の扇状地に広がる西域南道最大のオアシス都市。古来より和田玉（ホータン玉）と養蚕・絹織物で名高く、カラハン朝、カラ・キタイ、チャガタイ・ハン国、ヤルカンド・ハン国、清朝の南疆統治における重要拠点となった。'
  },
  {
    modern: 'カシュガル（喀什噶爾）',
    coord: [75.99, 39.47],
    tagZh: '天山南路・西域南北道の交差する交易都市',
    tagEn: 'Kashgar · Crossroads of the Silk Road',
    tagJa: '天山南路・西域南北道の交差する交易都市',
    descZh: 'タリム盆地最西端に位置し、天山・パミール・カラコルムを越える東西キャラバン路が集まる国際商業都市。東カラハン朝の都、白山派ホージャの本拠（アパク・ホージャ墓）、ヤクブ・ベク政権の中心、そしてグレート・ゲームの外交舞台となった。',
    descEn: 'Westernmost oasis of the Tarim Basin where the northern and southern Silk Roads meet the passes over the Pamirs and Tian Shan.',
    descJa: 'タリム盆地最西端に位置し、天山・パミール・カラコルムを越える東西キャラバン路が集まる国際商業都市。東カラハン朝の都、白山派ホージャの本拠（アパク・ホージャ墓）、ヤクブ・ベク政権の中心、そしてグレート・ゲームの外交舞台となった。'
  },
  {
    modern: 'ヤルカンド（葉爾羌）',
    coord: [77.25, 38.42],
    tagZh: 'ヤルカンド・ハン国200年の王都',
    tagEn: 'Yarkand · Capital of the Yarkent Khanate',
    tagJa: 'ヤルカンド・ハン国200年の王都',
    descZh: 'ヤルカンド川扇状地に広がる大オアシス。1514年にスルタン・サイード・ハーンがヤルカンド・ハン国の首都と定めて以来、タリム盆地最大の政治・文化都市として栄え、清代にもヤルカンド参賛大臣が置かれた。',
    descEn: 'Capital of the Yarkent Khanate (1514–1705) and chief Qing administrative seat in southern Xinjiang.',
    descJa: 'ヤルカンド川扇状地に広がる大オアシス。1514年にスルタン・サイード・ハーンがヤルカンド・ハン国の首都と定めて以来、タリム盆地最大の政治・文化都市として栄え、清代にもヤルカンド参賛大臣が置かれた。'
  },
  {
    modern: 'クチャ（亀茲）',
    coord: [82.96, 41.72],
    tagZh: '天山南路の中枢オアシス・古亀茲の都',
    tagEn: 'Kucha (Qiuci) · Central Oasis of the Northern Tarim',
    tagJa: '天山南路の中枢オアシス・古亀茲の都',
    descZh: '天山山脈南麓のほぼ中央に位置する要衝。キジル千仏洞などの仏教遺跡で知られ、ウイグル王国、チャガタイ・ハン国、モグーリスタン、ヤルカンド・ハン国、清朝を通じて西域北道の要となった。',
    descEn: 'Key oasis along the northern rim of the Tarim Basin at the southern foot of the Tian Shan.',
    descJa: '天山山脈南麓のほぼ中央に位置する要衝。キジル千仏洞などの仏教遺跡で知られ、ウイグル王国、チャガタイ・ハン国、モグーリスタン、ヤルカンド・ハン国、清朝を通じて西域北道の要となった。'
  },
  {
    modern: 'トルファン（高昌）',
    coord: [89.19, 42.95],
    tagZh: '高昌ウイグル王国の冬都・カレーズの緑洲',
    tagEn: 'Turfan (Qocho) · Winter Capital of the Uyghur Kingdom',
    tagJa: '高昌ウイグル王国の冬都・カレーズの緑洲',
    descZh: '天山東部のトルファン盆地に位置し、カレーズ（地下水路）灌漑で栄えた。高昌ウイグル王国の冬の都（カラホージャ）、モグーリスタン東部の中心、清代のエミン・ホージャ統治拠点として重要な役割を果たした。',
    descEn: 'Oasis of the Turfan Depression and capital of the Qocho Uyghur Kingdom.',
    descJa: '天山東部のトルファン盆地に位置し、カレーズ（地下水路）灌漑で栄えた。高昌ウイグル王国の冬の都（カラホージャ）、モグーリスタン東部の中心、清代のエミン・ホージャ統治拠点として重要な役割を果たした。'
  },
  {
    modern: 'ハミ（哈密）',
    coord: [93.51, 42.82],
    tagZh: '西域の咽喉・河西回廊と天山南北路の結節点',
    tagEn: 'Hami (Qumul) · Gateway to the Western Regions',
    tagJa: '西域の咽喉・河西回廊と天山南北路の結節点',
    descZh: '河西回廊の敦煌から白龍堆砂漠を越えて最初に達するオアシス。元代のチュベイ・ウルス、明代の哈密衛、清代のハミ回王旗が置かれ、歴代の西域遠征における最重要兵站基地となった。',
    descEn: 'Strategic easternmost oasis of Xinjiang linking the Hexi Corridor with both sides of the Tian Shan.',
    descJa: '河西回廊の敦煌から白龍堆砂漠を越えて最初に達するオアシス。元代のチュベイ・ウルス、明代の哈密衛、清代のハミ回王旗が置かれ、歴代の西域遠征における最重要兵站基地となった。'
  },
  {
    modern: 'イリ（クルジャ）',
    coord: [81.32, 43.92],
    tagZh: 'ジュンガル・ハン国本営・清朝イリ将軍駐在地',
    tagEn: 'Ili (Kulja / Ghulja) · Dzungar & Qing Military Seat',
    tagJa: 'ジュンガル・ハン国本営・清朝イリ将軍駐在地',
    descZh: 'イリ川渓谷の中心都市。チャガタイ・ハン国の都アルマリクに近く、17〜18世紀にはジュンガル・ハン国の本営（グルジャ）が置かれ、1762年以降は清朝のイリ将軍（恵遠城）が新疆全域とバルハシ湖方面を統括した。',
    descEn: 'Heart of the Ili River valley, seat of the Dzungar Khans and later the Qing General of Ili.',
    descJa: 'イリ川渓谷の中心都市。チャガタイ・ハン国の都アルマリクに近く、17〜18世紀にはジュンガル・ハン国の本営（グルジャ）が置かれ、1762年以降は清朝のイリ将軍（恵遠城）が新疆全域とバルハシ湖方面を統括した。'
  },
  {
    modern: 'タシュケント',
    coord: [69.24, 41.30],
    tagZh: 'シル川中流の要衝・トルキスタン総督府とウズベキスタン首都',
    tagEn: 'Tashkent · Metropolis of the Chirchiq Oasis',
    tagJa: 'シル川中流の要衝・トルキスタン総督府とウズベキスタン首都',
    descZh: '古名チャーチ（石国）。オアシス農耕圏とカザフ草原の接点に位置し、ティムール朝、モグーリスタン、カザフ・ハン国、コーカンド・ハン国が争奪した。1867年にロシア領トルキスタン総督府の首府となり、1930年よりウズベキスタンの首都。',
    descEn: 'Major commercial hub between the steppe and Transoxiana, seat of Russian Turkestan from 1867 and capital of Uzbekistan since 1930.',
    descJa: '古名チャーチ（石国）。オアシス農耕圏とカザフ草原の接点に位置し、ティムール朝、モグーリスタン、カザフ・ハン国、コーカンド・ハン国が争奪した。1867年にロシア領トルキスタン総督府の首府となり、1930年よりウズベキスタンの首都。'
  },
  {
    modern: 'ヒヴァ',
    coord: [60.36, 41.38],
    tagZh: 'ホラズム・オアシスの城塞都市・ヒヴァ・ハン国の都',
    tagEn: 'Khiva · Walled Capital of the Khiva Khanate',
    tagJa: 'ホラズム・オアシスの城塞都市・ヒヴァ・ハン国の都',
    descZh: 'アム川下流のホラズム地方に位置し、17世紀初頭にウルゲンチに代わってヒヴァ・ハン国の首都となった。内城「イチャン・カラ」に数々のモスク・マドラサ・ミナレットが残る。',
    descEn: 'Oasis city of Khwarezm and capital of the Khanate of Khiva from the early 17th century until 1920.',
    descJa: 'アム川下流のホラズム地方に位置し、17世紀初頭にウルゲンチに代わってヒヴァ・ハン国の首都となった。内城「イチャン・カラ」に数々のモスク・マドラサ・ミナレットが残る。'
  },
  {
    modern: 'コーカンド',
    coord: [70.94, 40.53],
    tagZh: 'フェルガナ盆地の覇者・コーカンド・ハン国の都',
    tagEn: 'Kokand · Capital of the Khanate of Kokand',
    tagJa: 'フェルガナ盆地の覇者・コーカンド・ハン国の都',
    descZh: 'フェルガナ盆地西部に位置し、1709年創始のコーカンド・ハン国の首都として栄えた。タシュケントからカシュガルに至る交易網を支配したが、1876年にロシア帝国に併合された。',
    descEn: 'Capital of the Khanate of Kokand (1709–1876) in the western Fergana Valley.',
    descJa: 'フェルガナ盆地西部に位置し、1709年創始のコーカンド・ハン国の首都として栄えた。タシュケントからカシュガルに至る交易網を支配したが、1876年にロシア帝国に併合された。'
  },
  {
    modern: 'ヘラート',
    coord: [62.20, 34.34],
    tagZh: 'ホラーサーンの真珠・ティムール朝後期の首都',
    tagEn: 'Herat · Pearl of Khorasan & Late Timurid Capital',
    tagJa: 'ホラーサーンの真珠・ティムール朝後期の首都',
    descZh: 'ハリー・ルード川流域の要衝。1405年にティムール朝のシャー・ルフが首都を遷し、15世紀後半のフサイン・バイカラとナヴァーイーの時代にイスラーム世界の文芸・美術の最高峰となった。',
    descEn: 'Imperial capital of the Timurid dynasty under Shah Rukh and Husayn Bayqara.',
    descJa: 'ハリー・ルード川流域の要衝。1405年にティムール朝のシャー・ルフが首都を遷し、15世紀後半のフサイン・バイカラとナヴァーイーの時代にイスラーム世界の文芸・美術の最高峰となった。'
  },
  {
    modern: '敦煌',
    coord: [94.66, 40.14],
    tagZh: '河西回廊西端の仏教聖地・西域南北道の起点',
    tagEn: 'Dunhuang · Oasis of the Mogao Caves',
    tagJa: '河西回廊西端の仏教聖地・西域南北道の起点',
    descZh: '河西回廊の最西端に位置し、莫高窟を擁するシルクロードの要衝。西夏、モンゴル帝国・元朝（沙州路）、明朝（沙州衛）、清朝（敦煌県）を通じて中国とタリム盆地を結ぶ門戸となった。',
    descEn: 'Westernmost oasis of the Hexi Corridor and gateway to the Tarim Basin.',
    descJa: '河西回廊の最西端に位置し、莫高窟を擁するシルクロードの要衝。西夏、モンゴル帝国・元朝（沙州路）、明朝（沙州衛）、清朝（敦煌県）を通じて中国とタリム盆地を結ぶ門戸となった。'
  }
];

const PLACE_GAZETTEER = [
  { name: 'ビシュバリク', aliases: ['北庭', '別失八里', 'ベシュ・バリク'], modern: '新疆ジムサル県（北庭故城）', coord: [89.18, 44.00], zoom: 2.6 },
  { name: 'サマルカンド', aliases: ['マラカンダ', '康国', '尋思干', 'サマルカンド'], modern: 'ウズベキスタン・サマルカンド', coord: [66.96, 39.65], zoom: 2.6 },
  { name: 'ブハラ', aliases: ['安国', '不花刺', 'ブハラ'], modern: 'ウズベキスタン・ブハラ', coord: [64.42, 39.77], zoom: 2.6 },
  { name: 'ヒヴァ', aliases: ['ヒヴァク', 'ホラズム'], modern: 'ウズベキスタン・ヒヴァ', coord: [60.36, 41.38], zoom: 2.6 },
  { name: 'ウルゲンチ', aliases: ['グルガンジ', '玉龍傑赤', 'クフナ・ウルゲンチ'], modern: 'トルクメニスタン・クフナ・ウルゲンチ', coord: [60.63, 41.55], zoom: 2.6 },
  { name: 'コーカンド', aliases: ['浩罕', 'ハワカンド'], modern: 'ウズベキスタン・コーカンド', coord: [70.94, 40.53], zoom: 2.6 },
  { name: 'タシュケント', aliases: ['石国', 'チャーチ', 'シャーシュ'], modern: 'ウズベキスタン・タシュケント', coord: [69.24, 41.30], zoom: 2.6 },
  { name: 'オトラル', aliases: ['ファラーブ', '訛答剌'], modern: 'カザフスタン・オトラル遺跡', coord: [68.30, 42.85], zoom: 2.6 },
  { name: 'ベラサグン', aliases: ['クズ・オルド', '虎思斡耳朶', 'ブラナ'], modern: 'キルギス・トクマク近郊', coord: [75.30, 42.75], zoom: 2.6 },
  { name: 'アルマリク', aliases: ['阿里麻里', '阿里馬城'], modern: '新疆イリ・コルガス近郊', coord: [80.55, 44.22], zoom: 2.6 },
  { name: 'イリ（クルジャ）', aliases: ['クルジャ', 'グルジャ', '恵遠城', '伊犁', '伊寧'], modern: '新疆イリ・グルジャ市（伊寧市）', coord: [81.32, 43.92], zoom: 2.6 },
  { name: 'ホータン（于闐）', aliases: ['ホータン', '于闐', 'コータン', '和田', '斡端'], modern: '新疆ホータン市（和田市）', coord: [79.92, 37.11], zoom: 2.6 },
  { name: 'カシュガル（喀什噶爾）', aliases: ['カシュガル', '喀什噶爾', '疏勒', '喀什', '可失合児'], modern: '新疆カシュガル市（喀什市）', coord: [75.99, 39.47], zoom: 2.6 },
  { name: 'ヤルカンド（葉爾羌）', aliases: ['ヤルカンド', '葉爾羌', '莎車'], modern: '新疆ヤルカンド県（莎車県）', coord: [77.25, 38.42], zoom: 2.6 },
  { name: 'アクス（阿克蘇）', aliases: ['アクス', '阿克蘇', '姑墨', '温宿'], modern: '新疆アクス市', coord: [80.26, 41.17], zoom: 2.6 },
  { name: 'クチャ（亀茲）', aliases: ['クチャ', '亀茲', '庫車', '曲先'], modern: '新疆クチャ市（庫車市）', coord: [82.96, 41.72], zoom: 2.6 },
  { name: 'カラシャール（焉耆）', aliases: ['カラシャール', '焉耆'], modern: '新疆カラシャール（焉耆県）', coord: [86.57, 42.06], zoom: 2.6 },
  { name: 'コルラ（庫爾勒）', aliases: ['コルラ', '庫爾勒'], modern: '新疆コルラ市', coord: [86.15, 41.76], zoom: 2.6 },
  { name: 'トルファン（高昌）', aliases: ['トルファン', '高昌', 'カラホージャ', '火州', '吐魯番'], modern: '新疆トルファン市', coord: [89.19, 42.95], zoom: 2.6 },
  { name: 'ハミ（哈密）', aliases: ['ハミ', '哈密', 'クムル', '伊州', '伊吾'], modern: '新疆ハミ市', coord: [93.51, 42.82], zoom: 2.6 },
  { name: 'チャルクリク（若羌）', aliases: ['チャルクリク', '若羌', '鄯善', '楼蘭'], modern: '新疆チャルクリク（若羌県）', coord: [88.17, 39.02], zoom: 2.6 },
  { name: 'チェルチェン（且末）', aliases: ['チェルチェン', '且末'], modern: '新疆チェルチェン（且末県）', coord: [85.53, 38.14], zoom: 2.6 },
  { name: '敦煌', aliases: ['沙州', '敦煌郡'], modern: '甘粛省敦煌市', coord: [94.66, 40.14], zoom: 2.6 },
  { name: 'ヘラート', aliases: ['也里', 'ハリーワ'], modern: 'アフガニスタン・ヘラート', coord: [62.20, 34.34], zoom: 2.6 },
  { name: 'メルヴ', aliases: ['マルヴ', '木鹿', 'マルギアナ'], modern: 'トルクメニスタン・マル近郊', coord: [62.18, 37.66], zoom: 2.6 },
  { name: 'バルフ', aliases: ['バクトラ', '縛喝', 'バクトリア'], modern: 'アフガニスタン・バルフ', coord: [66.90, 36.76], zoom: 2.6 },
  { name: 'カラコルム', aliases: ['和林', '哈剌和林', 'ハラホリン'], modern: 'モンゴル・ハラホリン', coord: [102.84, 47.20], zoom: 2.6 }
];

const PLACE_LANDMARK_EVENTS = [
  { dynastyKey: 'karakhitai', year: 1162, coord: [110.20, 49.10], site: 'デリウン・ボルダク', siteEn: 'Delüün Boldog', zh: '1162年、オノン河畔のデリウン・ボルダクにてイェスゲイ・バアトルの子テムジン（後のチンギス・ハーン）が生誕。', en: 'Birth of Temüjin (Genghis Khan) at Delüün Boldog on the Onon River.' },
  { dynastyKey: 'karakhitai', year: 1178, coord: [75.30, 42.75], site: 'ベラサグン', siteEn: 'Balasagun', zh: '1178年、カラ・キタイ（西遼）で末主イェリュ・チルグ（耶律直魯古）がベラサグンにて即位。', en: 'Yelü Zhilugu ascends the throne of Qara Khitai at Balasagun.' },
  { dynastyKey: 'mongol_rise', year: 1206, coord: [109.50, 47.50], site: 'オノン河源', siteEn: 'Onon River', zh: '1206年、テムジンがオノン河源のクリルタイでチンギス・ハーンに即位し大モンゴル・ウルスを建国。', en: 'Temüjin is proclaimed Genghis Khan at the Kurultai on the Onon River.' },
  { dynastyKey: 'mongol_rise', year: 1209, coord: [89.18, 44.00], site: 'ビシュバリク', siteEn: 'Beshbaliq', zh: '1209年、天山ウイグル王国（ビシュバリク・トルファン（高昌））のバルチュク・アルト・テギンがモンゴル帝国に帰順。', en: 'Barchuq Art Tegin of the Uyghur Kingdom of Beshbaliq and Qocho submits to Genghis Khan.' },
  { dynastyKey: 'mongol_rise', year: 1218, coord: [68.30, 42.85], site: 'オトラル', siteEn: 'Otrar', zh: '1218年、オトラル事件：ホラズム知事イナルチュクがモンゴルの通商使節団を殺害し、チンギス・ハーン西征の引き金となる。', en: 'The Otrar incident triggers the Mongol invasion of Khwarezm.' },
  { dynastyKey: 'mongol_rise', year: 1220, coord: [66.96, 39.65], site: 'サマルカンド', siteEn: 'Samarkand', zh: '1220年、チンギス・ハーン本軍がキジルクム砂漠を横断してブハラ・サマルカンドを相次いで攻略。', en: 'Genghis Khan captures Bukhara and Samarkand.' },
  { dynastyKey: 'mongol_empire', year: 1235, coord: [102.84, 47.20], site: 'カラコルム', siteEn: 'Karakorum', zh: '1235年、第2代オゴデイ・ハーンがオルホン河畔のカラコルム城壁と万安宮を完成させる。', en: 'Ögedei Khan completes the imperial capital of Karakorum.' },
  { dynastyKey: 'kaidu_chagatai', year: 1269, coord: [71.39, 42.90], site: 'タラズ', siteEn: 'Talas', zh: '1269年、タラス河畔のクリルタイ：オゴデイ家のハイドゥがチャガタイ・ジョチ両ウルスと盟約を結びハイドゥ・ウルスを形成。', en: 'Kurultai of Talas establishes Kaidu as head of the Central Asian Mongol coalition.' },
  { dynastyKey: 'kaidu_chagatai', year: 1347, coord: [80.26, 41.17], site: 'アクス（阿克蘇）', siteEn: 'Aksu', zh: '1347年、ドゥグラト部に擁立されたトゥグルク・ティムールがアクス（阿克蘇）で即位しモグーリスタン・ハン国が成立。', en: 'Tughlugh Timur is enthroned at Aksu, founding Moghulistan.' },
  { dynastyKey: 'timurid', year: 1370, coord: [66.96, 39.65], site: 'サマルカンド', siteEn: 'Samarkand', zh: '1370年、アミール・ティムールがサマルカンドを首都に定め、ティムール朝を創始。', en: 'Amir Timur establishes his capital at Samarkand.' },
  { dynastyKey: 'timurid', year: 1405, coord: [62.20, 34.34], site: 'ヘラート', siteEn: 'Herat', zh: '1405年、ティムール朝のシャー・ルフがヘラートを帝国の首都と定める。', en: 'Shah Rukh makes Herat the imperial capital of the Timurid realm.' },
  { dynastyKey: 'uzbek_kazakh', year: 1500, coord: [64.42, 39.77], site: 'ブハラ', siteEn: 'Bukhara', zh: '1500年、ムハンマド・シャイバーニー・ハーンがブハラとサマルカンドを占領しブハラ・ハン国（シャイバーニー朝）を樹立。', en: 'Muhammad Shaybani Khan establishes Uzbek rule in Bukhara and Samarkand.' },
  { dynastyKey: 'uzbek_kazakh', year: 1514, coord: [77.25, 38.42], site: 'ヤルカンド（葉爾羌）', siteEn: 'Yarkand', zh: '1514年、スルタン・サイード・ハーンがヤルカンド（葉爾羌）を都にヤルカンド・ハン国を建国。', en: 'Sultan Said Khan founds the Yarkent Khanate at Yarkand.' },
  { dynastyKey: 'dzungar', year: 1680, coord: [75.99, 39.47], site: 'カシュガル（喀什噶爾）', siteEn: 'Kashgar', zh: '1680年、ジュンガルのガルダン・ボショクト・ハーンがカシュガル（喀什噶爾）・ヤルカンド（葉爾羌）に進軍しタリム盆地を制圧。', en: 'Galdan Boshugtu Khan conquers Kashgar and Yarkand.' },
  { dynastyKey: 'dzungar', year: 1755, coord: [81.32, 43.92], site: 'イリ（クルジャ）', siteEn: 'Ili (Kulja)', zh: '1755年、清朝の乾隆帝の軍がイリ（クルジャ）に進駐してジュンガル・ハン国を平定し、1762年にイリ将軍を設置。', en: 'Qing forces capture Ili (Kulja) and pacify the Dzungar Khanate.' },
  { dynastyKey: 'qing_russian', year: 1865, coord: [69.24, 41.30], site: 'タシュケント', siteEn: 'Tashkent', zh: '1865年、ロシア帝国軍がタシュケントを占領し、1867年にトルキスタン総督府を設置。', en: 'Russian forces capture Tashkent and establish the Governorate-General of Turkestan.' },
  { dynastyKey: 'qing_russian', year: 1877, coord: [79.92, 37.11], site: 'ホータン（于闐）', siteEn: 'Khotan', zh: '1877〜1878年、左宗棠・劉錦棠の西征軍がカシュガル（喀什噶爾）・ヤルカンド（葉爾羌）・ホータン（于闐）を回復し、1884年に新疆省が設置される。', en: 'Zuo Zongtang and Liu Jintang recover Kashgar, Yarkand, and Khotan, leading to the creation of Xinjiang Province in 1884.' },
  { dynastyKey: 'modern_ca', year: 1924, coord: [69.24, 41.30], site: 'タシュケント', siteEn: 'Tashkent', zh: '1924年、ソビエト中央アジアの民族的境界画定によりウズベク・トルクメン等の構成共和国体制が形成される。', en: 'National delimitation in Soviet Central Asia creates the modern republics.' }
];

const loreOut = `// Generated Central Asia Lore Data (1162 - 1949)
window.ATLAS_LORE_DATA = ${JSON.stringify({
  CHINESE_ERA_SPANS,
  REGIONAL_ERA_TRACKS,
  PLACE_LANDMARK_EVENTS,
  GUQIN_TRACKS: ORIG_LORE.GUQIN_TRACKS || [],
  HISTORICAL_JOURNEYS,
  STRATEGIC_PASSES,
  CITY_LORE,
  PLACE_GAZETTEER,
  PERSON_PROFILES,
  POLITY_PROFILES
}, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, 'js', 'lore_data.js'), loreOut, 'utf8');
console.log('Generated js/lore_data.js with full schema compatibility.');

// ============================================================================
// 3. UPDATE index.html INITIAL DOM METADATA & YEAR RANGE (1162 - 1949)
// ============================================================================
const indexPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('<html lang="zh-TW">', '<html lang="ja">');
html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>西域時序 · 中央アジア時代変遷地図（1162年チンギス・ハーン生誕〜1949年中華人民共和国成立）</title>');
html = html.replace('<span class="seal-mark" id="txt-seal">江山时序</span>', '<span class="seal-mark" id="txt-seal">西域時序</span>');
html = html.replace('<span class="subtitle-mark" id="txt-subtitle">中国歴史地図 · 戦国 → 現代</span>', '<span class="subtitle-mark" id="txt-subtitle">中央アジア時代変遷地図 · 1162 → 1949</span>');
html = html.replace('<h2 id="dynasty-title">战国</h2>', '<h2 id="dynasty-title">カラ・キタイとホラズム</h2>');
html = html.replace('<span id="dynasty-span" class="span-label">前403 — 前221</span>', '<span id="dynasty-span" class="span-label">1162年 — 1205年</span>');
html = html.replace('<span id="dynasty-seat">咸阳（秦）· 洛阳（周）· 七雄都城</span>', '<span id="dynasty-seat">ベラサグン · ウルゲンチ · サマルカンド · ビシュバリク</span>');
html = html.replace(
  /<p id="dynasty-summary" class="dynasty-desc">[\s\S]*?<\/p>/,
  '<p id="dynasty-summary" class="dynasty-desc">1162年、モンゴル高原のオノン河畔でテムジン（後のチンギス・ハーン）が誕生した時期、中央アジアでは契丹（遼）の皇族イェリュ・ダシ（耶律大石）が建てたカラ・キタイ（西遼）がベラサグンを都に天山南北・マー・ワラー・アンナフルに覇権を唱え、西カラハン朝（サマルカンド・ブハラ）、東カラハン朝（カシュガル（喀什噶爾）・ホータン（于闐））、高昌ウイグル王国（ビシュバリク・トルファン（高昌））を従えていた。一方、西方ではウルゲンチを本拠とするホラズム・シャー朝が急速に台頭し、1200年までにイラン高原からシル川流域へ版図を拡大した。</p>'
);
html = html.replace(
  /<ul id="milestone-list">[\s\S]*?<\/ul>/,
  `<ul id="milestone-list">
            <li><span class="ev-yr">1162 年</span><span>オノン河畔デリウン・ボルドグにてテムジン（チンギス・ハーン）誕生</span></li>
            <li><span class="ev-yr">1164 年</span><span>カラ・キタイ（西遼）の摂政感天太后が没し、承天太后プスワンが政権を継承</span></li>
            <li><span class="ev-yr">1178 年</span><span>カラ・キタイ末主・耶律直魯古（チルグ）がベラサグンにて即位</span></li>
            <li><span class="ev-yr">1189 年</span><span>テムジンがオノン・ケルレン河源でモンゴル部のカンに推戴される</span></li>
            <li><span class="ev-yr">1200 年</span><span>ホラズム・シャー朝でアラーウッディーン・ムハンマドが即位、中央アジア最大勢力へ急成長</span></li>
          </ul>`
);
html = html.replace(
  /<span id="bubble-text">[\s\S]*?<\/span>/,
  '<span id="bubble-text">西暦 1162 年 · カラ・キタイ</span>'
);
html = html.replace('aria-valuemin="-403" aria-valuemax="2026" aria-valuenow="-403"', 'aria-valuemin="1162" aria-valuemax="1949" aria-valuenow="1162"');
html = html.replace('min="-403" max="2026" step="1" value="-403"', 'min="1162" max="1949" step="1" value="1162"');

// Cache busting v=ca_v3
html = html.replace(/css\/style\.css\?v=[^"]+/, 'css/style.css?v=ca_v3');
html = html.replace(/js\/china_geo_data\.js\?v=[^"]+/, 'js/china_geo_data.js?v=ca_v2');
html = html.replace(/js\/atlas_boot\.js\?v=[^"]+/, 'js/atlas_boot.js?v=ca_v2');
html = html.replace(/js\/map_data\.js\?v=[^"]+/, 'js/map_data.js?v=ca_v2');
html = html.replace(/js\/lore_data\.js\?v=[^"]+/, 'js/lore_data.js?v=ca_v2');
html = html.replace(/js\/ja_dict\.js\?v=[^"]+/, 'js/ja_dict.js?v=ca_v2');
html = html.replace(/js\/app\.js\?v=[^"]+" data-v-snapshots="[^"]+"/, 'js/app.js?v=ca_v3" data-v-snapshots="ca_v2"');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated index.html successfully.');
