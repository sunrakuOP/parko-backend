import { IsInt, Max, Min, NotEquals } from 'class-validator';

// +1 = entra un vehículo, -1 = sale uno. Se permite un delta mayor para
// corregir el conteo en bloque (ej. -20 al cierre del turno).
export class AjustarOcupacionDto {
  @IsInt()
  @Min(-500)
  @Max(500)
  @NotEquals(0)
  delta!: number;
}
