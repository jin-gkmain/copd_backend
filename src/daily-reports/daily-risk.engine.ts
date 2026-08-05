/**
 * 일일 아침 보고 + 선택적 걸음 스냅샷 기반 3단계 위험도.
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

export interface StepSnap {
  date: string;
  steps: number;
}

export interface ComputeDailyRiskInput {
  /** reportingDay 오름차순 */
  reportsAscending: ReportRow[];
  todayReportingDay: string;
  dailyStepsSnapshot?: StepSnap[] | null;
}

function sputumOrd(c: SputumColor): number {
  if (c === 'clear') return 0;
  if (c === 'yellow') return 1;
  return 2;
}

export function worsenCount(
  payload: MorningPayload,
  prev: MorningPayload | null,
): number {
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

export function computeDailyRisk(input: ComputeDailyRiskInput): {
  level: RiskLevel;
  reasonCodes: string[];
} {
  const reasons: string[] = [];
  const sorted = [...input.reportsAscending].sort((a, b) =>
    a.reportingDay.localeCompare(b.reportingDay),
  );

  const idxToday = sorted.findIndex(
    (r) => r.reportingDay === input.todayReportingDay,
  );
  const todayRow = idxToday >= 0 ? sorted[idxToday] : null;
  const prevPayload = idxToday > 0 ? sorted[idxToday - 1].payload : null;
  const S_today = todayRow ? worsenCount(todayRow.payload, prevPayload) : 0;

  let D_bad = 0;
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1].payload : null;
    if (worsenCount(sorted[i].payload, prev) >= 1) D_bad++;
  }

  let actMild = false;
  let actSevere = false;
  const snaps = input.dailyStepsSnapshot;
  if (snaps && snaps.length > 0) {
    const snapMap = new Map(snaps.map((s) => [s.date, s.steps]));
    const todayKey = input.todayReportingDay;
    const todaySteps = snapMap.has(todayKey) ? snapMap.get(todayKey)! : null;
    const priorKeys = [1, 2, 3, 4, 5, 6].map((k) =>
      subReportingDays(todayKey, k),
    );
    const priorVals = priorKeys
      .map((k) => snapMap.get(k))
      .filter((v): v is number => typeof v === 'number');
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

  const red = S_today >= 2 || D_bad >= 3 || actSevere;
  const yellow = !red && (S_today >= 1 || actMild);

  if (S_today >= 2) reasons.push('symptom_today_severe');
  if (D_bad >= 3) reasons.push('symptom_accumulation_days');
  if (actSevere) reasons.push('activity_severe');
  if (!red) {
    if (S_today >= 1) reasons.push('symptom_today_mild');
    if (actMild) reasons.push('activity_mild');
  }

  const level: RiskLevel = red ? 'red' : yellow ? 'yellow' : 'green';
  return { level, reasonCodes: reasons };
}

export function payloadFromUnknown(raw: unknown): MorningPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const dyspnea =
    o.dyspnea === 'up' || o.dyspnea === 'down' || o.dyspnea === 'same'
      ? o.dyspnea
      : null;
  const cough =
    o.cough === 'up' || o.cough === 'down' || o.cough === 'same'
      ? o.cough
      : null;
  const sputumAmount =
    o.sputumAmount === 'up' ||
    o.sputumAmount === 'down' ||
    o.sputumAmount === 'same'
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
