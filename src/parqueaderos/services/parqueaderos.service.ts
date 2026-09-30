import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParqueaderoDto } from '../dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from '../dto/update-parqueadero.dto';
import { Parqueadero } from '../entities/parqueadero.entity';

@Injectable()
export class ParqueaderosService {
  constructor(
    @InjectRepository(Parqueadero)
    private readonly parqueaderosRepository: Repository<Parqueadero>,
  ) {}

  create(createParqueaderoDto: CreateParqueaderoDto): Promise<Parqueadero> {
    const parqueadero = this.parqueaderosRepository.create({
      ...createParqueaderoDto,
      activo: true,
    });
    return this.parqueaderosRepository.save(parqueadero);
  }

  findAll(): Promise<Parqueadero[]> {
    return this.parqueaderosRepository.findBy({ activo: true });
  }

  async findOne(id: number): Promise<Parqueadero> {
    const parqueadero = await this.parqueaderosRepository.findOneBy({
      id,
      activo: true,
    });
    if (!parqueadero) {
      throw new NotFoundException(`El parqueadero con id ${id} no existe`);
    }
    return parqueadero;
  }

  async update(
    id: number,
    updateParqueaderoDto: UpdateParqueaderoDto,
  ): Promise<Parqueadero> {
    const parqueadero = await this.findOne(id);
    Object.assign(parqueadero, updateParqueaderoDto);
    return this.parqueaderosRepository.save(parqueadero);
  }

  async remove(id: number): Promise<void> {
    const parqueadero = await this.findOne(id);
    parqueadero.activo = false;
    await this.parqueaderosRepository.save(parqueadero);
  }
}
