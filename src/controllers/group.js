import ash from 'express-async-handler';
import { logger } from '../utils/logger';
import { Group, User } from '../db';

// get /group/:groupId
export const getGroupInfo = ash (async (req, res) => {
  const { group } = req;
  return res.json (group);
});

// post /group/:groupName
export const updateGroupInfo = ash (async (req, res) => {
  const { groupName, group } = req;
  const { name, description } = req.body;
  logger.api.info (`post /group/${groupName} request; name : ${name}, description: ${description}`);
  if (!name) {
    return res.status (400).json ({
      error: 'group name required',
    });
  }
  if (group.name !== name) {
    const [userTaken, groupTaken] = await Promise.all ([
      User.findOne ({ username: name }),
      Group.findOne ({ name }),
    ]);
    if (userTaken || groupTaken) {
      return res.status (400).json ({
        error: `'${name}' has already been taken.`,
      });
    }
    group.revisionHistory.push ({
      prev: group.name,
      next: name,
    });
    group.name = name;
  }
  group.description = description;
  await group.save ();
  return res.json (group);
});

// post /group/:groupName/profile
export const updateProfilePhoto = ash (async (req, res) => {
  const { group } = req;
  group.profilePhoto = req.file.location;
  await group.save ();
  return res.json (group);
});

// post /group/:groupName/background
export const updateBakPhoto = ash (async (req, res) => {
  const { group } = req;
  group.backgroundPhoto = req.file.location;
  await group.save ();
  return res.json (group);
});

/**
 * Add user as a member if not exist,
 * fail if already a member,
 *
 * req.params.groupName : required
 * req.body.username : required
 * req.body.isAdmin : optional (default to false)
 */
// put /group/:groupName/member
export const addMember = ash (async (req, res) => {
  const {
    self, groupName, group, user,
  } = req;
  let { isAdmin } = req.body;
  isAdmin = isAdmin === 'true';
  logger.api.info (
    'put /group/:groupName/member request; groupName: %s, from: %s, target: %s, isAdmin: %s',
    groupName,
    self.username,
    user.username,
    isAdmin,
  );
  const member = group.members.find (m => (m.user.equals (user._id)));
  if (member) {
    return res.status (404).json ({
      error: `${user.username} is already a member.`,
    });
  }
  group.members.push ({ user: user._id, isAdmin });
  user.groups.push (group._id);
  // EVENT: Group added event for user
  await Promise.all ([group.save (), user.save ()]);
  return res.json (group);
});

/**
 * Add user as a member if not exist,
 * update isAdmin if already a member,
 *
 * req.params.groupName : required
 * req.body.username : required
 * req.body.isAdmin : optional (default to false)
 */
// post /group/:groupName/member
export const updateMember = ash (async (req, res) => {
  const {
    groupName, group, self, user,
  } = req;
  let { isAdmin } = req.body;
  isAdmin = isAdmin === 'true';
  logger.api.info (
    'post /group/:groupName/member request; groupName: %s, from: %s, target: %s, isAdmin: %s',
    groupName,
    self.username,
    user.username,
    isAdmin,
  );
  if (self._id.equals (user._id)) {
    logger.api.error ('post /group/:groupName/member request error; 403 - cannot change your own permission');
    return res.status (403).json ({
      error: 'forbidden: cannot change your own permission',
    });
  }
  const memberIndex = group.members.findIndex (m => (m._id.equals (user._id)));
  if (memberIndex !== -1) {
    group.members[memberIndex] = { user: user._id, isAdmin };
  } else {
    group.members.push ({ user: user._id, isAdmin });
    user.groups.push (group._id);
  }
  // EVENT: Group permission updated event for user
  await Promise.all ([group.save (), user.save ()]);
  return res.json (group);
});

// delete /group/:groupName/member
export const deleteMember = ash (async (req, res) => {
  const {
    groupName, group, self, user,
  } = req;
  logger.api.info (
    'delete /group/:groupName/member request; groupName: %s, from: %s, delete: %s',
    groupName,
    self.username,
    user.username,
  );

  if (self._id.equals (user._id)) {
    logger.api.error ('delete /group/:groupName/member request error; 403 - cannot change your own permission');
    return res.status (403).json ({
      error: 'forbidden: cannot change your own permission',
    });
  }

  const memberIndex = group.members.findIndex (m => (m._id.equals (user._id)));
  if (memberIndex === -1) {
    return res.status (404).json ({
      error: `${user.username} is not a member.`,
    });
  }
  group.members.splice (memberIndex, 1);
  const groupIndex = user.groups.findIndex (groupId => groupId.equals (group._id));
  user.groups.splice (groupIndex, 1);
  if (user.currentGroup.equals (group._id)) {
    user.currentGroup = null;
  }
  // EVENT: Removed from group event for user
  await Promise.all ([group.save (), user.save ()]);
  return res.json (group);
});
