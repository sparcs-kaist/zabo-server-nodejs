import ash from 'express-async-handler';
import { Group, User, Zabo } from '../db';
import { logger } from '../utils/logger';
import { statSearch } from '../utils/statistic';

const splitTagNText = (query) => {
  const split = query.trim ().split ('#');
  const tags = split
    .slice (1)
    .map (trimmed => trimmed.split (' ')[0]);
  const searchQuery = [
    split[0],
    ...split
      .slice (1)
      .map (trimmed => trimmed.split (' ').slice (1).join (' ')),
  ]
    .join (' ')
    .trim ();

  return { tags, searchQuery };
};

export const getSimpleSearch = ash (async (req, res) => {
  const { safeQuery, safeCategory } = req;
  let [zabos, groups] = await Promise.all ([
    Zabo.searchFull (safeQuery, safeCategory)
      .select ({ title: 1 }),
    Group.searchPartial (safeQuery)
      .select ({ name: 1, profilePhoto: 1 }),
  ]);
  if (zabos.length < 10) {
    zabos = await Zabo.searchPartial (safeQuery, safeCategory)
      .select ({ title: 1 });
  }
  return res.json ({
    zabos,
    groups,
  });
});

export const getSearch = ash (async (req, res) => {
  const { safeQuery, safeCategory } = req;
  const { stat } = req.query;
  logger.info ('get /search request; query: %s, category: %s', safeQuery, safeCategory);
  if (stat) statSearch ({ query: safeQuery, category: safeCategory, decoded: req.decoded });

  // TODO : Cache search result using REDIS
  let [zabos, groupResult] = await Promise.all ([
    Zabo.searchFull (safeQuery, safeCategory)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board'),
    Group.searchPartial (safeQuery),
  ]);

  if (zabos.length < 10) {
    zabos = await Zabo.searchPartial (safeQuery, safeCategory)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }

  const groups = groupResult.map (group => group.toJSON ({ virtuals: true }));
  const counts = await Zabo.aggregate ([
    { $match: { owner: { $in: groups.map (group => group._id) } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  for (let i = 0; i < groups.length; i += 1) {
    const count = counts.find (count => groups[i]._id.equals (count._id));
    groups[i].zabosCount = count ? count.count : 0;
  }

  return res.json ({
    zabos,
    groups,
  });
});

export const getUserSearch = ash (async (req, res) => {
  const { safeQuery } = req;
  logger.info ('get /search/user request; query: %s', safeQuery);
  const users = await User.findByName (safeQuery)
    .select ('username koreanName name _id profilePhoto');
  res.json (users);
});

export const listSearchZabos = ash (async (req, res, next) => {
  const { safeQuery, safeCategory } = req;
  const { lastSeen } = req.query;
  logger.info (`get /search request; query: ${safeQuery}, category: ${safeCategory} ${lastSeen ? `lastSeen: ${lastSeen}` : ''}`);
  if (lastSeen) {
    req.lastSeen = lastSeen;
    return next ();
  }

  // TODO : Cache search result using REDIS
  // Zabo.search: limit(20) already exists inside function
  let result = await Zabo.searchFull (safeQuery, safeCategory)
    .populate ('owner', 'name profilePhoto subtitle description')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board');

  if (result.length < 10) {
    result = await Zabo.searchPartial (safeQuery, safeCategory)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }
  return res.send (result);
});

export const listNextSearchZabos = ash (async (req, res) => {
  const { safeQuery, safeCategory, lastSeen } = req;
  // const { tags, searchQuery } = splitTagNText (safeQuery);
  let result = await Zabo.searchFull (safeQuery, safeCategory, lastSeen)
    .populate ('owner', 'name profilePhoto subtitle description')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board');

  if (result.length < 10) {
    result = await Zabo.searchPartial (safeQuery, safeCategory)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }
  return res.send (result);
});
