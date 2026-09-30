import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';

export enum TipoEspacio {
  CARRO = 'carro',
  MOTO = 'moto',
  DISCAPACITADO = 'discapacitado',
}

export enum EstadoEspacio {
  DISPONIBLE = 'disponible',
  OCUPADO = 'ocupado',
  RESERVADO = 'reservado',
  MANTENIMIENTO = 'mantenimiento',
}

@Entity('espacios')
export class Espacio {
  @PrimaryGeneratedColumn()
  id!: number;

  // Relación N:1 — muchos espacios pertenecen a un parqueadero
  @ManyToOne(() => Parqueadero, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'parqueaderoId' })
  parqueadero!: Parqueadero;

  @Column({ type: 'integer' })
  parqueaderoId!: number;

  @Column({ length: 10 })
  numero!: string;

  @Column({ type: 'varchar' })
  tipo!: TipoEspacio;

  @Column({ type: 'varchar', default: EstadoEspacio.DISPONIBLE })
  estado!: EstadoEspacio;
}
