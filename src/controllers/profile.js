import ash from 'express-async-handler';
import { User, Group, Board } from '../db';

export const getProfile = ash (async (req, res) => {
  const { name } = req.params;
  const [user, group] = await Promise.all ([
    User.findOne ({ username: name }),
    Group.findOne ({ name }),
  ]);
  if (user) {
    const result = await user
      .populate ('groups')
      .populate ('currentGroup')
      .populate ('currentGroup.members')
      .populate ('boards')
      .populate ('likes')
      .execPopulate ();

    const [boardId] = user.boards;
    const board = await Board.findById (boardId)
      .populate ('pins');

    const likesNum = result.likes.length;
    const pinsNum = board.pins.length;
    return res.json ({
      ...result.toJSON (),
      likesNum,
      pinsNum,
    });
  }
  if (group) {
    return res.json (group);
  }
  return res.status (404).json ({
    error: 'user and group with given name does not exist',
  });
});
