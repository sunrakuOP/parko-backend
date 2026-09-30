# Parko Backend

Backend del proyecto de "Gestión de Parqueaderos" para la clase de Plataformas Computacionales
(Pontificia Universidad Javeriana Cali). Construido con NestJS + TypeORM, siguiendo la convención
del repo guía del profesor: [`backend-nestjs-seed`](https://github.com/cdtello/backend-nestjs-seed)
(rama `main`, consolidada — relaciones, transacción en `orders` y filtros solo con `Repository`).

**Diagrama de base de datos:** [`docs/diagrama-bd.drawio`](./docs/diagrama-bd.drawio) — abrir en
<https://app.diagrams.net> o en VS Code con la extensión Draw.io.

**Colección Postman:** [`postman/parko-backend.postman_collection.json`](./postman/parko-backend.postman_collection.json).

**Desplegado en AWS EC2:** <http://18.119.140.37:3000> — ver
[Despliegue en AWS EC2](#despliegue-en-aws-ec2).

## Estado actual (2026-09-29)

Base de datos conectada (TypeORM + SQLite por defecto, Postgres opcional vía `.env`). Los 5
recursos persisten de verdad, con relaciones reales (`@ManyToOne`) y la creación/cancelación de
reservas corre dentro de una **transacción** (mismo patrón que `OrdersService.create()` del repo
guía), para que "validar espacio disponible + marcarlo como reservado" sea atómico y no se pisen
dos reservas concurrentes sobre el mismo espacio.

Qué se arregló de la primera entrega (2026-09-20):

- `users.service.ts` tenía un método (`updateUser`) definido fuera de la clase — el proyecto no
  compilaba. Corregido.
- Estructura reorganizada al patrón del repo guía: `controllers/`, `services/`, `dto/`,
  `entities/` por recurso.
- DTOs validados con `class-validator` + `ValidationPipe` global (`whitelist`,
  `forbidNonWhitelisted`, `transform`).

Qué se agregó el 2026-09-21, después de que el profesor publicó `backend-nestjs-seed` con la
parte de base de datos ya resuelta:

- **TypeORM + SQLite** conectado (`src/config/env.validation.ts` + `app.module.ts`, calcados del
  repo guía). Por defecto crea `data/parko.sqlite` (no se versiona).
- Entidades reales con relaciones (`@ManyToOne`/`@JoinColumn`, `onDelete: CASCADE`/`RESTRICT`).
- `ReservasService.create()` y el cambio de estado (cancelar/completar) corren en una transacción
  con `DataSource.createQueryRunner()` — igual que `OrdersService` en el repo guía.
- Tests de service reescritos para usar una base **SQLite en memoria real** (`:memory:`) en vez de
  instanciar los services a mano — prueban el comportamiento real de TypeORM, no un mock.
- `docs/diagrama-bd.drawio`: diagrama ER de nuestro dominio, mismo formato que el del profesor.

Qué se corrigió y alineó el 2026-09-29, tras revisar el proyecto contra el repo guía actualizado
(el profesor refactorizó filtros y quitó `QueryBuilder`/`QueryRunner` el 28-sep):

- **Bug de datos:** al cancelar o completar una reserva, el espacio pasaba a `disponible` sin
  importar su estado real. Si un operador ya lo había puesto en `mantenimiento`, cancelar la
  reserva lo "revivía" a disponible. Ahora solo se libera si seguía en `reservado`.
- **Bug de negocio:** no existían reglas de transición de estado en `reservas` — se podía pasar
  de `cancelada` de vuelta a `confirmada`, o completar una reserva que nunca se confirmó.
  Transiciones válidas ahora: `pendiente → confirmada | cancelada`,
  `confirmada → completada | cancelada`; cualquier otra combinación devuelve `400`.
- **Bug de datos:** `PUT /espacios/:id` permitía forzar `estado: reservado` a mano, o modificar un
  espacio que ya estaba reservado por otra reserva activa, desincronizando el flujo. Ahora `PUT`
  y `DELETE` rechazan tocar un espacio en `reservado` (400) y el DTO ya no acepta `reservado` como
  valor manual — ese estado solo lo asigna `ReservasService`.
- **Bug de validación:** `GET /espacios?estado=` no validaba el valor (`?estado=xyz` pasaba sin
  error) y `?parqueaderoId=abc` se ignoraba en silencio. Ahora hay un DTO validado
  (`FilterEspacioDto`), igual que en `espacios`.
- **Alineación con el profe:** los filtros de `espacios` pasaron de `QueryBuilder` a
  `Repository.find({ where: FindOptionsWhere, ... })`, el mismo patrón que usa
  `ProductsService` en el repo guía tras su refactor del 28-sep. La transacción de `reservas` se
  mantuvo (a diferencia de `orders`, que el profesor simplificó a solo-Repository) porque acá sí
  hay una condición de carrera real que evitar: dos reservas simultáneas sobre el mismo espacio.
- **Nuevo:** filtro `GET /reservas?estado=&usuarioId=&espacioId=` (`FilterReservaDto`), y
  `findAll`/`findOne` ahora cargan las relaciones (`usuario`, `vehiculo`, `espacio`).
- **Nuevo:** `app.enableCors()` en `main.ts`, igual al commit del profesor, para poder probar la
  API desde una página HTML suelta (`file://`) sin que el navegador la bloquee por CORS.
- Se resolvieron 11 vulnerabilidades de `npm audit` (una crítica) subiendo `sqlite3` a `6.0.1`;
  quedan en 0.
- 6 tests nuevos cubriendo lo anterior (34 en total).

Nota de convención: **los nombres de campo se mantienen en español** (`nombre`, `telefono`,
`activo`) a diferencia del repo guía (que usa `name`, `phone`, `isActive`) — fue una decisión
explícita del equipo, no un descuido.

## Dominio y reglas de negocio

| Recurso | Tabla / PK | Reglas clave |
| --- | --- | --- |
| `users` | `usuarios` / `id` autoincremental | email único; roles `admin`, `operador`, `conductor` (default `conductor`); baja lógica (`activo`) |
| `vehiculos` | `vehiculos` / `placa` (natural, se normaliza a mayúsculas) | placa única; `usuarioId` debe existir (`CASCADE` si se borra el usuario); baja lógica |
| `parqueaderos` | `parqueaderos` / `id` autoincremental | datos básicos (nombre, dirección, capacidad); baja lógica |
| `espacios` | `espacios` / `id` autoincremental | número único por parqueadero; `parqueaderoId` (`CASCADE`); estado `disponible`/`ocupado`/`reservado`/`mantenimiento`; filtro por `parqueaderoId`/`estado` vía `Repository`+`FindOptionsWhere`; `reservado` solo lo asigna `ReservasService` (PUT/DELETE lo rechazan) |
| `reservas` | `reservas` / `id` autoincremental | **transacción**: valida usuario, vehículo (que sea del usuario) y espacio (`RESTRICT` si se intenta borrar uno con reservas); el espacio debe estar `disponible`; al crear pasa a `reservado`; transiciones válidas `pendiente→confirmada\|cancelada`, `confirmada→completada\|cancelada`; al cancelar/completar libera el espacio solo si seguía `reservado`; filtro por `estado`/`usuarioId`/`espacioId` |

## Endpoints

Todos los recursos exponen el mismo patrón CRUD (`POST /`, `GET /`, `GET /:id`, `PUT /:id`,
`DELETE /:id`, donde `DELETE` es baja lógica, no borrado físico):

```
POST   /users            { nombre, email, telefono, rol? }
GET    /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id

POST   /vehiculos        { placa, marca, modelo, tipo, usuarioId }
GET    /vehiculos
GET    /vehiculos/:placa
PUT    /vehiculos/:placa { marca?, modelo?, tipo? }
DELETE /vehiculos/:placa

POST   /parqueaderos     { nombre, direccion, capacidadTotal }
GET    /parqueaderos
GET    /parqueaderos/:id
PUT    /parqueaderos/:id
DELETE /parqueaderos/:id

POST   /espacios         { parqueaderoId, numero, tipo }
GET    /espacios?parqueaderoId=&estado=
GET    /espacios/:id
PUT    /espacios/:id     { tipo?, estado? }   (estado: disponible|ocupado|mantenimiento — no "reservado")
DELETE /espacios/:id     (pasa el espacio a "mantenimiento"; 400 si está reservado)

POST   /reservas         { usuarioId, vehiculoPlaca, espacioId, fechaInicio, fechaFin }
GET    /reservas?estado=&usuarioId=&espacioId=
GET    /reservas/:id
PUT    /reservas/:id     { estado }  (pendiente→confirmada|cancelada · confirmada→completada|cancelada)
DELETE /reservas/:id     (cancela la reserva; libera el espacio si seguía reservado)
```

Ejemplo de flujo completo (usuario → vehículo → parqueadero → espacio → reserva):

```bash
curl -X POST localhost:3000/users -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos Tello","email":"carlos@ejemplo.com","telefono":"+573101234567"}'

curl -X POST localhost:3000/vehiculos -H "Content-Type: application/json" \
  -d '{"placa":"abc123","marca":"Mazda","modelo":"3","tipo":"carro","usuarioId":1}'

curl -X POST localhost:3000/parqueaderos -H "Content-Type: application/json" \
  -d '{"nombre":"Sede Meléndez","direccion":"Calle 18 # 118-250","capacidadTotal":200}'

curl -X POST localhost:3000/espacios -H "Content-Type: application/json" \
  -d '{"parqueaderoId":1,"numero":"A-1","tipo":"carro"}'

curl -X POST localhost:3000/reservas -H "Content-Type: application/json" \
  -d '{"usuarioId":1,"vehiculoPlaca":"ABC123","espacioId":1,"fechaInicio":"2026-09-22T08:00:00.000Z","fechaFin":"2026-09-22T12:00:00.000Z"}'

# Disponibilidad de un parqueadero
curl "localhost:3000/espacios?parqueaderoId=1&estado=disponible"

# Confirmar y luego completar (no se puede saltar directo a "completada")
curl -X PUT localhost:3000/reservas/1 -H "Content-Type: application/json" -d '{"estado":"confirmada"}'
curl -X PUT localhost:3000/reservas/1 -H "Content-Type: application/json" -d '{"estado":"completada"}'

# Filtrar reservas
curl "localhost:3000/reservas?estado=pendiente&usuarioId=1"
```

## Inicio local

```bash
npm install
cp .env.example .env
npm run start:dev
```

Por defecto usa SQLite y crea `data/parko.sqlite` (se ignora en git). La API queda disponible en
<http://localhost:3000>.

## Configuración de base de datos

Se lee desde `.env` (no se versiona; `.env.example` es la referencia):

```dotenv
DB_TYPE=sqlite
DB_DATABASE=data/parko.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

`DB_SYNCHRONIZE=true` es conveniente en desarrollo (crea/actualiza las tablas solo). Antes de
producción debe pasar a `false` y manejarse con migraciones. Para Postgres, ver las variables
comentadas en `.env.example`.

## Verificación

```bash
npm run lint
npm run build
npm test        # 34 pruebas unitarias (services con SQLite en memoria + controllers)
npm run test:e2e
```

## Colección Postman

Importar [`postman/parko-backend.postman_collection.json`](./postman/parko-backend.postman_collection.json)
en Postman. Carpetas: **Users**, **Vehículos**, **Parqueaderos**, **Espacios** (con filtros),
**Reservas** (con filtros y transiciones de estado). Variable `baseUrl` ya apunta a
`http://18.119.140.37:3000` (el despliegue en EC2); cambiarla a `http://localhost:3000` para
probar en local.

## Despliegue en AWS EC2

Instancia `parko-backend` (`i-05e4738122b00f623`), **Amazon Linux 2023**, `t3.micro` (Free Tier),
región `us-east-2` (Ohio). Security group `parko-sg`: SSH (22) solo desde la IP del equipo +
el rango de EC2 Instance Connect (`3.16.146.0/29`, para poder conectar desde la consola sin
`.pem`); puerto `3000` abierto a `0.0.0.0/0` para la demo.

**Node 22 vía `nvm`** (no `dnf`/NodeSource): así el usuario `ec2-user` no necesita permisos de
root para instalar ni actualizar Node. El repo se bajó como tarball de GitHub
(`.../archive/refs/heads/main.tar.gz`) en vez de `git clone`, porque `git` tampoco viene
preinstalado en la AMI. Servido con **PM2** (`pm2 start dist/main.js --name parko-backend` +
`pm2 save` + `pm2 startup systemd`) para que siga corriendo tras un reinicio. Base de datos:
**SQLite** dentro de la propia instancia (`DB_SYNCHRONIZE=true`, ya que no hay migraciones
todavía).

**Gotcha real que apareció en el despliegue:** el binario precompilado de `sqlite3` (npm) exige
una `glibc` más nueva (`2.38`) que la que trae Amazon Linux 2023 — el backend arrancaba con
`DriverPackageNotInstalledError`. Se resolvió instalando `gcc-c++ make python3` y recompilando
con `npm rebuild sqlite3 --build-from-source`. Si se vuelve a desplegar desde cero, ese paso hay
que repetirlo (no lo resuelve un `npm ci` normal).

```bash
curl http://18.119.140.37:3000/parqueaderos
```

**Nota de seguridad:** el puerto 3000 queda expuesto al mundo y la API no tiene autenticación —
aceptable para una demo de clase, no para producción real. La instancia se apaga después de la
calificación.

## Próximos pasos

1. **Figma**: todavía no hay acceso al archivo PARKO. Falta contrastar el dominio (campos,
   pantallas, flujos) con lo que el equipo diseñó ahí y ajustar entidades/DTOs si hace falta.
2. **Autenticación/roles**: hoy `rol` existe en `User` pero no hay login ni guards — evaluar si
   la próxima entrega necesita JWT y `@UseGuards` para diferenciar admin/operador/conductor.
3. **Migraciones**: antes de producción, pasar de `DB_SYNCHRONIZE=true` a migraciones reales.
4. **Enunciado formal**: no hubo rúbrica escrita para esta entrega; validar con el profesor que
   el dominio elegido (parqueaderos, espacios, vehículos, reservas) cubre lo pedido.
5. **Registro de ingreso/salida real:** hoy el estado del espacio es "global" (no maneja franjas
   horarias) — la ocupación real (hora de entrada/salida por placa) frente a lo reservado es el
   dato que más valor agregaría en la próxima entrega.
