/**
 * 일일 아침 보고 + 호흡(7일) + 선택적 걸음 스냅샷 기반 3단계 위험도.
 * 임계값은 앱·서버에서 동일하게 유지합니다.
 */

export type Trend = 'up' | 'same' | 'down';
export type SputumColor = 'clear' | 'yellow' | 'green';
export type RiskLevel = 'green' | 'yellow' | 'red';

export interface MorningPayload {
  dyspnea: Trend;
  cough: Trend;
  sputumAmount: Trend;
  sputumColor: SputumColor;
  fatigue: boolean;
  chestPain: boolean;
}

export interface ReportRow {
  reportingDay: string;
  payload: MorningPayload;
}

export interface BreathingRow {
  measuredAt: Date;
  overallScore: number;
}

export interface StepSnap {
  date: string;
  steps: number;
}

export interface ComputeDailyRiskInput {
  /** reportingDay 오름차순 */
  reportsAscending: ReportRow[];
  todayReportingDay: string;
  breathing: BreathingRow[];
  dailyStepsSnapshot?: StepSnap[] | null;
}

const MS_7D = 7 * 24 * 60 * 60 * 1000;
const MS_48H = 48 * 60 * 60 * 1000;

export function riskFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function sputumOrd(c: SputumColor): number {
  if (c === 'clear') return 0;
  if (c === 'yellow') return 1;
  return 2;
}

export function worsenCount(payload: MorningPayload, prev: MorningPayload | null): number {
  let n = 0;
  if (payload.dyspnea === 'up') n++;
  if (payload.cough === 'up') n++;
  if (payload.sputumAmount === 'up') n++;
  if (prev && sputumOrd(payload.sputumColor) > sputumOrd(prev.sputumColor)) n++;
  if (payload.fatigue) n++;
  if (payload.chestPain) n++;
  return n;
}

function medianNumeric(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) return s[mid];
  return (s[mid - 1] + s[mid]) / 2;
}

/** `yyyy-MM-dd`에서 n일 전(로컬 달력 연산과 동일한 UTC 부품 연산). */
export function subReportingDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function groupMaxScoreByUtcDay(breathing: BreathingRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of breathing) {
    const u = b.measuredAt;
    const day = `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, '0')}-${String(u.getUTCDate()).padStart(2, '0')}`;
    const prev = map.get(day);
    if (prev == null || b.overallScore > prev) map.set(day, b.overallScore);
  }
  return map;
}

export function computeDailyRisk(input: ComputeDailyRiskInput): {
  level: RiskLevel;
  reasonCodes: string[];
} {
  const reasons: string[] = [];
  const sorted = [...input.reportsAscending].sort((a, b) =>
    a.reportingDay.localeCompare(b.reportingDay),
  );

  const idxToday = sorted.findIndex((r) => r.reportingDay === input.todayReportingDay);
  const todayRow = idxToday >= 0 ? sorted[idxToday] : null;
  const prevPayload = idxToday > 0 ? sorted[idxToday - 1].payload : null;
  const S_today = todayRow ? worsenCount(todayRow.payload, prevPayload) : 0;

  let D_bad = 0;
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1].payload : null;
    if (worsenCount(sorted[i].payload, prev) >= 1) D_bad++;
  }

  const now = Date.now();
  const breathing7d = input.breathing.filter((b) => now - b.measuredAt.getTime() <= MS_7D);
  const scores7d = breathing7d.map((b) => b.overallScore);
  const medianScore = medianNumeric(scores7d);

  let vitalMild = false;
  let vitalCompound = false;

  const recent48 = input.breathing.filter((b) => now - b.measuredAt.getTime() <= MS_48H);
  for (const b of recent48) {
    const r = riskFromScore(b.overallScore);
    if (b.overallScore < 60 || r === 'high' || r === 'critical') {
      vitalMild = true;
      break;
    }
  }

  const latest =
    input.breathing.length > 0
      ? [...input.breathing].sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0]
      : null;
  if (latest) {
    const rL = riskFromScore(latest.overallScore);
    if (latest.overallScore < 50 && rL !== 'low') {
      vitalCompound = true;
    }
  }

  if (!vitalCompound && scores7d.length >= 4 && medianScore != null) {
    const byDay = groupMaxScoreByUtcDay(breathing7d.length ? breathing7d : input.breathing);
    const days = [...byDay.keys()].sort();
    let run = 0;
    for (const day of days) {
      const sc = byDay.get(day)!;
      if (sc <= medianScore * 0.85) {
        run++;
        if (run >= 2) {
          vitalCompound = true;
          break;
        }
      } else {
        run = 0;
      }
    }
  }

  let actMild = false;
  let actSevere = false;
  const snaps = input.dailyStepsSnapshot;
  if (snaps && snaps.length > 0) {
    const snapMap = new Map(snaps.map((s) => [s.date, s.steps]));
    const todayKey = input.todayReportingDay;
    const todaySteps = snapMap.has(todayKey) ? snapMap.get(todayKey)! : null;
    const priorKeys = [1, 2, 3, 4, 5, 6].map((k) => subReportingDays(todayKey, k));
    const priorVals = priorKeys.map((k) => snapMap.get(k)).filter((v): v is number => typeof v === 'number');
    const medPrior = medianNumeric(priorVals);

    if (medPrior != null && medPrior > 0 && todaySteps != null) {
      if (todaySteps <= medPrior * 0.5 || todaySteps < 3000) {
        actMild = true;
      }
    }

    if (medPrior != null && medPrior > 0) {
      const d0 = todayKey;
      const d1 = subReportingDays(todayKey, 1);
      const d2 = subReportingDays(todayKey, 2);
      const s0 = snapMap.get(d0);
      const s1 = snapMap.get(d1);
      const s2 = snapMap.get(d2);
      const thr = medPrior * 0.5;
      if (
        s0 != null &&
        s1 != null &&
        s2 != null &&
        s0 <= thr &&
        s1 <= thr &&
        s2 <= thr
      ) {
        actSevere = true;
      }
    }
  }

  const red =
    S_today >= 2 || D_bad >= 3 || vitalCompound || actSevere;
  const yellow = !red && (S_today >= 1 || vitalMild || actMild);

  if (S_today >= 2) reasons.push('symptom_today_severe');
  if (D_bad >= 3) reasons.push('symptom_accumulation_days');
  if (vitalCompound) reasons.push('breathing_compound');
  if (actSevere) reasons.push('activity_severe');
  if (!red) {
    if (S_today >= 1) reasons.push('symptom_today_mild');
    if (vitalMild) reasons.push('breathing_mild');
    if (actMild) reasons.push('activity_mild');
  }

  const level: RiskLevel = red ? 'red' : yellow ? 'yellow' : 'green';
  return { level, reasonCodes: reasons };
}

export function payloadFromUnknown(raw: unknown): MorningPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const dyspnea = o.dyspnea === 'up' || o.dyspnea === 'down' || o.dyspnea === 'same' ? o.dyspnea : null;
  const cough = o.cough === 'up' || o.cough === 'down' || o.cough === 'same' ? o.cough : null;
  const sputumAmount =
    o.sputumAmount === 'up' || o.sputumAmount === 'down' || o.sputumAmount === 'same'
      ? o.sputumAmount
      : null;
  const sc = o.sputumColor;
  const sputumColor =
    sc === 'clear' || sc === 'yellow' || sc === 'green' ? sc : null;
  if (!dyspnea || !cough || !sputumAmount || !sputumColor) return null;
  return {
    dyspnea,
    cough,
    sputumAmount,
    sputumColor,
    fatigue: o.fatigue === true,
    chestPain: o.chestPain === true,
  };
}
