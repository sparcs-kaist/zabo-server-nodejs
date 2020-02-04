import ash from 'express-async-handler';
import moment from 'moment';
import { logger } from '../utils/logger';
import { sizeS3Item } from '../utils/aws';
import { stat } from '../utils/statistic';
import {
  User, Pin, Zabo, Like, Group,
} from '../db';

export const getZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
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
  const { self } = req;
  if (self) {
    const { likes, pins } = zabo;
    zaboJSON.isLiked = !!likes.find (like => like.likedBy.equals (self._id));
    zaboJSON.isPinned = !!pins.find (pin => pin.pinnedBy.equals (self._id));
    zaboJSON.isMyZabo = !!self.groups.find (group => group.equals (zaboJSON.owner._id));
    if (zaboJSON.isMyZabo) zaboJSON.createdBy = await User.findById (zaboJSON.createdBy, 'username');
    else delete zaboJSON.createdBy;
  } else {
    delete zaboJSON.createdBy;
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
  await Promise.all ([
    newZabo.save (),
    Group.findByIdAndUpdate (self.currentGroup, { $set: { recentUpload: new Date () } }),
  ]);
  await newZabo
    .populate ('owner', 'name profilePhoto')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board')
    .execPopulate ();
  const zaboJSON = newZabo.toJSON ();
  zaboJSON.isLiked = false;
  zaboJSON.isPinned = false;

  return res.send (zaboJSON);
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

const queryZabos = async (req, queryOptions) => {
  const zabos = await Zabo.find (queryOptions)
    .sort ({ createdAt: -1 })
    .limit (20)
    .populate ('owner', 'name')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board');

  let result = zabos;
  const { self } = req;
  if (self) {
    result = zabos.map (zabo => {
      const zaboJSON = zabo.toJSON ();
      const { likes, pins } = zabo;
      return {
        ...zaboJSON,
        isLiked: !!likes.find (like => self._id.equals (like.likedBy)),
        isPinned: !!pins.find (pin => self._id.equals (pin.pinnedBy)),
      };
    });
  }
  return result;
};

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
  const result = await queryZabos (req, queryOptions);
  return res.send (result);
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
  const result = await queryZabos (req, queryOptions);
  return res.send (result);
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
  const prevPin = board.pins.find (pin => pin.zabo.equals (zaboId));

  if (prevPin) {
    board.pins.pull ({ _id: prevPin._id });
    zabo.pins.pull ({ _id: prevPin._id });
    await Promise.all ([
      Pin.deleteOne ({ _id: prevPin._id }),
      board.save (),
      zabo.save (),
    ]);
    return res.send ({
      isPinned: false,
      pinsCount: zabo.pins.length,
    });
  }
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
});

export const likeZabo = ash (async (req, res) => {
  const { self, zabo, zaboId } = req;
  logger.zabo.info (`post /zabo/like request; zaboId: ${zaboId}, by: ${self.username} (${self.sso_sid})`);
  await Promise.all ([
    self.populate ('likes').execPopulate (),
    zabo.populate ('likes').execPopulate (),
  ]);
  const prevLike = zabo.likes.find (like => like.likedBy.equals (self._id));

  if (prevLike) {
    self.likes.pull ({ _id: prevLike._id });
    zabo.likes.pull ({ _id: prevLike._id });
    await Promise.all ([
      Like.deleteOne ({ _id: prevLike._id }),
      self.save (),
      zabo.save (),
    ]);
    return res.send ({
      isLiked: false,
      likesCount: zabo.likes.length,
    });
  }

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
});
