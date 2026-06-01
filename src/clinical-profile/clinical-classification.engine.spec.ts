import {
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
      expect(computeGoldAbeGroup({ mmrcScore: 0, exacerbationsLast12Months: 1 })).toBe('E');
    });

    it('returns B when symptoms are high and exacerbations are zero', () => {
      expect(computeGoldAbeGroup({ mmrcScore: 2, exacerbationsLast12Months: 0 })).toBe('B');
      expect(computeGoldAbeGroup({ caatScore: 10, exacerbationsLast12Months: 0 })).toBe('B');
    });

    it('returns A when symptoms are low and exacerbations are zero', () => {
      expect(computeGoldAbeGroup({ mmrcScore: 1, caatScore: 9, exacerbationsLast12Months: 0 })).toBe('A');
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
});

