import { Group, User, PreRegister } from "../db";
import { logger } from "./logger";

export const checkPreAndRegister = async user => {
  const preRegister = await PreRegister.findOneAndUpdate(
    { ownerSID: user.studentId, registered: false },
    { registered: true },
  );
  if (!preRegister) return false;
  logger.event.info(
    "===== Pre Registered User has Registered | Group : %s, Student ID : %s ===",
    preRegister.groupName,
    user.studentId,
  );
  const [, newUser] = await Promise.all([
    Group.findOneAndUpdate(
      { _id: preRegister.group },
      { $push: { members: { user: user._id, role: "admin" } } },
    ),
    User.findOneAndUpdate(
      { _id: user._id },
      { $push: { groups: preRegister.group } },
      { new: true },
    )
      .populate({
        path: "groups",
        select: "name profilePhoto followers recentUpload",
      })
      .populate("boards"),
  ]);
  return newUser;
};
