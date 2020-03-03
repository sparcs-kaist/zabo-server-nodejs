import jwt from 'jsonwebtoken';
import ash from 'express-async-handler';

import {
  Board, User, Group, GroupApply,
} from '../db';

/* eslint camelcase:0 */
import SSOClient from '../utils/sso';
import { jwtSign, parseJSON } from '../utils';
import { logger } from '../utils/logger';
import { checkPreAndRegister } from '../utils/preRegister';

export const authCheck = ash (async (req, res) => {
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
    const user = await User.findOne ({ sso_sid: sid })
      .populate ({
        path: 'groups',
        select: 'name profilePhoto followers recentUpload subtitle',
      })
      .populate ('boards');
    const groupApplies = await GroupApply.find ({ members: { $elemMatch: { user: user._id } } }, { name: 1, profilePhoto: 1, subtitle: 1 });
    const userJSON = user.toJSON ();
    userJSON.pendingGroups = groupApplies;
    res.json (userJSON);
  });
});

export const login = ash ((req, res) => {
  const { url, state } = SSOClient.getLoginParams ();
  logger.api.info ('get /auth/login request; url: %s, state: %s', url, state);
  req.session.state = state;
  res.redirect (url);
});

export const loginApi = ash ((req, res) => {
  const { url, state } = SSOClient.getLoginParams ();
  logger.api.info ('get /auth/login request; url: %s, state: %s', url, state);
  req.session.state = state;
  return res.json ({ url });
});

// TODO: Performance issue. Any better idea?
const generateUsernameWithPostfix = async (username) => {
  let maxNum = 90;
  let bias = 10;
  let trialLeft = 50;
  let dup;
  let testUsername = `${username}${Math.floor (Math.random () * maxNum) + bias}`;
  do {
    dup = await User.findOne ({ username: testUsername });
    if (!dup) dup = await Group.findOne ({ name: testUsername });
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
    ku_psft_user_status_kor,
    ku_kname,
  } = (parseJSON (kaist_info) || {});

  const setParams = {
    $set: {
      sso_uid: uid,
      sso_sid: sid,
      email: sso_email,
      firstName: first_name,
      lastName: last_name,
      koreanName: ku_kname,
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
      kaistStatus: ku_psft_user_status_kor,
    },
  };
  if (create) {
    let username = ku_kname || `${first_name}${last_name}`;
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

  let newUser = await User.findOneAndUpdate ({ sso_sid: sid }, setParams, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })
    .populate ({
      path: 'groups',
      select: 'name profilePhoto followers recentUpload subtitle',
    })
    .populate ('boards');

  if (create) {
    const preRegisteredUser = await checkPreAndRegister (newUser);
    newUser = preRegisteredUser || newUser;
  }

  return newUser;
};

const register = async (userData) => updateOrCreateUserData (userData, true);

export const loginCallback = ash (async (req, res) => {
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
  let user = await User.findOne ({ sso_sid: userData.sid })
    .populate ({
      path: 'groups',
      select: 'name profilePhoto followers recentUpload subtitle',
    })
    .populate ('boards');
  // User wants to refresh SSO data
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

  const groupApplies = await GroupApply.find ({ members: { $elemMatch: { user: user._id } } }, { name: 1, profilePhoto: 1, subtitle: 1 });
  const userJSON = user.toJSON ();
  userJSON.pendingGroups = groupApplies;

  const token = jwtSign (user, jwtSecret);
  res.json ({
    token,
    user: userJSON,
  });
});

export const logout = (req, res) => {
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
