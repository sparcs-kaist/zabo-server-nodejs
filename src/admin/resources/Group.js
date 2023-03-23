import { GroupApply } from "../../db/index";
import { acceptGroupAction } from "../actions/acceptGroupApply";
export const GroupResource = {
  resource: GroupApply,
  options: {
    actions: {
      acceptGroupAction: acceptGroupAction,
    },
  },
};
