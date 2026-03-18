/**
 * scoring.js
 * 参加者ペア間の相性スコアを計算するモジュール
 * スコア範囲: 0〜95点（ペナルティで負になることあり、最低0で丸める）
 */

'use strict';

// 業種補完マトリクス（加点対象の組み合わせ）
const INDUSTRY_COMPLEMENT = {
  'IT/情報通信関係': ['コンサル関係', 'デザイン関係', '広告関係', '製造業関係', '金融/保険業', '教育関係', '医療/介護/福祉/健康/スポーツ関係'],
  'コンサル関係': ['IT/情報通信関係', '士業（税理士/会計士/弁護士など）', '金融/保険業', '製造業関係', '人材（派遣/紹介）関係'],
  'デザイン関係': ['IT/情報通信関係', '広告関係', '店舗（飲食/美容/物販）関係', '美容/ファッション関係'],
  '不動産/住宅/建設関係': ['金融/保険業', 'IT/情報通信関係', '製造業関係', '士業（税理士/会計士/弁護士など）'],
  '人材（派遣/紹介）関係': ['IT/情報通信関係', 'コンサル関係', '医療/介護/福祉/健康/スポーツ関係', '教育関係'],
  '医療/介護/福祉/健康/スポーツ関係': ['IT/情報通信関係', '人材（派遣/紹介）関係', '金融/保険業'],
  '士業（税理士/会計士/弁護士など）': ['コンサル関係', '金融/保険業', '不動産/住宅/建設関係'],
  '広告関係': ['IT/情報通信関係', 'デザイン関係', '店舗（飲食/美容/物販）関係'],
  '店舗（飲食/美容/物販）関係': ['広告関係', 'IT/情報通信関係', '流通/卸売/小売関係', '製造業関係'],
  '教育関係': ['IT/情報通信関係', 'コンサル関係', '人材（派遣/紹介）関係'],
  '旅行/観光関係': ['IT/情報通信関係', '広告関係'],
  '流通/卸売/小売関係': ['製造業関係', '物流/運輸/郵便業', '店舗（飲食/美容/物販）関係'],
  '物流/運輸/郵便業': ['流通/卸売/小売関係', '製造業関係'],
  '生活品関係/食品（食材）': ['流通/卸売/小売関係', '製造業関係', '店舗（飲食/美容/物販）関係'],
  '美容/ファッション関係': ['IT/情報通信関係', '広告関係', 'デザイン関係'],
  '製造業関係': ['IT/情報通信関係', '流通/卸売/小売関係', '不動産/住宅/建設関係', '物流/運輸/郵便業'],
  '農業/林業/漁業/鉱業関係': ['生活品関係/食品（食材）', 'IT/情報通信関係'],
  '金融/保険業': ['IT/情報通信関係', '不動産/住宅/建設関係', '士業（税理士/会計士/弁護士など）', 'コンサル関係'],
  '電気/ガス/熱供給/水道業': ['IT/情報通信関係', '製造業関係'],
  'その他': [],
};

// 目的補完マトリクス（AがP1かつBがP2 → 加点）
const PURPOSE_COMPLEMENT_PAIRS = [
  { a: '販路開拓', b: '仕入先・外注先の発掘', score: 20 },
  { a: '仕入先・外注先の発掘', b: '販路開拓', score: 20 },
  { a: 'ビジネス提携先の発掘', b: 'ビジネス提携先の発掘', score: 15 },
  { a: '資金調達・投資家探し', b: '販路開拓', score: 10 },
  { a: '採用・人材確保', b: '情報収集・学び', score: 10 },
  { a: '情報収集・学び', b: '採用・人材確保', score: 10 },
];

/**
 * 2人の参加者間の相性スコアを計算する
 * @param {Object} a - 参加者A
 * @param {Object} b - 参加者B
 * @returns {number} 相性スコア（0〜95、趣味・出身地ボーナス最大+10）
 */
function calcScore(a, b) {
  let score = 0;

  // --- 1. 目的補完性（最大40点） ---
  let purposeScore = 0;
  const purposesA = a.purposes || [];
  const purposesB = b.purposes || [];

  for (const pair of PURPOSE_COMPLEMENT_PAIRS) {
    if (purposesA.includes(pair.a) && purposesB.includes(pair.b)) {
      purposeScore += pair.score;
    }
  }

  // 同目的同士（情報交換）+5点
  for (const p of purposesA) {
    if (purposesB.includes(p)) {
      purposeScore += 5;
    }
  }

  score += Math.min(purposeScore, 40);

  // --- 2. 業種相性（最大30点、ペナルティあり） ---
  let industryScore = 0;
  const industryA = a.industry || '';
  const industryB = b.industry || '';
  const preferA = a.preferIndustries || [];
  const preferB = b.preferIndustries || [];
  const avoidA = a.avoidIndustries || [];
  const avoidB = b.avoidIndustries || [];

  // ペナルティチェック（避けたい業種）
  if (avoidA.includes(industryB) || avoidB.includes(industryA)) {
    industryScore -= 20;
  }

  // 話したい業種に該当
  if (preferA.includes(industryB)) industryScore += 20;
  if (preferB.includes(industryA)) industryScore += 20;

  // 業種補完マトリクス
  const complementList = INDUSTRY_COMPLEMENT[industryA] || [];
  if (complementList.includes(industryB)) {
    industryScore += 10;
  }

  // 同業種ペナルティ
  if (industryA && industryB && industryA === industryB) {
    industryScore -= 10;
  }

  score += Math.max(-20, Math.min(industryScore, 30));

  // --- 3. 規模近似（最大15点） ---
  const SIZE_ORDER = ['1人（個人事業）', '2〜10人', '11〜50人', '51人以上'];
  const sizeIdxA = SIZE_ORDER.indexOf(a.companySize);
  const sizeIdxB = SIZE_ORDER.indexOf(b.companySize);
  if (sizeIdxA >= 0 && sizeIdxB >= 0) {
    const diff = Math.abs(sizeIdxA - sizeIdxB);
    if (diff === 0) score += 15;
    else if (diff === 1) score += 10;
    else if (diff === 2) score += 5;
  }

  // --- 4. 共通点ボーナス（最大+10点） ---
  // 趣味（複数選択対応）: 共通趣味1個につき+2点、上限5点
  const hobbiesA = Array.isArray(a.hobbies) ? a.hobbies : (a.hobby ? [a.hobby] : []);
  const hobbiesB = Array.isArray(b.hobbies) ? b.hobbies : (b.hobby ? [b.hobby] : []);
  const commonHobbies = hobbiesA.filter(h => h !== 'その他' && hobbiesB.includes(h));
  if (commonHobbies.length > 0) {
    score += Math.min(commonHobbies.length * 2, 5);
  }

  // 同じ出身地
  if (a.birthplace && b.birthplace && a.birthplace === b.birthplace && a.birthplace !== '海外') {
    score += 5;
  }

  return Math.max(0, score);
}

/**
 * 全参加者間の相性スコア行列を計算する
 * @param {Array} participants - 参加者配列
 * @returns {Array<Array<number>>} N×Nのスコア行列
 */
function buildScoreMatrix(participants) {
  const n = participants.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = calcScore(participants[i], participants[j]);
      matrix[i][j] = s;
      matrix[j][i] = s;
    }
  }

  return matrix;
}

// グローバルまたはモジュールとして公開
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcScore, buildScoreMatrix, INDUSTRY_COMPLEMENT };
}
if (typeof window !== 'undefined') {
  window.Scoring = { calcScore, buildScoreMatrix, INDUSTRY_COMPLEMENT };
}
