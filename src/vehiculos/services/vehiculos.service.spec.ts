import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { VehiculosService } from './vehiculos.service';
import { TipoVehiculo, Vehiculo } from '../entities/vehiculo.entity';

describe('VehiculosService', () => {
  let module: TestingModule;
  let service: VehiculosService;
  let usersService: UsersService;
  let usuarioId: number;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        sqliteMemoryModule([User, Vehiculo]),
        TypeOrmModule.forFeature([User, Vehiculo]),
      ],
      providers: [UsersService, VehiculosService],
    }).compile();

    service = module.get(VehiculosService);
    usersService = module.get(UsersService);

    const usuario = await usersService.create({
      nombre: 'Carlos',
      email: 'carlos@ejemplo.com',
      telefono: '+573101234567',
    });
    usuarioId = usuario.id;
  });

  afterEach(async () => {
    await module.close();
  });

  it('crea un vehículo asociado a un usuario existente', async () => {
    const vehiculo = await service.create({
      placa: 'abc123',
      marca: 'Mazda',
      modelo: '3',
      tipo: TipoVehiculo.CARRO,
      usuarioId,
    });

    expect(vehiculo.placa).toBe('ABC123');
    expect(vehiculo.activo).toBe(true);
  });

  it('rechaza crear un vehículo si el usuario no existe', async () => {
    await expect(
      service.create({
        placa: 'ABC123',
        marca: 'Mazda',
        modelo: '3',
        tipo: TipoVehiculo.CARRO,
        usuarioId: 999,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza placas repetidas', async () => {
    await service.create({
      placa: 'ABC123',
      marca: 'Mazda',
      modelo: '3',
      tipo: TipoVehiculo.CARRO,
      usuarioId,
    });

    await expect(
      service.create({
        placa: 'ABC123',
        marca: 'Kia',
        modelo: 'Rio',
        tipo: TipoVehiculo.CARRO,
        usuarioId,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('desactiva un vehículo y deja de aparecer en findAll/findOne', async () => {
    await service.create({
      placa: 'ABC123',
      marca: 'Mazda',
      modelo: '3',
      tipo: TipoVehiculo.CARRO,
      usuarioId,
    });
    await service.remove('ABC123');

    expect(await service.findAll()).toHaveLength(0);
    await expect(service.findOne('ABC123')).rejects.toThrow(NotFoundException);
  });
});
