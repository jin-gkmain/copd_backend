import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UserSchemaService implements OnModuleInit {
  private readonly logger = new Logger(UserSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" character varying(32),
        ADD COLUMN IF NOT EXISTS "privacyPolicyAgreedAt" timestamp with time zone
    `);
    this.logger.log('User privacy policy schema is ready');
  }
}
