const supportedDatabaseTypes = ['sqlite', 'postgres'];

function validateBoolean(value: string, name: string): string {
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${name} debe ser true o false`);
  }
  return value;
}

function validatePort(value: string, name: string): string {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} debe ser un puerto válido`);
  }
  return value;
}

function getRequiredValue(
  environment: Record<string, string | undefined>,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`${name} es obligatorio cuando DB_TYPE=postgres`);
  }
  return value;
}

export function validateEnvironment(
  environment: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const databaseType = environment.DB_TYPE ?? 'sqlite';
  if (!supportedDatabaseTypes.includes(databaseType)) {
    throw new Error(`DB_TYPE no soportado: ${databaseType}`);
  }

  const validatedEnvironment = {
    ...environment,
    PORT: validatePort(environment.PORT ?? '3000', 'PORT'),
    DB_TYPE: databaseType,
    DB_SYNCHRONIZE: validateBoolean(
      environment.DB_SYNCHRONIZE ?? 'true',
      'DB_SYNCHRONIZE',
    ),
    DB_LOGGING: validateBoolean(
      environment.DB_LOGGING ?? 'false',
      'DB_LOGGING',
    ),
  };

  if (databaseType === 'sqlite') {
    return {
      ...validatedEnvironment,
      DB_DATABASE: environment.DB_DATABASE ?? 'data/parko.sqlite',
    };
  }

  return {
    ...validatedEnvironment,
    DB_HOST: getRequiredValue(environment, 'DB_HOST'),
    DB_PORT: validatePort(environment.DB_PORT ?? '5432', 'DB_PORT'),
    DB_USERNAME: getRequiredValue(environment, 'DB_USERNAME'),
    DB_PASSWORD: getRequiredValue(environment, 'DB_PASSWORD'),
    DB_DATABASE: getRequiredValue(environment, 'DB_DATABASE'),
  };
}
