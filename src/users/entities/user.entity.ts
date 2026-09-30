import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  OPERADOR = 'operador',
  CONDUCTOR = 'conductor',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ unique: true, length: 254 })
  email!: string;

  @Column({ length: 30 })
  telefono!: string;

  // varchar en vez de enum: sqlite no soporta columnas enum nativas
  @Column({ type: 'varchar', default: UserRole.CONDUCTOR })
  rol!: UserRole;

  @Column({ default: true })
  activo!: boolean;
}
