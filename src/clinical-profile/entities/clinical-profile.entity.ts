import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('clinical_profiles')
export class ClinicalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float', nullable: true })
  fev1PercentPredicted: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  goldAirflowGrade: string | null;

  @Column({ type: 'double precision', nullable: true })
  mmrcScore: number | null;

  @Column({ type: 'double precision', nullable: true })
  caatScore: number | null;

  @Column({ type: 'int', nullable: true })
  exacerbationsLast12Months: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  smokingStatus: string | null;

  @Column({ type: 'jsonb', nullable: true })
  smokingCessation: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  vaccinationHistory: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 32, default: 'pending_review' })
  reviewStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  latestBreathingMeasuredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  latestAssessmentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
