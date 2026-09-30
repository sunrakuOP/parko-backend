import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

// Base SQLite en memoria para tests de services con TypeORM real
// (sin mockear Repository) — se destruye sola al cerrar el TestingModule.
export function sqliteMemoryModule(entities: EntityClassOrSchema[]) {
  return TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    entities,
    synchronize: true,
    dropSchema: true,
  });
}
