import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  port: 6379, // Redis port
  host: '127.0.0.1', // Redis host
  keyPrefix: 'zabo:',
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

export const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

const NEW_NOTICE = 'NEW_NOTICE';

const resolvers = {
  /*
  notice: {
    subcribe: async (_, __, { pubsub }) => {
      const iterable = pubsub.asyncIterator(NEW_NOTICE);
      return iterable;
    },
  },
  */
};

export default resolvers;
