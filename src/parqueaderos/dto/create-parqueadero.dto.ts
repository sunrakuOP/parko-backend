import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateParqueaderoDto {
  @IsString()
  @Length(2, 100)
  nombre!: string;

  @IsString()
  @Length(5, 200)
  direccion!: string;

  @IsInt()
  @Min(1)
  capacidadTotal!: number;
}
