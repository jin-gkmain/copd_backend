import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { BreathingService } from './breathing/breathing.service';
import { AssessmentsService } from './assessments/assessments.service';
import { UserRole, Gender } from './users/entities/user.entity';
import { AssessmentType } from './assessments/entities/assessment.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const breathingService = app.get(BreathingService);
  const assessmentsService = app.get(AssessmentsService);

  console.log('Seeding data...');

  // 1. Create a test user
  const testUser = {
    phoneNumber: '01012345678',
    password: 'password123',
    name: '테스트유저',
    birthDate: '1980-05-20',
    gender: Gender.MALE,
    role: UserRole.PATIENT,
  };

  let user;
  try {
    user = await authService.register(testUser);
    console.log('User created:', user.phoneNumber);
  } catch {
    console.log('User might already exist, trying to login...');
    const loginResult = await authService.validateUser(
      testUser.phoneNumber,
      testUser.password,
    );
    user = loginResult;
  }

  if (user) {
    // 2. Add some breathing data
    await breathingService.create(user.id, {
      fev1: 3.2,
      fvc: 4.0,
      pef: 420,
      oxygenSaturation: 97,
      measuredAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    } as any);

    await breathingService.create(user.id, {
      fev1: 3.0,
      fvc: 4.1,
      pef: 400,
      oxygenSaturation: 96,
      measuredAt: new Date(Date.now() - 86400000), // 1 day ago
    } as any);

    await breathingService.create(user.id, {
      fev1: 3.4,
      fvc: 4.2,
      pef: 450,
      oxygenSaturation: 98,
      measuredAt: new Date(),
    } as any);

    // 3. Add some assessments
    await assessmentsService.createGeneric(user.id, {
      type: AssessmentType.DYSPNEA,
      responses: { q1: 2, q2: 3 },
      score: 5,
    });

    await assessmentsService.createGeneric(user.id, {
      type: AssessmentType.DEPRESSION,
      responses: { q1: 1, q2: 1, q3: 2 },
      score: 4,
    });

    const walkEnd = new Date();
    const walkStart = new Date(walkEnd.getTime() - 360 * 1000);
    await assessmentsService.createSixMinuteStep(user.id, {
      steps: 380,
      durationSeconds: 360,
      estimatedDistanceMeters: 247,
      startedAt: walkStart.toISOString(),
      endedAt: walkEnd.toISOString(),
      interpretationLevel: '보통',
    });

    console.log('Seeding completed successfully!');
  }

  await app.close();
}

void bootstrap();
