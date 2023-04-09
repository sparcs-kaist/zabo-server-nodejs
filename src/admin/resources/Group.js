import { GroupApply } from "../../db/index";
//import { acceptAllGroupAction } from "../actions/acceptAllGroupApply";
import { acceptGroupAction } from "../actions/acceptGroupApply";
import { rejectGroupAction } from "../actions/rejectGroupApply";
export const GroupResource = {
  resource: GroupApply,
  options: {
    actions: {
      acceptGroupAction: acceptGroupAction,
      rejectGroupAction: rejectGroupAction,
      //acceptAllGroupAction: acceptAllGroupAction,
      show: {
        isAccessible: false,
      },
      edit: {
        isAccessible: false,
      },
      delete: {
        isAccessible: false,
      },
      bulkDelete: {
        isAccessible: false,
      },
    },
  },
};
