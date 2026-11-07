import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { ParqueaderosService } from '../../parqueaderos/services/parqueaderos.service';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';
import { SectoresService } from './sectores.service';
import { EstadoFila, Sector } from '../entities/sector.entity';

describe('SectoresService', () => {
  let module: TestingModule;
  let service: SectoresService;
  let parqueaderoId: number;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        sqliteMemoryModule([Parqueadero, Sector]),
        TypeOrmModule.forFeature([Parqueadero, Sector]),
      ],
      providers: [ParqueaderosService, SectoresService],
    }).compile();

    service = module.get(SectoresService);
    const parqueadero = await module.get(ParqueaderosService).create({
      nombre: 'Cañas Gordas',
      direccion: 'Entrada principal',
      capacidadTotal: 100,
    });
    parqueaderoId = parqueadero.id;
  });

  afterEach(async () => {
    await module.close();
  });

  it('crea un sector vacío y sin fila por defecto', async () => {
    const sector = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 40,
    });

    expect(sector.ocupados).toBe(0);
    expect(sector.fila).toBe(EstadoFila.SIN_FILA);
    expect(sector.capacidadEstimada).toBe(true);
    expect(sector.activo).toBe(true);
  });

  it('rechaza un sector en un parqueadero que no existe', async () => {
    await expect(
      service.create({ parqueaderoId: 999, nombre: 'X', capacidad: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un nombre repetido dentro del mismo parqueadero', async () => {
    await service.create({ parqueaderoId, nombre: 'Palmas', capacidad: 40 });
    await expect(
      service.create({ parqueaderoId, nombre: 'Palmas', capacidad: 10 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('filtra por parqueadero', async () => {
    const otro = await module.get(ParqueaderosService).create({
      nombre: 'Almendros',
      direccion: 'Entrada trasera',
      capacidadTotal: 50,
    });
    await service.create({ parqueaderoId, nombre: 'Palmas', capacidad: 40 });
    await service.create({
      parqueaderoId: otro.id,
      nombre: 'Cancha',
      capacidad: 30,
    });

    const delOtro = await service.findAll({ parqueaderoId: otro.id });
    expect(delOtro.map((s) => s.nombre)).toEqual(['Cancha']);
  });

  it('suma y resta ocupación con delta', async () => {
    const s = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 10,
    });

    await service.ajustarOcupacion(s.id, 1);
    await service.ajustarOcupacion(s.id, 1);
    const tras = await service.ajustarOcupacion(s.id, -1);

    expect(tras.ocupados).toBe(1);
  });

  it('no deja pasar de la capacidad ni bajar de cero', async () => {
    const s = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 2,
    });

    await service.ajustarOcupacion(s.id, 2);
    await expect(service.ajustarOcupacion(s.id, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await service.ajustarOcupacion(s.id, -2);
    await expect(service.ajustarOcupacion(s.id, -1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect((await service.findOne(s.id)).ocupados).toBe(0);
  });

  it('con dos porteros a la vez no se pasa de la capacidad', async () => {
    const s = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 3,
    });

    const resultados = await Promise.allSettled(
      Array.from({ length: 8 }, () => service.ajustarOcupacion(s.id, 1)),
    );

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect((await service.findOne(s.id)).ocupados).toBe(3);
  });

  it('ajustar un sector inexistente da 404', async () => {
    await expect(service.ajustarOcupacion(999, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('no permite bajar la capacidad por debajo de lo ocupado', async () => {
    const s = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 10,
    });
    await service.ajustarOcupacion(s.id, 6);

    await expect(service.update(s.id, { capacidad: 5 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const ok = await service.update(s.id, {
      capacidad: 8,
      fila: EstadoFila.LARGA,
    });
    expect(ok.capacidad).toBe(8);
    expect(ok.fila).toBe(EstadoFila.LARGA);
  });

  it('la baja es lógica y un sector dado de baja no admite ajustes', async () => {
    const s = await service.create({
      parqueaderoId,
      nombre: 'Palmas',
      capacidad: 10,
    });
    await service.remove(s.id);

    expect((await service.findOne(s.id)).activo).toBe(false);
    await expect(service.ajustarOcupacion(s.id, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
