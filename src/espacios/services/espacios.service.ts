import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ParqueaderosService } from '../../parqueaderos/services/parqueaderos.service';
import { CreateEspacioDto } from '../dto/create-espacio.dto';
import { FilterEspacioDto } from '../dto/filter-espacio.dto';
import { UpdateEspacioDto } from '../dto/update-espacio.dto';
import { Espacio, EstadoEspacio } from '../entities/espacio.entity';

@Injectable()
export class EspaciosService {
  constructor(
    @InjectRepository(Espacio)
    private readonly espaciosRepository: Repository<Espacio>,
    private readonly parqueaderosService: ParqueaderosService,
  ) {}

  async create(createEspacioDto: CreateEspacioDto): Promise<Espacio> {
    await this.parqueaderosService.findOne(createEspacioDto.parqueaderoId);
    await this.ensureNumeroIsAvailable(
      createEspacioDto.parqueaderoId,
      createEspacioDto.numero,
    );

    const espacio = this.espaciosRepository.create({
      ...createEspacioDto,
      estado: EstadoEspacio.DISPONIBLE,
    });
    return this.espaciosRepository.save(espacio);
  }

  // Filtros solo con Repository + FindOptionsWhere (mismo patrón que
  // ProductsService del repo guía, sin QueryBuilder).
  findAll(filtros: FilterEspacioDto = {}): Promise<Espacio[]> {
    const where: FindOptionsWhere<Espacio> = {};
    if (filtros.parqueaderoId) where.parqueaderoId = filtros.parqueaderoId;
    if (filtros.estado) where.estado = filtros.estado;

    return this.espaciosRepository.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Espacio> {
    const espacio = await this.espaciosRepository.findOneBy({ id });
    if (!espacio) {
      throw new NotFoundException(`El espacio con id ${id} no existe`);
    }
    return espacio;
  }

  async update(
    id: number,
    updateEspacioDto: UpdateEspacioDto,
  ): Promise<Espacio> {
    const espacio = await this.findOne(id);
    // Un espacio "reservado" solo lo libera ReservasService (al cancelar o
    // completar la reserva) — un PUT manual mientras está reservado
    // desincronizaría el estado real de la reserva activa.
    if (espacio.estado === EstadoEspacio.RESERVADO) {
      throw new BadRequestException(
        `El espacio ${id} está reservado; no se puede modificar manualmente`,
      );
    }
    Object.assign(espacio, updateEspacioDto);
    return this.espaciosRepository.save(espacio);
  }

  async remove(id: number): Promise<void> {
    const espacio = await this.findOne(id);
    if (espacio.estado === EstadoEspacio.RESERVADO) {
      throw new BadRequestException(
        `El espacio ${id} está reservado; cancelá la reserva antes de ponerlo en mantenimiento`,
      );
    }
    espacio.estado = EstadoEspacio.MANTENIMIENTO;
    await this.espaciosRepository.save(espacio);
  }

  private async ensureNumeroIsAvailable(
    parqueaderoId: number,
    numero: string,
  ): Promise<void> {
    const existing = await this.espaciosRepository.findOneBy({
      parqueaderoId,
      numero,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe el espacio ${numero} en el parqueadero ${parqueaderoId}`,
      );
    }
  }
}
