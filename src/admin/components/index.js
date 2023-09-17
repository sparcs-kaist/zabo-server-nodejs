import { ComponentLoader } from "adminjs";

const componentLoader = new ComponentLoader();

const Components = {
  uploadZaboComponent: componentLoader.add(
    "uploadZaboComponent",
    "./uploadZabo",
  ),
};

export { componentLoader, Components };
