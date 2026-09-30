import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EstadoEspacio } from '../entities/espacio.entity';

export class FilterEspacioDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parqueaderoId?: number;

  @IsOptional()
  @IsEnum(EstadoEspacio)
  estado?: EstadoEspacio;
}
