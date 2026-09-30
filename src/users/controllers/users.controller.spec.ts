import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { create: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega la creación en el service', async () => {
    const dto = {
      nombre: 'Carlos',
      email: 'carlos@ejemplo.com',
      telefono: '+573101234567',
    };

    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delega la baja lógica y responde con confirmación', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      mensaje: 'Usuario desactivado correctamente',
      id: 1,
    });
  });
});
