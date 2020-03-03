import { Statistic } from '../db';
import { EVENTS_MAP } from './variables';

export const statZabo = async ({ zaboId, decoded }) => {
  if (!decoded) return null;
  const data = {
    type: EVENTS_MAP.GET_ZABO,
    zabo: zaboId,
    user: decoded._id || decoded.id,
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
    data.user = decoded._id || decoded.id;
  }
  return Statistic.create (data);
};
