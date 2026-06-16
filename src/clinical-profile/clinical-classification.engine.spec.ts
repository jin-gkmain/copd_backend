import {
  buildAdaptiveManagementPlan,
  buildBadgePlan,
  buildSmokingCessationPlan,
  buildVaccinationRecommendations,
  computeDiseaseActivity,
  computeGoldAbeGroup,
  computeGoldAirflowGrade,
  mapDailyRiskToAdaptiveRisk,
} from './clinical-classification.engine';

describe('clinical classification engine', () => {
  describe('computeGoldAirflowGrade', () => {
    it.each([
      [80, 'GOLD 1'],
      [79.9, 'GOLD 2'],
      [50, 'GOLD 2'],
      [49.9, 'GOLD 3'],
      [30, 'GOLD 3'],
      [29.9, 'GOLD 4'],
      [null, null],
    ])('maps %p to %p', (input, expected) => {
      expect(computeGoldAirflowGrade(input)).toBe(expected);
    });
  });

  describe('computeGoldAbeGroup', () => {
    it('returns E for one or more exacerbations', () => {
      expect(
        computeGoldAbeGroup({ mmrcScore: 0, exacerbationsLast12Months: 1 }),
      ).toBe('E');
    });

    it('returns B when symptoms are high and exacerbations are zero', () => {
      expect(
        computeGoldAbeGroup({ mmrcScore: 2, exacerbationsLast12Months: 0 }),
      ).toBe('B');
      expect(
        computeGoldAbeGroup({ caatScore: 10, exacerbationsLast12Months: 0 }),
      ).toBe('B');
    });

    it('returns A when symptoms are low and exacerbations are zero', () => {
      expect(
        computeGoldAbeGroup({
          mmrcScore: 1,
          caatScore: 9,
          exacerbationsLast12Months: 0,
        }),
      ).toBe('A');
    });

    it('returns null when required inputs are missing', () => {
      expect(computeGoldAbeGroup({ mmrcScore: 1 })).toBeNull();
      expect(computeGoldAbeGroup({ exacerbationsLast12Months: 0 })).toBeNull();
    });
  });

  it('maps daily risk to adaptive LOW/MED/HIGH', () => {
    expect(mapDailyRiskToAdaptiveRisk('green')).toBe('LOW');
    expect(mapDailyRiskToAdaptiveRisk('yellow')).toBe('MED');
    expect(mapDailyRiskToAdaptiveRisk('red')).toBe('HIGH');
    expect(mapDailyRiskToAdaptiveRisk(null)).toBeNull();
  });

  it('builds risk-level adaptive management plans from the PDF mapping', () => {
    expect(buildAdaptiveManagementPlan('LOW')).toMatchObject({
      exerciseIntensity: expect.stringContaining('20-30분'),
      educationContentIds: ['1', '6', '3', '4'],
    });
    expect(buildAdaptiveManagementPlan('MED')).toMatchObject({
      frequency: expect.stringContaining('주 3-4회'),
      educationContentIds: ['5', '6', '3'],
    });
    expect(buildAdaptiveManagementPlan('HIGH')).toMatchObject({
      exerciseIntensity: expect.stringContaining('운동 중단'),
      educationContentIds: ['5', '3'],
    });
  });

  it('computes disease activity from risk and exacerbation context', () => {
    expect(
      computeDiseaseActivity({
        adaptiveRiskLevel: 'LOW',
        goldAbeGroup: 'A',
        exacerbationsLast12Months: 0,
      }),
    ).toBe('low_activity');
    expect(
      computeDiseaseActivity({
        adaptiveRiskLevel: 'MED',
        goldAbeGroup: 'B',
        exacerbationsLast12Months: 0,
      }),
    ).toBe('monitoring_needed');
    expect(
      computeDiseaseActivity({
        adaptiveRiskLevel: 'LOW',
        goldAbeGroup: 'E',
        exacerbationsLast12Months: 1,
      }),
    ).toBe('high_activity');
  });

  it('builds 5A smoking cessation guidance for current smokers', () => {
    const plan = buildSmokingCessationPlan({
      smokingStatus: 'current',
      smokingCessation: {
        lastDailyCheckDate: '2026-05-31',
        quitIntentionWithinMonth: true,
        smokesWithin30MinutesOfWaking: true,
        dailyCigarettes: 12,
      },
      goldAirflowGrade: 'GOLD 2',
      fev1PercentPredicted: 55,
    });
    expect(plan.fiveAStage).toBe('assist');
    expect(plan.message).toContain('FEV1 55%');
    expect(plan.assessmentQuestions).toHaveLength(3);
    expect(plan.actionStrategies).toEqual(
      expect.arrayContaining([expect.stringContaining('보조요법 상담')]),
    );
    expect(plan.arrangeAfterDays).toBe(7);
  });

  it('recommends vaccines based on missing history and high-risk context', () => {
    const recs = buildVaccinationRecommendations({
      vaccinationHistory: { influenza: true, pneumococcal: false },
      goldAirflowGrade: 'GOLD 3',
      goldAbeGroup: 'E',
    });
    expect(recs.map((r) => r.key)).toEqual(
      expect.arrayContaining([
        'pneumococcal',
        'rsv',
        'zoster',
        'covid19',
        'tdap',
      ]),
    );
    expect(recs.map((r) => r.key)).not.toContain('influenza');
    expect(recs.find((r) => r.key === 'pneumococcal')?.reminderDate).toBeNull();
  });

  it('builds badge tracking criteria from smoking and exacerbation records', () => {
    const plan = buildBadgePlan({
      smokingStatus: 'current',
      smokingCessation: { smokeFreeSince: '2020-01-01' },
      exacerbationsLast12Months: 0,
    });
    expect(plan.earned).toEqual(
      expect.arrayContaining(['smoke_free_7d', 'gold_stability_3mo']),
    );
    expect(plan.criteria.walk_improvement_6mo).toContain('6개월');
  });
});
