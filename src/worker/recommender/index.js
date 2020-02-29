import moment from 'moment';
import db, { Zabo, Statistic } from '../../db';
import { EVENTS_MAP } from '../../utils/variables';

const eventEndDate = moment ('2020-03-31', 'YYYY-MM-DD');

const LIKE_MA_WEIGHT = 4;
const VIEW_MA_WEIGHT = 15;

const calMA = (acc, cur, weight) => (acc * (weight - 1) + cur) / weight;

export const updateScores = async () => {
  // eslint-disable-next-line no-restricted-syntax
  for await (const zabo of Zabo.find ()) {
    const {
      lastLikeCount, lastLikeTimeMA, lastCountedViewDate, lastViewTimeMA,
    } = zabo.scoreMeta;
    let likeTimeMA = lastLikeTimeMA;
    zabo.likesWithTime.slice (lastLikeCount).forEach (({ createdAt }) => {
      const likeTime = new Date (createdAt).getTime ();
      likeTimeMA = calMA (likeTimeMA, likeTime, LIKE_MA_WEIGHT);
    });

    const views = await Statistic.find ({ type: EVENTS_MAP.GET_ZABO, createdAt: { $gt: lastCountedViewDate } });
    let viewTimeMA = lastViewTimeMA;
    views.forEach (view => {
      const viewTime = new Date (view.createdAt).getTime ();
      viewTimeMA = calMA (viewTimeMA, viewTime, VIEW_MA_WEIGHT);
    });

    const outstanding = Math.max (likeTimeMA, viewTimeMA);

    const curDate = new Date ();
    let score = -(curDate - outstanding);

    const isPreBonusSuitable = (zabo.owner.isPreRegistered && moment (zabo.createdAt).isBefore (eventEndDate));
    if (isPreBonusSuitable) score *= 0.8;

    const isBonusApplicable = (zabo.owner.level > 0);
    if (isBonusApplicable) score *= 0.5;

    const scoreMeta = {
      lastLikeCount: zabo.likesWithTime.length,
      lastLikeTimeMA: new Date (likeTimeMA),
      lastCountedViewDate: new Date (curDate),
      lastViewTimeMA: new Date (viewTimeMA),
    };

    await db.collection ('zabos').updateOne (
      { _id: zabo._id },
      {
        $set: {
          score,
          updatedAt: zabo.updatedAt,
          scoreMeta,
        },
      },
    );
  }
  return true;
};
