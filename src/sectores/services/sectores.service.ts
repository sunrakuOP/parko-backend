import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ParqueaderosService } from '../../parqueaderos/services/parqueaderos.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { FilterSectorDto } from '../dto/filter-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { EstadoFila, Sector } from '../entities/sector.entity';

@Injectable()
export class SectoresService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectoresRepository: Repository<Sector>,
    private readonly parqueaderosService: ParqueaderosService,
  ) {}

  async create(dto: CreateSectorDto): Promise<Sector> {
    await this.parqueaderosService.findOne(dto.parqueaderoId);
    await this.ensureNombreIsAvailable(dto.parqueaderoId, dto.nombre);

    const sector = this.sectoresRepository.create({
      ...dto,
      ocupados: 0,
      fila: EstadoFila.SIN_FILA,
    });
    return this.sectoresRepository.save(sector);
  }

  findAll(filtros: FilterSectorDto = {}): Promise<Sector[]> {
    const where: FindOptionsWhere<Sector> = {};
    if (filtros.parqueaderoId) where.parqueaderoId = filtros.parqueaderoId;
    return this.sectoresRepository.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectoresRepository.findOneBy({ id });
    if (!sector) {
      throw new NotFoundException(`El sector con id ${id} no existe`);
    }
    return sector;
  }

  async update(id: number, dto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id);
    if (dto.nombre && dto.nombre !== sector.nombre) {
      await this.ensureNombreIsAvailable(sector.parqueaderoId, dto.nombre);
    }

    const capacidad = dto.capacidad ?? sector.capacidad;
    const ocupados = dto.ocupados ?? sector.ocupados;
    if (ocupados > capacidad) {
      throw new BadRequestException(
        `Los ocupados (${ocupados}) no pueden superar la capacidad (${capacidad})`,
      );
    }

    Object.assign(sector, dto);
    return this.sectoresRepository.save(sector);
  }

  // Suma o resta a los ocupados en UNA sola sentencia con la condición dentro:
  // si dos porteros marcan a la vez, ninguno puede pasarse de [0, capacidad]
  // (un "leer, sumar, guardar" en dos pasos sí lo permitiría).
  async ajustarOcupacion(id: number, delta: number): Promise<Sector> {
    const result = await this.sectoresRepository
      .createQueryBuilder()
      .update(Sector)
      .set({ ocupados: () => 'ocupados + :delta' })
      .where(
        'id = :id AND activo = :activo AND ocupados + :delta >= 0 AND ocupados + :delta <= capacidad',
        { id, activo: true, delta },
      )
      .execute();

    if (result.affected === 0) {
      const sector = await this.findOne(id); // 404 si no existe
      if (!sector.activo) {
        throw new BadRequestException(`El sector ${id} está dado de baja`);
      }
      throw new BadRequestException(
        delta > 0
          ? `El sector "${sector.nombre}" no tiene cupos para ${delta} vehículo(s) más`
          : `El sector "${sector.nombre}" no tiene ${Math.abs(delta)} vehículo(s) para sacar`,
      );
    }
    return this.findOne(id);
  }

  // Baja lógica, igual que users/vehiculos/parqueaderos.
  async remove(id: number): Promise<void> {
    const sector = await this.findOne(id);
    sector.activo = false;
    await this.sectoresRepository.save(sector);
  }

  private async ensureNombreIsAvailable(
    parqueaderoId: number,
    nombre: string,
  ): Promise<void> {
    const existing = await this.sectoresRepository.findOneBy({
      parqueaderoId,
      nombre,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe el sector "${nombre}" en el parqueadero ${parqueaderoId}`,
      );
    }
  }
}
