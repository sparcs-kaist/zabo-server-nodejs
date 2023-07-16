import { Zabo } from "../../db";
import { uploadZaboAction } from "../actions/uploadZabo";
import { deleteZaboAction } from "../actions/deleteZabo";
import { uploadZaboPage } from "../actions/uploadZaboPage";
export const ZaboResource = {
  resource: Zabo,
  options: {
    actions: {
      uploadZabo: uploadZaboAction,
      uploadZaboPage: uploadZaboPage,
      deleteZabo: deleteZaboAction,
    },
  },
};
