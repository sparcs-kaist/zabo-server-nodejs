import jwt from 'jsonwebtoken';

import { Board, User } from '../db';

/* eslint camelcase:0 */
import SSOClient from '../utils/sso';
import { parseJSON } from '../utils';
import { stat } from '../utils/statistic';
import { logger } from '../utils/logger';

export const authCheck = async (req, res) => {
  const jwtSecret = req.app.get ('jwt-secret');
  const token = (req.headers.authorization || '').substring (7);
  jwt.verify (token, jwtSecret, async (error, decoded) => {
    if (error) {
      console.error (error.message, error.lineNumber);
      res.status (403).json ({
        error: error.message,
      });
      return;
    }
    req.decoded = decoded;
    const { sid } = decoded;
    try {
      const user = await User.findOne ({ sso_sid: sid })
        .populate ('groups')
        .populate ('currentGroup')
        .populate ('currentGroup.members')
        .populate ('boards');

      res.json (user);
    } catch (error) {
      logger.error (error);
      res.sendStatus (500);
    }
  });
};

export const login = (req, res) => {
  try {
    const { url, state } = SSOClient.getLoginParams ();
    logger.api.info ('get /auth/login request; url: %s, state: %s', url, state);
    req.session.state = state;
    res.redirect (url);
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};

// TODO: Performance issue. Any better idea?
const generateUsernameWithPostfix = async (username) => {
  let maxNum = 90;
  let bias = 10;
  let trialLeft = 50;
  let dup;
  let testUsername = `${username}${Math.floor (Math.random () * maxNum) + bias}`;
  do {
    dup = await User.findOne ({ username: testUsername });
    if (dup) {
      trialLeft -= 1;
      const postFix = Math.floor (Math.random () * maxNum) + bias;
      testUsername = `${username}${postFix}`;
      if (trialLeft <= 0) {
        trialLeft = bias * 5;
        bias *= 10;
        maxNum *= 10;
      }
    }
  } while (dup);
  return testUsername;
};

const updateOrCreateUserData = async (userData, create) => {
  const {
    uid,
    sid,
    email: sso_email,
    first_name,
    last_name,
    gender,
    birthday,
    flags,
    facebook_id,
    twitter_id,
    kaist_id,
    kaist_info,
    kaist_info_time,
    sparcs_id,
  } = userData;
  const {
    // displayname,
    ku_person_type,
    // ku_sex,
    ku_std_no,
    mail: kaist_email,
  } = parseJSON (kaist_info);

  const setParams = {
    $set: {
      sso_uid: uid,
      sso_sid: sid,
      email: sso_email,
      firstName: first_name,
      lastName: last_name,
      gender,
      birthday,
      flags,
      facebookId: facebook_id,
      twitterId: twitter_id,
      kaistId: kaist_id,
      sparcsId: sparcs_id,
      studentId: ku_std_no,
      kaistPersonType: ku_person_type,
      kaistEmail: kaist_email,
      kaistInfoTime: kaist_info_time,
    },
  };
  if (create) {
    let username = `${first_name}${last_name}`;
    if (!username) username = 'noname';
    username = await generateUsernameWithPostfix (username);

    logger.event.info ('===== New User Has Registered | %s - %s %s ===', ku_std_no, `${first_name} ${last_name}`, username);
    const board = await Board.create ({ title: '저장한 포스터' });
    const boards = [board._id];
    Object.assign (setParams, {
      $set: {
        ...setParams.$set,
        boards,
        username,
      },
    });
  }

  const newUser = await User.findOneAndUpdate ({ sso_sid: sid }, setParams, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })
    .populate ('groups')
    .populate ('currentGroup')
    .populate ('currentGroup.members')
    .populate ('boards');

  if (create) {
    stat.REGISTER ({ userId: newUser._id });
  }

  return newUser;
};

const register = async (userData) => updateOrCreateUserData (userData, true);

export const loginCallback = async (req, res) => {
  try {
    const stateBefore = req.session.state;
    const { state, code, update } = req.body;
    logger.api.info ('get /auth/callback request; state: %s, code: %s, update: %s', state, code, update);
    const jwtSecret = req.app.get ('jwt-secret');

    if (stateBefore !== state) {
      res.status (401).json ({
        error: 'TOKEN MISMATCH: session might be hijacked!',
        status: 401,
      });
      return;
    }
    const userData = await SSOClient.getUserInfo (code);
    let user = await User.findOne ({ sso_sid: userData.sid });
    if (update) {
      if (!user) {
        res.status (401).json ({
          error: 'Please register first.',
          status: 401,
        });
        return;
      }
      user = await updateOrCreateUserData (userData, false);
    }
    if (!user) {
      user = await register (userData);
    }

    const token = jwt.sign ({
      id: user._id,
      sid: user.sso_sid,
      email: user.email,
      studentId: user.studentId,
    }, jwtSecret, {
      expiresIn: '60d',
      issuer: 'zabo-sparcs-kaist',
    });

    res.json ({
      token,
      user,
    });
  } catch (error) {
    logger.error (error);
    res.sendStatus (500);
  }
};

export const logout = async (req, res) => {
  const { sid } = req.session;
  const { token } = req.session;
  const jwtSecret = req.app.get ('jwt-secret');

  jwt.verify (token, jwtSecret, (err, decoded) => {
    if (err) {
      return console.error (err);
    }
  }); // TODO : FIX
  // const redirectUrl = encodeURIComponent('http://ssal.sparcs.org:10001/after/logout')
  const logoutUrl = SSOClient.getLogoutUrl (sid);
  res.redirect (logoutUrl);
};

export const unregister = (req, res) => {
  res.json ();
};
