import uploadZabo from "../api/uploadZabo";

//action without component.
//component will use axios to send request for uploading zabo
export const uploadZaboAction = {
  actionType: "resource",
  component: false,
  guard: "Do you really want to upload this zabo?",
  handler: async (req, res, context) => {
    console.log(req);
    const currentAdmin = req.adminUser;
    const zaboJson = await uploadZabo(currentAdmin, req.body, req.files);
    res.json(zaboJson);
  },
};
