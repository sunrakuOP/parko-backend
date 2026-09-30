import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasService } from './services/reservas.service';
import { ReservasController } from './controllers/reservas.controller';
import { Reserva } from './entities/reserva.entity';

// No importa UsersModule/VehiculosModule/EspaciosModule: el service accede
// a esas entidades directamente vía el queryRunner de la transacción
// (autoLoadEntities:true las registra igual en la conexión), mismo patrón
// que OrdersModule en el repo guía.
@Module({
  imports: [TypeOrmModule.forFeature([Reserva])],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
