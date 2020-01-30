import ash from 'express-async-handler';
import {
  Group, Pin, User, Zabo,
} from '../db';
import { logger } from '../utils/logger';
import { isValidId, validateNameAndRes } from '../utils';

// get /user/
export const getUserInfo = ash (async (req, res) => {
  const { sid } = req.decoded;
  logger.api.info ('get /user/ request; sid: %s', sid);

  const user = await User.findOne ({ sso_sid: sid })
    .populate ('groups')
    .populate ('currentGroup')
    .populate ('currentGroup.members')
    .populate ('boards');
  res.json (user);
});

// post /user
export const updateUserInfo = ash (async (req, res) => {
  const { sid } = req.decoded;
  const { username, description } = req.body;
  logger.api.info (
    'post /user/ request; sid: %s, username: %s, description: %s',
    sid,
    username,
    description,
  );
  const updateParams = { description };
  const self = await User.findOne ({ sso_sid: sid });
  if (self.username !== username) {
    const error = await validateNameAndRes (username, req, res);
    if (error) return error;
    updateParams.username = username;
  }
  // Ignore very rare timing issue which is unlikely to happen.
  const updatedUser = await User.findOneAndUpdate ({ sso_sid: sid }, {
    $set: updateParams,
  }, {
    upsert: true,
    new: true,
  })
    .populate ('groups')
    .populate ('currentGroup')
    .populate ('currentGroup.members')
    .populate ('boards');

  return res.json (updatedUser);
});

// post /user/profile
export const updateProfilePhoto = ash (async (req, res) => {
  const { sid } = req.decoded;
  const url = req.file.location;
  logger.api.info ('post /user/profile request; sid: %s, url: %s', sid, url);
  const updatedUser = await User.findOneAndUpdate ({ sso_sid: sid }, {
    $set: {
      profilePhoto: url,
    },
  }, {
    new: true,
  })
    .populate ('groups')
    .populate ('currentGroup')
    .populate ('currentGroup.members')
    .populate ('boards');

  res.json (updatedUser);
});

// post /user/background
export const updateBakPhoto = ash (async (req, res) => {
  const { sid } = req.decoded;
  const url = req.file.location;
  logger.api.info ('post /user/background request; sid: %s, url: %s', sid, url);
  const updatedUser = await User.findOneAndUpdate ({ sso_sid: sid }, {
    $set: {
      backgroundPhoto: url,
    },
  }, {
    new: true,
  })
    .populate ('groups')
    .populate ('currentGroup')
    .populate ('currentGroup.members')
    .populate ('boards');

  res.json (updatedUser);
});

// post /user/currentGroup/:groupId
export const setCurrentGroup = ash (async (req, res) => {
  const { group, self } = req;
  const { sid } = req.decoded;
  logger.api.info ('post /user/currentGroup/:groupId request; sid: %s, groupName: %s', sid, group.name);
  self.currentGroup = group._id;
  await self.save ();
  res.json (group);
});

export const listPins = ash (async (req, res, next) => {
  const { self } = req;
  const { lastSeen } = req.query;
  if (lastSeen) return next ();
  await self
    .populate ({
      path: 'boards',
      populate: 'pins',
    })
    .execPopulate ();
  const zaboIds = self.boards[0].pins.map (pin => pin.zabo).slice (0, 30);
  const zabos = await Zabo.find ({ _id: { $in: zaboIds } });
  res.send (zabos);
});

export const listNextPins = ash (async (req, res) => {
  const { self } = req;
  const { lastSeen } = req.query;
  await self
    .populate ({
      path: 'boards',
      populate: 'pins',
    })
    .execPopulate ();
  const { pins } = self.boards[0];
  let lastSeenIndex = pins.findIndex (pin => pin.zabo.equals (lastSeen));
  lastSeenIndex = Math.max (0, lastSeenIndex);
  const lastIndex = Math.min (lastSeenIndex + 30, pins.length - 1);
  const zaboIds = pins.map (pin => pin.zabo).slice (lastSeenIndex, lastIndex);
  const zabos = await Zabo.find ({ _id: { $in: zaboIds } });
  res.send (zabos);
});
