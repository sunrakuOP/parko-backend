import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { EstadoEspacio, TipoEspacio } from '../entities/espacio.entity';

// "reservado" queda fuera a propósito: solo lo asigna ReservasService al
// crear una reserva. Ponerlo a mano por PUT desincronizaría el estado real.
const ESTADOS_ASIGNABLES_MANUALMENTE = [
  EstadoEspacio.DISPONIBLE,
  EstadoEspacio.OCUPADO,
  EstadoEspacio.MANTENIMIENTO,
] as const;

export class UpdateEspacioDto {
  @IsOptional()
  @IsEnum(TipoEspacio)
  tipo?: TipoEspacio;

  @IsOptional()
  @IsIn(ESTADOS_ASIGNABLES_MANUALMENTE)
  estado?: EstadoEspacio;
}
