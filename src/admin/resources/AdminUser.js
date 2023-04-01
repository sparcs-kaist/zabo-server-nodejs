import { AdminUser } from "../../db/index";
import { initAdminGroupAction } from "../actions/initAdminGroup";

export const AdminUserResource = {
  resource: AdminUser,
  options: {
    actions: {
      initAdminGroupAction: initAdminGroupAction,
    },
  },
};
