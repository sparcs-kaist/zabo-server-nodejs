require ('@babel/register');
require ('../config/env');
const { Statistic } = require ('../src/db');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await Statistic.deleteMany ({ type: 'GET_ZABO', updatedAt: { $gt: new Date (0) } });
  await Statistic.deleteMany ({ type: 'REGISTER' });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
}

module.exports = { up, down };
