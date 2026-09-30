import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ParqueaderosService } from '../services/parqueaderos.service';
import { CreateParqueaderoDto } from '../dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from '../dto/update-parqueadero.dto';

@Controller('parqueaderos')
export class ParqueaderosController {
  constructor(private readonly parqueaderosService: ParqueaderosService) {}

  @Post()
  create(@Body() createParqueaderoDto: CreateParqueaderoDto) {
    return this.parqueaderosService.create(createParqueaderoDto);
  }

  @Get()
  findAll() {
    return this.parqueaderosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parqueaderosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParqueaderoDto: UpdateParqueaderoDto,
  ) {
    return this.parqueaderosService.update(id, updateParqueaderoDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.parqueaderosService.remove(id);
    return { mensaje: 'Parqueadero desactivado correctamente', id };
  }
}
