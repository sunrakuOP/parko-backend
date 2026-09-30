import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Espacio, EstadoEspacio } from '../../espacios/entities/espacio.entity';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { FilterReservaDto } from '../dto/filter-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { EstadoReserva, Reserva } from '../entities/reserva.entity';

// Transiciones válidas de estado — evita, por ejemplo, "revivir" una reserva
// cancelada o completar una que nunca se confirmó.
const TRANSICIONES_VALIDAS: Record<EstadoReserva, EstadoReserva[]> = {
  [EstadoReserva.PENDIENTE]: [
    EstadoReserva.CONFIRMADA,
    EstadoReserva.CANCELADA,
  ],
  [EstadoReserva.CONFIRMADA]: [
    EstadoReserva.COMPLETADA,
    EstadoReserva.CANCELADA,
  ],
  [EstadoReserva.CANCELADA]: [],
  [EstadoReserva.COMPLETADA]: [],
};

const RELACIONES = ['usuario', 'vehiculo', 'espacio'];

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    private readonly dataSource: DataSource,
  ) {}

  // Crear reserva con transacción: valida usuario/vehículo/espacio y
  // marca el espacio como reservado de forma atómica (mismo patrón que
  // OrdersService.create del repo guía).
  async create(createReservaDto: CreateReservaDto): Promise<Reserva> {
    const { usuarioId, espacioId, fechaInicio, fechaFin } = createReservaDto;
    const placa = createReservaDto.vehiculoPlaca.toUpperCase();

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      throw new BadRequestException(
        'fechaFin debe ser posterior a fechaInicio',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const usuario = await queryRunner.manager.findOneBy(User, {
        id: usuarioId,
        activo: true,
      });
      if (!usuario) {
        throw new NotFoundException(`El usuario con id ${usuarioId} no existe`);
      }

      const vehiculo = await queryRunner.manager.findOneBy(Vehiculo, {
        placa,
        activo: true,
      });
      if (!vehiculo) {
        throw new NotFoundException(`El vehículo con placa ${placa} no existe`);
      }
      if (vehiculo.usuarioId !== usuarioId) {
        throw new BadRequestException(
          'El vehículo no pertenece al usuario indicado',
        );
      }

      const espacio = await queryRunner.manager.findOneBy(Espacio, {
        id: espacioId,
      });
      if (!espacio) {
        throw new NotFoundException(`El espacio con id ${espacioId} no existe`);
      }
      if (espacio.estado !== EstadoEspacio.DISPONIBLE) {
        throw new BadRequestException(
          `El espacio ${espacioId} no está disponible`,
        );
      }

      espacio.estado = EstadoEspacio.RESERVADO;
      await queryRunner.manager.save(Espacio, espacio);

      const reserva = queryRunner.manager.create(Reserva, {
        usuarioId,
        vehiculoPlaca: vehiculo.placa,
        espacioId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado: EstadoReserva.PENDIENTE,
      });
      const savedReserva = await queryRunner.manager.save(Reserva, reserva);

      await queryRunner.commitTransaction();
      return savedReserva;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Filtros solo con Repository + FindOptionsWhere, mismo patrón que
  // ProductsService del repo guía (sin QueryBuilder).
  findAll(filtros: FilterReservaDto = {}): Promise<Reserva[]> {
    const where: FindOptionsWhere<Reserva> = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;
    if (filtros.espacioId) where.espacioId = filtros.espacioId;

    return this.reservasRepository.find({
      where,
      relations: RELACIONES,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!reserva) {
      throw new NotFoundException(`La reserva con id ${id} no existe`);
    }
    return reserva;
  }

  update(id: number, updateReservaDto: UpdateReservaDto): Promise<Reserva> {
    return this.applyEstadoChange(id, updateReservaDto.estado);
  }

  async remove(id: number): Promise<void> {
    await this.applyEstadoChange(id, EstadoReserva.CANCELADA);
  }

  // Cambia el estado validando la transición y, solo si el espacio seguía
  // reservado por ESTA reserva, lo libera — también transaccional por tocar
  // dos tablas.
  private async applyEstadoChange(
    id: number,
    nuevoEstado: EstadoReserva,
  ): Promise<Reserva> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reserva = await queryRunner.manager.findOneBy(Reserva, { id });
      if (!reserva) {
        throw new NotFoundException(`La reserva con id ${id} no existe`);
      }

      const transicionesPermitidas = TRANSICIONES_VALIDAS[reserva.estado];
      if (!transicionesPermitidas.includes(nuevoEstado)) {
        throw new BadRequestException(
          `No se puede pasar la reserva de "${reserva.estado}" a "${nuevoEstado}"`,
        );
      }

      const estadosFinales = [
        EstadoReserva.CANCELADA,
        EstadoReserva.COMPLETADA,
      ];
      const liberaEspacio = estadosFinales.includes(nuevoEstado);

      reserva.estado = nuevoEstado;
      await queryRunner.manager.save(Reserva, reserva);

      if (liberaEspacio) {
        const espacio = await queryRunner.manager.findOneBy(Espacio, {
          id: reserva.espacioId,
        });
        // Solo se libera si seguía "reservado": si un operador ya lo puso en
        // mantenimiento no queremos que cancelar la reserva lo reactive.
        if (espacio && espacio.estado === EstadoEspacio.RESERVADO) {
          espacio.estado = EstadoEspacio.DISPONIBLE;
          await queryRunner.manager.save(Espacio, espacio);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Fuera de la transacción (ya confirmada): recarga con relaciones para
    // devolver la reserva completa, igual que el resto de los "findOne".
    return this.findOne(id);
  }
}
