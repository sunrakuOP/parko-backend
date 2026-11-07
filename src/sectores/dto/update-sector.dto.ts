import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { EstadoFila } from '../entities/sector.entity';

export class UpdateSectorDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  capacidad?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ocupados?: number;

  @IsOptional()
  @IsEnum(EstadoFila)
  fila?: EstadoFila;

  @IsOptional()
  @IsBoolean()
  capacidadEstimada?: boolean;
}
