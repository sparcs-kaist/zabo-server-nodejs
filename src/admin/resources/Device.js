import { Device } from "../../db/index";
import { addDeviceAction } from "../actions/addDevice";

export const DeviceResource = {
  resource: Device,
  options: {
    actions: {
      addDevice: addDeviceAction,
    },
  },
};
