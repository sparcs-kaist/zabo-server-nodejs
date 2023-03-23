import { Group, GroupApply, User } from "../../db";
import { adminUserSchema } from "../../db/schema";
import { logger } from "../../utils/logger";
import { sendApplyDoneMessage } from "../../utils/slack";

//FIXME using hard coded admin data
import { AdminUser } from "../../db/index";

export const acceptGroupAction = {
  actionType: "record",
  component: false,
  handler: async (req, res, context) => {
    //FIXME get current admin information from admin js authenticator
    //const { record, currentAdmin } = context;
    const { record } = context;
    const currentAdmin = await AdminUser.findOne({}).populate("user");

    const groupName = record.params.name;
    const adminName = currentAdmin.user.username;

    logger.admin.info(
      "Accept Group; name: %s, adminUser: %s",
      groupName,
      adminName,
    );

    const newGroup = await GroupApply.findOneAndDelete({ name: groupName });
    const newGroupJSON = newGroup.toJSON({ virtuals: false });
    delete newGroupJSON._id;
    newGroupJSON.members.forEach((member, i) => {
      delete newGroupJSON.members[i]._id;
    });
    const created = await Group.create(newGroupJSON);

    currentAdmin.actionHistory.push({
      name: "acceptGroup",
      target: created._id,
    });

    await Promise.all([
      ...newGroupJSON.members.map(({ user }) =>
        User.findByIdAndUpdate(user._id, { $push: { groups: created._id } }),
      ),
      currentAdmin.save(),
    ]);

    sendApplyDoneMessage(groupName, currentAdmin);

    return {
      record: record.toJSON(currentAdmin),
      msg: "Accepting Group: Success",
    };
  },
};
