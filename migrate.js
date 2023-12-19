require ('./config/env');

module.exports = {
  dbConnectionUri: process.env.CONNECTION_STRING,
};
