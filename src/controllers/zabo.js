import mongoose from 'mongoose';
import ash from 'express-async-handler';
import { logger } from '../utils/logger';
import { sizeS3Item } from '../utils/aws';
import { stat } from '../utils/statistic';
import { isValidId } from '../utils';

import {
  Pin, User, Zabo, Like,
} from '../db';

export const getZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('get /zabo/ request; id: %s', zaboId);
  if (!zaboId) {
    logger.zabo.error ('get /zabo/ request error; 400 - null id');
    return res.status (400).json ({
      error: 'bad request: null id',
    });
  }
  stat.GET_ZABO (req);

  if (!mongoose.Types.ObjectId.isValid (zaboId)) {
    logger.zabo.error ('get /zabo/ request error; 400 - invalid id');
    return res.status (400).json ({
      error: 'bad request: invalid id',
    });
  }
  const zabo = await Zabo.findOne ({ _id: zaboId })
    .populate ('owner', 'name profilePhoto')
    .populate ('likes');

  if (!zabo) {
    logger.zabo.error ('get /zabo/ request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'not found: zabo does not exist',
    });
  }

  let result;
  if (sid) {
    const user = await User.findOne ({ sso_sid: sid });
    if (!user.currentGroup) {
      return res.status (403).json ({
        error: 'Requested User Is Not Currently Belonging to Any Group',
      });
    }

    // zabo.likes
    result.isLiked = !!zabo.likes.find (like => like.likedBy.equals (user._id));
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

  if (!zaboId) {
    logger.zabo.error ('post /zabo/pin request error; 400 - null id');
    return res.status (400).json ({
      error: 'null id',
    });
  }

  if (!mongoose.Types.ObjectId.isValid (zaboId)) {
    logger.zabo.error ('post /zabo/pin request error; 400 - invalid id');
    return res.status (400).json ({
      error: 'invalid id',
    });
  }

  // find boardId of user
  const user = await User.findOne ({ sso_sid: sid });
  if (user === null) {
    logger.zabo.error ('post /zabo/pin request error; 404 - user does not exist');
    return res.status (404).json ({
      error: 'user does not exist',
    });
  }
  [boardId] = user.boards;

  const userId = user._id;

  // edit zabo pins
  const zabo = await Zabo.findById (zaboId);
  if (zabo === null) {
    logger.zabo.error ('post /zabo/pin request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'zabo does not exist',
    });
  }

  const newPin = new Pin ({
    pinnedBy: userId,
    zaboId,
    boardId,
  });

  // save new pin
  const pin = await newPin.save ();

  zabo.pins.push (pin._id);
  await zabo.save ();

  return res.send ({ zabo, newPin });
});

export const deletePin = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { sid } = req.decoded;
  logger.zabo.info ('delete /zabo/pin request; zaboId: %s, sid: %s', zaboId, sid);
  let boardId;

  if (!zaboId) {
    logger.zabo.error ('delete /zabo/pin request error; 400 - null id');
    return res.status (400).json ({
      error: 'bad request: null id',
    });
  }

  if (!mongoose.Types.ObjectId.isValid (zaboId)) {
    logger.zabo.error ('delete /zabo/pin request error; 400 - invalid id');
    return res.status (400).json ({
      error: 'bad request: invalid id',
    });
  }

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
  logger.zabo.info ('delete /zabo/pin request; deleted pin: %s', deletedPin);

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

  if (!zaboId) {
    logger.zabo.error ('post /zabo/like request error; 400 - null id');
    return res.status (400).json ({
      error: 'null id',
    });
  }

  if (!mongoose.Types.ObjectId.isValid (zaboId)) {
    logger.zabo.error ('post /zabo/like request error; 400 0 invalid id');
    return res.status (400).json ({
      error: 'invalid id',
    });
  }

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

  const isLiked = !!zabo.likes.find (like => like.likedBy.equals (user._id));

  if (!isLiked) {
    // create zabo like
    const newLike = new Like ({
      likedBy: userId,
      zaboId,
    });

    const like = await newLike.save ();

    // update user.likes info
    user.likes.push (like._id);
    await user.save ();
    // update zabo.likes info
    zabo.likes.push (like._id);
    await zabo.save ();

    // return res.send ({ zabo, newLike });
    return res.send (true);
  }

  // delete zabo like
  const deletedLike = await Like.findOneAndDelete ({ likedBy: userId, zaboId });
  logger.zabo.info ('post /zabo/like request; deleted like: %s', deletedLike);

  const newLikes = zabo.likes.filter (like => !like.equals (deletedLike._id));
  logger.zabo.info ('post /zabo/like request; edited user,zabo likes: %s', newLikes);
  user.likes = newLikes;
  zabo.likes = newLikes;
  await zabo.save ();

  // return res.send ({ zabo });
  return res.send (false);
});
