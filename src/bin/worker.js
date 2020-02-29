import cron from 'node-cron';
import { updateScores } from '../worker/recommender';

cron.schedule ('/17 * * * *', () => {
  updateScores ()
    .then (() => {
      console.log ('success');
    })
    .catch (error => {
      console.error (error);
      console.log ('failure');
    });
});
