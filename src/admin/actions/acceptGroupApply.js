import { Group, GroupApply, User } from "../../db";
import { logger } from "../../utils/logger";
import { sendApplyDoneMessage } from "../../utils/slack";

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

const acceptGroup = async (currAdmin, groupName) => {
  const adminName = currAdmin.user.username;
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

  currAdmin.actionHistory.push({
    name: "acceptGroup",
    target: created._id,
  });

  await Promise.all([
    ...newGroupJSON.members.map(({ user }) =>
      User.findByIdAndUpdate(user._id, { $push: { groups: created._id } }),
    ),
    currAdmin.save(),
  ]);

  sendApplyDoneMessage(groupName, currAdmin);

  return created;
};
