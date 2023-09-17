import { AdminUser, User, GroupApply, Group } from "../../db";
import { nameUsabilityCheck } from "../../utils";
import { validateName } from "../../utils";
import { logger } from "../../utils/logger";
import { sendApplyDoneMessage } from "../../utils/slack";
import { adminGroupConfig } from "../../../config/adminGroup";

export const initAdminGroupAction = {
  actionType: "resource",
  component: false,
  handler: async (req, res, context) => {
    const currentAdmin = req.adminUser;

    //TODO create admingroup config file
    await initAdminGroup(currentAdmin, adminGroupConfig);

    return {
      records: [],
      msg: "Initializing Admin Group Success.",
    };
  },
};

/*
groupInfo = {
    name: "관리자 그룹",
    description: "관리자 그룹",
    subtitle: "관리자 그룹",
    purpose: "관리자 그룹",
    category: "관리자그룹",
    isBusiness: false,
  };
*/
const initAdminGroup = async (currAdmin, groupInfo) => {
  const isValid = validateName(groupInfo.name);

  if (!isValid) {
    logger.admin.info(
      "Invalid Admin Group Name; adminUser: %s; GroupName: %s",
      currAdmin.user.username,
      groupInfo.name,
    );
    return false;
  }

  const [usability] = await nameUsabilityCheck(groupInfo.name);

  if (!usability) {
    logger.admin.info(
      "Admin Group Already Existed; adminUser: %s; GroupName: %s",
      currAdmin.name,
      groupInfo.name,
    );

    return true;
  }
  //add all admin to admin group
  const adminUsers = await AdminUser.find({});
  const adminMembers = adminUsers.map(function(admin) {
    return {
      user: admin.user,
      role: "admin",
    };
  });

  groupInfo.members = adminMembers;
  const groupApply = await GroupApply.create(groupInfo);
  const newGroup = await GroupApply.findOneAndDelete({
    name: groupInfo.name,
  });
  const newGroupJSON = newGroup.toJSON({ virtuals: false });
  delete newGroupJSON._id;
  newGroupJSON.members.forEach((member, i) => {
    delete newGroupJSON.members[i]._id;
  });

  const created = await Group.create(newGroupJSON);
  currAdmin.actionHistory.push({
    name: "init AdminGroup",
    target: created._id,
  });

  await Promise.all([
    ...newGroupJSON.members.map(({ user }) =>
      User.findByIdAndUpdate(user._id, { $push: { groups: created._id } }),
    ),
    currAdmin.save(),
  ]);

  sendApplyDoneMessage(groupInfo.name, currAdmin);

  return true;
};
