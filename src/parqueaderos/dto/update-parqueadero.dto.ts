import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateParqueaderoDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  direccion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidadTotal?: number;
}
