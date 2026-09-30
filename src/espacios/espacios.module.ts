import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqueaderosModule } from '../parqueaderos/parqueaderos.module';
import { EspaciosService } from './services/espacios.service';
import { EspaciosController } from './controllers/espacios.controller';
import { Espacio } from './entities/espacio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Espacio]), ParqueaderosModule],
  controllers: [EspaciosController],
  providers: [EspaciosService],
  exports: [EspaciosService],
})
export class EspaciosModule {}
