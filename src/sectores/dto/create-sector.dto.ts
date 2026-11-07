import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateSectorDto {
  @IsInt()
  @Min(1)
  parqueaderoId!: number;

  @IsString()
  @Length(1, 60)
  nombre!: string;

  @IsInt()
  @Min(1)
  @Max(5000)
  capacidad!: number;

  @IsOptional()
  @IsBoolean()
  capacidadEstimada?: boolean;
}
