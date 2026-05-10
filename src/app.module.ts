import { join } from 'path';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BreathingModule } from './breathing/breathing.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AirQualityModule } from './air-quality/air-quality.module';
import { MedicalSurveyModule } from './medical-survey/medical-survey.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dist 기준 상위(backend/)의 .env — 모노레포 루트에서 실행해도 키를 읽도록 함
      envFilePath: [join(__dirname, '..', '.env'), '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Only for development!
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BreathingModule,
    AssessmentsModule,
    AirQualityModule,
    MedicalSurveyModule,
    DailyReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
