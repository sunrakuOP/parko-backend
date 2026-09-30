import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, Matches, Min } from 'class-validator';
import { TipoVehiculo } from '../entities/vehiculo.entity';

export class CreateVehiculoDto {
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  @IsString()
  @Matches(/^[A-Z0-9]{5,8}$/) // acepta placas de carro (ABC123) y moto (ABC12D) sin guiones
  placa!: string;

  @IsString()
  marca!: string;

  @IsString()
  modelo!: string;

  @IsEnum(TipoVehiculo)
  tipo!: TipoVehiculo;

  @IsInt()
  @Min(1)
  usuarioId!: number;
}
