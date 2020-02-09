import ash from 'express-async-handler';
import { Group, User, Zabo } from '../db';
import { TAGS } from '../utils/variables';
import { logger } from '../utils/logger';
import { stat } from '../utils/statistic';

export const getSearch = ash (async (req, res) => {
  const { query } = req.query;
  logger.info ('get /search request; query: %s', query);
  if (!query || !query.trim ()) {
    return res.status (400).send ({
      error: 'Search Keyword Required',
    });
  }
  stat.SEARCH (req);

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

  // TODO : Cache search result using REDIS
  const results = await Promise.all ([
    Zabo.search (searchQuery, tags),
    Group.search (searchQuery),
  ]);

  const groups = results[1].map (group => group.toJSON ({ virtuals: true }));
  const counts = await Zabo.aggregate ([
    { $match: { owner: { $in: groups.map (group => group._id) } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  for (let i = 0; i < groups.length; i += 1) {
    const count = counts.find (count => groups[i]._id.equals (count._id));
    groups[i].zabosCount = count ? count.count : 0;
  }

  results.push (
    TAGS.filter (item => item.indexOf (query) > -1),
  );

  return res.json ({
    zabos: results[0],
    groups,
    categories: results[2],
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
  const { lastSeen, query } = req.query;
  if (lastSeen) return next ();
  if (!query || !query.trim ()) {
    return res.status (400).send ({
      error: 'Search Keyword Required',
    });
  }
  stat.SEARCH (req);

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

  // TODO : Cache search result using REDIS
  // Zabo.search: limit(20) already exists inside function
  const result = await Zabo.search (searchQuery, tags);
  return res.send (result);
});

export const listNextSearchZabos = ash (async (req, res) => {
  const { lastSeen, query } = req.query;
  if (!query || !query.trim ()) {
    return res.status (400).send ({
      error: 'Search Keyword Required',
    });
  }
  stat.SEARCH (req);

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

  const result = await Zabo.search (searchQuery, tags, lastSeen);
  return res.send (result);
});
