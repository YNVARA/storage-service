import pino from 'pino';
import { env } from './env';

export const logger = pino({
    level: env.log.level,
    base: {
        service: env.app.name,
        env: env.app.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport:
        env.app.environment === 'development'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
});
