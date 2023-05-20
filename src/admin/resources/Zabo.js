import { Zabo } from "../../db";
import { uploadZaboAction } from "../actions/uploadZabo";
import { deleteZaboAction } from "../actions/deleteZabo";
import { Components } from "../components";
export const ZaboResource = {
  resource: Zabo,
  options: {
    actions: {
      uploadZabo: {
        actionType: "resource",
        component: Components.uploadZaboComponent,
        handler: (req, res, context) => {
          console.log(req);
          console.log("upload zabo action called");
          return [
            {
              record: "hello",
              msg: "hello world!",
            },
          ];
        },
      },
      deleteZabo: deleteZaboAction,
    },
  },
};
