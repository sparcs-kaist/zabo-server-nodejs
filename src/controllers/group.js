import ash from 'express-async-handler';
import { Group, User } from '../db';
import { logger } from '../utils/logger';

// get /group/:groupId
export const getGroupInfo = ash (async (req, res) => {
  const { group } = req;
  return res.json (group);
});

// post /group/:groupName
export const updateGroupInfo = ash (async (req, res) => {
  const { groupName } = req.params;
  // TODO:
});

// post /group/:groupName/profile
export const updateProfilePhoto = ash (async (req, res) => {
  const { groupName } = req.params;
  const url = req.file.location;
  const updatedGroup = await Group.findOneAndUpdate (
    { name: groupName },
    {
      $set: {
        profilePhoto: url,
      },
    },
    { new: true },
  );
  return res.json (updatedGroup);
});

// post /group/:groupName/background
export const updateBakPhoto = ash (async (req, res) => {
  const { groupName } = req.params;
  const url = req.file.location;
  const updatedGroup = await Group.findOneAndUpdate (
    { name: groupName },
    {
      $set: {
        backgroundPhoto: url,
      },
    },
    { new: true },
  );
  return res.json (updatedGroup);
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
  const found = group.members.find (m => (m.userId === user._id));
  if (found) {
    return res.status (404).json ({
      error: `${user.username} is already a member.`,
    });
  }

  const updatedGroup = await Group.findOneAndUpdate ({
    name: groupName,
  }, {
    $push: {
      members: {
        userId: user._id,
        isAdmin,
      },
    },
  }, {
    new: true,
  });
  // EVENT: Group added event for user
  await User.findByIdAndUpdate (user._id,
    {
      $push: {
        groups: updatedGroup._id,
      },
    });
  return res.json (updatedGroup);
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

  if (self._id === user._id) {
    logger.api.error ('post /group/:groupName/member request error; 403 - cannot change your own permission');
    return res.status (403).json ({
      error: 'forbidden: cannot change your own permission',
    });
  }

  const found = group.members.find (m => (m._id === user._id));

  let updatedGroup;
  if (found) {
    updatedGroup = await Group.findOneAndUpdate ({
      name: groupName,
      'members.userId': user._id,
    }, {
      $set: { 'members.$': { userId: user._id, isAdmin } },
    }, {
      new: true,
    });
  } else {
    updatedGroup = await Group.findOneAndUpdate (
      { name: groupName },
      {
        $push: {
          members: { userId: user._id, isAdmin },
        },
      },
      { new: true },
    );
    await User.findByIdAndUpdate (user._id, {
      $push: {
        groups: updatedGroup._id,
      },
    });
  }
  res.json (updatedGroup);
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

  if (self._id === user._id) {
    logger.api.error ('delete /group/:groupName/member request error; 403 - cannot change your own permission');
    return res.status (403).json ({
      error: 'forbidden: cannot change your own permission',
    });
  }

  const updatedGroup = await Group.findOneAndUpdate (
    { name: groupName },
    {
      $pull: {
        members: {
          userId: user._id,
        },
      },
    },
    { new: true },
  );

  // EVENT: Group removed event for user
  await User.findByIdAndUpdate (user._id, {
    $pull: {
      groups: groupName,
    },
  });
  if (updatedGroup._id.equals (user.currentGroup)) {
    await User.findByIdAndUpdate (user._id, {
      $set: {
        currentGroup: null,
      },
    });
  }
  return res.json (updatedGroup);
});
