import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TipoVehiculo {
  CARRO = 'carro',
  MOTO = 'moto',
}

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryColumn({ length: 8 })
  placa!: string;

  @Column({ length: 50 })
  marca!: string;

  @Column({ length: 50 })
  modelo!: string;

  @Column({ type: 'varchar' })
  tipo!: TipoVehiculo;

  // Relación N:1 — muchos vehículos pertenecen a un usuario
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: User;

  @Column({ type: 'integer' })
  usuarioId!: number;

  @Column({ default: true })
  activo!: boolean;
}
