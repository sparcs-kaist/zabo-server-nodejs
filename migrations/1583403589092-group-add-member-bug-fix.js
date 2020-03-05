require ('@babel/register');
require ('../config/env');
const { AdminUser, Group, User } = require ('../src/db');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  const adminUsers = await AdminUser.find ();
  const groupsByAdmin = await Promise.all (
    adminUsers.map (({ actionHistory }) => {
      const groupIds = actionHistory
        .filter (history => history.name === 'acceptGroup')
        .map (history => history.target);
      return Promise.all (groupIds.map (groupId => Group.findById (groupId)));
    }),
  );
  groupsByAdmin.filter (x => x.length);
  const groups = groupsByAdmin.reduce ((acc, cur) => ([...acc, ...cur]), []);
  console.log (groups.map (group => group.name));
  const memberIds = groups.map (group => group.members[0].user);
  const members = await Promise.all (
    memberIds.map (memberId => User.findById (memberId)),
  );
  console.log (members.map (member => member.username));
  await Promise.all (members.map ((member, idx) => {
    if (member.groups.some (groupId => groups[idx]._id.equals (groupId))) {
      return member.save ();
    }
    member.groups.push (groups[idx]._id);
    return member.save ();
  }));
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
}

module.exports = { up, down };
