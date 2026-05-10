import type { RiskLevel } from './daily-risk.engine';

/**
 * 일일 규칙 엔진 산출값(base) 위에, 연속 일수 기반으로 최종 위험도를 조정합니다.
 *
 * - 황색(base)이 보고일 기준 2일 연속이면 적색으로 상향(중간 위험 지속).
 * - 녹색(base)이 보고일 기준 3일 연속이면 최종을 녹색으로 확정(정상 구간 회복).
 */

export interface TemporalRiskInput {
  baseLevel: RiskLevel;
  baseReasonCodes: string[];
  /** 직전 보고일의 base (없으면 null — 스트릭 끊김) */
  yesterdayBase: RiskLevel | null;
  /** 직전전 보고일의 base */
  dayBeforeYesterdayBase: RiskLevel | null;
}

function dedupeReasons(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of codes) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

function isRiskLevel(v: string | null | undefined): v is RiskLevel {
  return v === 'green' || v === 'yellow' || v === 'red';
}

/** DB에 저장된 문자열을 RiskLevel 로 파싱 (레거시 행 대비). */
export function parseStoredRiskLevel(v: string | null | undefined): RiskLevel | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (isRiskLevel(s)) return s;
  return null;
}

export function applyTemporalRiskOverlay(input: TemporalRiskInput): {
  level: RiskLevel;
  reasonCodes: string[];
} {
  const reasons = [...input.baseReasonCodes];
  let level = input.baseLevel;

  const y = input.yesterdayBase;
  const d2 = input.dayBeforeYesterdayBase;

  // 중간(황색) 위험이 2보고일 연속 → 상향
  if (input.baseLevel === 'yellow' && y === 'yellow') {
    level = 'red';
    reasons.push('temporal_yellow_streak_2d');
  }

  // 정상(녹색) 수치가 3보고일 연속 → 낮은 위험도(녹색)로 회복
  if (input.baseLevel === 'green' && y === 'green' && d2 === 'green') {
    level = 'green';
    reasons.push('temporal_green_streak_3d');
  }

  return { level, reasonCodes: dedupeReasons(reasons) };
}
