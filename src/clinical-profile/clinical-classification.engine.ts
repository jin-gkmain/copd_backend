export type GoldAirflowGrade = 'GOLD 1' | 'GOLD 2' | 'GOLD 3' | 'GOLD 4';
export type GoldAbeGroup = 'A' | 'B' | 'E';
export type DailyRisk = 'green' | 'yellow' | 'red';
export type AdaptiveRiskLevel = 'LOW' | 'MED' | 'HIGH';
export type DiseaseActivityLevel =
  | 'low_activity'
  | 'monitoring_needed'
  | 'high_activity';

export interface AdaptiveManagementPlan {
  level: AdaptiveRiskLevel | null;
  exerciseIntensity: string;
  frequency: string;
  monitoring: string;
  systemActions: string[];
  educationContentIds: string[];
}

export interface SmokingCessationPlan {
  status: string | null;
  fiveAStage:
    | 'ask'
    | 'advise'
    | 'assess'
    | 'assist'
    | 'arrange'
    | 'maintenance';
  message: string;
  assessmentQuestions: string[];
  arrangeAfterDays: number | null;
  dailyCheckRequired: boolean;
  actionStrategies: string[];
  nextCheckDate: string | null;
  smokeFreeDays: number | null;
}

export interface VaccinationRecommendation {
  key: string;
  label: string;
  priority: 'seasonal' | 'due' | 'risk_based' | 'history_check';
  reason: string;
  reminderDate: string | null;
}

export interface BadgePlan {
  earned: string[];
  trackable: string[];
  criteria: Record<string, string>;
}

export function computeGoldAirflowGrade(
  fev1PercentPredicted: number | null | undefined,
): GoldAirflowGrade | null {
  if (fev1PercentPredicted == null || !Number.isFinite(fev1PercentPredicted)) {
    return null;
  }
  if (fev1PercentPredicted >= 80) return 'GOLD 1';
  if (fev1PercentPredicted >= 50) return 'GOLD 2';
  if (fev1PercentPredicted >= 30) return 'GOLD 3';
  return 'GOLD 4';
}

export function computeGoldAbeGroup(input: {
  mmrcScore?: number | null;
  caatScore?: number | null;
  exacerbationsLast12Months?: number | null;
}): GoldAbeGroup | null {
  const exacerbations = input.exacerbationsLast12Months;
  if (exacerbations == null || !Number.isFinite(exacerbations)) return null;
  if (exacerbations >= 1) return 'E';

  const hasHighMmrc =
    input.mmrcScore != null &&
    Number.isFinite(input.mmrcScore) &&
    input.mmrcScore >= 2;
  const hasHighCaat =
    input.caatScore != null &&
    Number.isFinite(input.caatScore) &&
    input.caatScore >= 10;
  const hasAnySymptomScore =
    (input.mmrcScore != null && Number.isFinite(input.mmrcScore)) ||
    (input.caatScore != null && Number.isFinite(input.caatScore));

  if (!hasAnySymptomScore) return null;
  return hasHighMmrc || hasHighCaat ? 'B' : 'A';
}

export function mapDailyRiskToAdaptiveRisk(
  risk: DailyRisk | string | null | undefined,
): AdaptiveRiskLevel | null {
  if (risk === 'green') return 'LOW';
  if (risk === 'yellow') return 'MED';
  if (risk === 'red') return 'HIGH';
  return null;
}

export function computeDiseaseActivity(input: {
  adaptiveRiskLevel?: AdaptiveRiskLevel | null;
  goldAbeGroup?: GoldAbeGroup | null;
  exacerbationsLast12Months?: number | null;
}): DiseaseActivityLevel {
  if (
    input.adaptiveRiskLevel === 'HIGH' ||
    input.goldAbeGroup === 'E' ||
    (input.exacerbationsLast12Months != null &&
      input.exacerbationsLast12Months >= 1)
  ) {
    return 'high_activity';
  }
  if (input.adaptiveRiskLevel === 'LOW' && input.goldAbeGroup === 'A') {
    return 'low_activity';
  }
  return 'monitoring_needed';
}

export function buildAdaptiveManagementPlan(
  level: AdaptiveRiskLevel | null,
): AdaptiveManagementPlan {
  if (level === 'HIGH') {
    return {
      level,
      exerciseIntensity: '운동 중단, 증상 안정과 의료진 상담 우선',
      frequency: '운동 보류',
      monitoring: '위험 신호와 증상 변화를 집중 기록',
      systemActions: [
        '운동 프로그램 중단',
        '경고 알림 표시',
        '병원 방문 필요성 안내',
      ],
      educationContentIds: ['5', '3'],
    };
  }
  if (level === 'MED') {
    return {
      level,
      exerciseIntensity: '유산소 10-15분, 의자 운동 중심',
      frequency: '주 3-4회, 하루 2회 증상 체크',
      monitoring: '호흡곤란, 기침, 가래, 활동량 변화를 추적',
      systemActions: [
        '운동 강도 자동 조절',
        '증상 악화 알림',
        '지속 시 HIGH 전환 검토',
      ],
      educationContentIds: ['5', '6', '3'],
    };
  }
  if (level === 'LOW') {
    return {
      level,
      exerciseIntensity: '유산소 20-30분, 근력운동 병행',
      frequency: '주 5회, 일일 1회 증상 체크',
      monitoring: '호흡곤란, 기침, 가래, 피로를 정기 확인',
      systemActions: [
        '기본 8주 프로그램 유지',
        '교육 콘텐츠 제공',
        '일일 체크 알림',
      ],
      educationContentIds: ['1', '6', '3', '4'],
    };
  }
  return {
    level,
    exerciseIntensity: '임상 요약 입력 후 개인화',
    frequency: '기록 입력 필요',
    monitoring: '아침 보고와 평가 입력을 먼저 완료',
    systemActions: ['필수 입력 안내', '기록 기반 추천 대기'],
    educationContentIds: ['1', '3'],
  };
}

export function buildSmokingCessationPlan(input: {
  smokingStatus?: string | null;
  smokingCessation?: Record<string, unknown> | null;
  goldAirflowGrade?: GoldAirflowGrade | string | null;
  fev1PercentPredicted?: number | null;
}): SmokingCessationPlan {
  const status = input.smokingStatus ?? null;
  const state = input.smokingCessation ?? {};
  const quitIntention = asBoolean(state.quitIntentionWithinMonth);
  const earlySmoke = asBoolean(state.smokesWithin30MinutesOfWaking);
  const dailyCigarettes = finiteNumber(state.dailyCigarettes);
  const smokedToday = asBoolean(state.smokedToday);
  const smokeFreeDays = computeSmokeFreeDays(state.smokeFreeSince);
  const lastDailyCheckDate = stringValue(state.lastDailyCheckDate);
  const nextCheckDate = dateAfterDays(
    lastDailyCheckDate ?? todayKey(),
    status === 'current' ? 1 : 30,
  );

  if (status === 'current') {
    const fev1Text =
      input.fev1PercentPredicted != null &&
      Number.isFinite(input.fev1PercentPredicted)
        ? `FEV1 ${Math.round(input.fev1PercentPredicted)}%`
        : '최근 폐기능 기록';
    const goldText = input.goldAirflowGrade
      ? ` · ${input.goldAirflowGrade}`
      : '';
    return {
      status,
      fiveAStage: quitIntention === false ? 'advise' : 'assist',
      message: `${fev1Text}${goldText} 기준으로 금연 의도와 니코틴 의존도 확인이 필요합니다.`,
      assessmentQuestions: [
        '앞으로 1개월 안에 금연을 시도할 의향이 있나요?',
        '기상 후 30분 안에 첫 담배를 피우나요?',
        '하루 평균 흡연량은 몇 개비인가요?',
      ],
      arrangeAfterDays: 7,
      dailyCheckRequired: !isCurrentOrFutureDateKey(lastDailyCheckDate),
      actionStrategies: buildSmokingStrategies({
        quitIntention,
        earlySmoke,
        dailyCigarettes,
        smokedToday,
      }),
      nextCheckDate,
      smokeFreeDays,
    };
  }
  if (status === 'former') {
    return {
      status,
      fiveAStage: 'maintenance',
      message:
        '금연 유지 상태입니다. 재흡연 위험을 정기 확인하고 성공 배지를 추적합니다.',
      assessmentQuestions: ['최근 7일 동안 흡연한 날이 있었나요?'],
      arrangeAfterDays: 30,
      dailyCheckRequired: false,
      actionStrategies: [
        '흡연 유혹이 강했던 상황을 기록하고 회피 전략을 유지하세요.',
        '금연 유지 기간과 악화 0회 기록을 함께 확인하세요.',
      ],
      nextCheckDate,
      smokeFreeDays,
    };
  }
  if (status === 'never') {
    return {
      status,
      fiveAStage: 'maintenance',
      message: '비흡연 상태입니다. 간접흡연 회피와 생활습관 관리를 유지합니다.',
      assessmentQuestions: [],
      arrangeAfterDays: null,
      dailyCheckRequired: false,
      actionStrategies: ['간접흡연 노출을 피하고 현재 생활습관을 유지하세요.'],
      nextCheckDate: null,
      smokeFreeDays: null,
    };
  }
  return {
    status,
    fiveAStage: 'ask',
    message: '흡연 상태 확인이 필요합니다.',
    assessmentQuestions: ['현재 담배 또는 전자담배를 사용하고 있나요?'],
    arrangeAfterDays: null,
    dailyCheckRequired: true,
    actionStrategies: ['임상 정보에서 흡연 상태를 먼저 기록하세요.'],
    nextCheckDate: null,
    smokeFreeDays: null,
  };
}

export function buildVaccinationRecommendations(input: {
  vaccinationHistory?: Record<string, unknown> | null;
  goldAirflowGrade?: GoldAirflowGrade | string | null;
  goldAbeGroup?: GoldAbeGroup | null;
}): VaccinationRecommendation[] {
  const history = input.vaccinationHistory ?? {};
  const missing = (key: string) => !hasReceivedVaccine(history[key]);
  const highRisk =
    input.goldAbeGroup === 'E' ||
    input.goldAirflowGrade === 'GOLD 3' ||
    input.goldAirflowGrade === 'GOLD 4';
  const recs: VaccinationRecommendation[] = [];

  if (missing('influenza')) {
    recs.push({
      key: 'influenza',
      label: '인플루엔자(독감)',
      priority: 'seasonal',
      reason: '매년 가을 접종 이력을 확인하고 정기 알림을 권장합니다.',
      reminderDate: seasonalInfluenzaReminderDate(),
    });
  }
  if (missing('pneumococcal')) {
    recs.push({
      key: 'pneumococcal',
      label: '폐렴구균',
      priority: 'due',
      reason: 'COPD 환자는 폐렴구균 접종 이력 확인이 필요합니다.',
      reminderDate: null,
    });
  }
  if (missing('rsv') && highRisk) {
    recs.push({
      key: 'rsv',
      label: 'RSV',
      priority: 'risk_based',
      reason: 'GOLD 3-4 또는 E 그룹 등 고위험 기록에서 접종 상담을 권장합니다.',
      reminderDate: null,
    });
  }
  for (const [key, label] of [
    ['zoster', '대상포진'],
    ['covid19', '코로나19'],
    ['tdap', 'Tdap'],
  ] as const) {
    if (missing(key)) {
      recs.push({
        key,
        label,
        priority: 'history_check',
        reason: '접종 이력을 확인하고 필요한 경우 의료진과 상담하세요.',
        reminderDate: null,
      });
    }
  }
  return recs;
}

export function buildBadgePlan(input: {
  smokingStatus?: string | null;
  smokingCessation?: Record<string, unknown> | null;
  exacerbationsLast12Months?: number | null;
}): BadgePlan {
  const criteria = {
    smoke_free_24h: '24시간 금연 유지',
    smoke_free_3d: '3일 연속 금연 유지',
    smoke_free_7d: '7일 연속 금연 유지',
    gold_stability_3mo: '3개월 동안 중등도/중증 악화 0회',
    walk_improvement_6mo: '6개월 6분 걷기 기록 향상',
  };
  const earned: string[] = [];
  const trackable = Object.keys(criteria);
  const smokeFreeDays = computeSmokeFreeDays(
    input.smokingCessation?.smokeFreeSince,
  );
  if (
    input.smokingStatus === 'never' ||
    (smokeFreeDays != null && smokeFreeDays >= 1)
  ) {
    earned.push('smoke_free_24h');
  }
  if (
    input.smokingStatus === 'never' ||
    (smokeFreeDays != null && smokeFreeDays >= 3)
  ) {
    earned.push('smoke_free_3d');
  }
  if (
    input.smokingStatus === 'never' ||
    (smokeFreeDays != null && smokeFreeDays >= 7)
  ) {
    earned.push('smoke_free_7d');
  }
  if (input.exacerbationsLast12Months === 0) {
    earned.push('gold_stability_3mo');
  }
  return { earned, trackable, criteria };
}

function buildSmokingStrategies(input: {
  quitIntention: boolean | null;
  earlySmoke: boolean | null;
  dailyCigarettes: number | null;
  smokedToday: boolean | null;
}): string[] {
  const strategies = [
    '흡연 욕구가 올 때 5분 지연, 물 마시기, 짧은 걷기 중 하나를 선택하세요.',
  ];
  if (input.quitIntention === true) {
    strategies.push('금연 시작일을 정하고 가족 또는 의료진에게 공유하세요.');
  } else if (input.quitIntention === false) {
    strategies.push(
      '금연의 장점과 걱정되는 점을 하나씩 기록해 상담 때 확인하세요.',
    );
  }
  if (input.earlySmoke === true || (input.dailyCigarettes ?? 0) >= 10) {
    strategies.push('니코틴 의존도가 높을 수 있어 보조요법 상담을 권장합니다.');
  }
  if (input.smokedToday === false) {
    strategies.push(
      '오늘 금연 기록을 유지하고 내일 같은 시간에 다시 확인하세요.',
    );
  }
  return strategies;
}

function hasReceivedVaccine(v: unknown): boolean {
  if (v === true) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const record = v as Record<string, unknown>;
  return (
    record.received === true || record.done === true || record.status === 'done'
  );
}

function asBoolean(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

function finiteNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function stringValue(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCurrentOrFutureDateKey(value: string | null): boolean {
  return (
    value != null && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= todayKey()
  );
}

function dateAfterDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return todayKey();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeSmokeFreeDays(value: unknown): number | null {
  const key = stringValue(value);
  if (!key) return null;
  const start = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date(`${todayKey()}T00:00:00.000Z`);
  return Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / 86400000),
  );
}

function seasonalInfluenzaReminderDate(): string {
  const now = new Date();
  const year =
    now.getUTCMonth() <= 9 ? now.getUTCFullYear() : now.getUTCFullYear() + 1;
  return `${year}-10-01`;
}
