import { Statistic, DeviceLog } from "../db";
import { EVENTS_MAP } from "./variables";

export const statZabo = async ({ zaboId, decoded }) => {
  if (!decoded) return null;
  const data = {
    type: EVENTS_MAP.GET_ZABO,
    zabo: zaboId,
    user: decoded._id || decoded.id,
  };
  return Statistic.create(data);
};

export const statBoard = async ({ deviceInfo, zaboIds }) => {
  // TODO
  // make statistic generator for zabo boards
  const data = {
    type: EVENTS_MAP.SHOW,
    device: deviceInfo._id || deviceInfo.id,
    zabos: zaboIds,
  };

  return DeviceLog.create(data);
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
  return Statistic.create(data);
};
