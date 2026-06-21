// 回答時間をスコアに反映する「スピードボーナス」
// 速いほど加点、遅いと少し減点。瞬発力検定は時間の比重を大きくする。
export type ExamCategory = 'text' | 'speed' | 'idea' | 'photo';

export function getTimeBonus(seconds: number | null | undefined, category: ExamCategory = 'idea'): number {
  if (seconds === null || seconds === undefined) return 0;
  const max = category === 'speed' ? 20 : 10; // 最大加点
  const threshold = category === 'speed' ? 30 : 45; // ここを超えると加点0→減点へ
  const bonus = Math.round(max * (1 - seconds / threshold));
  return Math.max(-5, Math.min(max, bonus));
}
