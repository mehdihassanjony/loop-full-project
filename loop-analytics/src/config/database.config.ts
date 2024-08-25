import * as path from 'path';

export default {
  default: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [path.resolve('dist/modules/**/*.entity{.ts,.js}')],
    synchronize: false,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
  mb: {
    type: process.env.MB_DB_TYPE,
    host: process.env.MB_DB_HOST,
    port: process.env.MB_DB_PORT,
    username: process.env.MB_DB_USERNAME,
    password: process.env.MB_DB_PASSWORD,
    database: process.env.MB_DB_NAME,
    entities: [path.resolve('dist/modules/**/*.entity{.ts,.js}')],
    synchronize: false,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
