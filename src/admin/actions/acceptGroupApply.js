import { Group, GroupApply, User } from "../../db";
import { logger } from "../../utils/logger";
import { sendApplyDoneMessage } from "../../utils/slack";
import acceptGroup from "../api/acceptGroup";

export const acceptGroupAction = {
  actionType: "record",
  component: false,
  handler: async (req, res, context) => {
    const { record } = context;
    const currentAdmin = req.adminUser;
    const groupName = record.params.name;

    const created = await acceptGroup(currentAdmin, groupName);

    return {
      record: record.toJSON(created),
      msg: "Accepting Group: Success",
    };
  },
};
