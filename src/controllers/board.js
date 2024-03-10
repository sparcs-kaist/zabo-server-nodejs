import ash from "express-async-handler";
import { hash } from "bcrypt";
import { logger } from "../utils/logger";
import { Device } from "../db";

const checkDeviceNameUnique = async name => {
  const device = await Device.findOne({ name });

  if (device) {
    return false;
  }
  return true;
};

export const addDevice = ash(async (req, res) => {
  const { name, description, password } = req.body;

  logger.api.info(
    `POST /board/device by ${req.adminUser.user.username} request; name: ${name}, description: ${description}`,
  );

  // check if there is duplicate name
  const isUniqueName = await checkDeviceNameUnique(name);

  if (!isUniqueName) {
    // device with given name already exists.
    return res.status(404).json({
      error: `name ${name} already exists. Please use another name`,
    });
  }

  // hash password
  const passwordHash = await hash(password, 10);

  const deviceInfo = {
    name,
    description,
    passwordHash,
  };
  await Device.create(deviceInfo);
  delete deviceInfo.passwordHash;
  return res.json(deviceInfo);
});

export const removeDevice = ash(async (req, res) => {
  const { name } = req.body;

  logger.api.info(
    `DELETE /board/device by ${req.adminUser.user.username} request; name: ${name}`,
  );

  await Device.findOneAndDelete({ name });
  return res.json({
    message: "remove device success",
  });
});
