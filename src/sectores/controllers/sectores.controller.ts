import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SectoresService } from '../services/sectores.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { FilterSectorDto } from '../dto/filter-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { AjustarOcupacionDto } from '../dto/ajustar-ocupacion.dto';

@Controller('sectores')
export class SectoresController {
  constructor(private readonly sectoresService: SectoresService) {}

  @Post()
  create(@Body() dto: CreateSectorDto) {
    return this.sectoresService.create(dto);
  }

  // GET /sectores?parqueaderoId=
  @Get()
  findAll(@Query() filter: FilterSectorDto) {
    return this.sectoresService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSectorDto) {
    return this.sectoresService.update(id, dto);
  }

  // PATCH /sectores/:id/ocupacion  { "delta": 1 }  → entra un vehículo
  @Patch(':id/ocupacion')
  ajustarOcupacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarOcupacionDto,
  ) {
    return this.sectoresService.ajustarOcupacion(id, dto.delta);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.sectoresService.remove(id);
    return { mensaje: 'Sector dado de baja', id };
  }
}
