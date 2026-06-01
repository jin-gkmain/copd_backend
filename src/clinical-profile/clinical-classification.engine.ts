export type GoldAirflowGrade = 'GOLD 1' | 'GOLD 2' | 'GOLD 3' | 'GOLD 4';
export type GoldAbeGroup = 'A' | 'B' | 'E';
export type DailyRisk = 'green' | 'yellow' | 'red';
export type AdaptiveRiskLevel = 'LOW' | 'MED' | 'HIGH';

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
    input.mmrcScore != null && Number.isFinite(input.mmrcScore) && input.mmrcScore >= 2;
  const hasHighCaat =
    input.caatScore != null && Number.isFinite(input.caatScore) && input.caatScore >= 10;
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

