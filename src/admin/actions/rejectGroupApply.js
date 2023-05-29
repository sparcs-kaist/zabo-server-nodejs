import { GroupApply } from "../../db";
import { logger } from "../../utils/logger";
import { sendRejectDoneMessage } from "../../utils/slack";
import rejectGroup from "../api/rejectGroup";

export const rejectGroupAction = {
  actionType: "record",
  component: false,
  guard: "Do you really want to reject this group?",
  handler: async (req, res, context) => {
    const { record } = context;
    const currentAdmin = req.adminUser;
    const groupName = record.params.name;

    await rejectGroup(currentAdmin, groupName);

    return {
      record: {},
      msg: "Rejecting Group: Success",
    };
  },
};
