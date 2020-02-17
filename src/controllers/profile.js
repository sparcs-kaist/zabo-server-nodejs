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
  if (self) {
    const selfMember = group.members.find (member => member.user.equals (self._id));
    myRole = selfMember ? selfMember.role : '';
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
  if (self) {
    own = self._id.equals (user._id);
  }
  return res.json ({
    ...result.toJSON ({ virtuals: true }),
    groups,
    pinsCount,
    own,
  });
});

export const getProfile = ash (async (req, res) => {
  const { user, group, self } = req;
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
  const onModel = user ? 'User' : 'Group';
  const prevFollow = profile.followers.find (follower => follower.equals (self._id));
  if (prevFollow) {
    self.followings = self.followings.filter (follow => follow.equals (prevFollow._id));
    profile.followers = profile.followers.filter (follower => follower.equals (prevFollow._id));
    await Promise.all ([
      Follow.deleteOne ({ _id: prevFollow._id }),
      self.followings.pull ({ _id: prevFollow._id }),
      profile.followers.pull ({ _id: prevFollow._id }),
    ]);
    return res.send ({
      following: false,
    });
  }
  const follow = await Follow.create ({
    followee: profile._id,
    follower: self._id,
    onModel,
  });
  profile.followers.push (follow._id);
  self.followings.push (follow._id);
  await Promise.all ([profile.save (), self.save ()]);
  return res.send ({
    following: true,
  });
});
