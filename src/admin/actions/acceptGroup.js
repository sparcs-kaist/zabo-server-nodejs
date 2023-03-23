import { Group, GroupApply } from "../../db/index";
import { logger } from "../../utils/logger";

export const acceptGroupAction = {
  actionType: "record",
  component: false,
  handler: async (req, res, context) => {
    const { record, currentAdmin } = context;
    console.log(record.params.name);
    const groupName = record.params.name;
    //FIXME add admin authenticator to set this value
    //const adminName = currentAdmin.user;
    const adminName = "Ball";

    logger.api.info(
      "post /admin/group/apply/accept request; name: %s, adminUser: %s",
      groupName,
      adminName,
    );

    //const newGroup = await GroupApply.findOneAndDelete({name});

    return {
      record: record.toJSON(currentAdmin),
      msg: "Hello world",
    };
  },
};
