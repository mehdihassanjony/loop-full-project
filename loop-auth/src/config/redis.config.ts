const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  db: parseInt(process.env.REDIS_DB),
  auth_pass: process.env.REDIS_PASSWORD,
};

export default redisConfig;
