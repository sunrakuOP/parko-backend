import { IsEnum, IsInt, IsString, Length, Min } from 'class-validator';
import { TipoEspacio } from '../entities/espacio.entity';

export class CreateEspacioDto {
  @IsInt()
  @Min(1)
  parqueaderoId!: number;

  @IsString()
  @Length(1, 10)
  numero!: string;

  @IsEnum(TipoEspacio)
  tipo!: TipoEspacio;
}
