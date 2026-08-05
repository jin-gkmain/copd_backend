import {
  buildRiskManagementPlan,
  buildBadgePlan,
  buildSmokingCessationPlan,
  buildVaccinationRecommendations,
  computeGoldAbeGroup,
  computeGoldAirflowGrade,
  computeUnifiedRiskLevel,
  hasSixMonthWalkImprovement,
  mapDailyReportToRiskLevel,
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
      [-0.1, null],
      [200.1, null],
      [Number.NaN, null],
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

    it('rejects out-of-range clinical values', () => {
      expect(
        computeGoldAbeGroup({
          mmrcScore: -1,
          caatScore: 41,
          exacerbationsLast12Months: 0,
        }),
      ).toBeNull();
      expect(
        computeGoldAbeGroup({
          mmrcScore: 1,
          exacerbationsLast12Months: -1,
        }),
      ).toBeNull();
    });
  });

  it('maps daily reports to LOW/MED/HIGH', () => {
    expect(mapDailyReportToRiskLevel('green')).toBe('LOW');
    expect(mapDailyReportToRiskLevel('yellow')).toBe('MED');
    expect(mapDailyReportToRiskLevel('red')).toBe('HIGH');
    expect(mapDailyReportToRiskLevel(null)).toBeNull();
  });

  it('uses the highest level from clinical and daily risk evidence', () => {
    expect(
      computeUnifiedRiskLevel({ goldAbeGroup: 'A', dailyRisk: 'green' }),
    ).toBe('LOW');
    expect(
      computeUnifiedRiskLevel({ goldAbeGroup: 'B', dailyRisk: 'green' }),
    ).toBe('MED');
    expect(
      computeUnifiedRiskLevel({ goldAbeGroup: 'A', dailyRisk: 'red' }),
    ).toBe('HIGH');
    expect(
      computeUnifiedRiskLevel({ goldAbeGroup: 'E', dailyRisk: 'green' }),
    ).toBe('HIGH');
  });

  it('builds risk-level management plans from the PDF mapping', () => {
    expect(buildRiskManagementPlan('LOW')).toMatchObject({
      exerciseIntensity: expect.stringContaining('20-30분'),
      educationContentIds: ['1', '6', '3', '9'],
    });
    expect(buildRiskManagementPlan('MED')).toMatchObject({
      frequency: expect.stringContaining('주 3-4회'),
      educationContentIds: ['5', '3', '8'],
    });
    expect(buildRiskManagementPlan('HIGH')).toMatchObject({
      exerciseIntensity: expect.stringContaining('운동 중단'),
      educationContentIds: ['5', '3'],
    });
  });

  it('builds 5A smoking cessation guidance for current smokers', () => {
    const plan = buildSmokingCessationPlan({
      smokingStatus: 'current',
      smokingCessation: {
        lastDailyCheckDate: new Date().toISOString().slice(0, 10),
        smokedToday: true,
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
    expect(plan.actionStrategies).toEqual(
      expect.arrayContaining([expect.stringContaining('전자담배')]),
    );
  });

  it('advances current smokers through actionable 5A stages', () => {
    const today = new Date().toISOString().slice(0, 10);
    const plan = (smokingCessation: Record<string, unknown>) =>
      buildSmokingCessationPlan({
        smokingStatus: 'current',
        smokingCessation: { lastDailyCheckDate: today, ...smokingCessation },
      });

    expect(plan({}).fiveAStage).toBe('ask');
    expect(plan({ smokedToday: true }).fiveAStage).toBe('advise');
    expect(
      plan({ smokedToday: true, quitIntentionWithinMonth: true }).fiveAStage,
    ).toBe('assess');
    expect(
      plan({
        smokedToday: true,
        quitIntentionWithinMonth: true,
        smokesWithin30MinutesOfWaking: false,
        dailyCigarettes: 5,
      }).fiveAStage,
    ).toBe('assist');
    expect(
      plan({
        smokedToday: false,
        smokeFreeSince: today,
        quitIntentionWithinMonth: true,
        smokesWithin30MinutesOfWaking: false,
        dailyCigarettes: 5,
      }).fiveAStage,
    ).toBe('arrange');
  });

  it('uses the PDF 20-cigarette threshold for high-dependence guidance', () => {
    const belowThreshold = buildSmokingCessationPlan({
      smokingStatus: 'current',
      smokingCessation: {
        quitIntentionWithinMonth: true,
        smokesWithin30MinutesOfWaking: false,
        dailyCigarettes: 19,
      },
    });
    const atThreshold = buildSmokingCessationPlan({
      smokingStatus: 'current',
      smokingCessation: {
        quitIntentionWithinMonth: true,
        smokesWithin30MinutesOfWaking: false,
        dailyCigarettes: 20,
      },
    });
    expect(belowThreshold.actionStrategies.join(' ')).not.toContain(
      '보조요법 상담',
    );
    expect(atThreshold.actionStrategies.join(' ')).toContain('보조요법 상담');
  });

  it('recommends vaccines based on missing history and high-risk context', () => {
    const recs = buildVaccinationRecommendations({
      vaccinationHistory: {
        influenza: { received: true, administeredAt: '2026-01-10' },
        pneumococcal: false,
      },
      goldAirflowGrade: 'GOLD 3',
      goldAbeGroup: 'E',
      ageYears: 65,
      asOf: new Date('2026-06-30T00:00:00.000Z'),
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

  it('recommends RSV for COPD and limits zoster guidance to age 50+', () => {
    const age49 = buildVaccinationRecommendations({
      vaccinationHistory: {},
      ageYears: 49,
    });
    const age50 = buildVaccinationRecommendations({
      vaccinationHistory: {},
      ageYears: 50,
    });
    expect(age49.map((r) => r.key)).toContain('rsv');
    expect(age49.map((r) => r.key)).not.toContain('zoster');
    expect(age50.map((r) => r.key)).toContain('zoster');
  });

  it('recommends annual influenza and 10-year Tdap from recorded dates', () => {
    const recs = buildVaccinationRecommendations({
      vaccinationHistory: {
        influenza: { received: true, administeredAt: '2025-10-10' },
        tdap: { received: true, administeredAt: '2016-06-29' },
        pneumococcal: true,
        rsv: true,
        covid19: true,
      },
      ageYears: 49,
      asOf: new Date('2026-06-30T00:00:00.000Z'),
    });

    expect(recs.map((r) => r.key)).toEqual(
      expect.arrayContaining(['influenza', 'tdap']),
    );
    expect(recs.find((r) => r.key === 'influenza')?.reminderDate).toBe(
      '2026-10-01',
    );
  });

  it('keeps current-year influenza and Tdap under 10 years completed', () => {
    const recs = buildVaccinationRecommendations({
      vaccinationHistory: {
        influenza: { received: true, administeredAt: '2026-01-10' },
        tdap: { received: true, administeredAt: '2020-01-10' },
        pneumococcal: true,
        rsv: true,
        covid19: true,
      },
      ageYears: 49,
      asOf: new Date('2026-06-30T00:00:00.000Z'),
    });

    expect(recs.map((r) => r.key)).not.toContain('influenza');
    expect(recs.map((r) => r.key)).not.toContain('tdap');
  });

  it('asks for dates when legacy recurring vaccine history is boolean-only', () => {
    const recs = buildVaccinationRecommendations({
      vaccinationHistory: {
        influenza: true,
        tdap: true,
        pneumococcal: true,
        rsv: true,
        covid19: true,
      },
      ageYears: 49,
      asOf: new Date('2026-06-30T00:00:00.000Z'),
    });

    expect(recs.map((r) => r.key)).toEqual(
      expect.arrayContaining(['influenza', 'tdap']),
    );
  });

  it('builds badge tracking criteria from smoking and exacerbation records', () => {
    const plan = buildBadgePlan({
      smokingStatus: 'current',
      smokingCessation: { smokeFreeSince: '2020-01-01' },
      exacerbationsLast12Months: 0,
      exacerbationFreeSince: '2026-01-01T00:00:00.000Z',
      walkImprovementOverSixMonths: true,
      asOf: new Date('2026-04-01T00:00:00.000Z'),
    });
    expect(plan.earned).toEqual(
      expect.arrayContaining([
        'smoke_free_7d',
        'gold_stability_3mo',
        'walk_improvement_6mo',
      ]),
    );
    expect(plan.criteria.walk_improvement_6mo).toContain('6개월');
  });

  it('does not award cessation or stability badges without evidence duration', () => {
    const plan = buildBadgePlan({
      smokingStatus: 'never',
      exacerbationsLast12Months: 0,
      exacerbationFreeSince: '2026-03-15T00:00:00.000Z',
      asOf: new Date('2026-04-01T00:00:00.000Z'),
    });
    expect(plan.earned).toEqual([]);
  });

  it('requires six elapsed months and improved 6-minute walk performance', () => {
    const baseline = {
      endedAt: new Date('2025-01-01T00:00:00.000Z'),
      steps: 500,
      estimatedDistanceMeters: 350,
    };
    expect(
      hasSixMonthWalkImprovement(
        {
          endedAt: new Date('2025-07-01T00:00:00.000Z'),
          steps: 520,
          estimatedDistanceMeters: 370,
        },
        baseline,
      ),
    ).toBe(true);
    expect(
      hasSixMonthWalkImprovement(
        {
          endedAt: new Date('2025-06-30T00:00:00.000Z'),
          steps: 520,
          estimatedDistanceMeters: 370,
        },
        baseline,
      ),
    ).toBe(false);
    expect(
      hasSixMonthWalkImprovement(
        {
          endedAt: new Date('2025-07-01T00:00:00.000Z'),
          steps: 480,
          estimatedDistanceMeters: 340,
        },
        baseline,
      ),
    ).toBe(false);
  });
});
