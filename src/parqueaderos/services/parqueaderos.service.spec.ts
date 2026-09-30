import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteMemoryModule } from '../../test-utils/sqlite-memory.module';
import { ParqueaderosService } from './parqueaderos.service';
import { Parqueadero } from '../entities/parqueadero.entity';

describe('ParqueaderosService', () => {
  let module: TestingModule;
  let service: ParqueaderosService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        sqliteMemoryModule([Parqueadero]),
        TypeOrmModule.forFeature([Parqueadero]),
      ],
      providers: [ParqueaderosService],
    }).compile();

    service = module.get(ParqueaderosService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('crea un parqueadero activo', async () => {
    const parqueadero = await service.create({
      nombre: 'Sede Meléndez',
      direccion: 'Calle 18 # 118-250',
      capacidadTotal: 200,
    });

    expect(parqueadero.id).toBeDefined();
    expect(parqueadero.activo).toBe(true);
  });

  it('lanza NotFoundException si no existe', async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('desactiva un parqueadero y deja de listarse', async () => {
    const parqueadero = await service.create({
      nombre: 'Sede Meléndez',
      direccion: 'Calle 18 # 118-250',
      capacidadTotal: 200,
    });
    await service.remove(parqueadero.id);

    expect(await service.findAll()).toHaveLength(0);
  });
});
