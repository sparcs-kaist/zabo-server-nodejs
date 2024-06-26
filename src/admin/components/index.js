import { ComponentLoader } from "adminjs";

const componentLoader = new ComponentLoader();

const Components = {
  uploadZaboComponent: componentLoader.add(
    "uploadZaboComponent",
    "./uploadZabo",
  ),
  addDeviceComponent: componentLoader.add("addDeviceComponent", "./addDevice"),
};

export { componentLoader, Components };
