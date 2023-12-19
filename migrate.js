require ('./config/env');

module.exports = {
  dbConnectionUri: process.env.MONGODB_URL,
};
