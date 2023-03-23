import { Zabo } from "../../db";
import { logger } from "../../utils/logger";

//FIXME using hard coded admin data
import { AdminUser } from "../../db/index";

export const uploadZaboAction = {
  actionType: "resource",
  component: false,
  handler: async (req, res, context) => {
    console.log(context);
  },
};
