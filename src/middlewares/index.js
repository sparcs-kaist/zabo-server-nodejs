import ash from "express-async-handler";
import jwt from "jsonwebtoken";
import { AdminUser, Group, User, Zabo } from "../db";
import { logger } from "../utils/logger";
import { isValidId } from "../utils";

export const authMiddleware = (req, res, next) => {
  const jwtSecret = req.app.get("jwt-secret");
  const token = (req.headers.authorization || "").substring(7);
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      logger.mw.error(err.message);
      res.status(403).json({
        error: err.message,
      });
      return;
    }
    req.decoded = decoded;
    req.token = token;
    next();
  });
};

export const jwtParseMiddleware = (req, res, next) => {
  const jwtSecret = req.app.get("jwt-secret");
  const token = (req.headers.authorization || "").substring(7);
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // Do nothing as jwt is optional
      next();
      return;
    }
    req.decoded = decoded;
    req.token = token;
    next();
  });
};

export const validateId = key => (req, res, next) => {
  const value = req[key] || req.params[key] || req.body[key] || req.query[key];
  if (!value) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl} request error; 400 - empty ${key}`,
    );
    return res.status(400).json({
      error: `bad request: ${key} required`,
    });
  }
  if (!isValidId(value)) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl} request error; 400 - invalid ${key}`,
    );
    return res.status(400).json({
      error: `invalid ${key}`,
    });
  }
  return next();
};
export const validateZaboId = validateId("zaboId");

export const isAdmin = ash(async (req, res, next) => {
  const { isAdmin } = req.session;
  const { adminId } = req.session;
  if (isAdmin) {
    const adminUser = await AdminUser.findOne({ user: adminId }).populate(
      "user",
    );
    req.adminUser = adminUser;
    next();
  } else {
    return res.status(404).json({
      error: "not administer",
    });
  }
});

export const findSelfMiddleware = ash(async (req, res, next) => {
  const { sid } = req.decoded;
  const user = await User.findOne({ sso_sid: sid });
  if (user === null) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl} request error; 403 - Authentication required`,
    );
    return res.status(404).json({
      error: "Invalid User",
    });
  }
  req.self = user;
  return next();
});

export const findSelfIfExist = ash(async (req, res, next) => {
  if (!req.decoded) return next();
  return findSelfMiddleware(req, res, next);
});

export const tryFindSelf = [jwtParseMiddleware, findSelfIfExist];

export const findUserWithKeyMiddleware = (queryKey, reqKey = queryKey) =>
  ash(async (req, res, next) => {
    const value = req[reqKey];
    if (!value) {
      logger.api.error(
        `[${req.method}] ${req.originalUrl} request error; 400 - empty ${reqKey}`,
      );
      return res.status(400).json({
        error: `bad request: ${reqKey} required`,
      });
    }
    const user = await User.findOne({ [queryKey]: value });
    if (!user) {
      logger.api.error(
        `[${req.method}] ${req.originalUrl} request error; 404 - user '${value}' not found`,
      );
      return res.status(404).json({
        error: "not found: user does not exist",
      });
    }
    req.user = user;
    return next();
  });
export const findUserWithUserIdMiddleware = findUserWithKeyMiddleware(
  "_id",
  "userId",
);
export const findUserWithUsernameMiddleware = findUserWithKeyMiddleware(
  "username",
);
export const findUserWithStudentIdMiddleware = findUserWithKeyMiddleware(
  "studentId",
);

export const findProfileMiddleware = ash(async (req, res, next) => {
  const { name } = req;
  const [user, group] = await Promise.all([
    User.findOne({ username: name }),
    Group.findOne({ name }),
  ]);
  if (!user && !group) {
    return res.status(404).json({
      error: "user and group with given name does not exist",
    });
  }
  req.user = user;
  req.group = group;
  if (user) req.profile = user;
  else if (group) req.profile = group;
  return next();
});

export const findZaboMiddleware = ash(async (req, res, next) => {
  const { zaboId } = req;
  if (!zaboId) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl} request error; 400 - empty zabo id`,
    );
    return res.status(400).json({
      error: "bad request: zabo id required",
    });
  }
  const zabo = await Zabo.findById(zaboId);
  if (!zabo) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl}  request error; 404 - zabo id : ${zaboId}`,
    );
    return res.status(404).json({
      error: "zabo not found",
    });
  }
  req.zabo = zabo;
  return next();
});

export const isZaboOwnerMiddleware = ash(async (req, res, next) => {
  const { zabo, self } = req;
  const found = self.groups.find(group => zabo.owner.equals(group));
  if (!found) {
    return res.status(403).json({
      error: "Permission Denied",
    });
  }
  return next();
});

export const findGroupMiddleware = ash(async (req, res, next) => {
  const { groupName } = req;
  if (!groupName) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl} request error; 400 - null groupName`,
    );
    return res.status(400).json({
      error: "bad request: null groupName",
    });
  }
  const group = await Group.findOne({ name: groupName });
  if (!group) {
    logger.api.error(
      `[${req.method}] ${req.originalUrl}  request error; 404 - groupName : ${groupName}`,
    );
    return res.status(404).json({
      error: "group not found",
    });
  }
  req.group = group;
  return next();
});

export const isGroupAdminMiddleware = ash(async (req, res, next) => {
  const { group, self } = req;
  if (group.members.find(m => m.role === "admin" && m.user.equals(self._id))) {
    return next();
  }
  return res.status(403).json({
    error: "Permission Denied",
  });
});

export const isGroupMemberMiddleware = ash(async (req, res, next) => {
  const { group, self } = req;
  if (group.members.find(m => m.user.equals(self._id))) {
    return next();
  }
  return res.status(403).json({
    error: "Not Group Member",
  });
});
