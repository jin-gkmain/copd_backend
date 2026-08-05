import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ClinicalProfileSchemaService implements OnModuleInit {
  private readonly logger = new Logger(ClinicalProfileSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "clinical_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fev1PercentPredicted" double precision,
        "goldAirflowGrade" character varying(16),
        "mmrcScore" double precision,
        "caatScore" double precision,
        "exacerbationsLast12Months" integer,
        "exacerbationFreeSince" timestamp with time zone,
        "smokingStatus" character varying(32),
        "smokingCessation" jsonb,
        "vaccinationHistory" jsonb,
        "reviewStatus" character varying(32) NOT NULL DEFAULT 'pending_review',
        "latestBreathingMeasuredAt" timestamp with time zone,
        "latestAssessmentAt" timestamp with time zone,
        "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_971b1b4be7496efb85e37b3ad64" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_a8ca18e4719496ca5a2595b3bc2" UNIQUE ("userId"),
        CONSTRAINT "FK_a8ca18e4719496ca5a2595b3bc2"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await this.dataSource.query(`
      ALTER TABLE "clinical_profiles"
        ADD COLUMN IF NOT EXISTS "fev1PercentPredicted" double precision,
        ADD COLUMN IF NOT EXISTS "goldAirflowGrade" character varying(16),
        ADD COLUMN IF NOT EXISTS "mmrcScore" double precision,
        ADD COLUMN IF NOT EXISTS "caatScore" double precision,
        ADD COLUMN IF NOT EXISTS "exacerbationsLast12Months" integer,
        ADD COLUMN IF NOT EXISTS "exacerbationFreeSince" timestamp with time zone,
        ADD COLUMN IF NOT EXISTS "smokingStatus" character varying(32),
        ADD COLUMN IF NOT EXISTS "smokingCessation" jsonb,
        ADD COLUMN IF NOT EXISTS "vaccinationHistory" jsonb,
        ADD COLUMN IF NOT EXISTS "reviewStatus" character varying(32) DEFAULT 'pending_review',
        ADD COLUMN IF NOT EXISTS "latestBreathingMeasuredAt" timestamp with time zone,
        ADD COLUMN IF NOT EXISTS "latestAssessmentAt" timestamp with time zone,
        ADD COLUMN IF NOT EXISTS "createdAt" timestamp without time zone DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamp without time zone DEFAULT now()
    `);

    await this.dataSource.query(`
      UPDATE "clinical_profiles"
      SET "reviewStatus" = 'pending_review'
      WHERE "reviewStatus" IS NULL
    `);
    await this.dataSource.query(`
      ALTER TABLE "clinical_profiles"
        ALTER COLUMN "reviewStatus" SET DEFAULT 'pending_review',
        ALTER COLUMN "reviewStatus" SET NOT NULL,
        ALTER COLUMN "createdAt" SET DEFAULT now(),
        ALTER COLUMN "createdAt" SET NOT NULL,
        ALTER COLUMN "updatedAt" SET DEFAULT now(),
        ALTER COLUMN "updatedAt" SET NOT NULL
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clinical_profiles_userId_unique"
      ON "clinical_profiles" ("userId")
    `);

    await this.dataSource.query(`
      ALTER TABLE "breathing_data"
        ADD COLUMN IF NOT EXISTS "fev1PercentPredicted" double precision,
        ADD COLUMN IF NOT EXISTS "goldAirflowGrade" character varying(16),
        ADD COLUMN IF NOT EXISTS "deviceSource" character varying(32),
        ADD COLUMN IF NOT EXISTS "rawSpiro240" text
    `);
    await this.dataSource.query(`
      ALTER TABLE "breathing_data"
        ALTER COLUMN "overallScore" DROP NOT NULL
    `);

    this.logger.log('Clinical profile schema is ready');
  }
}
