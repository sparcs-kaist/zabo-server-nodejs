import { GroupApply } from "../../db";
import { logger } from "../../utils/logger";
import { sendRejectDoneMessage } from "../../utils/slack";

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

const rejectGroup = async (currAdmin, groupName) => {
  const adminName = currAdmin.user.username;
  logger.admin.info(
    "Reject Group; name: %s, adminUser: %s",
    groupName,
    adminName,
  );

  const newGroup = await GroupApply.deleteOne({ name: groupName });

  currAdmin.actionHistory.push({
    name: "rejectGroup",
    target: groupName,
  });

  await currAdmin.save();

  sendRejectDoneMessage(groupName, currAdmin);

  return;
};
