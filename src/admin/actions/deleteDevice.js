import axios from "axios";
export const deleteDeviceAction = {
  actionType: "record",
  component: false,
  guard: "Do you really want to delete this device?",
  handler: async (req, res, context) => {
    const { record } = context;
    const deviceName = record.params.name;
    const response = await axios.delete("/api/board/device", {
      name: deviceName,
    });

    response.data.message;

    return {
      record: {},
      msg: "Deleting Device: Success",
    };
  },
};
