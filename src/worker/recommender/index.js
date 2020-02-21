import moment from 'moment';
import db, { Zabo } from '../../db';

const eventEndDate = moment ('2020-03-31', 'YYYY-MM-DD');

export const updateScores = async () => {
  const curMoment = moment ();
  const zabos = await Zabo.find ().populate ('owner');
  const updates = zabos.map (zabo => {
    const timeDiff = curMoment.diff (moment (zabo.createdAt));
    const likesCount = zabo.likes.length;
    const { views } = zabo;
    const preRegistrationBonus = (zabo.owner.isPreRegistered && moment (zabo.createdAt).isBefore (eventEndDate))
      ? 121
      : 0;
    const bias = 1 + zabo.owner.score + preRegistrationBonus;
    const score = (likesCount + (views / 81) + bias) / ((timeDiff / 86400000) ** 2);
    return db.collection ('zabos').updateOne ({ _id: zabo._id }, { $set: { score, updatedAt: zabo.updatedAt } });
  });
  await Promise.all (updates);
  return true;
};
