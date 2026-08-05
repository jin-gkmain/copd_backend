import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Assessment,
  AssessmentType,
  SixMinuteStepAssessment,
} from '../assessments/entities/assessment.entity';
import { BreathingData } from '../breathing/entities/breathing-data.entity';
import { DailyMorningReport } from '../daily-reports/entities/daily-morning-report.entity';
import {
  buildRiskManagementPlan,
  buildBadgePlan,
  buildSmokingCessationPlan,
  buildVaccinationRecommendations,
  computeGoldAbeGroup,
  computeGoldAirflowGrade,
  computeUnifiedRiskLevel,
  hasSixMonthWalkImprovement,
} from './clinical-classification.engine';
import { UpdateClinicalProfileDto } from './dto/update-clinical-profile.dto';
import { ClinicalProfile } from './entities/clinical-profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClinicalProfileService {
  constructor(
    @InjectRepository(ClinicalProfile)
    private readonly repo: Repository<ClinicalProfile>,
    @InjectRepository(BreathingData)
    private readonly breathingRepo: Repository<BreathingData>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(DailyMorningReport)
    private readonly morningRepo: Repository<DailyMorningReport>,
    @InjectRepository(SixMinuteStepAssessment)
    private readonly sixMinuteWalkRepo: Repository<SixMinuteStepAssessment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getOrCreate(userId: string): Promise<ClinicalProfile> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({
        userId,
        fev1PercentPredicted: null,
        goldAirflowGrade: null,
        mmrcScore: null,
        caatScore: null,
        exacerbationsLast12Months: null,
        exacerbationFreeSince: null,
        smokingStatus: null,
        smokingCessation: null,
        vaccinationHistory: null,
        reviewStatus: 'pending_review',
        latestBreathingMeasuredAt: null,
        latestAssessmentAt: null,
      }),
    );
  }

  async patch(
    userId: string,
    dto: UpdateClinicalProfileDto,
  ): Promise<ClinicalProfile> {
    const profile = await this.getOrCreate(userId);
    if (dto.fev1PercentPredicted !== undefined) {
      profile.fev1PercentPredicted = dto.fev1PercentPredicted;
      profile.goldAirflowGrade = computeGoldAirflowGrade(
        dto.fev1PercentPredicted,
      );
    }
    if (dto.mmrcScore !== undefined) profile.mmrcScore = dto.mmrcScore;
    if (dto.caatScore !== undefined) profile.caatScore = dto.caatScore;
    if (dto.exacerbationsLast12Months !== undefined) {
      if (dto.exacerbationsLast12Months === 0) {
        profile.exacerbationFreeSince ??= new Date();
      } else {
        profile.exacerbationFreeSince = null;
      }
      profile.exacerbationsLast12Months = dto.exacerbationsLast12Months;
    }
    if (dto.smokingStatus !== undefined)
      profile.smokingStatus = dto.smokingStatus;
    if (dto.smokingCessation !== undefined)
      profile.smokingCessation = dto.smokingCessation;
    if (dto.vaccinationHistory !== undefined)
      profile.vaccinationHistory = dto.vaccinationHistory;
    return this.repo.save(profile);
  }

  async updateFromBreathing(
    userId: string,
    input: { fev1PercentPredicted?: number | null; measuredAt?: Date | null },
  ): Promise<void> {
    if (input.fev1PercentPredicted == null) return;
    const profile = await this.getOrCreate(userId);
    profile.fev1PercentPredicted = input.fev1PercentPredicted;
    profile.goldAirflowGrade = computeGoldAirflowGrade(
      input.fev1PercentPredicted,
    );
    profile.latestBreathingMeasuredAt = input.measuredAt ?? new Date();
    await this.repo.save(profile);
  }

  async updateFromAssessment(
    userId: string,
    assessment: Assessment,
  ): Promise<void> {
    if (assessment.type !== AssessmentType.DYSPNEA) return;
    const profile = await this.getOrCreate(userId);
    profile.mmrcScore = assessment.score;
    profile.latestAssessmentAt = assessment.createdAt ?? new Date();
    await this.repo.save(profile);
  }

  async updateFromMedicalSurveyPayload(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const patch = extractClinicalPatchFromSurvey(payload);
    if (Object.keys(patch).length === 0) return;
    await this.patch(userId, patch);
  }

  async getSummary(userId: string) {
    const profile = await this.getOrCreate(userId);
    const latestBreathing = await this.breathingRepo.findOne({
      where: { userId },
      order: { measuredAt: 'DESC' },
    });
    const latestMorning = await this.morningRepo.findOne({
      where: { userId },
      order: { reportingDay: 'DESC' },
    });
    const latestMmrc = await this.assessmentRepo.findOne({
      where: { userId, type: AssessmentType.DYSPNEA },
      order: { createdAt: 'DESC' },
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const walkRecords = await this.sixMinuteWalkRepo.find({
      where: { userId },
      order: { endedAt: 'DESC' },
    });
    const latestWalk = walkRecords[0] ?? null;
    const baselineWalk = latestWalk
      ? (walkRecords.find((row) => {
          const sixMonthsAfter = new Date(row.endedAt);
          sixMonthsAfter.setUTCMonth(sixMonthsAfter.getUTCMonth() + 6);
          return sixMonthsAfter <= latestWalk.endedAt;
        }) ?? null)
      : null;
    const mmrcScore = profile.mmrcScore ?? latestMmrc?.score ?? null;
    const caatScore = profile.caatScore ?? null;
    const goldAirflowGrade =
      profile.goldAirflowGrade ??
      computeGoldAirflowGrade(profile.fev1PercentPredicted);
    const goldAbeGroup = computeGoldAbeGroup({
      mmrcScore,
      caatScore,
      exacerbationsLast12Months: profile.exacerbationsLast12Months,
    });
    const riskLevel = computeUnifiedRiskLevel({
      goldAbeGroup,
      dailyRisk: latestMorning?.computedRisk,
    });
    const managementPlan = buildRiskManagementPlan(riskLevel);
    const smokingCessationPlan = buildSmokingCessationPlan({
      smokingStatus: profile.smokingStatus,
      smokingCessation: profile.smokingCessation,
      goldAirflowGrade,
      fev1PercentPredicted: profile.fev1PercentPredicted,
    });
    const vaccinationRecommendations = buildVaccinationRecommendations({
      vaccinationHistory: profile.vaccinationHistory,
      goldAirflowGrade,
      goldAbeGroup,
      ageYears: ageAt(user?.birthDate ?? null),
    });
    const badgePlan = buildBadgePlan({
      smokingStatus: profile.smokingStatus,
      smokingCessation: profile.smokingCessation,
      exacerbationsLast12Months: profile.exacerbationsLast12Months,
      exacerbationFreeSince: profile.exacerbationFreeSince,
      walkImprovementOverSixMonths: hasSixMonthWalkImprovement(
        latestWalk,
        baselineWalk,
      ),
    });

    return {
      profile: this.serialize(profile),
      goldAirflowGrade,
      riskLevel,
      managementPlan,
      smokingCessationPlan,
      vaccinationRecommendations,
      badgePlan,
      evidence: {
        latestBreathingMeasuredAt:
          profile.latestBreathingMeasuredAt ??
          latestBreathing?.measuredAt ??
          null,
        latestAssessmentAt:
          profile.latestAssessmentAt ?? latestMmrc?.createdAt ?? null,
        latestMorningReportingDay: latestMorning?.reportingDay ?? null,
      },
      missingInputs: {
        fev1PercentPredicted: profile.fev1PercentPredicted == null,
        exacerbationsLast12Months: profile.exacerbationsLast12Months == null,
        symptomScore: mmrcScore == null && caatScore == null,
      },
      reviewStatus: profile.reviewStatus,
      safetyNotice:
        '기록 기반 참고 정보입니다. 진단·치료 결정은 의료진 상담과 검수를 통해 확인하세요.',
    };
  }

  serialize(profile: ClinicalProfile) {
    return {
      id: profile.id,
      userId: profile.userId,
      fev1PercentPredicted: profile.fev1PercentPredicted,
      goldAirflowGrade: profile.goldAirflowGrade,
      mmrcScore: profile.mmrcScore,
      caatScore: profile.caatScore,
      exacerbationsLast12Months: profile.exacerbationsLast12Months,
      exacerbationFreeSince: profile.exacerbationFreeSince,
      smokingStatus: profile.smokingStatus,
      smokingCessation: profile.smokingCessation,
      vaccinationHistory: profile.vaccinationHistory,
      reviewStatus: profile.reviewStatus,
      latestBreathingMeasuredAt: profile.latestBreathingMeasuredAt,
      latestAssessmentAt: profile.latestAssessmentAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function finiteNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function ageAt(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }
  const [year, month, day] = parts;
  let age = now.getUTCFullYear() - year;
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  if (beforeBirthday) age--;
  return age >= 0 ? age : null;
}

function extractClinicalPatchFromSurvey(
  payload: Record<string, unknown>,
): UpdateClinicalProfileDto {
  const sources = [
    asRecord(payload.clinicalProfile),
    asRecord(payload.respiratoryProfile),
    asRecord(asRecord(payload.diseaseHistory)?.clinicalProfile),
  ].filter((v): v is Record<string, unknown> => v != null);

  const patch: UpdateClinicalProfileDto = {};
  for (const src of sources) {
    const fev1 = finiteNumber(src.fev1PercentPredicted);
    if (fev1 !== undefined && fev1 >= 0 && fev1 <= 200) {
      patch.fev1PercentPredicted = fev1;
    }
    const mmrc = finiteNumber(src.mmrcScore);
    if (mmrc !== undefined && mmrc >= 0 && mmrc <= 4) {
      patch.mmrcScore = mmrc;
    }
    const caat = finiteNumber(src.caatScore);
    if (caat !== undefined && caat >= 0 && caat <= 40) {
      patch.caatScore = caat;
    }
    const ex = finiteNumber(src.exacerbationsLast12Months);
    if (ex !== undefined && ex >= 0 && ex <= 99) {
      patch.exacerbationsLast12Months = Math.round(ex);
    }
    if (typeof src.smokingStatus === 'string')
      patch.smokingStatus = src.smokingStatus;
    const smokingCessation = asRecord(src.smokingCessation);
    if (smokingCessation) patch.smokingCessation = smokingCessation;
    const vaccinations = asRecord(src.vaccinationHistory);
    if (vaccinations) patch.vaccinationHistory = vaccinations;
  }
  return patch;
}
