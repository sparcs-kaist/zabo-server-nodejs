import ash from 'express-async-handler';
import queryString from 'query-string';
import { Group, User, Zabo } from '../db';
import { logger } from '../utils/logger';
import { stat } from '../utils/statistic';

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

const escapeRegExp = string => string.replace (/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getSearch = ash (async (req, res) => {
  const { query, category } = req.query;
  const safeQuery = query ? escapeRegExp (query) : '';
  const safeCategory = !category ? []
    : !Array.isArray (category) ? [category]
      : category;
  logger.info ('get /search request; query: %s, category: %s', safeQuery, safeCategory);
  stat.SEARCH (req);

  // const { tags, searchQuery } = splitTagNText (query);

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
  const { query } = req.query;
  logger.info ('get /serach/user request; query: %s', query);
  if (!query || !query.trim ()) {
    return res.status (400).send ({
      error: 'Search Keyword Required',
    });
  }
  const users = await User.findByName (query)
    .select ('username koreanName name _id profilePhoto');
  res.json (users);
});

export const listSearchZabos = ash (async (req, res, next) => {
  const { lastSeen, query: text, category: stringifiedCategory } = req.query;
  const query = escapeRegExp (text);
  const { category } = stringifiedCategory ? queryString.parse (stringifiedCategory) : { undefined };
  if (lastSeen) return next ();
  stat.SEARCH (req);

  // const { tags, searchQuery } = splitTagNText (query);
  // TODO : Cache search result using REDIS
  // Zabo.search: limit(20) already exists inside function
  let result = await Zabo.searchFull (query, category)
    .populate ('owner', 'name profilePhoto subtitle description')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board');

  if (result.length < 10) {
    result = await Zabo.searchPartial (query, category)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }
  return res.send (result);
});

export const listNextSearchZabos = ash (async (req, res) => {
  const { lastSeen, query: text, category: stringifiedCategory } = req.query;
  const query = escapeRegExp (text);
  const { category } = stringifiedCategory ? queryString.parse (stringifiedCategory) : { undefined };
  stat.SEARCH (req);

  // const { tags, searchQuery } = splitTagNText (query);
  let result = await Zabo.searchFull (query, category, lastSeen)
    .populate ('owner', 'name profilePhoto subtitle description')
    .populate ('likes')
    .populate ('pins', 'pinnedBy board');

  if (result.length < 10) {
    result = await Zabo.searchPartial (query, category)
      .populate ('owner', 'name profilePhoto subtitle description')
      .populate ('likes')
      .populate ('pins', 'pinnedBy board');
  }
  return res.send (result);
});
