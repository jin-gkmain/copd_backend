import {
  computeDailyRisk,
  payloadFromUnknown,
  type MorningPayload,
} from './daily-risk.engine';

const stable: MorningPayload = {
  dyspnea: 'same',
  cough: 'same',
  sputumAmount: 'same',
  sputumColor: 'clear',
  fatigue: false,
  chestPain: false,
};

describe('daily risk engine', () => {
  it('maps stable, one-change, and two-change reports to green/yellow/red', () => {
    const reportingDay = '2026-06-30';
    const run = (payload: MorningPayload) =>
      computeDailyRisk({
        reportsAscending: [{ reportingDay, payload }],
        todayReportingDay: reportingDay,
      });

    expect(run(stable).level).toBe('green');
    expect(run({ ...stable, dyspnea: 'up' })).toMatchObject({
      level: 'yellow',
      reasonCodes: ['symptom_today_mild'],
    });
    expect(run({ ...stable, dyspnea: 'up', cough: 'up' })).toMatchObject({
      level: 'red',
      reasonCodes: expect.arrayContaining(['symptom_today_severe']),
    });
  });

  it('raises red after symptom changes on three days in the seven-day window', () => {
    const result = computeDailyRisk({
      reportsAscending: ['2026-06-28', '2026-06-29', '2026-06-30'].map(
        (reportingDay) => ({
          reportingDay,
          payload: { ...stable, dyspnea: 'up' as const },
        }),
      ),
      todayReportingDay: '2026-06-30',
    });

    expect(result.level).toBe('red');
    expect(result.reasonCodes).toContain('symptom_accumulation_days');
  });

  it('rejects malformed morning payloads instead of inventing defaults', () => {
    expect(payloadFromUnknown(null)).toBeNull();
    expect(payloadFromUnknown({ ...stable, sputumColor: 'brown' })).toBeNull();
    expect(payloadFromUnknown(stable)).toEqual(stable);
  });
});
