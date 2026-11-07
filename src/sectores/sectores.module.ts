import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqueaderosModule } from '../parqueaderos/parqueaderos.module';
import { SectoresService } from './services/sectores.service';
import { SectoresController } from './controllers/sectores.controller';
import { Sector } from './entities/sector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sector]), ParqueaderosModule],
  controllers: [SectoresController],
  providers: [SectoresService],
  exports: [SectoresService],
})
export class SectoresModule {}
