import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AssessmentType {
  DYSPNEA = 'dyspnea', // 호흡곤란평가 (앱: mMRC)
  DEPRESSION = 'depression', // 우울장애 평가 (앱: NDS)
  ANXIETY = 'anxiety', // 불안장애 평가 (앱: NAS)
  STRESS = 'stress', // 스트레스 평가 (앱: NSS)
  QOL = 'qol', // 삶의질 평가 (앱: EQ-5D)
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
  })
  type: AssessmentType;

  @Column({ type: 'json' })
  responses: any; // { questionId: answerId, ... }

  /** 기존 행·마이그레이션 시 NULL 방지용 DB 기본값 (synchronize 시 ADD/SET NOT NULL 통과) */
  @Column({ type: 'double precision', default: 0 })
  score: number;

  @CreateDateColumn()
  createdAt: Date;
}

/** Health Connect 등으로 집계한 6분(또는 중단) 구간 걸음 능력 측정 기록 */
@Entity('six_minute_step_assessments')
export class SixMinuteStepAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  steps: number;

  @Column({ type: 'int' })
  durationSeconds: number;

  @Column({ type: 'float', nullable: true })
  estimatedDistanceMeters: number | null;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  endedAt: Date;

  /** 앱 루브릭 등급 문자열 (예: 우수, 양호, 보통, 개선 필요) */
  @Column({ type: 'varchar', length: 32, nullable: true })
  interpretationLevel: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
