import { Environment } from '../common/enums';

const databaseConfig = {
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  entities: [__dirname + '/../modules/*/entities/*.entity{.ts,.js}'],
  migrationsTableName: 'user_migration_table',
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: __dirname + '/../migrations',
  },
  synchronize: false,
};

if (
  process.env.NODE_ENV === Environment.PRODUCTION ||
  process.env.NODE_ENV === Environment.DEVELOP
) {
  databaseConfig['ssl'] = {
    rejectUnauthorized: false,
  };
}

export default databaseConfig;
