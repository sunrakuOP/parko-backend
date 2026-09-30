import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EspaciosService } from '../services/espacios.service';
import { CreateEspacioDto } from '../dto/create-espacio.dto';
import { FilterEspacioDto } from '../dto/filter-espacio.dto';
import { UpdateEspacioDto } from '../dto/update-espacio.dto';

@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Post()
  create(@Body() createEspacioDto: CreateEspacioDto) {
    return this.espaciosService.create(createEspacioDto);
  }

  // GET /espacios?parqueaderoId=&estado=
  @Get()
  findAll(@Query() filter: FilterEspacioDto) {
    return this.espaciosService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.espaciosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEspacioDto: UpdateEspacioDto,
  ) {
    return this.espaciosService.update(id, updateEspacioDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.espaciosService.remove(id);
    return { mensaje: 'Espacio puesto en mantenimiento', id };
  }
}
