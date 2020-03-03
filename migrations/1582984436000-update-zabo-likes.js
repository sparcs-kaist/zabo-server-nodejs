require ('@babel/register');
require ('../config/env');
const { Zabo } = require ('../src/db');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  // eslint-disable-next-line no-restricted-syntax
  for await (const zabo of Zabo.find ({ $where: 'this.likes.length > 0' })) {
    zabo.likesWithTime = zabo.likes.map (like => ({ user: like }));
    zabo.likes = [];
    await zabo.save ();
  }
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
  throw new Error ('No Down Operation');
}

module.exports = { up, down };
