import { DeletedZabo, Zabo, Board } from "../../db";
import { logger } from "../../utils/logger";

const deleteZabo = async (currentAdmin, zaboId) => {
  const adminName = currentAdmin.user.username;

  logger.admin.info("Delete Zabo; id: %s, adminName: %s", zaboId, adminName);

  try {
    const [, deleted] = await Promise.all([
      Board.updateMany({ pins: zaboId }, { $pull: { pins: zaboId } }),
      Zabo.findOneAndDelete({ _id: zaboId }),
    ]);
    const newDeletedZabo = deleted.toJSON({ virtuals: false });
    delete newDeletedZabo._id;
    newDeletedZabo.photos.forEach((photo, i) => {
      delete newDeletedZabo.photos[i]._id;
    });
    await DeletedZabo.create(newDeletedZabo);
  } catch (error) {
    logger.admin.error(
      "Delete Zabo Error: Error occur while deleting zabo - %s",
      zaboId,
    );
    logger.admin.error("=> %s", error);
    throw error;
  }

  return true;
};

export default deleteZabo;
