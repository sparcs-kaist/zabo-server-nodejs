import mongoose from 'mongoose';
import ash from 'express-async-handler';
import moment from 'moment';
import { logger } from '../utils/logger';
import { sizeS3Item } from '../utils/aws';
import { stat } from '../utils/statistic';
import { isValidId } from '../utils';

import {
  Pin, User, Zabo, Like, Board,
} from '../db';

export const getZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('get /zabo/ request; id: %s', zaboId);

  if (!mongoose.Types.ObjectId.isValid (zaboId)) {
    logger.zabo.error ('get /zabo/ request error; 400 - invalid id');
    return res.status (400).json ({
      error: 'bad request: invalid id',
    });
  }

  let newVisit;
  if (!req.session[zaboId] || moment ().isAfter (req.session[zaboId])) {
    newVisit = true;
    req.session[zaboId] = moment ().add (30, 'seconds');
  }

  let zabo;
  if (newVisit) {
    stat.GET_ZABO (req);
    zabo = await Zabo.findByIdAndUpdate (zaboId, { $inc: { views: 1 } }, { new: true })
      .populate ('owner', 'name profilePhoto')
      .populate ('likes')
      .populate ('pins');
  } else {
    zabo = await Zabo.findOne ({ _id: zaboId })
      .populate ('owner', 'name profilePhoto')
      .populate ('likes')
      .populate ('pins');
  }

  if (!zabo) {
    logger.zabo.error ('get /zabo/ request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'not found: zabo does not exist',
    });
  }

  const result = {};
  if (sid) {
    const user = await User.findOne ({ sso_sid: sid });
    if (!user.currentGroup) {
      return res.status (403).json ({
        error: 'Requested User Is Not Currently Belonging to Any Group',
      });
    }

    const zaboLikes = zabo.likes; const
      zaboPins = zabo.pins;
    result.isLiked = !!zaboLikes.find (like => like.likedBy.equals (user._id));
    result.likedCount = zaboLikes.length;
    result.isPinned = !!zaboPins.find (pin => pin.pinnedBy.equals (user._id));
    result.pinnedCount = zaboPins.length;
  }
  return res.json ({
    ...zabo.toJSON (),
    ...result,
  });
});

export const postNewZabo = ash (async (req, res) => {
  const { title, description, endAt } = req.body;
  let { category } = req.body;
  const { sid } = req.decoded;
  logger.zabo.info (
    'post /zabo/ request; title: %s, description: %s, category: %s, endAt: %s, files info: %s',
    title,
    description,
    category,
    endAt,
    req.files,
  );
  category = (category || '').toLowerCase ().split ('#').filter (x => !!x);
  if (!req.files || !title || !description || !endAt) {
    logger.zabo.error ('post /zabo/ request error; 400');
    return res.status (400).json ({
      error: 'bad request',
    });
  }
  const user = await User.findOne ({ sso_sid: sid });
  if (!user.currentGroup) {
    return res.status (403).json ({
      error: 'Requested User Is Not Currently Belonging to Any Group',
    });
  }

  const newZabo = new Zabo ({
    owner: user.currentGroup,
    createdBy: user._id,
    title,
    description,
    category,
    endAt,
  });

  const calSizes = [];

  for (let i = 0; i < req.files.length; i += 1) {
    const s3ImageKey = req.files[i].key;
    calSizes.push (sizeS3Item (s3ImageKey));
  }

  const results = await Promise.all (calSizes);
  const photos = results.map (([dimensions, bytesRead], index) => ({
    url: req.files[index].location,
    width: dimensions.width,
    height: dimensions.height,
  }));
  newZabo.photos = newZabo.photos.concat (photos);
  await newZabo.save ();
  return res.send (newZabo);
});

export const editZabo = ash (async (req, res) => {
  const { zabo } = req;
  const { title, description, endAt } = req.body;
  let { category } = req.body;
  logger.zabo.info (
    'post /zabo/%s/edit request; title: %s, description: %s, category: %s, endAt: %s',
    zabo._id,
    title,
    description,
    category,
    endAt,
  );
  category = (category || '').toLowerCase ().split ('#').filter (x => !!x);
  zabo.title = title;
  zabo.description = description;
  zabo.category = category;
  zabo.endAt = endAt;
  await zabo.save ();
  return res.json (zabo);
});

// DANGER: Not fully implemented. Don't use
export const deleteZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  logger.zabo.info ('delete /zabo/ request; id: %s', zaboId);

  if (!zaboId) {
    logger.zabo.error ('delete /zabo/ request error; 400 - null id');
    return res.status (400).json ({
      error: 'bad request: null id',
    });
  }

  await Zabo.deleteOne ({ _id: req.body.id });
  return res.send ('zabo successfully deleted');
});

export const listZabos = ash (async (req, res, next) => {
  const { lastSeen, relatedTo } = req.query;

  if (lastSeen) return next ();

  let queryOptions = {};

  if (relatedTo) {
    const zabo = await Zabo.findOne ({ _id: relatedTo });
    if (!zabo) {
      logger.zabo.error ('get /zabo/list request error; 404 - related zabo does not exist');
      return res.status (404).json ({
        error: 'related zabo does not exist',
      });
    }
    queryOptions = { category: { $in: zabo.category }, _id: { $ne: relatedTo } };
  }

  const zabos = await Zabo.find (queryOptions)
    .sort ({ createdAt: -1 })
    .limit (20)
    .populate ('owner', 'name');
  return res.send (zabos);
});

export const listNextZabos = ash (async (req, res) => {
  const { lastSeen, relatedTo } = req.query;
  if (!isValidId (lastSeen)) {
    logger.zabo.error ('get /zabo/list request error; 400 - invalid lastSeen');
    return res.status (400).json ({
      error: 'invalid lastSeen',
    });
  }

  let queryOptions = {};

  if (relatedTo) {
    const zabo = await Zabo.findOne ({ _id: relatedTo });
    if (!zabo) {
      logger.zabo.error ('get /zabo/list request error; 404 - related zabo does not exist');
      return res.status (404).json ({
        error: 'related zabo does not exist',
      });
    }
    queryOptions = { category: { $in: zabo.category }, _id: { $ne: relatedTo } };
  }

  queryOptions = {
    ...queryOptions,
    _id: {
      ...queryOptions._id,
      $lt: lastSeen,
    },
  };
  const nextZaboList = await Zabo.find (queryOptions)
    .sort ({ createdAt: -1 })
    .limit (30)
    .populate ('owner', 'name');
  return res.json (nextZaboList);
});

export const pinZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('post /zabo/pin request; zaboId: %s, sid: %s', zaboId, sid);
  let boardId;

  const user = await User.findOne ({ sso_sid: sid });

  if (user === null) {
    logger.zabo.error ('post /zabo/pin request error; 404 - user does not exist');
    return res.status (404).json ({
      error: 'user does not exist',
    });
  }

  const userId = user._id;

  // edit zabo pins
  const zabo = await Zabo.findById (zaboId);
  if (zabo === null) {
    logger.zabo.error ('post /zabo/pin request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'zabo does not exist',
    });
  }

  // currently user has only 1 boardObject!
  [boardId] = user.boards;

  const board = await Board.findById (boardId)
    .populate ('pins');

  const result = {};
  const wasPinned = !!board.pins.find (pin => pin.zaboId.equals (zaboId));

  if (!wasPinned) {
    // create zabo pin
    const pin = await Pin.create ({
      pinnedBy: userId,
      zaboId,
      boardId,
    });

    board.pins.push (pin._id);
    zabo.pins.push (pin._id);
    await Promise.all ([board.save (), zabo.save ()]);

    result.isPinned = true;
    result.pinnedCount = zabo.pins.length;
    return res.send (result);
  }

  // delete zabo pin
  const deletedPin = await Pin.findOneAndDelete ({ zaboId, boardId });
  logger.zabo.info ('post /zabo/pin request; deleted zabo pins: %s', deletedPin);

  const boardNewPins = board.pins.filter (pin => !pin.equals (deletedPin._id));
  const zaboNewPins = zabo.pins.filter (pin => !pin.equals (deletedPin._id));
  logger.zabo.info ('delete /zabo/pin request; edited board,zabo pins: %s');
  board.pins = boardNewPins;
  zabo.pins = zaboNewPins;
  await Promise.all ([board.save (), zabo.save ()]);

  result.isPinned = false;
  result.pinnedCount = zabo.pins.length;
  return res.send (result);
});

export const deletePin = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('delete /zabo/pin request; zaboId: %s, sid: %s', zaboId, sid);
  let boardId;

  // find boardId of user
  const user = await User.findOne ({ sso_sid: sid });
  if (!user) {
    logger.zabo.error ('delete /zabo/pin request error; 404 - user does not exist');
    return res.status (404).json ({
      error: 'not found: user does not exist',
    });
  }
  [boardId] = user.boards;

  // delete the pin
  const deletedPin = await Pin.findOneAndDelete ({ zaboId, boardId });

  // edit zabo pins
  const zabo = await Zabo.findById (zaboId);
  if (!zabo) {
    logger.zabo.error ('delete /zabo/pin request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'not found: zabo does not exist',
    });
  }
  const newPins = zabo.pins.filter (pin => !pin.equals (deletedPin._id));
  logger.zabo.info ('delete /zabo/pin request; edited zabo pins: %s', newPins);
  zabo.pins = newPins;
  await zabo.save ();
  return res.send ({ zabo });
});

export const likeZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('post /zabo/like request; zaboId: %s, sid: %s', zaboId, sid);

  const user = await User.findOne ({ sso_sid: sid })
    .populate ('likes');

  if (user === null) {
    logger.zabo.error ('post /zabo/like request error; 404 - user does not exist');
    return res.status (404).json ({
      error: 'user does not exist',
    });
  }
  const userId = user._id;

  // edit zabo likes
  const zabo = await Zabo.findById (zaboId)
    .populate ('likes');
  if (zabo === null) {
    logger.zabo.error ('post /zabo/pin request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'zabo does not exist',
    });
  }
  const result = {};
  const wasLiked = !!zabo.likes.find (like => like.likedBy.equals (user._id));

  if (!wasLiked) {
    // create zabo like
    const like = await Like.create ({
      likedBy: userId,
      zaboId,
    });

    user.likes.push (like._id);
    zabo.likes.push (like._id);
    await Promise.all ([user.save (), zabo.save ()]);

    result.isLiked = true;
    result.likedCount = zabo.likes.length;
    return res.send (result);
  }

  // delete zabo like
  const deletedLike = await Like.findOneAndDelete ({ likedBy: userId, zaboId });
  logger.zabo.info ('post /zabo/like request; deleted like: %s', deletedLike);

  const userNewLikes = user.likes.filter (like => !like.equals (deletedLike._id));
  const zaboNewLikes = zabo.likes.filter (like => !like.equals (deletedLike._id));
  logger.zabo.info ('post /zabo/like request; edited user,zabo likes');
  user.likes = userNewLikes;
  zabo.likes = zaboNewLikes;
  await Promise.all ([user.save (), zabo.save ()]);

  result.isLiked = false;
  result.likedCount = zabo.likes.length;
  return res.send (result);
});
