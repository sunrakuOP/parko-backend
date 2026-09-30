import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Espacio } from '../../espacios/entities/espacio.entity';

export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada',
}

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id!: number;

  // Relación N:1 — muchas reservas pertenecen a un usuario
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: User;

  @Column({ type: 'integer' })
  usuarioId!: number;

  // Relación N:1 hacia Vehiculo, cuya PK natural es la placa
  @ManyToOne(() => Vehiculo, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'vehiculoPlaca', referencedColumnName: 'placa' })
  vehiculo!: Vehiculo;

  @Column({ length: 8 })
  vehiculoPlaca!: string;

  // Relación N:1 hacia Espacio — no se permite borrar un espacio con reservas
  @ManyToOne(() => Espacio, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'espacioId' })
  espacio!: Espacio;

  @Column({ type: 'integer' })
  espacioId!: number;

  // Sin `type` explícito: TypeORM infiere el tipo nativo correcto por motor
  // (datetime en sqlite, timestamp en postgres) a partir del tipo Date.
  @Column()
  fechaInicio!: Date;

  @Column()
  fechaFin!: Date;

  @Column({ type: 'varchar', default: EstadoReserva.PENDIENTE })
  estado!: EstadoReserva;
}
