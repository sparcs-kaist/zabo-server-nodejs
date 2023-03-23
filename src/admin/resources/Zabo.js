import { Zabo } from "../../db";
import { uploadZaboAction } from "../actions/uploadZabo";

export const ZaboResource = {
  resource: Zabo,
  options: {
    actions: {
      uploadZabo: uploadZaboAction,
    },
  },
};
