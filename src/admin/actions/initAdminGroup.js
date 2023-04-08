import { Group, GroupApply, User } from "../../db";
import { adminUserSchema } from "../../db/schema";
import { logger } from "../../utils/logger";

//FIXME using hard coded admin data
import { AdminUser } from "../../db/index";
import { nameUsabilityCheck, validateName } from "../../utils";
import { sendApplyDoneMessage, sendNewApplyMessage } from "../../utils/slack";

export const initAdminGroupAction = {
  actionType: "resource",
  component: false,
  handler: async (req, res, context) => {
    const { record } = context;
    const currentAdmin = req.adminUser;

    //FIXME 관리자 그룹에 표기될 자세한 내용 수정
    const adminGroup = {
      name: "관리자 그룹",
      description: "관리자 그룹",
      subtitle: "관리자 그룹",
      purpose: "관리자 그룹",
      category: "관리자그룹",
      isBusiness: false,
    };

    //check admin group name validity
    const isValid = validateName(adminGroup.name);

    if (!isValid) {
      logger.admin.info("Invalid Admin Group Name; name: %s", adminGroup.name);
      return {
        records: [],
        msg: "Initializing Admin Group Failed. Invalid Group Name.",
      };
    }

    //check if admin group already exists
    const [usability] = await nameUsabilityCheck(adminGroup.name);
    if (!usability) {
      return {
        records: [],
        msg: "Initializing Admin Group Success.",
      };
    }

    //All admin members
    const adminUsers = await AdminUser.find({});
    const adminMembers = adminUsers.map(function(admin) {
      return {
        user: admin.user,
        role: "admin",
      };
    });

    //create admin group
    adminGroup.members = adminMembers;

    const groupApply = await GroupApply.create(adminGroup);
    const newGroup = await GroupApply.findOneAndDelete({
      name: adminGroup.name,
    });
    const newGroupJSON = newGroup.toJSON({ virtuals: false });
    delete newGroupJSON._id;
    newGroupJSON.members.forEach((member, i) => {
      delete newGroupJSON.members[i]._id;
    });
    const created = await Group.create(newGroupJSON);

    currentAdmin.actionHistory.push({
      name: "init AdminGroup",
      target: created._id,
    });

    await Promise.all([
      ...newGroupJSON.members.map(({ user }) =>
        User.findByIdAndUpdate(user._id, { $push: { groups: created._id } }),
      ),
      currentAdmin.save(),
    ]);

    sendApplyDoneMessage(adminGroup.name, currentAdmin);

    return {
      records: [],
      msg: "Initializing Admin Group Success.",
    };
  },
};
