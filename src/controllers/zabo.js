import ash from 'express-async-handler';
import moment from 'moment';
import { logger } from '../utils/logger';
import { sizeS3Item } from '../utils/aws';
import { statZabo } from '../utils/statistic';
import {
  User, Zabo, Group, Board, DeletedZabo,
} from '../db';
import { isValidId, parseJSON } from '../utils';
import { populateZaboPrivateStats, populateZabosPrivateStats } from '../utils/populate';

export const getZabo = ash (async (req, res) => {
  const { zaboId } = req.params;
  const { self } = req;
  let newVisit;
  if (req.get ('User-Agent').length > 20 && (!req.session[zaboId] || moment ().isAfter (req.session[zaboId]))) {
    newVisit = true;
    req.session[zaboId] = moment ().add (30, 'seconds');
  }
  let zabo;
  if (newVisit) {
    statZabo ({ zaboId, decoded: req.decoded });
    zabo = await Zabo.findByIdAndUpdate (zaboId, { $inc: { views: 1, effectiveViews: 1 } }, { new: true })
      .populate ('owner', 'name profilePhoto subtitle description');
  } else {
    zabo = await Zabo.findByIdAndUpdate (zaboId, { $inc: { views: 1 } }, { new: true })
      .populate ('owner', 'name profilePhoto subtitle description');
  }
  if (!zabo) {
    logger.zabo.error ('get /zabo/ request error; 404 - zabo does not exist - id: %s', zaboId);
    return res.status (404).json ({
      error: 'not found: zabo does not exist',
    });
  }
  const zaboJSON = populateZaboPrivateStats (zabo, self);
  if (self) {
    zaboJSON.isMyZabo = self.groups.some (group => group.equals (zaboJSON.owner._id));
    zaboJSON.owner.following = self.followings.some (following => following.followee.equals (zaboJSON.owner._id));
    if (zaboJSON.isMyZabo) zaboJSON.createdBy = await User.findById (zaboJSON.createdBy, 'username');
    else delete zaboJSON.createdBy;
  } else {
    delete zaboJSON.createdBy;
  }
  return res.json (zaboJSON);
});

export const postNewZabo = ash (async (req, res) => {
  const { self } = req;
  const { title, description, schedules: jsonSchedules } = req.body;
  const schedules = parseJSON (jsonSchedules, []);
  let { category } = req.body;
  logger.zabo.info (
    'post /zabo/ request; by: %s, title: %s, description: %s, category: %s, schedules: %s, files info: %s',
    self.username,
    title,
    description,
    category,
    schedules,
    req.files,
  );
  category = (category || '').toLowerCase ().split ('#').filter (x => !!x);
  if (!req.files || !title || !description) {
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
    schedules,
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
    .populate ('owner', 'name profilePhoto subtitle description')
    .execPopulate ();
  const zaboJSON = newZabo.toJSON ();
  zaboJSON.isLiked = false;
  zaboJSON.isPinned = false;

  return res.send (zaboJSON);
});

export const editZabo = ash (async (req, res) => {
  const { zabo } = req;
  const { title, description, schedules = [] } = req.body;
  let { category } = req.body;
  logger.zabo.info (
    'post /zabo/%s/edit request; title: %s, description: %s, category: %s, schedules: %s',
    zabo._id,
    title,
    description,
    category,
    schedules,
  );
  category = (category || '').toLowerCase ().split ('#').filter (x => !!x);
  zabo.title = title;
  zabo.description = description;
  zabo.category = category;
  zabo.schedules = schedules;
  await zabo.save ();
  return res.json ({
    title: zabo.title,
    description: zabo.description,
    category: zabo.category,
    schedules: zabo.schedules,
  });
});

export const deleteZabo = ash (async (req, res) => {
  const { zaboId, zabo } = req;
  logger.zabo.info ('delete /zabo/ request; id: %s', zaboId);
  try {
    const [, deleted] = await Promise.all ([
      Board.updateMany ({ pins: zaboId }, { $pull: { pins: zaboId } }),
      Zabo.findOneAndDelete ({ _id: zaboId }),
    ]);
    const newDeletedZabo = deleted.toJSON ({ virtuals: false });
    delete newDeletedZabo._id;
    newDeletedZabo.photos.forEach ((photo, i) => {
      delete newDeletedZabo.photos[i]._id;
    });
    await DeletedZabo.create (newDeletedZabo);
  } catch (error) {
    logger.zabo.error ('===> Error occured while deleting zabo - %s', zaboId);
    logger.zabo.error ('=> %s', error);
    throw error;
  }
  return res.send (true);
});

const queryZabos = async (req, queryOptions) => {
  const zabos = await Zabo.find (queryOptions)
    .sort ({ score: -1 })
    .limit (20)
    .populate ('owner', 'name profilePhoto subtitle description');
  return populateZabosPrivateStats (zabos, req.self);
};

export const listHotZabos = ash (async (req, res) => {
  const zabos = await queryZabos (req, { $where: 'this.likesWithTime.length > 5' }); // TODO: Store likes count with pre
  // save
  // or some other hooks
  const results = [];
  let minIndex = 0;
  zabos.forEach (zabo => {
    const zaboJSON = zabo.toJSON ();
    if (results.length < 3) {
      results.push (zaboJSON);
      if (results[minIndex].likesCount >= zaboJSON.likesCount) minIndex = results.length - 1;
      return;
    }
    if (results[minIndex].likesCount < zaboJSON.likesCount) {
      results.splice (0, 1);
      results.push (zaboJSON);
      minIndex = 0;
      if (results[1].likesCount <= results[minIndex].likesCount) minIndex = 1;
      if (results[2].likesCount <= results[minIndex].likesCount) minIndex = 2;
    }
  });
  return res.json (results);
});

export const listMagamImbakList = ash (async (req, res) => {
  const cur = new Date ();
  const nextWeek = new Date (+new Date () + 7 * 24 * 60 * 60 * 1000);
  const zabos = await Zabo.find ({ schedules: { $elemMatch: { startAt: { $lt: nextWeek, $gt: cur } } } });
  return res.json (zabos);
});

export const listZabos = ash (async (req, res, next) => {
  const { lastSeen, relatedTo } = req.query;
  if (lastSeen) return next ();
  let queryOptions = {};
  if (relatedTo) {
    const zabo = isValidId (relatedTo) && await Zabo.findOne ({ _id: relatedTo });
    if (!zabo) {
      logger.zabo.error ('get /zabo/list request error; 404 - zabo does not exist');
      return res.status (404).json ({
        error: 'zabo does not exist',
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
    const zabo = await Zabo.findById (relatedTo);
    if (!zabo) {
      logger.zabo.error ('get /zabo/list request error; 404 - related zabo does not exist');
      return res.status (404).json ({
        error: 'related zabo does not exist',
      });
    }
    queryOptions = { category: { $in: zabo.category }, _id: { $ne: relatedTo } };
  }
  if (lastSeen) {
    const lastSeenZabo = await Zabo.findById (lastSeen, 'score');
    queryOptions.score = {
      $lt: lastSeenZabo.score,
    };
  }
  const result = await queryZabos (req, queryOptions);
  return res.send (result);
});

export const pinZabo = ash (async (req, res) => {
  const { zabo, self, zaboId } = req;
  logger.zabo.info (`post /zabo/pin request; zaboId: ${zaboId}, by: ${self.username} (${self.sso_sid})`);

  // currently user has only 1 boardObject!
  await self
    .populate ('boards')
    .execPopulate ();
  const [board] = self.boards;
  const prevPin = board.pins.find (pin => pin.equals (zaboId));

  if (prevPin) {
    // TODO: Transaction
    board.pins.pull (zaboId);
    zabo.pins.pull (board._id);
    await Promise.all ([
      board.save (),
      zabo.save (),
    ]);
    return res.send ({
      isPinned: false,
      pinsCount: zabo.pins.length,
    });
  }
  board.pins.push (zaboId);
  zabo.pins.push (board._id);
  await Promise.all ([board.save (), zabo.save ()]);

  return res.send ({
    isPinned: true,
    pinsCount: zabo.pins.length,
  });
});

export const likeZabo = ash (async (req, res) => {
  const { self, zabo, zaboId } = req;
  logger.zabo.info (`post /zabo/like request; zaboId: ${zaboId}, by: ${self.username} (${self.sso_sid})`);
  const prevLike = zabo.likesWithTime.find (like => like.user.equals (self._id));
  if (prevLike) {
    zabo.likesWithTime.pull (prevLike);
    await zabo.save ();
    return res.send ({
      isLiked: false,
      likesCount: zabo.likesWithTime.length,
    });
  }
  zabo.likesWithTime.push ({ user: self._id });
  await zabo.save ();
  return res.send ({
    isLiked: true,
    likesCount: zabo.likesWithTime.length,
  });
});
