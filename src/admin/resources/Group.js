import { GroupApply } from "../../db/index";
import { acceptGroupAction } from "../actions/acceptGroupApply";
import { rejectGroupAction } from "../actions/rejectGroupApply";
export const GroupResource = {
  resource: GroupApply,
  options: {
    actions: {
      acceptGroupAction: acceptGroupAction,
      rejectGroupAction: rejectGroupAction,
    },
  },
};
