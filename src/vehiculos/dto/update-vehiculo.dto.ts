import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoVehiculo } from '../entities/vehiculo.entity';

export class UpdateVehiculoDto {
  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsEnum(TipoVehiculo)
  tipo?: TipoVehiculo;
}
