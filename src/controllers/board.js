import ash from "express-async-handler";
import { hash, compare } from "bcrypt";
import { logger } from "../utils/logger";
import { Device } from "../db";

const checkDeviceNameUnique = async name => {
  const device = await Device.findOne({ name });

  if (device) {
    return false;
  }
  return true;
};

const checkDevicePassword = async (name, password) => {
  if (!name || !password) {
    return false;
  }
  const device = await Device.findOne({ name });

  if (!device) {
    return false;
  }

  const match = await compare(password, device.passwordHash);

  return match;
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

// TODO
// having error at deviceLogin controller
// it accepts login if name and password is undefined
export const deviceLogin = ash(async (req, res) => {
  const { name, password } = req.body;

  // check password
  const match = await checkDevicePassword(name, password);
  console.log(`match: ${match}`);

  if (!match) {
    logger.api.info(`POST /board/login request: name: ${name} FAILED`);
    return res.json({
      error: `Invalid Credentials. Please check device name and password.`,
    });
  }

  logger.api.info(`POST /board/login request: name: ${name} SUCCESS`);

  req.session.isDevice = true;
  req.session.deviceName = name;

  return res.json({
    message: "Device Login Success!",
  });
});

export const deviceLogout = ash(async (req, res) => {
  if (!req.session.isDevice) {
    logger.api.info(
      `POST /board/logout request: name: ${req.session.deviceName}, isDevice: ${req.session.isDevice} INVALID REQUEST`,
    );
    return res.status(400).json({
      error: "It is not logged-in Device. You cannot logout.",
    });
  }
  logger.api.info(
    `POST /board/logout request: name: ${req.session.deviceName}, isDevice: ${req.session.isDevice}`,
  );

  req.session.isDevice = false;
  req.session.deviceName = "";

  res.json({
    message: "Device Logout Success!",
  });
});
