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
      .populate ('pins', 'pinnedBy board');
  } else {
    zabo = await Zabo.findOne ({ _id: zaboId })
      .populate ('owner', 'name profilePhoto')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }
  if (!zabo) {
    logger.zabo.error ('get /zabo/ request error; 404 - zabo does not exist');
    return res.status (404).json ({
      error: 'not found: zabo does not exist',
    });
  }
  const zaboJSON = zabo.toJSON ();
  if (sid) {
    const { likes, pins } = zabo;
    const user = await User.findOne ({ sso_sid: sid });
    zaboJSON.isLiked = !!likes.find (like => like.likedBy.equals (user._id));
    zaboJSON.isPinned = !!pins.find (pin => pin.pinnedBy.equals (user._id));
  }
  return res.json (zaboJSON);
});

export const postNewZabo = ash (async (req, res) => {
  const { self } = req;
  const { title, description, endAt } = req.body;
  let { category } = req.body;
  logger.zabo.info (
    'post /zabo/ request; by: %s, title: %s, description: %s, category: %s, endAt: %s, files info: %s',
    self.username,
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
  if (!self.currentGroup) {
    return res.status (403).json ({
      error: 'Requested User Is Not Currently Belonging to Any Group',
    });
  }

  const newZabo = new Zabo ({
    owner: self.currentGroup,
    createdBy: self._id,
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
  const { zaboId } = req;
  logger.zabo.info ('delete /zabo/ request; id: %s', zaboId);
  await Zabo.deleteOne ({ _id: zaboId });
  return res.send (true);
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
  const { zabo, self, zaboId } = req;
  logger.zabo.info (`post /zabo/pin request; zaboId: ${zaboId}, by: ${self.username} (${self.sso_sid})`);

  // currently user has only 1 boardObject!
  await self
    .populate ({
      path: 'boards',
      populate: 'pins',
    })
    .execPopulate ();
  const [board] = self.boards;
  const wasPinned = !!board.pins.find (pin => pin.zabo.equals (zaboId));

  if (!wasPinned) {
    // create zabo pin
    const pin = await Pin.create ({
      pinnedBy: self._id,
      zabo: zaboId,
      board: board._id,
    });

    board.pins.push (pin._id);
    zabo.pins.push (pin._id);
    await Promise.all ([board.save (), zabo.save ()]);

    return res.send ({
      isPinned: true,
      pinsCount: zabo.pins.length,
    });
  }

  // delete zabo pin
  const deletedPin = await Pin.findOneAndDelete ({ zabo: zaboId, board: board._id });
  board.pins = board.pins.filter (pinId => !pinId.equals (deletedPin._id));
  zabo.pins = zabo.pins.filter (pinId => !pinId.equals (deletedPin._id));
  await Promise.all ([board.save (), zabo.save ()]);
  return res.send ({
    isPinned: true,
    pinsCount: zabo.pins.length,
  });
});

export const likeZabo = ash (async (req, res) => {
  const { self, zabo, zaboId } = req;
  logger.zabo.info (`post /zabo/like request; zaboId: ${zaboId}, by: ${self.username} (${self.sso_sid})`);
  await Promise.all ([
    self.populate ('likes').execPopulate (),
    zabo.populate ('likes').execPopulate (),
  ]);
  const wasLiked = !!zabo.likes.find (like => like.likedBy.equals (self._id));

  if (!wasLiked) {
    const like = await Like.create ({
      likedBy: self._id,
      zabo: zaboId,
    });

    self.likes.push (like._id);
    zabo.likes.push (like._id);
    await Promise.all ([self.save (), zabo.save ()]);

    return res.send ({
      isLiked: true,
      likesCount: zabo.likes.length,
    });
  }

  // delete zabo like
  const deletedLike = await Like.findOneAndDelete ({ likedBy: self._id, zabo: zaboId });
  self.likes = self.likes.filter (like => !like.equals (deletedLike._id));
  zabo.likes = zabo.likes.filter (like => !like.equals (deletedLike._id));
  await Promise.all ([self.save (), zabo.save ()]);
  return res.send ({
    isLiked: false,
    likesCount: zabo.likes.length,
  });
});
