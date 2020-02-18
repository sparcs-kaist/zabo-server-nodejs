import ash from 'express-async-handler';
import jwt from 'jsonwebtoken';
import {
  Board, Group, User, Zabo,
} from '../db';
import { logger } from '../utils/logger';
import { isNameInvalidWithRes } from '../utils';

// TODO: Accept other keys too, Don't accept student id only.
// post /admin/group
export const createGroup = ash (async (req, res) => {
  const { user, studentId, adminUser } = req;
  const { name } = req.body;
  logger.api.info ('post /admin/group request; name: %s, studentId: %s', name, studentId);

  const error = await isNameInvalidWithRes (name, req, res);
  if (error) return error;

  // Ignore very small delay after name usability check
  const group = await Group.create ({ name, members: [{ user: user._id, role: 'admin' }] });
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
  });
  return res.json (user);
});

// post /admin/fakeLogin
export const fakeLogin = ash (async (req, res) => {
  const { studentId } = req.body;
  const jwtSecret = req.app.get ('jwt-secret');
  const user = await User.findOne ({ studentId });
  const token = jwt.sign ({
    id: user._id,
    sid: user.sso_sid,
    email: user.email,
    studentId: user.studentId,
  }, jwtSecret, {
    expiresIn: '60d',
    issuer: 'zabo-sparcs-kaist',
  });
  return res.json (token);
});


/* For admin page */
// get /analytics/zabo/date/created
export const analyticsGetZaboCreatedDate = async (req, res) => {
  try {
    logger.api.info ('get /analytics/zabo/date/created');
    const zabos = [];

    // Use stream
    const cursor = await Zabo.find ({}).lean ().cursor ();
    cursor.on ('data', (zabo) => { zabos.push (zabo.createdAt); });
    cursor.on ('end', () => {
      res.send (zabos);
    });
  } catch (error) {
    logger.api.error (error);
    res.status (500).json ({
      error: error.message,
    });
  }
};

// get /analytics/user/date/created
export const analyticsGetUserCreatedDate = async (req, res) => {
  try {
    logger.api.info ('get /analytics/user/date/created');
    const users = [];

    // Use stream
    const cursor = await User.find ({}).lean ().cursor ();
    cursor.on ('data', (user) => { users.push (user.createdAt); });
    cursor.on ('end', () => {
      res.send (users);
    });
  } catch (error) {
    logger.api.error (error);
    res.status (500).json ({
      error: error.message,
    });
  }
};
