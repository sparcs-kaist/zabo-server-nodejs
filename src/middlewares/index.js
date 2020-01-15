import ash from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { Group, User } from '../db';
import { isValidId } from '../utils';
import { logger } from '../utils/logger';

export const authMiddleware = (req, res, next) => {
  const jwtSecret = req.app.get ('jwt-secret');
  const token = (req.headers.authorization || '').substring (7);
  jwt.verify (token, jwtSecret, (err, decoded) => {
    if (err) {
      logger.mw.error (err.message);
      res.status (403).json ({
        error: err.message,
      });
      return;
    }
    req.decoded = decoded;
    req.token = token;
    next ();
  });
};

export const jwtParseMiddleware = (req, res, next) => {
  const jwtSecret = req.app.get ('jwt-secret');
  const token = (req.headers.authorization || '').substring (7);
  jwt.verify (token, jwtSecret, (err, decoded) => {
    if (err) {
      // Do nothing as jwt is optional
      next ();
      return;
    }
    req.decoded = decoded;
    req.token = token;
    next ();
  });
};

export const findUserWithUsername = ash (async (req, res, next) => {
  const { username } = req;
  if (!username) {
    logger.api.error (`[${req.method}] ${req.originalUrl} request error; 400 - empty username`);
    return res.status (400).json ({
      error: 'bad request: username required',
    });
  }
  const user = await User.findOne ({ username });
  if (!user) {
    logger.api.error (`[${req.method}] ${req.originalUrl} request error; 404 - user '${username}' not found`);
    return res.status (404).json ({
      error: 'not found: user does not exist',
    });
  }
  req.user = user;
  return next ();
});

export const findGroup = ash (async (req, res, next) => {
  const { groupName } = req;
  if (!groupName) {
    logger.api.error (`[${req.method}] ${req.originalUrl} request error; 400 - null groupName`);
    return res.status (400).json ({
      error: 'bad request: null groupName',
    });
  }
  const group = await Group.findOne ({ name: groupName });
  if (!group) {
    logger.api.error (`[${req.method}] ${req.originalUrl}  request error; 404 - groupName : ${groupName}`);
    return res.status (404).json ({
      error: 'group not found',
    });
  }
  req.group = group;
  return next ();
});

export const isGroupAdmin = ash (async (req, res, next) => {
  const { sid } = req.decoded;
  const { group } = req;
  const user = await User.findOne ({ sso_sid: sid });
  req.self = user;
  if (group.members.find (m => m.isAdmin && (m.userId === user._id))) {
    return next ();
  }
  return res.status (403).json ({
    error: 'Permission Denied',
  });
});

export const isGroupMember = ash (async (req, res, next) => {
  const { sid } = req.decoded;
  const { group } = req;
  const user = await User.findOne ({ sso_sid: sid });
  req.self = user;
  if (group.members.find (m => (m.userId === user._id))) {
    return next ();
  }
  return res.status (403).json ({
    error: 'Not Group Member',
  });
});
