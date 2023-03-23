import { GroupApply } from "../../db/index";
import { acceptGroupAction } from "../actions/acceptGroup";
export const GroupResource = {
  resource: GroupApply,
  options: {
    actions: {
      acceptGroupAction: acceptGroupAction,
    },
  },
};
