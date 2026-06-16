import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface VersionStatus {
  name: string;
  version: string;
  gitSha: string | null;
  nodeEnv: string;
}

@Injectable()
export class AppService {
  getHello(): string {
    return 'COPD Care API';
  }

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  getVersion(): VersionStatus {
    return {
      name: 'copd_backend',
      version: process.env.APP_VERSION || '0.0.1',
      gitSha: process.env.GIT_SHA || process.env.COMMIT_SHA || null,
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }
}
