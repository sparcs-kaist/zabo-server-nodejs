import { Statistic, User } from '../db';
import { logger } from './logger';


import { EVENTS, EVENTS_MAP } from './variables';

const stat = EVENTS.reduce ((acc, cur) => ({
  ...acc,
  [cur]: (data) => Statistic.create ({
    type: cur,
    data,
  })
    .catch (error => {
      logger.event.error (`Creating ${cur} Stat Failed`);
      logger.event.error (error);
    }),
}), {});

stat.GET_ZABO = (req) => {
  const { id } = req.query;
  const { decoded } = req;
  if (!decoded) return Promise.resolve ();
  const { sid } = decoded;
  return User.findOne ({ sso_sid: sid })
    .then (user => {
      const data = {
        type: EVENTS_MAP.GET_ZABO,
        data: {
          zaboId: id,
          userSid: sid,
        },
      };
      if (user) data.user = user._id;
      return Statistic.create (data);
    });
};

export const statSearch = ({ query, category, decoded }) => {
  if (!decoded) return Promise.resolve ();
  const { sid } = decoded;
  return User.findOne ({ sso_sid: sid })
    .then (user => {
      const data = {
        type: EVENTS_MAP.SEARCH,
        query,
        category,
      };
      if (user) data.user = user._id;
      return Statistic.create (data);
    });
};

export { stat };
