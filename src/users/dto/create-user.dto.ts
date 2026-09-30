import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  nombre!: string;

  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @Length(5, 254)
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/) // +? permite prefijo internacional; exige entre 7 y 15 dígitos
  telefono!: string;

  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}
