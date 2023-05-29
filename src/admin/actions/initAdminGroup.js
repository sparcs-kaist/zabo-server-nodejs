import axios from "axios";
import initAdminGroup from "../api/initAdminGroup";
import { adminGroupInfo } from "..";

export const initAdminGroupAction = {
  actionType: "resource",
  component: false,
  handler: async (req, res, context) => {
    const currentAdmin = req.adminUser;
    console.log(currentAdmin);

    //TODO create admingroup config file
    await initAdminGroup(currentAdmin, adminGroupInfo);

    return {
      records: [],
      msg: "Initializing Admin Group Success.",
    };
  },
};
