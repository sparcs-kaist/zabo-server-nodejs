import { Zabo } from "../../db";
import { uploadZaboAction } from "../actions/uploadZabo";
import { deleteZaboAction } from "../actions/deleteZabo";
import { Components } from "../components";
export const ZaboResource = {
  resource: Zabo,
  options: {
    actions: {
      uploadZabo: uploadZaboAction,
      deleteZabo: deleteZaboAction,
    },
  },
};
