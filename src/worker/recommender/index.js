import moment from 'moment';
import _ from 'lodash';
import db, {
  Zabo, Statistic, User, Meta,
} from '../../db';
import { EVENTS_MAP, GROUP_CATEGORIES_2 } from '../../utils/variables';
import { debug } from '../../utils/logger/signale';

const eventEndDate = moment ('2020-03-31', 'YYYY-MM-DD');

// (9/10)^10 = 0.348
// (99/100)^100 = 0.366

const LIKE_MA_WEIGHT = 4;
const VIEW_MA_WEIGHT = 15;

const calMA = (prev, next, weight) => (prev * (weight - 1) + next) / weight;

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

    const views = await Statistic.find ({
      type: EVENTS_MAP.GET_ZABO,
      zabo: zabo._id,
      createdAt: { $gt: lastCountedViewDate },
    });
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
          scoreMeta,
        },
      },
    );
  }
  return true;
};

const INTEREST_LIKE_MA_WEIGHT = 30;
const INTEREST_VIEW_MA_WEIGHT = 200;

const calObjMA = (prev, next, weight) => {
  const newVal = Object.keys (prev)
    .reduce ((acc, cur) => ({
      ...acc, [cur]: prev[cur] * ((weight - 1) / weight),
    }), {});
  newVal[next] += (1 / weight);
  return newVal;
};

const cats = [...GROUP_CATEGORIES_2, '관리자'];
export const updateRecommends = async () => {
  // const meta = await Meta.findOne ({ type: 'lastRecommendCountedDate' });
  // const lastRecommendCountedDate = meta ? meta.value : new Date (0);
  // const views = await Statistic.find ({
  //     type: EVENTS_MAP.GET_ZABO,
  //     createdAt: { $gt: lastCountedDate },
  //   })
  //   .populate ({
  //     path: 'zabo',
  //     populate: {
  //       path: 'owner',
  //       project: 'category',
  //     },
  //   });
  // TODO: Temporarily disabled due to useless data
  // const viewsAll = await Statistic.aggregate ([
  //   {
  //     $match: {
  //       type: EVENTS_MAP.GET_ZABO,
  //       createdAt: { $gt: lastCountedDate },
  //     },
  //   },
  //   { $group: { _id: '$user', zabo: { $push: '$zabo' } } },
  // ]);
  //
  // await Meta.findOneAndUpdate (
  //   { type: 'lastRecommendCountedDate' },
  //   { $set: { value: new Date () } },
  //   { upsert: true },
  // );

  // eslint-disable-next-line no-restricted-syntax
  for await (const user of User.find ()) {
    const hrstart = process.hrtime ();
    const { lastCountedDate } = user.interestMeta;
    let { interests } = user;
    if (!interests) {
      interests = cats.reduce ((acc, cur) => ({ ...acc, [cur]: 1 / cats.length }), {});
    }

    const viewInterests = { ...interests };

    // const views = viewsAll.find (userViews => userViews._id.equals (user._id));
    // views.forEach (view => {
    //   const [, cat2] = view.zabo.owner.category;
    //   viewInterests = calObjMA (viewInterests, cat2, INTEREST_VIEW_MA_WEIGHT);
    // });

    const likes = await Zabo.find ({
      likesWithTime: {
        $elemMatch: {
          user: user._id,
          createdAt: { $gt: lastCountedDate },
        },
      },
    }, 'owner').populate ({
      path: 'owner',
      select: 'category',
    });

    let likeInterests = { ...viewInterests };
    likes.forEach (zabo => {
      const [, cat2] = zabo.owner.category;
      likeInterests = calObjMA (likeInterests, cat2, INTEREST_LIKE_MA_WEIGHT);
    });

    const interestMeta = {
      lastCountedDate: new Date (),
    };

    await db.collection ('users').updateOne (
      { _id: user._id },
      {
        $set: {
          interestMeta,
          interests: likeInterests,
        },
      },
    );

    const hrend = process.hrtime (hrstart);
    debug.info ('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
    // _ (likeInterests).toPairs ().sortBy (1).value ()
  }
};
