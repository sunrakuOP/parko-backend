import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { VehiculosService } from '../../vehiculos/services/vehiculos.service';
import {
  TipoVehiculo,
  Vehiculo,
} from '../../vehiculos/entities/vehiculo.entity';
import { ParqueaderosService } from '../../parqueaderos/services/parqueaderos.service';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';
import { EspaciosService } from '../../espacios/services/espacios.service';
import {
  EstadoEspacio,
  Espacio,
  TipoEspacio,
} from '../../espacios/entities/espacio.entity';
import { ReservasService } from './reservas.service';
import { EstadoReserva, Reserva } from '../entities/reserva.entity';

describe('ReservasService', () => {
  let module: TestingModule;
  let usersService: UsersService;
  let vehiculosService: VehiculosService;
  let parqueaderosService: ParqueaderosService;
  let espaciosService: EspaciosService;
  let espaciosRepository: Repository<Espacio>;
  let service: ReservasService;

  let usuarioId: number;
  let espacioId: number;
  const placa = 'ABC123';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        sqliteMemoryModule([User, Vehiculo, Parqueadero, Espacio, Reserva]),
        TypeOrmModule.forFeature([
          User,
          Vehiculo,
          Parqueadero,
          Espacio,
          Reserva,
        ]),
      ],
      providers: [
        UsersService,
        VehiculosService,
        ParqueaderosService,
        EspaciosService,
        ReservasService,
      ],
    }).compile();

    usersService = module.get(UsersService);
    vehiculosService = module.get(VehiculosService);
    parqueaderosService = module.get(ParqueaderosService);
    espaciosService = module.get(EspaciosService);
    espaciosRepository = module.get(getRepositoryToken(Espacio));
    service = module.get(ReservasService);

    const usuario = await usersService.create({
      nombre: 'Carlos',
      email: 'carlos@ejemplo.com',
      telefono: '+573101234567',
    });
    usuarioId = usuario.id;

    await vehiculosService.create({
      placa,
      marca: 'Mazda',
      modelo: '3',
      tipo: TipoVehiculo.CARRO,
      usuarioId,
    });

    const parqueadero = await parqueaderosService.create({
      nombre: 'Sede Meléndez',
      direccion: 'Calle 18 # 118-250',
      capacidadTotal: 200,
    });

    const espacio = await espaciosService.create({
      parqueaderoId: parqueadero.id,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });
    espacioId = espacio.id;
  });

  afterEach(async () => {
    await module.close();
  });

  function crearReserva() {
    return service.create({
      usuarioId,
      vehiculoPlaca: placa,
      espacioId,
      fechaInicio: '2026-09-20T08:00:00.000Z',
      fechaFin: '2026-09-20T12:00:00.000Z',
    });
  }

  it('crea la reserva y marca el espacio como reservado', async () => {
    const reserva = await crearReserva();

    expect(reserva.estado).toBe(EstadoReserva.PENDIENTE);
    expect((await espaciosService.findOne(espacioId)).estado).toBe(
      EstadoEspacio.RESERVADO,
    );
  });

  it('rechaza si el espacio no está disponible', async () => {
    await crearReserva();

    await expect(crearReserva()).rejects.toThrow(BadRequestException);
  });

  it('rechaza si el vehículo no pertenece al usuario', async () => {
    const otroUsuario = await usersService.create({
      nombre: 'Ana',
      email: 'ana@ejemplo.com',
      telefono: '+573000000009',
    });

    await expect(
      service.create({
        usuarioId: otroUsuario.id,
        vehiculoPlaca: placa,
        espacioId,
        fechaInicio: '2026-09-20T08:00:00.000Z',
        fechaFin: '2026-09-20T12:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza si fechaFin no es posterior a fechaInicio', async () => {
    await expect(
      service.create({
        usuarioId,
        vehiculoPlaca: placa,
        espacioId,
        fechaInicio: '2026-09-20T12:00:00.000Z',
        fechaFin: '2026-09-20T08:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('al cancelar libera el espacio', async () => {
    const reserva = await crearReserva();
    await service.remove(reserva.id);

    expect((await service.findOne(reserva.id)).estado).toBe(
      EstadoReserva.CANCELADA,
    );
    expect((await espaciosService.findOne(espacioId)).estado).toBe(
      EstadoEspacio.DISPONIBLE,
    );
  });

  it('al completar libera el espacio (pasando primero por confirmada)', async () => {
    const reserva = await crearReserva();
    await service.update(reserva.id, { estado: EstadoReserva.CONFIRMADA });
    await service.update(reserva.id, { estado: EstadoReserva.COMPLETADA });

    expect((await espaciosService.findOne(espacioId)).estado).toBe(
      EstadoEspacio.DISPONIBLE,
    );
  });

  it('rechaza completar una reserva que sigue pendiente (debe confirmarse antes)', async () => {
    const reserva = await crearReserva();

    await expect(
      service.update(reserva.id, { estado: EstadoReserva.COMPLETADA }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza reactivar una reserva ya cancelada', async () => {
    const reserva = await crearReserva();
    await service.remove(reserva.id);

    await expect(
      service.update(reserva.id, { estado: EstadoReserva.CONFIRMADA }),
    ).rejects.toThrow(BadRequestException);
  });

  it('al cancelar, si el espacio ya estaba en mantenimiento, no lo revive a disponible', async () => {
    const reserva = await crearReserva();
    // Un operador pone el espacio en mantenimiento mientras la reserva sigue activa.
    // No pasa por EspaciosService.update (bloquearía por estar "reservado"): se accede
    // al repositorio directo, como haría un ajuste manual de datos.
    await espaciosRepository.update(espacioId, {
      estado: EstadoEspacio.MANTENIMIENTO,
    });

    await service.remove(reserva.id);

    expect((await espaciosService.findOne(espacioId)).estado).toBe(
      EstadoEspacio.MANTENIMIENTO,
    );
  });

  it('lanza NotFoundException si la reserva no existe', async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('filtra por estado y usuarioId', async () => {
    const reserva = await crearReserva();
    await service.update(reserva.id, { estado: EstadoReserva.CONFIRMADA });

    const porEstado = await service.findAll({
      estado: EstadoReserva.CONFIRMADA,
    });
    expect(porEstado).toHaveLength(1);
    expect(porEstado[0].id).toBe(reserva.id);

    const porUsuario = await service.findAll({ usuarioId });
    expect(porUsuario).toHaveLength(1);

    const sinCoincidencias = await service.findAll({
      estado: EstadoReserva.CANCELADA,
    });
    expect(sinCoincidencias).toHaveLength(0);
  });
});
