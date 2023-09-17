import ash from "express-async-handler";
import { GroupApply, User } from "../db";
import { logger } from "../utils/logger";
import { isNameInvalidWithRes } from "../utils";
import { populateZabosPrivateStats } from "../utils/populate";

// get /user/
export const getUserInfo = ash(async (req, res) => {
  const { sid } = req.decoded;
  logger.api.info("get /user/ request; sid: %s", sid);

  const user = await User.findOne({ sso_sid: sid })
    .populate("groups")
    .populate("boards");
  const groupApplies = await GroupApply.find({
    members: { $elemMatch: { user: user._id } },
  });
  const userJSON = user.toJSON();
  userJSON.pendingGroups = groupApplies;
  res.json(userJSON);
});

// post /user
export const updateUserInfo = ash(async (req, res) => {
  const { sid } = req.decoded;
  const { username, description } = req.body;
  const { file } = req;
  logger.api.info(
    "post /user/ request; sid: %s, username: %s, description: %s %s",
    sid,
    username,
    description,
    file ? `image: ${file.location}` : "",
  );
  const updateParams = { description };
  const self = await User.findOne({ sso_sid: sid });
  if (self.username !== username) {
    const error = await isNameInvalidWithRes(username, req, res);
    if (error) return error;
    updateParams.username = username;
  }
  if (file) updateParams.profilePhoto = file.location;
  // Ignore very rare timing issue which is unlikely to happen.
  const updatedUser = await User.findOneAndUpdate(
    { sso_sid: sid },
    {
      $set: updateParams,
    },
    {
      upsert: true,
      new: true,
    },
  ).select("username description profilePhoto");

  return res.json(updatedUser);
});

// post /user/profile
export const updateProfilePhoto = ash(async (req, res) => {
  const { sid } = req.decoded;
  const url = req.file.location;
  logger.api.info("post /user/profile request; sid: %s, url: %s", sid, url);
  const updatedUser = await User.findOneAndUpdate(
    { sso_sid: sid },
    {
      $set: {
        profilePhoto: url,
      },
    },
    {
      new: true,
    },
  );

  return res.json({
    profilePhoto: updatedUser.profilePhoto,
  });
});

// post /user/background
export const updateBakPhoto = ash(async (req, res) => {
  const { sid } = req.decoded;
  const url = req.file.location;
  logger.api.info("post /user/background request; sid: %s, url: %s", sid, url);
  const updatedUser = await User.findOneAndUpdate(
    { sso_sid: sid },
    {
      $set: {
        backgroundPhoto: url,
      },
    },
    {
      new: true,
    },
  );

  res.json({
    backgroundPhoto: updatedUser.backgroundPhoto,
  });
});

// post /user/currentGroup/:groupId
export const setCurrentGroup = ash(async (req, res) => {
  const { group, self } = req;
  const { sid } = req.decoded;
  logger.api.info(
    "post /user/currentGroup/:groupId request; sid: %s, groupName: %s",
    sid,
    group.name,
  );
  self.currentGroup = group._id;
  await self.save();
  res.json({
    currentGroup: self.currentGroup,
  });
});

export const listPins = ash(async (req, res, next) => {
  const { user } = req;
  const { lastSeen } = req.query;
  if (lastSeen) return next();
  await user
    .populate({
      path: "boards",
      populate: {
        path: "pins",
        populate: "owner",
        project: "name",
      },
      options: {
        sort: { createdAt: -1 },
      },
    })
    .execPopulate();
  const zabos = user.boards[0].pins;
  const result = populateZabosPrivateStats(zabos, req.self);
  return res.send(result); // TODO: Limit and hand it to listNextPins
});

// const { self } = req;
// const { lastSeen } = req.query;
export const listNextPins = ash(async (req, res) => res.send([])); // TODO
