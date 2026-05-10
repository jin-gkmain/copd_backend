import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('daily_morning_reports')
@Unique(['userId', 'reportingDay'])
@Index(['userId', 'reportingDay'])
export class DailyMorningReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  /** 클라이언트 로컬 보고일 키 `yyyy-MM-dd` (06:00 경계) */
  @Column({ type: 'varchar', length: 10 })
  reportingDay: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 128, nullable: true })
  clientTimezone: string | null;

  /** 규칙 엔진만 적용한 단계(시간 조정 전). */
  @Column({ type: 'varchar', length: 16, nullable: true })
  baseComputedRisk: string | null;

  /** 시간 조정까지 반영한 사용자 노출용 위험도. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  computedRisk: string | null;

  @Column({ type: 'jsonb', nullable: true })
  reasonCodes: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
