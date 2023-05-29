import { GroupApply } from "../../db";
import { logger } from "../../utils/logger";
import { sendRejectDoneMessage } from "../../utils/slack";

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

export default rejectGroup;
