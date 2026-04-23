import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import aiConfig from './ai.config';

export default () => ({
  ...databaseConfig(),
  ...jwtConfig(),
  ...redisConfig(),
  ...aiConfig(),
});
