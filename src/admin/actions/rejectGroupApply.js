import { Group, GroupApply } from "../../db";
import { adminUserSchema } from "../../db/schema";
import { logger } from "../../utils/logger";
import { sendRejectDoneMessage } from "../../utils/slack";

//FIXME using hard coded admin data
import { AdminUser } from "../../db/index";

export const rejectGroupAction = {
  actionType: "record",
  component: false,
  guard: "Do you really want to reject this group?",
  handler: async (req, res, context) => {
    //FIXME get current admin information from admin js authenticator
    //const { record, currentAdmin } = context;
    const { record } = context;
    const currentAdmin = await AdminUser.findOne({}).populate("user");

    const groupName = record.params.name;
    const adminName = currentAdmin.user.username;

    logger.admin.info(
      "Reject Group; name: %s, adminUser: %s",
      groupName,
      adminName,
    );

    const newGroup = await GroupApply.deleteOne({ name: groupName });

    currentAdmin.actionHistory.push({
      name: "rejectGroup",
      target: groupName,
    });
    await currentAdmin.save();

    sendRejectDoneMessage(groupName, currentAdmin);

    return {
      record: record.toJSON(currentAdmin),
      msg: "Rejecting Group: Success",
    };
  },
};
