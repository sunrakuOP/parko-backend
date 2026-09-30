import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { ParqueaderosService } from '../../parqueaderos/services/parqueaderos.service';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';
import { EspaciosService } from './espacios.service';
import {
  EstadoEspacio,
  Espacio,
  TipoEspacio,
} from '../entities/espacio.entity';

describe('EspaciosService', () => {
  let module: TestingModule;
  let service: EspaciosService;
  let parqueaderosService: ParqueaderosService;
  let espaciosRepository: Repository<Espacio>;
  let parqueaderoId: number;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        sqliteMemoryModule([Parqueadero, Espacio]),
        TypeOrmModule.forFeature([Parqueadero, Espacio]),
      ],
      providers: [ParqueaderosService, EspaciosService],
    }).compile();

    service = module.get(EspaciosService);
    parqueaderosService = module.get(ParqueaderosService);
    espaciosRepository = module.get(getRepositoryToken(Espacio));

    const parqueadero = await parqueaderosService.create({
      nombre: 'Sede Meléndez',
      direccion: 'Calle 18 # 118-250',
      capacidadTotal: 200,
    });
    parqueaderoId = parqueadero.id;
  });

  afterEach(async () => {
    await module.close();
  });

  it('crea un espacio disponible por defecto', async () => {
    const espacio = await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });

    expect(espacio.estado).toBe(EstadoEspacio.DISPONIBLE);
  });

  it('rechaza crear un espacio en un parqueadero inexistente', async () => {
    await expect(
      service.create({
        parqueaderoId: 999,
        numero: 'A-1',
        tipo: TipoEspacio.CARRO,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza número de espacio repetido dentro del mismo parqueadero', async () => {
    await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });

    await expect(
      service.create({ parqueaderoId, numero: 'A-1', tipo: TipoEspacio.MOTO }),
    ).rejects.toThrow(ConflictException);
  });

  it('filtra por parqueadero y estado en findAll', async () => {
    await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });
    const espacio2 = await service.create({
      parqueaderoId,
      numero: 'A-2',
      tipo: TipoEspacio.MOTO,
    });
    await service.update(espacio2.id, { estado: EstadoEspacio.OCUPADO });

    expect(await service.findAll({ parqueaderoId })).toHaveLength(2);
    expect(
      await service.findAll({ estado: EstadoEspacio.OCUPADO }),
    ).toHaveLength(1);
  });

  it('remove pone el espacio en mantenimiento en vez de borrarlo', async () => {
    const espacio = await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });
    await service.remove(espacio.id);

    expect((await service.findOne(espacio.id)).estado).toBe(
      EstadoEspacio.MANTENIMIENTO,
    );
  });

  it('rechaza update de un espacio reservado (solo ReservasService puede tocarlo)', async () => {
    const espacio = await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });
    // Se fuerza a "reservado" directo por repositorio, como haría ReservasService.
    await espaciosRepository.update(espacio.id, {
      estado: EstadoEspacio.RESERVADO,
    });

    await expect(
      service.update(espacio.id, { tipo: TipoEspacio.MOTO }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza remove (mantenimiento) de un espacio reservado', async () => {
    const espacio = await service.create({
      parqueaderoId,
      numero: 'A-1',
      tipo: TipoEspacio.CARRO,
    });
    await espaciosRepository.update(espacio.id, {
      estado: EstadoEspacio.RESERVADO,
    });

    await expect(service.remove(espacio.id)).rejects.toThrow(
      BadRequestException,
    );
  });
});
