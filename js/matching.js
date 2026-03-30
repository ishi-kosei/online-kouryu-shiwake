/**
 * matching.js
 * 5ラウンドのマッチングスケジュールを生成するモジュール
 *
 * アルゴリズム: 貪欲法（Greedy Weighted Matching）
 * - 相性スコア降順にペアを確定
 * - 既に会ったペアは除外
 * - 奇数人数はダミー参加者で調整（ダミー戦 = 「休憩」）
 */

'use strict';

const DUMMY_NAME = '__BYE__';
const ROUNDS = 5;

/**
 * マッチングを生成する
 * @param {Array} participants - 参加者配列（各要素は scoring.js の形式）
 * @param {Array<Array<number>>} scoreMatrix - buildScoreMatrix() の出力
 * @param {Object} [options]
 * @param {number}  [options.roundsToGenerate=5] - 生成するラウンド数（途中再マッチ時に5未満を指定）
 * @param {Set}     [options.initialUsedPairs]   - 過去ラウンドの使用済みペア（"idA---idB" 形式のSet）
 * @returns {Object} { rounds: Array<Array<{a, b, score}>>, hasBye: boolean }
 */
function generateMatching(participants, scoreMatrix, options = {}) {
  const roundsToGenerate = options.roundsToGenerate != null ? options.roundsToGenerate : ROUNDS;

  // 奇数人数対応: ダミー追加
  let list = [...participants];
  let matrix = scoreMatrix.map(row => [...row]);
  let hasBye = false;

  if (list.length % 2 !== 0) {
    hasBye = true;
    const dummy = { id: DUMMY_NAME, name: '（休憩）', company: '', isDummy: true };
    const n = list.length;
    list.push(dummy);
    // ダミーのスコアはすべて-1（最低優先度）
    for (let i = 0; i < n; i++) {
      matrix[i].push(-1);
    }
    matrix.push(new Array(n + 1).fill(-1));
  }

  const n = list.length;

  // ラウンドの「質レベル」をシャッフル
  // 貪欲法は常に「残り最高スコアのペア」を取るため、
  // 生成順 0→1→2→3→4 だと Round1 が常に最高スコアになる。
  // 生成した結果を格納するスロット番号をシャッフルすることで
  // 「どのラウンドが高スコアか」をランダム化し、参加者が
  // 最後のラウンドで最高の出会いをするケースも生まれる。
  const roundSlots = Array.from({ length: roundsToGenerate }, (_, i) => i);
  for (let i = roundSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roundSlots[i], roundSlots[j]] = [roundSlots[j], roundSlots[i]];
  }
  const roundResults = new Array(roundsToGenerate);

  // ID→インデックスマップ（initialUsedPairs の変換用）
  const idToIdx = {};
  list.forEach((p, i) => { if (p.id) idToIdx[p.id] = i; });

  // 既にマッチしたペアのセット（"i-j" 形式、i<j）
  const usedPairs = new Set();

  // 過去ラウンドで使用済みのID対をインデックス対に変換して登録
  for (const key of (options.initialUsedPairs || [])) {
    const parts = key.split('---');
    if (parts.length === 2) {
      const iA = idToIdx[parts[0]], iB = idToIdx[parts[1]];
      if (iA !== undefined && iB !== undefined) {
        const lo = Math.min(iA, iB), hi = Math.max(iA, iB);
        usedPairs.add(`${lo}-${hi}`);
      }
    }
  }

  for (let round = 0; round < roundsToGenerate; round++) {
    // 全ペアをスコア降順でソート（まだ会っていないもの）
    const candidates = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (!usedPairs.has(`${i}-${j}`)) {
          candidates.push({ i, j, score: matrix[i][j] });
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score);

    // 貪欲にペアを確定（インデックスも保持）
    const matched = new Set();
    const roundPairs = []; // { a, b, score, _i, _j }

    for (const { i, j, score } of candidates) {
      if (!matched.has(i) && !matched.has(j)) {
        matched.add(i);
        matched.add(j);
        usedPairs.add(`${i}-${j}`);
        roundPairs.push({ a: list[i], b: list[j], score: Math.max(0, score), _i: i, _j: j });
      }
    }

    // 未マッチの参加者を収集
    const unmatched = [];
    for (let i = 0; i < n; i++) {
      if (!matched.has(i)) unmatched.push(i);
    }

    // 拡張パスで同一ペア回避を試みる
    // 未マッチの u に対し、既確定ペア(x,y) の片方と交換できないか探索
    if (unmatched.length >= 2) {
      let improved = true;
      while (improved && unmatched.length >= 2) {
        improved = false;
        outer: for (let ui = 0; ui < unmatched.length; ui++) {
          const u = unmatched[ui];
          for (let pi = 0; pi < roundPairs.length; pi++) {
            const { _i: x, _j: y } = roundPairs[pi];
            for (const [swap1, swap2] of [[u, x, y], [u, y, x]].map(([a, b, c]) => [a, b, c])) {
              const newKey1 = `${Math.min(swap1, swap2)}-${Math.max(swap1, swap2)}`;
              if (usedPairs.has(newKey1)) continue;
              // swap1(=u) と swap2(=x or y) を新ペアに。swap2 の元パートナー swap3 を未マッチへ
              const swap3 = swap2 === x ? y : x;
              // swap3 と組める未マッチ v を探す
              for (let vi = 0; vi < unmatched.length; vi++) {
                if (vi === ui) continue;
                const v = unmatched[vi];
                const newKey2 = `${Math.min(swap3, v)}-${Math.max(swap3, v)}`;
                if (usedPairs.has(newKey2)) continue;
                // 拡張パス確定: 既存ペアを解除して新ペア2組を追加
                usedPairs.delete(`${Math.min(x, y)}-${Math.max(x, y)}`);
                roundPairs.splice(pi, 1);
                usedPairs.add(newKey1);
                usedPairs.add(newKey2);
                roundPairs.push({ a: list[swap1], b: list[swap2], score: Math.max(0, matrix[swap1][swap2]), _i: Math.min(swap1,swap2), _j: Math.max(swap1,swap2) });
                roundPairs.push({ a: list[swap3], b: list[v],     score: Math.max(0, matrix[swap3][v]),     _i: Math.min(swap3,v),    _j: Math.max(swap3,v)    });
                const hi = Math.max(ui, vi), lo = Math.min(ui, vi);
                unmatched.splice(hi, 1);
                unmatched.splice(lo, 1);
                improved = true;
                break outer;
              }
            }
          }
        }
      }
    }

    // それでも未マッチが残る場合のみやむを得ずペアリング（人数が少なすぎる場合）
    for (let k = 0; k < unmatched.length - 1; k += 2) {
      const i = unmatched[k], j = unmatched[k + 1];
      roundPairs.push({ a: list[i], b: list[j], score: Math.max(0, matrix[i][j]) });
    }

    // 内部インデックスを除去して結果に格納
    roundResults[roundSlots[round]] = roundPairs.map(({ a, b, score }) => ({ a, b, score }));
  }

  return { rounds: roundResults, hasBye };
}

/**
 * マッチング結果を個人別スケジュールに変換する
 * @param {Array} rounds - generateMatching().rounds
 * @param {Array} participants - 参加者配列
 * @returns {Map} participantId → [{round, partner}]
 */
function buildPersonalSchedule(rounds, participants) {
  const schedule = new Map();

  for (const p of participants) {
    schedule.set(p.id, []);
  }

  rounds.forEach((pairs, roundIdx) => {
    for (const { a, b, score, isRepeat } of pairs) {
      if (a.isDummy || b.isDummy) {
        // 休憩ラウンド
        const active = a.isDummy ? b : a;
        if (schedule.has(active.id)) {
          schedule.get(active.id).push({
            round: roundIdx + 1,
            partner: null,
            isBye: true,
            score: 0,
          });
        }
      } else {
        if (schedule.has(a.id)) {
          schedule.get(a.id).push({ round: roundIdx + 1, partner: b, score, isRepeat: !!isRepeat });
        }
        if (schedule.has(b.id)) {
          schedule.get(b.id).push({ round: roundIdx + 1, partner: a, score, isRepeat: !!isRepeat });
        }
      }
    }
  });

  return schedule;
}

/**
 * マッチング結果をCSV文字列に変換する（全体スケジュール）
 * @param {Array} rounds
 * @returns {string} CSV文字列
 */
function exportMatchingCSV(rounds) {
  const BOM = '\uFEFF';
  const rows = [['ラウンド', '参加者A', '会社A', '参加者B', '会社B', '相性スコア', '備考']];

  rounds.forEach((pairs, idx) => {
    for (const { a, b, score, isRepeat, isBye } of pairs) {
      const note = isBye ? '休憩' : '';
      rows.push([
        `Round ${idx + 1}`,
        a.isDummy ? '（休憩）' : a.name,
        a.isDummy ? '' : a.company,
        b.isDummy ? '（休憩）' : b.name,
        b.isDummy ? '' : b.company,
        a.isDummy || b.isDummy ? '' : score,
        note,
      ]);
    }
  });

  return BOM + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * 個人別スケジュールをCSV文字列に変換する
 * @param {Map} personalSchedule - buildPersonalSchedule() の出力
 * @param {Array} participants
 * @returns {string} CSV文字列
 */
function exportPersonalCSV(personalSchedule, participants) {
  const BOM = '\uFEFF';
  const rows = [['お名前', '会社名', 'Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5']];

  for (const p of participants) {
    const sched = personalSchedule.get(p.id) || [];
    const cells = [p.name, p.company];
    for (let r = 1; r <= ROUNDS; r++) {
      const entry = sched.find(s => s.round === r);
      if (!entry) {
        cells.push('');
      } else if (entry.isBye) {
        cells.push('休憩');
      } else {
        cells.push(`${entry.partner.name}（${entry.partner.company}）`);
      }
    }
    rows.push(cells);
  }

  return BOM + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// グローバルまたはモジュールとして公開
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateMatching, buildPersonalSchedule, exportMatchingCSV, exportPersonalCSV, ROUNDS };
}
if (typeof window !== 'undefined') {
  window.Matching = { generateMatching, buildPersonalSchedule, exportMatchingCSV, exportPersonalCSV, ROUNDS };
}
