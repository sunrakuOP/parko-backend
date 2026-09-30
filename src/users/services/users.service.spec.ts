import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { UsersService } from './users.service';
import { User, UserRole } from '../entities/user.entity';

describe('UsersService', () => {
  let module: TestingModule;
  let service: UsersService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [sqliteMemoryModule([User]), TypeOrmModule.forFeature([User])],
      providers: [UsersService],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('crea un usuario con rol por defecto conductor', async () => {
    const user = await service.create({
      nombre: 'Carlos Tello',
      email: 'carlos@ejemplo.com',
      telefono: '+573101234567',
    });

    expect(user.id).toBeDefined();
    expect(user.rol).toBe(UserRole.CONDUCTOR);
    expect(user.activo).toBe(true);
  });

  it('rechaza crear un usuario con email repetido', async () => {
    await service.create({
      nombre: 'A',
      email: 'a@ejemplo.com',
      telefono: '+573000000001',
    });

    await expect(
      service.create({
        nombre: 'B',
        email: 'a@ejemplo.com',
        telefono: '+573000000002',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lanza NotFoundException si el usuario no existe', async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('no incluye usuarios desactivados en findAll', async () => {
    const user = await service.create({
      nombre: 'A',
      email: 'a@ejemplo.com',
      telefono: '+573000000001',
    });
    await service.remove(user.id);

    expect(await service.findAll()).toHaveLength(0);
    await expect(service.findOne(user.id)).rejects.toThrow(NotFoundException);
  });

  it('actualiza datos y valida disponibilidad de email al cambiarlo', async () => {
    const user = await service.create({
      nombre: 'A',
      email: 'a@ejemplo.com',
      telefono: '+573000000001',
    });
    await service.create({
      nombre: 'B',
      email: 'b@ejemplo.com',
      telefono: '+573000000002',
    });

    const updated = await service.update(user.id, { nombre: 'A actualizado' });
    expect(updated.nombre).toBe('A actualizado');

    await expect(
      service.update(user.id, { email: 'b@ejemplo.com' }),
    ).rejects.toThrow(ConflictException);
  });
});
