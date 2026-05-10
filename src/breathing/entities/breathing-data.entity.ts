import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('breathing_data')
export class BreathingData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // common COPD metrics
  @Column({ type: 'float' })
  fev1: number; // Forced Expiratory Volume in 1 second (L)

  @Column({ type: 'float' })
  fvc: number; // Forced Vital Capacity (L)

  @Column({ type: 'float', nullable: true })
  pef: number; // Peak Expiratory Flow (L/min)

  @Column({ type: 'int', nullable: true })
  oxygenSaturation: number; // SpO2 (%)

  @Column({ type: 'int', nullable: true })
  heartRate: number; // bpm

  @Column({ type: 'int' })
  overallScore: number; // Calculated score (0-100)

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  measuredAt: Date;
}
