import ash from 'express-async-handler';
import {
  Board, Group, User, Zabo,
} from '../db';
import { logger } from '../utils/logger';
import { isNameInvalidWithRes, jwtSign, parseJSON } from '../utils';

// TODO: Accept other keys too, Don't accept student id only.
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
  const { groupName } = req.params;
  const { level } = req.body;
  const result = await Group.findOneAndUpdate ({ name: groupName }, { $set: { level } }, { new: true });
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

// post /admin/fakeRegister
export const fakeRegister = ash (async (req, res) => {
  const { username } = req.body;
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
  const token = jwtSign (user, jwtSecret);
  return res.json ({ user, token });
});

// post /admin/fakeLogin
export const fakeLogin = ash (async (req, res) => {
  const { username } = req.body;
  const error = await isNameInvalidWithRes (username, req, res);
  if (error) return error;
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
  const zabos = [];

  // Use stream
  const cursor = await Zabo.find ({}).lean ().cursor ();
  cursor.on ('data', (zabo) => { zabos.push (zabo.createdAt); });
  cursor.on ('end', () => {
    res.send (zabos);
  });
});

// get /analytics/user/date/created
export const analyticsGetUserCreatedDate = ash (async (req, res) => {
  logger.api.info ('get /admin/analytics/user/date/created');
  const users = [];

  // Use stream
  const cursor = await User.find ({}).lean ().cursor ();
  cursor.on ('data', (user) => { users.push (user.createdAt); });
  cursor.on ('end', () => {
    res.send (users);
  });
});
