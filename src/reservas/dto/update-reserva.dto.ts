import { IsEnum } from 'class-validator';
import { EstadoReserva } from '../entities/reserva.entity';

export class UpdateReservaDto {
  @IsEnum(EstadoReserva)
  estado!: EstadoReserva;
}
