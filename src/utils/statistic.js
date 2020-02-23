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

export const statZabo = async ({ zaboId, decoded }) => {
  if (!decoded) return null;
  const data = {
    type: EVENTS_MAP.GET_ZABO,
    zaboId,
    sso_sid: decoded.sid,
  };
  return Statistic.create (data);
};

export const statSearch = async ({ query, category, decoded }) => {
  const data = {
    type: EVENTS_MAP.SEARCH,
    query,
    category,
  };
  if (decoded) {
    data.sso_sid = decoded.sid;
  }
  return Statistic.create (data);
};

export { stat };
