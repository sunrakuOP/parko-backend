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
import { ReservasService } from '../services/reservas.service';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { FilterReservaDto } from '../dto/filter-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  // GET /reservas?estado=&usuarioId=&espacioId=
  @Get()
  findAll(@Query() filter: FilterReservaDto) {
    return this.reservasService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservaDto: UpdateReservaDto,
  ) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.reservasService.remove(id);
    return { mensaje: 'Reserva cancelada correctamente', id };
  }
}
