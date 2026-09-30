import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';
import { Vehiculo } from '../entities/vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,
    private readonly usersService: UsersService,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    await this.usersService.findOne(createVehiculoDto.usuarioId);
    const placa = createVehiculoDto.placa.toUpperCase();
    await this.ensurePlacaIsAvailable(placa);

    const vehiculo = this.vehiculosRepository.create({
      ...createVehiculoDto,
      placa,
      activo: true,
    });
    return this.vehiculosRepository.save(vehiculo);
  }

  findAll(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.findBy({ activo: true });
  }

  async findOne(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculosRepository.findOneBy({
      placa,
      activo: true,
    });
    if (!vehiculo) {
      throw new NotFoundException(`El vehículo con placa ${placa} no existe`);
    }
    return vehiculo;
  }

  async update(
    placa: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(placa);
    Object.assign(vehiculo, updateVehiculoDto);
    return this.vehiculosRepository.save(vehiculo);
  }

  async remove(placa: string): Promise<void> {
    const vehiculo = await this.findOne(placa);
    vehiculo.activo = false;
    await this.vehiculosRepository.save(vehiculo);
  }

  private async ensurePlacaIsAvailable(placa: string): Promise<void> {
    const existing = await this.vehiculosRepository.findOneBy({ placa });
    if (existing) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${placa}`,
      );
    }
  }
}
