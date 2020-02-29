import cron from 'node-cron';
import { updateRecommends, updateScores } from '../worker/recommender';

cron.schedule ('*/17 * * * *', () => {
  updateScores ()
    .then (() => {
      console.log ('success');
    })
    .catch (error => {
      console.error (error);
      console.log ('failure');
    });
});

cron.schedule ('43 */19 * * * *', () => {
  updateRecommends ()
    .then (() => {
      console.log ('success');
    })
    .catch (error => {
      console.error (error);
      console.log ('failure');
    });
});
