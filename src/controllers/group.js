import ash from 'express-async-handler';
import { logger } from '../utils/logger';
import { Group, GroupApply, Zabo } from '../db';
import { isNameInvalidWithRes, parseJSON } from '../utils';
import { populateZabosPrivateStats } from '../utils/populate';

export const applyGroup = ash (async (req, res) => {
  const { file, self } = req;
  const {
    name, description, subtitle, purpose, category: categoryString, isBusiness = false,
  } = req.body;
  const category = parseJSON (categoryString, []);
  logger.api.info (`
    post /group/apply request; name: %s, description: %s, subtitle: %s,
    purpose: %s, category: %s, isBusiness: %s
   `, name, description, subtitle, purpose, category, isBusiness);

  if (!name || !description || !subtitle || !purpose || category.length < 1) {
    return res.status (400).json ({
      error: 'All fields are required',
    });
  }
  const error = await isNameInvalidWithRes (name, req, res);
  if (error) return error;

  const groupInfo = {
    name,
    description,
    subtitle,
    purpose,
    members: [{ user: self._id, role: 'admin' }],
    category,
    isBusiness,
  };

  if (file) {
    groupInfo.profilePhoto = file.location;
  }

  const groupApply = await GroupApply.create (groupInfo);

  return res.json (groupApply);
});

// get /group/random
export const findGroupRecommends = ash (async (req, res) => {
  if (req.session.groupRecommend) {
    return res.json (req.session.groupRecommend);
  }
  const groups = await Group.aggregate ([
    { $sample: { size: 5 } },
    { $project: { name: 1, profilePhoto: 1, subtitle: 1 } },
  ]);
  req.session.groupRecommend = groups;
  return res.json (groups);
});

// get /group/:groupId
export const getGroupInfo = ash (async (req, res) => {
  const { group } = req;
  return res.json (group);
});

// post /group/:groupName
export const updateGroupInfo = ash (async (req, res) => {
  const { groupName, group, file } = req;
  const {
    name, description, subtitle, category: categoryString,
  } = req.body;
  const category = parseJSON (categoryString, []);
  logger.api.info (`post /group/${groupName} request; name : ${name}, description: ${description},
   subtitle: ${subtitle} category: ${category} ${file ? `, image: ${file.location}` : ''}`);

  if (group.name !== name) {
    const error = await isNameInvalidWithRes (name, req, res);
    if (error) return error;

    // Use post save hook instead? What if someone use update instead of save while refactoring.
    // Seems bug prune to me. Thus, just explicitly add history in controller
    group.revisionHistory.push ({
      prev: group.name,
      next: name,
    });
    group.name = name;
  }
  if (file) {
    group.profilePhoto = file.location;
  }
  group.description = description;
  group.subtitle = subtitle;
  group.category = category;
  await group.save ();
  return res.json ({
    name,
    description,
    subtitle,
    revisionHistory: group.revisionHistory,
  });
});

// post /group/:groupName/background
export const updateBakPhoto = ash (async (req, res) => {
  const { group } = req;
  group.backgroundPhoto = req.file.location;
  await group.save ();
  return res.json ({
    backgroundPhoto: group.backgroundPhoto,
  });
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
  const { role } = req.body;
  logger.api.info (
    'put /group/:groupName/member request; groupName: %s, from: %s (%s), target: %s (%s), role: %s',
    groupName,
    self.username,
    self._id,
    user.username,
    user._id,
    role,
  );
  const member = group.members.find (m => (m.user.equals (user._id)));
  if (member) {
    return res.status (404).json ({
      error: `${user.username} is already a member.`,
    });
  }
  group.members.push ({ user: user._id, role });
  user.groups.push (group._id);
  // EVENT: Group added event for user
  await Promise.all ([group.save (), user.save ()]);
  await group
    .populate ({
      path: 'members.user',
      select: 'username koreanName lastName firstName _id profilePhoto',
    })
    .execPopulate ();
  return res.json ({
    members: group.members,
  });
});

/**
 * Add user as a member if not exist,
 * update role if already a member,
 *
 * req.params.groupName : required
 * req.body.username : required
 * req.body.role : required
 */
// post /group/:groupName/member
export const updateMember = ash (async (req, res) => {
  const {
    groupName, group, self, user,
  } = req;
  const { role } = req.body;
  logger.api.info (
    'post /group/:groupName/member request; groupName: %s, from: %s (%s), target: %s (%s), role: %s',
    groupName,
    self.username,
    self._id,
    user.username,
    user._id,
    role,
  );
  if (self._id.equals (user._id)) {
    logger.api.error ('post /group/:groupName/member request error; 403 - cannot change your own permission');
    return res.status (403).json ({
      error: 'forbidden: cannot change your own permission',
    });
  }
  const memberIndex = group.members.findIndex (m => (m.user.equals (user._id)));
  if (memberIndex !== -1) {
    group.members[memberIndex] = { user: user._id, role };
  } else {
    group.members.push ({ user: user._id, role });
    user.groups.push (group._id);
  }
  // EVENT: Group permission updated event for user
  await Promise.all ([group.save (), user.save ()]);
  await group
    .populate ({
      path: 'members.user',
      select: 'username koreanName lastName firstName _id profilePhoto',
    })
    .execPopulate ();
  return res.json ({
    members: group.members,
  });
});

// delete /group/:groupName/member
export const deleteMember = ash (async (req, res) => {
  const {
    groupName, group, self, user,
  } = req;
  logger.api.info (
    'delete /group/:groupName/member request; groupName: %s, from: %s (%s), target: %s (%s)',
    groupName,
    self.username,
    self._id,
    user.username,
    user._id,
  );

  if (self._id.equals (user._id)) {
    logger.api.error ('delete /group/:groupName/member request error; 403 - cannot delete yourself');
    return res.status (403).json ({
      error: 'forbidden: cannot delete yourself',
    });
  }
  const member = group.members.find (m => (m.user.equals (user._id)));
  if (!member) {
    return res.status (404).json ({
      error: `${user.username} is not a member.`,
    });
  }
  group.members.pull (member);
  const groupIndex = user.groups.findIndex (groupId => groupId.equals (group._id));
  user.groups.splice (groupIndex, 1);
  if (user.currentGroup && user.currentGroup.equals (group._id)) {
    user.currentGroup = null;
  }
  // EVENT: Removed from group event for user
  await Promise.all ([group.save (), user.save ()]);
  await group
    .populate ({
      path: 'members.user',
      select: 'username koreanName lastName firstName _id profilePhoto',
    })
    .execPopulate ();
  return res.json ({
    members: group.members,
  });
});

export const listGroupZabos = ash (async (req, res, next) => {
  const { group } = req;
  const { lastSeen } = req.query;
  if (lastSeen) return next ();
  const zabos = await Zabo.find ({ owner: group._id }, { description: 0 })
    .sort ({ createdAt: -1 })
    // .limit (20) // TODO: optimize
    .populate ('owner', 'name profilePhoto subtitle description');
  const result = populateZabosPrivateStats (zabos, req.self);
  return res.json (result);
});

export const listNextGroupZabos = ash (async (req, res) => res.send ([])); // TODO
