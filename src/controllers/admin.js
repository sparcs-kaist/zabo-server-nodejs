import ash from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { Board, Group, User } from '../db';
import { logger } from '../utils/logger';

// post /admin/group
export const createGroup = ash (async (req, res) => {
  const { user, studentId } = req;
  const { name } = req.body;
  logger.api.info ('post /admin/group request; name: %s, studentId: %s', name, studentId);
  if (!name) {
    return res.status (400).json ({
      error: 'bad request: null name',
    });
  }
  const [userTaken, groupTaken] = await Promise.all ([
    User.findOne ({ username: name }),
    Group.findOne ({ name }),
  ]);
  if (userTaken || groupTaken) {
    return res.status (400).json ({
      error: `'${name}' has already been taken.`,
    });
  }
  // Ignore very rare timing issue which is unlikely to happen.
  const group = await Group.create ({ name, members: [{ user: user._id, isAdmin: true }] });
  user.groups.push (group._id);
  await user.save ();
  console.log ({ user });
  return res.json (group);
});

// get /admin/user/:studentId
export const getUserInfo = ash (async (req, res) => {
  const { user } = req;
  const populated = user
    .populate ('currentGroup', '_id name profilePhoto')
    .populate ('groups', '_id name profilePhoto')
    .populate ('boards', '_id title isPrivate');
  res.json (populated);
});

// post /admin/fakeRegister
export const fakeRegister = ash (async (req, res) => {
  const { studentId } = req.body;
  const board = await Board.create ({
    title: '저장한 포스터',
  });
  const boards = [board._id];
  const user = await User.create ({
    sso_uid: studentId,
    sso_sid: studentId,
    studentId,
    email: `${studentId}@kaist.ac.kr`,
    boards,
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
