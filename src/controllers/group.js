import { Group, User } from '../db';
import { logger } from '../utils/logger';

// get /group/:groupId
export const getGroupInfo = async (req, res) => {
  try {
    const { groupName } = req.params;
    logger.api.info ('get /group/:groupName request; groupName: %s', groupName);

    if (!groupName) {
      logger.api.error ('get /group/:groupName request error; 400 - null groupName');
      return res.status (400).json ({
        error: 'bad request: null groupName',
      });
    }

    const group = await Group.findOne ({ name: groupName });
    return res.json (group);
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};

// post /group/:groupName
export const updatePhoto = async (req, res) => {
  try {
    const { groupName } = req.params;
    logger.api.info ('post /group/:groupName request; groupName: %s', groupName);

    if (!groupName) {
      logger.api.error ('post /group/:groupName request error; 400 - null groupName');
      return res.status (400).json ({
        error: 'bad request: null groupName',
      });
    }

    return res.json ('todo');
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};

/**
 * Add user as a member if not exist,
 * update isAdmin if already a member,
 *
 * req.params.groupName : required
 * req.body.studentId : required
 * req.body.isAdmin : optional (default to false)
 */
// post /group/:groupName/member
export const updateMember = async (req, res) => {
  try {
    const { groupName } = req.params;
    const { sid } = req.decoded;
    const { studentId } = req.body;
    let { isAdmin } = req.body;
    isAdmin = isAdmin === 'true';
    logger.api.info ('post /group/:groupName/member request; groupName: %s, sid: %s, studentId: %s, isAdmin: %s', groupName, sid, studentId, isAdmin);

    if (!studentId) {
      logger.api.error ('post /group/:groupName/member request error; 400 - null studentId');
      res.status (400).json ({
        error: 'bad request: null studentId',
      });
      return;
    }

    const self = await User.findOne ({ sso_sid: sid });
    if (self.studentId === studentId) {
      logger.api.error ('post /group/:groupName/member request error; 403 - cannot change your own permission');
      res.status (403).json ({
        error: 'forbidden: cannot change your own permission',
      });
      return;
    }

    const user = await User.findOne ({ studentId });
    if (!user) {
      logger.api.error ('post /group/:groupName/member request error; 404 - student does not exist');
      res.status (404).json ({
        error: 'not found: student does not exist',
      });
      return;
    }

    const group = await Group.findOne ({
      name: groupName,
    });
    const found = group.members.find (m => (m.studentId === studentId));
    let updatedGroup;
    if (found) {
      updatedGroup = await Group.findOneAndUpdate ({
        name: groupName,
        'members.studentId': studentId,
      }, {
        $set: { 'members.$': { studentId, isAdmin } },
      }, {
        new: true,
      });
    } else {
      updatedGroup = await Group.findOneAndUpdate ({
        name: groupName,
      }, {
        $push: {
          members: {
            studentId,
            isAdmin,
          },
        },
      }, {
        new: true,
      });
      await User.findOneAndUpdate ({
        studentId,
      }, {
        $push: {
          groups: updatedGroup._id,
        },
      });
    }
    res.json (updatedGroup);
  } catch (error) {
    logger.api.error (error);
    res.status (500).json ({
      error: error.message,
    });
  }
};

// delete /group/:groupName/member
export const deleteMember = async (req, res) => {
  try {
    const { groupName } = req.params;
    const { sid } = req.decoded;
    const { studentId } = req.body;
    logger.api.info ('delete /group/:groupName/member request; groupName: %s, sid: %s, studentId: %s', groupName, sid, studentId);

    if (!studentId) {
      logger.api.error ('delete /group/:groupName/member request error; 400 - null studentId');
      return res.status (400).json ({
        error: 'bad request: null studentId',
      });
    }

    const self = await User.findOne ({ sso_sid: sid });
    if (self.studentId === studentId) {
      logger.api.error ('delete /group/:groupName/member request error; 403 - cannot change your own permission');
      return res.status (403).json ({
        error: 'forbidden: cannot change your own permission',
      });
    }

    const user = await User.findOne ({ studentId });
    if (!user) {
      logger.api.error ('delete /group/:groupName/member request error; 404 - student does not exist');
      return res.status (404).json ({
        error: 'not found: student does not exist',
      });
    }
    const group = await Group.findOneAndUpdate ({
      name: groupName,
    }, {
      $pull: {
        members: {
          studentId,
        },
      },
    }, {
      new: true,
    });

    await User.findOneAndUpdate ({ // TODO : combine with below query
      studentId,
    }, {
      $pull: {
        groups: groupName,
      },
    });
    if (group._id.equals (user.currentGroup)) {
      await User.findOneAndUpdate ({
        studentId,
      }, {
        $set: {
          currentGroup: null,
        },
      });
    }
    return res.json (group);
  } catch (error) {
    logger.api.error (error);
    return res.status (500).json ({
      error: error.message,
    });
  }
};
