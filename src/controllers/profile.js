import ash from 'express-async-handler';
import {
  Board, Follow, Zabo,
} from '../db';
import { nameUsabilityCheck, validateName } from '../utils';

export const validateNameController = ash (async (req, res) => {
  const { name } = req.params;
  const isValid = validateName (name);
  if (!isValid) {
    return res.status (400).json ({
      message: 'invalid',
    });
  }
  const [, , usability] = await nameUsabilityCheck (name);
  if (!usability) {
    return res.status (400).json ({
      message: 'taken',
    });
  }
  return res.json (true);
});

const getGroupProfile = ash (async (req, res) => {
  const { group, self } = req;
  const zabosCount = await Zabo.countDocuments ({ owner: group._id });
  let myRole = '';
  let following = false;
  if (self) {
    const selfMember = group.members.find (member => member.user.equals (self._id));
    myRole = selfMember ? selfMember.role : '';
    following = group.followers.some (follower => follower.equals (self._id));
  }
  if (myRole) {
    await group.populate ({
      path: 'members.user',
      select: 'username koreanName lastName firstName _id profilePhoto',
    }).execPopulate ();
  } else {
    // TODO: Hide group.members
  }
  return res.json ({
    ...group.toJSON ({ virtuals: true }),
    zabosCount,
    myRole,
    following,
  });
});

const getUserProfile = ash (async (req, res) => {
  const { user, self } = req;
  const result = await user
    .populate ('groups')
    .populate ('boards')
    .execPopulate ();

  const { groups } = user.toJSON ({ virtuals: true });
  const counts = await Zabo.aggregate ([
    { $match: { owner: { $in: groups.map (group => group._id) } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  for (let i = 0; i < groups.length; i += 1) {
    const count = counts.find (count => groups[i]._id.equals (count._id));
    groups[i].zabosCount = count ? count.count : 0;
  }
  const [boardId] = user.boards;
  const board = await Board.findById (boardId);
  const pinsCount = board.pins.length;
  let own = false;
  let following = false;
  if (self) {
    own = self._id.equals (user._id);
    if (!own) following = user.followers.some (follower => follower.equals (self._id));
  }
  return res.json ({
    ...result.toJSON ({ virtuals: true }),
    groups,
    pinsCount,
    own,
    following,
  });
});

export const getProfile = ash (async (req, res) => {
  const { user, group } = req;
  if (group) {
    return getGroupProfile (req, res);
  }
  if (user) {
    return getUserProfile (req, res);
  }
  throw new Error ('Cannot reach here');
});

export const followController = ash (async (req, res) => {
  const { self, user, profile } = req;
  const prevFollow = self.followings.find (following => following.followee.equals (profile._id));
  if (prevFollow) {
    self.followings.pull (prevFollow);
    profile.followers = profile.followers.pull (self._id);
    await Promise.all ([
      self.save (),
      profile.save (),
    ]);
    return res.send ({
      following: false,
      followersCount: profile.followers.length,
    });
  }
  profile.followers.push (self._id);
  self.followings.push ({
    followee: profile._id,
    onModel: user ? 'User' : 'Group',
  });
  await Promise.all ([profile.save (), self.save ()]);
  return res.send ({
    following: true,
    followersCount: profile.followers.length,
  });
});
