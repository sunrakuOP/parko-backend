import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';

export enum EstadoFila {
  SIN_FILA = 'sin_fila',
  CORTA = 'corta',
  LARGA = 'larga',
}

// Un sector es un "lado" o zona de un parqueadero (ej. Cañas Gordas → Palmas,
// Lagos). Los parqueaderos de la U no se controlan plaza por plaza, sino por
// cupos: cuántos caben (capacidad) y cuántos hay adentro (ocupados).
@Entity('sectores')
export class Sector {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Parqueadero, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'parqueaderoId' })
  parqueadero!: Parqueadero;

  @Column({ type: 'integer' })
  parqueaderoId!: number;

  @Column({ length: 60 })
  nombre!: string;

  @Column({ type: 'integer' })
  capacidad!: number;

  @Column({ type: 'integer', default: 0 })
  ocupados!: number;

  @Column({ type: 'varchar', default: EstadoFila.SIN_FILA })
  fila!: EstadoFila;

  // true mientras la capacidad sea una aproximación y no un dato oficial.
  @Column({ default: true })
  capacidadEstimada!: boolean;

  @Column({ default: true })
  activo!: boolean;
}
