import { adminZaboGroup } from "..";
import { Components } from "../components";

export const uploadZaboAction = {
  actionType: "resource",
  component: false,
  handler: async (req, res, context) => {
    const currentAdmin = req.adminUser;
    const adminGroup = adminZaboGroup;

    return [];
  },
};
