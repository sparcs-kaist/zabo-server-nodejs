import { Zabo } from "../../db";
import { deleteZaboAction } from "../actions/deleteZabo";
import { uploadZaboPage } from "../actions/uploadZaboPage";
export const ZaboResource = {
  resource: Zabo,
  options: {
    actions: {
      uploadZaboPage: uploadZaboPage,
      deleteZabo: deleteZaboAction,
    },
  },
};
