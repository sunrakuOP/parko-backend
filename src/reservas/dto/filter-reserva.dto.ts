import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EstadoReserva } from '../entities/reserva.entity';

export class FilterReservaDto {
  @IsOptional()
  @IsEnum(EstadoReserva)
  estado?: EstadoReserva;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  espacioId?: number;
}
