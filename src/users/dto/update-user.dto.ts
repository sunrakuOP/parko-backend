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

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @Length(5, 254)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  telefono?: string;

  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}
