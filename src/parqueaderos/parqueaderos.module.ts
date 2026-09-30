import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqueaderosService } from './services/parqueaderos.service';
import { ParqueaderosController } from './controllers/parqueaderos.controller';
import { Parqueadero } from './entities/parqueadero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parqueadero])],
  controllers: [ParqueaderosController],
  providers: [ParqueaderosService],
  exports: [ParqueaderosService],
})
export class ParqueaderosModule {}
