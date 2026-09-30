import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('parqueaderos')
export class Parqueadero {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 200 })
  direccion!: string;

  @Column({ type: 'integer' })
  capacidadTotal!: number;

  @Column({ default: true })
  activo!: boolean;
}
