import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { VehiculosService } from '../services/vehiculos.service';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculosService.create(createVehiculoDto);
  }

  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get(':placa')
  findOne(@Param('placa') placa: string) {
    return this.vehiculosService.findOne(placa.toUpperCase());
  }

  @Put(':placa')
  update(
    @Param('placa') placa: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(placa.toUpperCase(), updateVehiculoDto);
  }

  @Delete(':placa')
  async remove(@Param('placa') placa: string) {
    const placaNormalizada = placa.toUpperCase();
    await this.vehiculosService.remove(placaNormalizada);
    return {
      mensaje: 'Vehículo desactivado correctamente',
      placa: placaNormalizada,
    };
  }
}
