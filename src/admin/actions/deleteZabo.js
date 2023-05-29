import deleteZabo from "../api/deleteZabo";

export const deleteZaboAction = {
  actionType: "record",
  component: false,
  handler: async (req, res, context) => {
    const { record } = context;
    const currentAdmin = req.adminUser;
    const zaboId = record.params._id;
    await deleteZabo(currentAdmin, zaboId);

    return {
      record: {},
      msg: "Delete Zabo: Success",
    };
  },
};
