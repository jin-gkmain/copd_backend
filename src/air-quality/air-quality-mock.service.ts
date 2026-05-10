import { Injectable } from '@nestjs/common';

/** 쿼리 문자열로 결정적인 0~1 값 (같은 입력 → 같은 목업) */
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function aqiBand(v: number): string {
  if (v <= 15) return 'good';
  if (v <= 35) return 'moderate';
  if (v <= 75) return 'unhealthy_sensitive';
  return 'unhealthy';
}

export type AirQualityMockPayload = {
  overall: {
    index: number;
    grade: string;
    measuredAt: string;
  };
  pollutants: {
    pm25: { value: number; unit: string; level: string };
    pm10: { value: number; unit: string; level: string };
    no2: { value: number; unit: string; level: string };
    so2: { value: number; unit: string; level: string };
    pollen: { value: string; level: string; unit: string };
    chemicals: { value: string; level: string; unit: string };
  };
};

@Injectable()
export class AirQualityMockService {
  /** 임의의 쿼리 객체를 시드로 대기질 목업 생성 */
  buildFromQuery(received: Record<string, string | string[]>): AirQualityMockPayload {
    const seed = JSON.stringify(received);
    const r = hash01(seed || 'default');
    const pm25 = Math.round(15 + r * 35);
    const pm10 = Math.round(pm25 * 1.4 + 10);
    const no2 = Math.round((0.015 + r * 0.04) * 1000) / 1000;
    const so2 = Math.round((0.008 + r * 0.02) * 1000) / 1000;

    return {
      overall: {
        index: Math.min(150, Math.round(40 + r * 80)),
        grade: aqiBand(pm25),
        measuredAt: new Date().toISOString(),
      },
      pollutants: {
        pm25: { value: pm25, unit: 'μg/m³', level: aqiBand(pm25) },
        pm10: { value: pm10, unit: 'μg/m³', level: aqiBand(pm10) },
        no2: { value: no2, unit: 'ppm', level: r < 0.5 ? 'good' : 'moderate' },
        so2: { value: so2, unit: 'ppm', level: 'good' },
        pollen: {
          value: r < 0.33 ? 'low' : r < 0.66 ? 'medium' : 'high',
          level: 'moderate',
          unit: '',
        },
        chemicals: { value: r < 0.5 ? 'low' : 'medium', level: 'good', unit: '' },
      },
    };
  }
}
