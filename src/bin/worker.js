import cron from "node-cron";
import { updateRecommends, updateScores } from "../worker/recommender";
import signale from "../utils/logger/signale";

const zaboSignale = signale.scope("zabo");
const userSignale = signale.scope("user");

cron.schedule("*/17 * * * *", () => {
  const hrstart = process.hrtime();
  zaboSignale.info("ZABO Scoring start");
  updateScores()
    .then(() => {
      zaboSignale.log("success");
    })
    .catch(error => {
      zaboSignale.error(error);
      zaboSignale.log("failure");
    })
    .finally(() => {
      const hrend = process.hrtime(hrstart);
      zaboSignale.info(
        "Execution time (hr): %ds %dms",
        hrend[0],
        hrend[1] / 1000000,
      );
    });
});

cron.schedule("43 */19 * * * *", () => {
  const hrstart = process.hrtime();
  userSignale.info("User Scoring start");
  updateRecommends()
    .then(() => {
      userSignale.log("success");
    })
    .catch(error => {
      userSignale.error(error);
      userSignale.log("failure");
    })
    .finally(() => {
      const hrend = process.hrtime(hrstart);
      userSignale.info(
        "Execution time (hr): %ds %dms",
        hrend[0],
        hrend[1] / 1000000,
      );
    });
});
