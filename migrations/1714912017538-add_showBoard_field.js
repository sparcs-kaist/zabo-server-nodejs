require ('@babel/register');
require ('../config/env');

const {Zabo} = require('../src/db');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  // eslint-disable-next-line no-restricted-syntax
  for await (const zabo of Zabo.find()) {
    zabo.showBoard = false;
    await zabo.save ();
  }
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
}

module.exports = { up, down };
