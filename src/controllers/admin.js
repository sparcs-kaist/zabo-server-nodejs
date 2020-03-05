import ash from 'express-async-handler';
import {
  Board, Group, GroupApply, User, Zabo,
} from '../db';
import { logger } from '../utils/logger';
import { isNameInvalidWithRes, jwtSign, parseJSON } from '../utils';

export const listGroupApplies = ash (async (req, res) => {
  const applies = await GroupApply.find ()
    .populate ('members.user');
  return res.json (applies);
});

export const acceptGroupApply = ash (async (req, res) => {
  const { adminUser } = req;
  const { name } = req.body;
  logger.api.info ('post /admin/group/apply/accept request; name: %s, adminUser: %s', name, adminUser.user);
  const newGroup = await GroupApply.findOneAndDelete ({ name });
  const newGroupJSON = newGroup.toJSON ({ virtuals: false });
  delete newGroupJSON._id;
  newGroupJSON.members.forEach ((member, i) => {
    delete newGroupJSON.members[i]._id;
  });
  const created = await Group.create (newGroupJSON);
  adminUser.actionHistory.push ({
    name: 'acceptGroup',
    target: created._id,
  });
  await Promise.all ([
    newGroupJSON.members.map (({ user }) => User.findByIdAndUpdate (user._id, { $push: { groups: created._id } })),
    adminUser.save (),
  ]);
  return res.json (created);
});

// post /admin/group
export const createGroup = ash (async (req, res) => {
  const { user, studentId, adminUser } = req;
  const { name, category: categoryString } = req.body;
  logger.api.info ('post /admin/group request; name: %s, studentId: %s', name, studentId);
  const category = parseJSON (categoryString, []);

  const error = await isNameInvalidWithRes (name, req, res);
  if (error) return error;

  if (!Array.isArray (category) || category.length < 2) {
    return res.status (400).json ({
      error: 'category with 2 length long array is required',
    });
  }
  // Ignore very small delay after name usability check
  const group = await Group.create ({
    name,
    members: [{ user: user._id, role: 'admin' }],
    category,
  });
  user.groups.push (group._id);
  adminUser.actionHistory.push ({
    name: 'createGroup',
    target: group._id,
    info: { name, studentId },
  });
  await Promise.all ([
    user.save (),
    adminUser.save (),
  ]);
  return res.json (group);
});

export const patchLevel = ash (async (req, res) => {
  const { adminUser } = req;
  const { groupName } = req.params;
  const { level } = req.body;
  logger.api.info ('patch /admin/:groupName/level request; groupName: %s, adminUser: %s', groupName, adminUser.user);
  const result = await Group.findOneAndUpdate ({ name: groupName }, { $set: { level } }, { new: true });
  adminUser.actionHistory.push ({
    name: 'patchLevel',
    target: result._id,
  });
  await adminUser.save ();
  return res.json (result);
});

// get /admin/user/:studentId
export const getUserInfo = ash (async (req, res) => {
  const { user } = req;
  const populated = await user
    .populate ('groups', '_id name profilePhoto')
    .populate ('boards', '_id title isPrivate')
    .execPopulate ();
  res.json (populated);
});

export const listGroups = ash (async (req, res) => {
  const groups = await Group.find ()
    .populate ('members.user');
  return res.json (groups);
});

export const listUsers = ash (async (req, res) => {
  const users = await User.find ().lean ();
  return res.json (users);
});

// post /admin/fakeRegister
export const fakeRegister = ash (async (req, res) => {
  const { adminUser } = req;
  const { username } = req.body;
  logger.api.info ('post /admin/fakeRegister request; username: %s, adminUser: %s', username, adminUser.user);
  const error = await isNameInvalidWithRes (username, req, res);
  if (error) return error;
  const jwtSecret = req.app.get ('jwt-secret');
  const board = await Board.create ({
    title: '저장한 포스터',
  });
  const boards = [board._id];
  const user = await User.create ({
    flags: ['TEST', 'SPARCS'],
    sso_uid: new Date ().getTime (),
    sso_sid: new Date ().getTime (),
    email: `${username}@kaist.ac.kr`,
    boards,
    username,
    studentId: Math.ceil (Math.random () * 10000),
  });
  adminUser.actionHistory.push ({
    name: 'fakeRegister',
    target: user._id,
  });
  await adminUser.save ();
  const token = jwtSign (user, jwtSecret);
  return res.json ({ user, token });
});

// post /admin/fakeLogin
export const fakeLogin = ash (async (req, res) => {
  const { adminUser } = req;
  const { username } = req.body;
  logger.api.info ('post /admin/fakeLogin request; username: %s, adminUser: %s', username, adminUser.user);
  const jwtSecret = req.app.get ('jwt-secret');
  const user = await User.findOne ({ username });
  if (!user) return res.sendStatus (404);
  const token = jwtSign (user, jwtSecret);
  return res.json (token);
});


/* For admin page */
// get /analytics/zabo/date/created
export const analyticsGetZaboCreatedDate = ash (async (req, res) => {
  logger.api.info ('get /admin/analytics/zabo/date/created');
  const users = await Zabo.find ({}, 'createdAt').lean ();
  return res.json (users);
});

// get /analytics/user/date/created
export const analyticsGetUserCreatedDate = ash (async (req, res) => {
  logger.api.info ('get /admin/analytics/user/date/created');
  const users = await User.find ({}, 'createdAt').lean ();
  return res.json (users);
});
