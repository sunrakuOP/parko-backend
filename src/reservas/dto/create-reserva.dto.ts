import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsString, Matches, Min } from 'class-validator';

export class CreateReservaDto {
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  @IsString()
  @Matches(/^[A-Z0-9]{5,8}$/) // misma validación que CreateVehiculoDto.placa
  vehiculoPlaca!: string;

  @IsInt()
  @Min(1)
  espacioId!: number;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;
}
