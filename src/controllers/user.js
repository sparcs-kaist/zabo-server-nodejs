import { Group, User } from '../db';
import { logger } from '../utils/logger';

// post /user
export const updateUserInfo = async (req, res) => {
  try {
    const { sid } = req.decoded;
    const { username } = req.body;
    logger.api.info ('post /user/ request; sid: %s, username: %s', sid, username);
    const [userTaken, groupTaken] = await Promise.all ([
      User.findOne ({ username }),
      Group.findOne ({ name: username }),
    ]);
    if (userTaken || groupTaken) {
      return res.status (400).json ({
        error: `'${username}' has already been taken.`,
      });
    }
    // Ignore very rare timing issue which is unlikely to happen.
    const updatedUser = await User.findOneAndUpdate ({ sso_sid: sid }, {
      $set: {
        username,
      },
    }, {
      upsert: true,
      new: true,
    })
      .populate ('groups')
      .populate ('currentGroup')
      .populate ('currentGroup.members')
      .populate ('boards');

    return res.json (updatedUser);
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};

// post /user/profile
export const updateProfilePhoto = async (req, res) => {
  try {
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
  } catch (error) {
    logger.api.error (error);
    res.status (500).json ({
      error: error.message,
    });
  }
};

// get /user/
export const getUserInfo = async (req, res) => {
  try {
    const { sid } = req.decoded;
    logger.api.info ('get /user/ request; sid: %s', sid);

    const user = await User.findOne ({ sso_sid: sid })
      .populate ('groups')
      .populate ('currentGroup')
      .populate ('currentGroup.members')
      .populate ('boards');
    res.json (user);
  } catch (error) {
    logger.api.error (error);
    res.status (500).json ({
      error: error.message,
    });
  }
};

// post /user/currentGroup/:groupId
export const setCurrentGroup = async (req, res) => {
  try {
    const { sid } = req.decoded;
    const { groupId } = req.params;
    logger.api.info ('post /user/currentGroup/:groupId request; sid: %s, groupId: %s', sid, groupId);

    const user = await User.findOneAndUpdate ({ sso_sid: sid }, {
      $set: {
        currentGroup: groupId,
      },
    }, {
      new: true,
      projection: 'currentGroup',
      populate: {
        path: 'currentGroup',
      },
    });
    res.json (user);
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};
