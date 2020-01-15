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

export const isGroupAdmin = async (req, res, next) => {
  const { groupName } = req.params;
  const { sid } = req.decoded;

  try {
    const [user, group] = await Promise.all ([
      User.findOne ({ sso_sid: sid }, 'studentId'),
      Group.findOne ({ name: groupName }, 'members'),
    ]);
    console.log ({
      user,
      group,
    });
    if (!group) {
      logger.mw.error ('isGroupAdmin - group not found');
      res.status (404).json ({
        error: 'Group not found',
      });
      return;
    }
    if (
      group.members.find (m => m.isAdmin && (m.studentId === user.studentId))
    ) {
      next ();
    } else {
      res.status (403).json ({
        error: 'Not Group Admin',
      });
    }
  } catch (error) {
    logger.mw.error (error);
    res.sendStatus (500);
  }
};

export const isGroupMember = async (req, res, next) => {
  const { sid } = req.decoded;
  const { groupName } = req.params;

  try {
    const [user, group] = await Promise.all ([
      User.findOne ({ sso_sid: sid }, 'studentId'),
      Group.findOne ({ name: groupName }, 'members'),
    ]);
    if (!group) {
      logger.mw.error ('isGroupMember - group not found');
      res.status (404).json ({
        error: 'Group not found',
      });
      return;
    }
    if (
      group.members.find (m => (m.studentId === user.studentId))
    ) {
      next ();
    } else {
      res.status (403).json ({
        error: 'Not Group Member',
      });
    }
  } catch (error) {
    logger.mw.error (error);
    res.status (400).json ({
      error: error.message,
    });
  }
};
