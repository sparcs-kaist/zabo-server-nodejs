import { GraphQLServer } from 'graphql-yoga';
import resolvers, { pubsub } from './graphql/resolvers';
import { logger } from './utils/logger';

const server = new GraphQLServer({
  typeDefs: './src/graphql/schema.graphql',
  resolvers,
  context: { pubsub },
});

server.start({
  port: 6002,
  endpoint: '/api/graphql',
  playground: '/api/graphql',
}, () => {
  const boldBlue = text => `\u001b[1m\u001b[34m${text}\u001b[39m\u001b[22m`;
  logger.info(`Graphql Server is running at ${boldBlue(`http://localhost:${6002}/`)}`);
});
