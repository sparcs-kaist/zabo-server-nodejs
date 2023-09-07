import { Components } from "../components";

//action without component.
//component will use axios to send request for uploading zabo
export const uploadZaboPage = {
  actionType: "resource",
  component: Components.uploadZaboComponent,
};
